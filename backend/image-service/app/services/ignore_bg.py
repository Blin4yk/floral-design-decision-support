"""
Модуль для выделения переднего плана и получения доминирующих цветов.
"""
import math

import numpy as np
import cv2
from sklearn.cluster import KMeans

from data.data_colors import WEBCOLORS_CCS3_RGB


def get_color_name(rgb):
    """
    Возвращает название цвета по RGB, используя ближайшее евклидово расстояние
    к набору предопределённых цветов.
    """
    colors = {
        'красный': (255, 0, 0),
        'оранжевый': (255, 165, 0),
        'желтый': (255, 255, 0),
        'зеленый': (0, 255, 0),
        'голубой': (0, 255, 255),
        'синий': (0, 0, 255),
        'фиолетовый': (128, 0, 128),
        'розовый': (255, 192, 203),
        'коричневый': (165, 42, 42),
        'серый': (128, 128, 128),
        'черный': (0, 0, 0),
        'белый': (255, 255, 255),
        'темно-синий': (0, 0, 128),
        'светло-зеленый': (144, 238, 144),
        'бирюзовый': (64, 224, 208),
        'оливковый': (128, 128, 0),
        'пурпурный': (255, 0, 255),
        'темно-красный': (139, 0, 0),
        'золотой': (255, 215, 0)
    }
    min_dist = float('inf')
    best_name = None
    for name, ref_rgb in colors.items():
        dist = sum((c - r) ** 2 for c, r in zip(rgb, ref_rgb))
        if dist < min_dist:
            min_dist = dist
            best_name = name
    return best_name

def rgb_to_hsv(r, g, b):
    """Конвертирует RGB в HSV (все значения нормированы в 0..1)."""
    r, g, b = r / 255.0, g / 255.0, b / 255.0
    max_val = max(r, g, b)
    min_val = min(r, g, b)
    diff = max_val - min_val
    # Hue
    if diff == 0:
        h = 0
    elif max_val == r:
        h = (60 * ((g - b) / diff) + 360) % 360
    elif max_val == g:
        h = (60 * ((b - r) / diff) + 120) % 360
    else: # max_val == b
        h = (60 * ((r - g) / diff) + 240) % 360
    # Saturation
    s = 0 if max_val == 0 else diff / max_val
    # Value
    v = max_val
    return (h, s, v)

def hue_distance(h1, h2):
    """Циклическое расстояние между оттенками в градусах (0-360)."""
    d = abs(h1 - h2)
    return min(d, 360 - d)

def find_closest_webcolor_hsv(rgb, color_dict=WEBCOLORS_CCS3_RGB, weights=(1.0, 0.5, 0.5)):
    """
    Поиск ближайшего цвета по HSV с весами для (H, S, V).
    weights: кортеж (вес оттенка, вес насыщенности, вес яркости).
    """
    r, g, b = rgb
    h_target, s_target, v_target = rgb_to_hsv(r, g, b)
    wh, ws, wv = weights
    min_dist = float('inf')
    closest_name = None
    for name, (cr, cg, cb) in color_dict.items():
        h_c, s_c, v_c = rgb_to_hsv(cr, cg, cb)
        # Расстояние по оттенку с учётом цикличности
        dh = hue_distance(h_target, h_c) / 180.0  # нормируем до 0..2
        ds = abs(s_target - s_c)
        dv = abs(v_target - v_c)
        # Взвешенное евклидово расстояние
        dist = math.sqrt(wh * dh**2 + ws * ds**2 + wv * dv**2)
        if dist < min_dist:
            min_dist = dist
            closest_name = name
    return closest_name

def centroid_histogram(clt):
    """
    Строит гистограмму на основе меток кластеров.
    Возвращает массив с долей каждого кластера.
    """
    numLabels = np.arange(0, len(np.unique(clt.labels_)) + 1)
    (hist, _) = np.histogram(clt.labels_, bins=numLabels)
    hist = hist.astype("float")
    hist /= hist.sum()
    return hist

def get_foreground_mask(image_rgb):
    """
    Выделяет передний план с помощью GrabCut.
    Возвращает бинарную маску (1 – передний план, 0 – фон).
    """
    scale = 0.5
    small = cv2.resize(image_rgb, None, fx=scale, fy=scale,
                       interpolation=cv2.INTER_LINEAR)
    mask = np.zeros(small.shape[:2], np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    h, w = small.shape[:2]
    rect = (int(0.1*w), int(0.1*h), int(0.8*w), int(0.8*h))
    cv2.grabCut(small, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    mask_full = cv2.resize(mask, (image_rgb.shape[1], image_rgb.shape[0]),
                           interpolation=cv2.INTER_NEAREST)
    mask_fg = np.where((mask_full == 2) | (mask_full == 0), 0, 1).astype('uint8')
    return mask_fg

def apply_mask_to_image(image_rgb, mask):
    """
    Накладывает маску на изображение: фон становится чёрным,
    объект сохраняет исходные цвета.
    """
    masked = image_rgb * np.stack([mask]*3, axis=2)
    return masked.astype(np.uint8)

def get_dominant_colors(image_rgb, n_clusters=3, ignore_bg=True):
    """
    Возвращает список доминирующих цветов (центроидов KMeans) и их доли.
    Если ignore_bg=True, предварительно выделяется передний план.
    Возвращает список словарей: [{'rgb': [r,g,b], 'percentage': float, 'color_name': str}, ...]
    """
    if ignore_bg:
        mask = get_foreground_mask(image_rgb)
        pixels = image_rgb[mask == 1]
        if len(pixels) == 0:
            # Если передний план не найден, используем всё изображение
            pixels = image_rgb.reshape((-1, 3))
    else:
        pixels = image_rgb.reshape((-1, 3))

    # Кластеризация
    clt = KMeans(n_clusters=n_clusters)
    clt.fit(pixels)

    hist = centroid_histogram(clt)
    centroids = clt.cluster_centers_

    # Сортировка по убыванию доли
    sorted_indices = np.argsort(hist)[::-1]
    result = []
    for i in sorted_indices:
        rgb = [int(centroids[i][0]), int(centroids[i][1]), int(centroids[i][2])]
        result.append({
            'rgb': rgb,
            'percentage': float(hist[i]),
            'color_name': find_closest_webcolor_hsv(rgb)
        })
    return result