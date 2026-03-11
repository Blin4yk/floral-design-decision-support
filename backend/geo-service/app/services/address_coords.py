from geopy.extra.rate_limiter import RateLimiter
from geopy.geocoders import Nominatim

# Здесь обязательно передавать User-agent
geolocator = Nominatim(timeout=10, user_agent="MyDiplomaApp/1.0 (nshelonin@mail.ru)")
# Соблюдать паузу. Такие условия у сервиса
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)


def get_coords_from_address(address: str):
    """Возвращает """
    location = geocode(address)
    return location.latitude, location.longitude