from pydantic import BaseModel


class GeoCoordinate(BaseModel):
    latitude: float
    longitude: float