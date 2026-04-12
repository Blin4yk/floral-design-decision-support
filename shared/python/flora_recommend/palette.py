"""
Шаг 2: K-means (k-means++) в Lab, J = Σ||x − μ_k||², останов по ΔJ или max_iter,
веса w_k = |C_k|/(H·W), выбор K по silhouette, h_photo — оттенок центроида с max(w_k).
"""

from __future__ import annotations

import numpy as np
from sklearn.metrics import silhouette_score

from flora_recommend.color_lab import lab_to_hex, lab_to_hue_deg
from flora_recommend.constants import (
    K_MEANS_DELTA_J_THRESHOLD,
    K_MEANS_K_MAX,
    K_MEANS_K_MIN,
    K_MEANS_MAX_ITER,
    SILHOUETTE_RANDOM_SEED,
    SILHOUETTE_SAMPLE_SIZE,
)


def _pairwise_sq_dists(x: np.ndarray, centers: np.ndarray) -> np.ndarray:
    """Квадраты расстояний ||x_i - c_j||² для x (N,3), centers (K,3)."""
    # (N,1,3) - (1,K,3) -> (N,K,3) sum -> (N,K)
    diff = x[:, np.newaxis, :] - centers[np.newaxis, :, :]
    return np.sum(diff * diff, axis=2)


def _kmeans_plus_plus_init(x: np.ndarray, k: int, rng: np.random.Generator) -> np.ndarray:
    """Инициализация k-means++: первый центр случайно, далее пропорционально D²."""
    n = x.shape[0]
    idx0 = int(rng.integers(0, n))
    centers = [x[idx0].copy()]
    for _ in range(1, k):
        d2 = np.min(_pairwise_sq_dists(x, np.stack(centers, axis=0)), axis=1)
        s = d2.sum()
        if s <= 0:
            idx = int(rng.integers(0, n))
        else:
            p = d2 / s
            idx = int(rng.choice(n, p=p))
        centers.append(x[idx].copy())
    return np.stack(centers, axis=0)


def _kmeans_lloyd(
    x: np.ndarray,
    k: int,
    rng: np.random.Generator,
) -> tuple[np.ndarray, np.ndarray, float]:
    """
    Lloyd: минимизация J = Σ||x - μ_assign||² в Lab.
    Останов: |J_prev - J| < 1e-4 или итераций >= 300.
    Возвращает центроиды (K,3), метки (N,), финальный J.
    """
    centers = _kmeans_plus_plus_init(x, k, rng)
    n = x.shape[0]
    prev_j = np.inf
    for _ in range(K_MEANS_MAX_ITER):
        dists = _pairwise_sq_dists(x, centers)
        labels = np.argmin(dists, axis=1)
        j = float(np.sum(dists[np.arange(n), labels]))
        new_centers = centers.copy()
        for kk in range(k):
            mask = labels == kk
            if np.any(mask):
                new_centers[kk] = x[mask].mean(axis=0)
            # пустой кластер: центр не меняем (редко при k-means++ на плотных данных)
        centers = new_centers
        if abs(prev_j - j) < K_MEANS_DELTA_J_THRESHOLD:
            break
        prev_j = j
    dists = _pairwise_sq_dists(x, centers)
    labels = np.argmin(dists, axis=1)
    j_final = float(np.sum(dists[np.arange(n), labels]))
    return centers, labels, j_final


def _silhouette_for_k(x: np.ndarray, labels: np.ndarray) -> float:
    """Silhouette; при большом N — случайная подвыборка с фиксированным seed."""
    n = x.shape[0]
    if n < 2 or len(np.unique(labels)) < 2:
        return -1.0
    if n > SILHOUETTE_SAMPLE_SIZE:
        rng = np.random.default_rng(SILHOUETTE_RANDOM_SEED)
        idx = rng.choice(n, size=SILHOUETTE_SAMPLE_SIZE, replace=False)
        return float(silhouette_score(x[idx], labels[idx], metric="euclidean"))
    return float(silhouette_score(x, labels, metric="euclidean"))


def extract_palette(lab_pixels: np.ndarray, rng: np.random.Generator | None = None) -> dict:
    """
    Вход: все пиксели в Lab, форма (N, 3).
    K ∈ [5, 8], k-means++, выбор K по silhouette, w_k = |C_k|/N.
    h_photo — hue(Lab) центроида с максимальным w_k.
    """
    x = np.asarray(lab_pixels, dtype=np.float64).reshape(-1, 3)
    if x.shape[0] == 0:
        raise ValueError("Нет пикселей для кластеризации")
    rng = rng or np.random.default_rng(SILHOUETTE_RANDOM_SEED)
    n = x.shape[0]
    best_k = K_MEANS_K_MIN
    best_score = -np.inf
    best_centers = None
    best_labels = None
    best_j = np.inf
    per_k: dict[int, dict] = {}

    for k in range(K_MEANS_K_MIN, K_MEANS_K_MAX + 1):
        centers, labels, j_fin = _kmeans_lloyd(x, k, rng)
        sil = _silhouette_for_k(x, labels)
        per_k[k] = {"silhouette": sil, "inertia": j_fin}
        if sil > best_score:
            best_score = sil
            best_k = k
            best_centers = centers
            best_labels = labels
            best_j = j_fin

    assert best_centers is not None and best_labels is not None
    counts = np.bincount(best_labels, minlength=best_k).astype(np.float64)
    weights = counts / float(n)
    dominant_idx = int(np.argmax(weights))
    h_photo = float(lab_to_hue_deg(best_centers[dominant_idx]))
    hex_colors = [lab_to_hex(best_centers[i]) for i in range(best_k)]

    return {
        "k": best_k,
        "centroids_lab": best_centers.tolist(),
        "weights": weights.tolist(),
        "h_photo": h_photo,
        "labels": best_labels,
        "per_k_metrics": per_k,
        "palette_hex": hex_colors,
        "dominant_centroid_lab": best_centers[dominant_idx].tolist(),
    }

