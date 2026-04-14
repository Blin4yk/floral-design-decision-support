import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Ui";
import StepSidebar from "../components/StepSidebar";
import IttenWheel from "../components/IttenWheel";
import { api } from "../services/api";
import { setHarmony } from "../store/flowSlice";
import { getHarmonyPartners, getIttenSectorIndex, HARMONY_TYPES, ITTEN_SECTOR_COUNT } from "../utils/harmony";

const hueDistance = (a, b) => {
  const delta = Math.abs(a - b) % 360;
  return Math.min(delta, 360 - delta);
};

const getSectorCenterHue = (sectorIndex) => ((sectorIndex % ITTEN_SECTOR_COUNT) * 360) / ITTEN_SECTOR_COUNT;

export default function HarmonyPage() {
  const palette = useSelector((state) => state.flow.palette);
  const [type, setType] = useState("analogous");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSectorIndex, setSelectedSectorIndex] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!palette.length) {
      setSelectedColor("");
      setSelectedSectorIndex(null);
      return;
    }
    const initialColor = palette[0];
    setSelectedColor(initialColor);
    setSelectedSectorIndex(getIttenSectorIndex(initialColor));
  }, [palette]);

  const selectColor = (color) => {
    setSelectedColor(color);
    setSelectedSectorIndex(getIttenSectorIndex(color));
  };

  const selectSector = (sectorIndex) => {
    setSelectedSectorIndex(sectorIndex);
    if (!palette.length) {
      return;
    }
    const colorsInSector = palette.filter((color) => getIttenSectorIndex(color) === sectorIndex);
    if (colorsInSector.length) {
      setSelectedColor(colorsInSector[0]);
      return;
    }
    const targetHue = getSectorCenterHue(sectorIndex);
    const closestByHue = [...palette]
      .map((color) => ({ color, hue: getSectorCenterHue(getIttenSectorIndex(color)) }))
      .sort((a, b) => hueDistance(a.hue, targetHue) - hueDistance(b.hue, targetHue))[0];
    if (closestByHue) {
      setSelectedColor(closestByHue.color);
    }
  };

  const baseColor = selectedColor || palette[0];
  const partners = useMemo(() => getHarmonyPartners(baseColor, type), [baseColor, type]);
  const fullPalette = [...new Set([...palette, ...partners])];

  const next = async () => {
    const response = await api.saveHarmony({ harmonyType: type, baseColor }).catch(() => null);
    const backendPartners = response?.harmony_colors || [];
    const nextPartners = backendPartners.length ? backendPartners : partners;
    dispatch(setHarmony({ harmonyType: type, partners: nextPartners, baseColor }));
    navigate("/location");
  };

  return (
    <section className="workbench">
      <StepSidebar activeStep={2} />
      <div className="page">
        <p className="step-meta">ШАГ 2 ИЗ 3 - ЦВЕТОВАЯ ГАРМОНИЯ</p>
        <h1 className="page-title">Круг Иттена</h1>
        <p className="subtitle">Выберите сектор или цвет из фото, затем тип гармонии.</p>
        <div className="card">
          <IttenWheel
            selectedColor={baseColor}
            selectedSectorIndex={selectedSectorIndex}
            photoPalette={palette}
            onSelectColor={selectColor}
            onSelectSector={selectSector}
          />
          <div className="row wrap">
            {palette.map((color) => (
              <button
                key={color}
                className={`swatch-btn ${baseColor === color ? "active" : ""}`}
                onClick={() => selectColor(color)}
                style={{ backgroundColor: color }}
                aria-label={`Выбрать базовый цвет ${color}`}
              />
            ))}
          </div>
          <div className="palette">
            {fullPalette.map((color, index) => (
              <span key={`${color}-${index}`} className="swatch" style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="row wrap">
            {Object.entries(HARMONY_TYPES).map(([key, label]) => (
              <button key={key} className={`btn ${type === key ? "btn-primary" : "btn-outline"}`} onClick={() => setType(key)}>
                {label}
              </button>
            ))}
          </div>
          <Button onClick={next} disabled={!palette.length}>
            Далее: указать локацию
          </Button>
        </div>
      </div>
    </section>
  );
}
