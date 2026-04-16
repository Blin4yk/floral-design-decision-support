# KMeans и гармонии Иттена
import colorsys
from typing import List, Tuple

def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)

def rgb_to_hsv(rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
    r, g, b = [x / 255.0 for x in rgb]
    return colorsys.rgb_to_hsv(r, g, b)

def hsv_to_rgb(h: float, s: float, v: float) -> Tuple[int, int, int]:
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return int(r * 255), int(g * 255), int(b * 255)

def generate_harmony_colors(base_rgb: tuple[int, int, int]) -> list[str]:
    """Генерирует комплементарные, аналогичные и триадные цвета для базового RGB."""
    h, s, v = rgb_to_hsv(base_rgb)
    harmonies = []

    # Комплементарный (H + 0.5)
    h_comp = (h + 0.5) % 1.0
    harmonies.append(hsv_to_rgb(h_comp, s, v))

    # Аналогичные (H ± 30° -> ± 0.0833)
    h_analog1 = (h + 0.0833) % 1.0
    h_analog2 = (h - 0.0833) % 1.0
    harmonies.append(hsv_to_rgb(h_analog1, s, v))
    harmonies.append(hsv_to_rgb(h_analog2, s, v))

    # Триадные (H ± 120° -> ± 0.333)
    h_triad1 = (h + 0.333) % 1.0
    h_triad2 = (h - 0.333) % 1.0
    harmonies.append(hsv_to_rgb(h_triad1, s, v))
    harmonies.append(hsv_to_rgb(h_triad2, s, v))

    hex_list = [rgb_to_hex(rgb) for rgb in harmonies]
    return hex_list

# ---------------------------------------#
""" Модуль обработки и анализа цвета """
import cv2
import numpy as np
from sklearn.cluster import KMeans

def centroid_histogram(clt):
    numLabels = np.arange(0, len(np.unique(clt.labels_)) + 1)
    (hist, _) = np.histogram(clt.labels_, bins=numLabels)
    hist = hist.astype("float")
    hist /= hist.sum()
    return hist

def get_foreground_mask(image_rgb):
    scale = 0.5
    small = cv2.resize(image_rgb, None, fx=scale, fy=scale,
                       interpolation=cv2.INTER_LINEAR)
    mask = np.zeros(small.shape[:2], np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    h, w = small.shape[:2]
    rect = (int(0.1 * w), int(0.1 * h), int(0.8 * w), int(0.8 * h))
    cv2.grabCut(small, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    mask_full = cv2.resize(mask, (image_rgb.shape[1], image_rgb.shape[0]),
                           interpolation=cv2.INTER_NEAREST)
    mask_fg = np.where((mask_full == 2) | (mask_full == 0), 0, 1).astype('uint8')
    return mask_fg

def extract_dominant_colors(image_path, n_colors=7):
    """
    Извлекает доминирующие цвета переднего плана изображения.
    Возвращает список словарей с ключами "hex", "rgb", "weight".
    """
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        raise FileNotFoundError(f"Не удалось загрузить изображение по пути: {image_path}")
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    mask = get_foreground_mask(image_rgb)
    pixels = image_rgb[mask == 1]
    if len(pixels) == 0:
        pixels = image_rgb.reshape((-1, 3))

    actual_n_colors = min(n_colors, len(pixels))
    if actual_n_colors == 0:
        return []

    clt = KMeans(n_clusters=actual_n_colors, random_state=42, n_init=10)
    clt.fit(pixels)

    hist = centroid_histogram(clt)
    centroids = clt.cluster_centers_
    rgb_colors = np.round(centroids).astype(int)

    dominant_colors = []
    for i in np.argsort(hist)[::-1]:
        rgb_list = [int(val) for val in rgb_colors[i]]
        dominant_colors.append({
            "hex": rgb_to_hex(tuple(rgb_list)),
            "rgb": rgb_list,
            "weight": float(hist[i])       # <- добавляем вес (долю)
        })
    return dominant_colors