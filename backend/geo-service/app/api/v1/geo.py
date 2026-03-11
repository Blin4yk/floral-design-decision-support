from fastapi import APIRouter, Query

from app.schemas.geo_scheme import GeoCoordinate
from app.services.address_coords import get_coords_from_address

router = APIRouter(prefix='/api/v1/geo', tags=['geo'])


@router.get("/coordinates")
async def process_image(
        address: str = Query(...),
) -> GeoCoordinate:
    """
    Возвращает координаты
    """
    coords_latitude, coords_longitude = get_coords_from_address(address)

    return GeoCoordinate(latitude=coords_latitude, longitude=coords_longitude)

# @router.get("/climat")