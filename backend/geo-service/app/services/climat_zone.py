import requests
import pandas as pd

def get_climate_norm_visualcrossing(lat: float, lon: float, api_key: str):
    """
    Получает среднемесячные климатические нормы (температура, осадки)
    для заданных координат через Visual Crossing API.

    Args:
        lat: Широта
        lon: Долгота
        api_key: Ваш API-ключ Visual Crossing

    Returns:
        DataFrame с колонками 'month', 'mean_temp', 'mean_precip' или None при ошибке.
    """
    # Базовый URL для запроса климатических норм
    # Используем include=stats для получения статистических данных
    url = f"https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{lat},{lon}"

    params = {
        "key": api_key,
        "include": "stats",  # Ключевой параметр для климатических норм
        "elements": "datetime,temp,precip",  # Запрашиваем только нужные поля
        "unitGroup": "metric"  # Метрическая система (°C, мм)
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Проверим на ошибки HTTP

        data = response.json()
        print(data)

        # Извлекаем данные по месяцам из секции "stats"
        # Структура ответа может немного отличаться, проверим по документации
        if "stats" not in data:
            print("В ответе нет секции 'stats'. Проверьте параметры запроса.")
            # Альтернативный путь: данные могут быть в days с типом "stats"
            if "days" in data:
                stats_data = [day for day in data["days"] if day.get("datetime") and "stats" in day]
                if stats_data:
                    # Если данные разбиты по дням с статистикой
                    monthly_stats = []
                    for day in stats_data:
                        # Здесь нужно агрегировать по месяцам
                        pass
            return None

        # Предполагаем, что stats содержит список месяцев
        # (Уточните точную структуру, выполнив тестовый запрос)
        stats_list = data["stats"]

        # Преобразуем в DataFrame
        df = pd.DataFrame(stats_list)
        # Оставляем только нужные колонки и переименовываем
        if not df.empty and all(col in df.columns for col in ['name', 'temp', 'precip']):
            df = df[['name', 'temp', 'precip']].rename(
                columns={'name': 'month', 'temp': 'mean_temp', 'precip': 'mean_precip'}
            )
            return df
        else:
            print("Структура 'stats' не содержит ожидаемых колонок.")
            return None

    except requests.exceptions.RequestException as e:
        print(f"Ошибка HTTP запроса: {e}")
    except ValueError as e:
        print(f"Ошибка парсинга JSON: {e}")
    except KeyError as e:
        print(f"Неожиданная структура ответа, отсутствует ключ: {e}")

    return None

# Пример использования
API_KEY = "PJ2CKSXKGA7Q4J4PPHQJHMVTT"  # Замените на ваш реальный ключ
lat, lon = 55.75, 37.62  # Москва

climate_data = get_climate_norm_visualcrossing(lat, lon, API_KEY)

if climate_data is not None:
    print("Среднемесячные климатические нормы:")
    print(climate_data)
else:
    print("Не удалось получить данные.")