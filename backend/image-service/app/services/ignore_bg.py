"""
Модуль описать, что здесь определяется объект переднего фона
Вырезается цветная маска, весь задний фон закрашивается в черный цвет и не учитывается в анализе.
Маска периодически обрезает часть переднего фона, но это не критично, тк обрезается менее 5%, что не является критическим
показателем.

Описать GrabCut. Что это такое

"""

# Импорт необходимых библиотек
import argparse
import numpy as np
import cv2
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt

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

def plot_colors(hist, centroids):
    """
    Создаёт цветную полосу пропорционально доле каждого кластера.
    Возвращает изображение-полосу.
    """
    bar = np.zeros((50, 300, 3), dtype="uint8")
    startX = 0
    for (percent, color) in zip(hist, centroids):
        endX = startX + (percent * 300)
        cv2.rectangle(bar, (int(startX), 0), (int(endX), 50),
                      color.astype("uint8").tolist(), -1)
        startX = endX
    return bar

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
    # Создаём копию изображения и умножаем на маску (по каналам)
    masked = image_rgb * np.stack([mask]*3, axis=2)
    return masked.astype(np.uint8)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("-i", "--image", required=True, help="путь к изображению")
    ap.add_argument("-c", "--clusters", required=True, type=int, help="количество кластеров")
    ap.add_argument("--ignore-bg", action="store_true", help="исключать фон (небо, траву, деревья)")
    ap.add_argument("--save-masked", metavar="PATH", help="сохранить изображение с вырезанным объектом")
    args = vars(ap.parse_args())

    # Загрузка изображения
    image = cv2.imread(args["image"])
    if image is None:
        print("Ошибка: не удалось загрузить изображение. Проверьте путь.")
        exit()

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    if args["ignore_bg"]:
        print("Выделяем передний план...")
        mask = get_foreground_mask(image_rgb)

        # Визуализация: исходное изображение, маска, объект на чёрном фоне
        masked_obj = apply_mask_to_image(image_rgb, mask)

        plt.figure(figsize=(12, 4))
        plt.subplot(1, 3, 1)
        plt.imshow(image_rgb)
        plt.title("Исходное изображение")
        plt.axis("off")

        plt.subplot(1, 3, 2)
        plt.imshow(mask, cmap='gray')
        plt.title("Маска переднего плана")
        plt.axis("off")

        plt.subplot(1, 3, 3)
        plt.imshow(masked_obj)
        plt.title("Объект (фон чёрный)")
        plt.axis("off")

        plt.tight_layout()
        plt.show()

        # Сохраняем изображение с объектом, если указан параметр
        if args["save_masked"]:
            # Конвертируем обратно в BGR для OpenCV и сохраняем
            cv2.imwrite(args["save_masked"], cv2.cvtColor(masked_obj, cv2.COLOR_RGB2BGR))
            print(f"Изображение с объектом сохранено в {args['save_masked']}")

        # Берём только пиксели переднего плана для анализа
        pixels = image_rgb[mask == 1]
        if len(pixels) == 0:
            print("Предупреждение: передний план не найден. Обрабатываем всё изображение.")
            pixels = image_rgb.reshape((-1, 3))
    else:
        pixels = image_rgb.reshape((-1, 3))
        # Если фон не исключаем, показываем только исходное изображение
        plt.figure()
        plt.imshow(image_rgb)
        plt.title("Исходное изображение")
        plt.axis("off")
        plt.show()

    # Кластеризация
    clt = KMeans(n_clusters=args["clusters"])
    clt.fit(pixels)

    hist = centroid_histogram(clt)
    centroids = clt.cluster_centers_
    bar = plot_colors(hist, centroids)

    # Отображение цветовой гистограммы
    plt.figure()
    plt.imshow(bar)
    plt.title("Цветовая гистограмма (KMeans)" + (" – только передний план" if args["ignore_bg"] else ""))
    plt.axis("off")
    plt.show()