import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Ui";
import StepSidebar from "../components/StepSidebar";
import IttenWheel from "../components/IttenWheel";
import { api } from "../services/api";
import { setHarmony } from "../store/flowSlice";
import { getHarmonyPartners, getIttenSectorIndex, HARMONY_TYPES, ITTEN_COLORS } from "../utils/harmony";

const normalizeHex = (value) => String(value || "").toUpperCase();

export default function HarmonyPage() {
  const palette = useSelector((state) => state.flow.palette);
  const [type, setType] = useState("analogous");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSectorIndex, setSelectedSectorIndex] = useState(null);
  const [previewPartners, setPreviewPartners] = useState([]);
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
    setSelectedColor(ITTEN_COLORS[sectorIndex] || palette[0] || "");
  };

  const baseColor = useMemo(() => normalizeHex(selectedColor || palette[0]), [selectedColor, palette]);

  useEffect(() => {
    if (!baseColor) {
      setPreviewPartners([]);
      return;
    }

    const fallbackPartners = getHarmonyPartners(baseColor, type).map((item) => normalizeHex(item));
    setPreviewPartners(fallbackPartners);

    let cancelled = false;
    api
      .saveHarmony({ harmonyType: type, baseColor })
      .then((response) => {
        if (cancelled) return;
        const backendPartners = (response?.harmony_colors || []).map((item) => normalizeHex(item));
        if (backendPartners.length) {
          setPreviewPartners(backendPartners);
        }
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [baseColor, type]);

  const fullPalette = useMemo(
    () => [...new Set([...palette.map((item) => normalizeHex(item)), ...previewPartners])],
    [palette, previewPartners]
  );

  const next = async () => {
    dispatch(setHarmony({ harmonyType: type, partners: previewPartners, baseColor }));
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
