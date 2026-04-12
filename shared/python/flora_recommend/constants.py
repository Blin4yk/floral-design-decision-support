"""
Числовые константы из формальной модели (sRGB → XYZ → Lab, пороги скоринга, K-means).
"""

# --- Шаг 1: линейризация sRGB (гамма) ---
RGB_LINEAR_THRESHOLD = 0.04045
RGB_LINEAR_DIVISOR = 12.92
RGB_GAMMA_OFFSET = 0.055
RGB_GAMMA_DIVISOR = 1.055
RGB_GAMMA_POWER = 2.4

# --- Шаг 1: RGB′ → XYZ (матрица из спецификации, D65) ---
# [X; Y; Z] = M @ [R′; G′; B′]
RGB_TO_XYZ_ROW0 = (0.4124, 0.3576, 0.1805)
RGB_TO_XYZ_ROW1 = (0.2126, 0.7152, 0.0722)
RGB_TO_XYZ_ROW2 = (0.0193, 0.1192, 0.9505)

# Опорный белый D65 для CIELAB (градусы 2°, стандартные значения)
XYZ_REF_XN = 95.047
XYZ_REF_YN = 100.0
XYZ_REF_ZN = 108.883

# --- Шаг 1: XYZ → Lab, кусочная f(t) ---
LAB_DELTA = 6.0 / 29.0
LAB_EPSILON = LAB_DELTA**3  # δ³

# --- Шаг 2: K-means ---
K_MEANS_K_MIN = 5
K_MEANS_K_MAX = 8
K_MEANS_MAX_ITER = 300
K_MEANS_DELTA_J_THRESHOLD = 1e-4

# --- Шаг 4: цветовой скор (hue arc, °) ---
HUE_ARC_PHI_DEG = 20.0
HUE_ARC_DENOMINATOR = 180.0

# --- Шаг 5: Photo_score ---
PHOTO_SCORE_DISTANCE_SCALE = 50.0

# --- Шаг 6: Soil_score ---
SOIL_PH_DELTA_DIVISOR = 1.0

# --- Шаг 8: итоговые веса ---
WEIGHT_COLOR_SCORE = 0.55
WEIGHT_PHOTO_SCORE = 0.25
WEIGHT_SOIL_SCORE = 0.20

# --- Малые пороги численной устойчивости ---
CHROMA_EPS = 1e-9

# --- Silhouette: подвыборка для больших N (метка тем же кластером, что и полная кластеризация) ---
SILHOUETTE_SAMPLE_SIZE = 10_000
SILHOUETTE_RANDOM_SEED = 42
