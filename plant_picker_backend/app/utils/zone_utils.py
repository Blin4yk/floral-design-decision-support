# Преобразование климатических зон
def zone_to_number(zone: str) -> float:
    """Преобразует строку вида '5a' в число 5.0, '5b' -> 5.2 (условно)."""
    if not zone or len(zone) < 2:
        raise ValueError(f"Invalid zone format: {zone}")
    num_part = int(zone[:-1])
    letter = zone[-1].lower()
    offset = {'a': 0.0, 'b': 0.2}.get(letter, 0.0)
    return num_part + offset

def is_zone_in_range(user_zone: str, min_zone: str, max_zone: str) -> bool:
    """Проверяет, попадает ли user_zone в диапазон [min_zone, max_zone]."""
    try:
        u = zone_to_number(user_zone)
        low = zone_to_number(min_zone)
        high = zone_to_number(max_zone)
        return low <= u <= high
    except ValueError:
        return False