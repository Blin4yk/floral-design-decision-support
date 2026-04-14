# SQLAlchemy модели
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, CheckConstraint, Index
from sqlalchemy.orm import relationship
from .database import Base

class ClimateZone(Base):
    __tablename__ = "climate_zones"
    id = Column(Integer, primary_key=True, index=True)
    zone_code = Column(String(10), unique=True, nullable=False)
    min_temp_c = Column(Integer, nullable=False)
    max_temp_c = Column(Integer, nullable=False)

    cities = relationship("City", back_populates="climate_zone")

class SoilType(Base):
    __tablename__ = "soil_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)

    plants = relationship("Plant", back_populates="soil_type")

class Plant(Base):
    __tablename__ = "plants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    height_cm = Column(Integer)
    width_cm = Column(Integer)
    care_difficulty = Column(String(20))
    image_url = Column(Text)
    climate_zone_min = Column(String(10), nullable=False)
    climate_zone_max = Column(String(10), nullable=False)
    soil_type_id = Column(Integer, ForeignKey("soil_types.id", ondelete="CASCADE"))

    soil_type = relationship("SoilType", back_populates="plants")
    plant_colors = relationship("PlantColor", back_populates="plant", lazy="selectin")

class Color(Base):
    __tablename__ = "colors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    hex_code = Column(String(7), nullable=False)
    rgb_r = Column(Integer, nullable=False)
    rgb_g = Column(Integer, nullable=False)
    rgb_b = Column(Integer, nullable=False)

    plant_colors = relationship("PlantColor", back_populates="color")

class PlantColor(Base):
    __tablename__ = "plant_colors"
    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="CASCADE"))
    color_id = Column(Integer, ForeignKey("colors.id", ondelete="CASCADE"))
    intensity = Column(Float, default=1.0)

    plant = relationship("Plant", back_populates="plant_colors")
    color = relationship("Color", back_populates="plant_colors", lazy="selectin")

class City(Base):
    __tablename__ = "cities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    climate_zone_id = Column(Integer, ForeignKey("climate_zones.id", ondelete="CASCADE"))

    climate_zone = relationship("ClimateZone", back_populates="cities", lazy="selectin")