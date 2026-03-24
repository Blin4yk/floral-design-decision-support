import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Ui";
import StepSidebar from "../components/StepSidebar";
import IttenWheel from "../components/IttenWheel";
import { api } from "../services/api";
import { setHarmony } from "../store/flowSlice";
import { getHarmonyPartners, HARMONY_TYPES } from "../utils/harmony";

export default function HarmonyPage() {
  const palette = useSelector((state) => state.flow.palette);
  const [type, setType] = useState("analogous");
  const [selectedColor, setSelectedColor] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const baseColor = selectedColor || palette[0];
  const partners = useMemo(() => getHarmonyPartners(baseColor, type), [baseColor, type]);
  const fullPalette = [...palette, ...partners];

  const next = async () => {
    await api.saveHarmony({ harmonyType: type, palette: fullPalette }).catch(() => null);
    dispatch(setHarmony({ harmonyType: type, partners }));
    navigate("/location");
  };

  return (
    <section className="workbench">
      <StepSidebar activeStep={2} />
      <div className="page">
        <p className="step-meta">ШАГ 2 ИЗ 3 - ЦВЕТОВАЯ ГАРМОНИЯ</p>
        <h1 className="page-title">Круг Иттена</h1>
        <p className="subtitle">Выберите тип гармонии для найденных цветов.</p>
        <div className="card">
          <IttenWheel selectedColor={baseColor} photoPalette={palette} onSelectColor={setSelectedColor} />
          <div className="row wrap">
            {palette.map((color) => (
              <button
                key={color}
                className={`swatch-btn ${baseColor === color ? "active" : ""}`}
                onClick={() => setSelectedColor(color)}
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
