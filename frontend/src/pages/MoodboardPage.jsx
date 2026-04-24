import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "../components/Ui";
import { exportElementToPdf } from "../utils/pdf";
import { api } from "../services/api";

const FILTERS = [
  { id: "all", label: "Все" },
  { id: "flowering", label: "Цветущие" },
  { id: "shade", label: "Теневые" }
];

const MAX_MOODBOARD_PLANTS = 15;

const truncateText = (value, maxLength = 140) => {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
};

const getMatchLabel = (matchPercent) => {
  if (matchPercent >= 85) return "Очень близкое попадание в палитру участка.";
  if (matchPercent >= 70) return "Хорошо поддерживает общую цветовую композицию.";
  if (matchPercent >= 55) return "Подходит как мягкий акцент в подборке.";
  return "Может использоваться как дополнительный оттеночный акцент.";
};

const getPlantDescription = (plant) => {
  if (plant?.description) {
    return truncateText(plant.description, 150);
  }

  const zone = plant?.zone || "5b";
  const care = plant?.care_difficulty || "средней сложности";
  return `Растение подходит для зоны ${zone} и требует ухода ${care}. Может использоваться для поддержания общей цветовой палитры участка.`;
};

export default function MoodboardPage() {
  const [filter, setFilter] = useState("all");
  const [orderedPlants, setOrderedPlants] = useState([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const [saveMessage, setSaveMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const flow = useSelector((state) => state.flow);
  const { plants, palette, harmonyPartners } = flow;

  const filtered = useMemo(() => {
    if (filter === "flowering") return plants.filter((p) => p.flowering);
    if (filter === "shade") return plants.filter((p) => p.shade);
    return plants;
  }, [filter, plants]);

  useEffect(() => {
    setOrderedPlants(
      [...filtered].sort((left, right) => Number(right?.matchPercent || 0) - Number(left?.matchPercent || 0))
    );
    setBatchIndex(0);
  }, [filtered]);

  const visiblePlants = useMemo(() => {
    if (orderedPlants.length <= MAX_MOODBOARD_PLANTS) {
      return orderedPlants;
    }
    const start = batchIndex * MAX_MOODBOARD_PLANTS;
    return orderedPlants.slice(start, start + MAX_MOODBOARD_PLANTS);
  }, [orderedPlants, batchIndex]);

  const visibleRangeLabel = useMemo(() => {
    if (!filtered.length || !visiblePlants.length) {
      return "0 из 0";
    }
    const start = batchIndex * MAX_MOODBOARD_PLANTS + 1;
    const end = start + visiblePlants.length - 1;
    return `${start}-${end} из ${filtered.length}`;
  }, [batchIndex, filtered.length, visiblePlants.length]);

  const hasMultipleBatches = orderedPlants.length > MAX_MOODBOARD_PLANTS;
  const maxBatchIndex = hasMultipleBatches ? Math.ceil(orderedPlants.length / MAX_MOODBOARD_PLANTS) - 1 : 0;

  const showAnotherSelection = () => {
    if (!hasMultipleBatches) {
      return;
    }
    setBatchIndex((prev) => (prev < maxBatchIndex ? prev + 1 : 0));
  };

  const saveMoodboard = async () => {
    if (!plants.length) {
      setSaveMessage("Сначала сформируйте подборку растений.");
      return;
    }

    setSaving(true);
    setSaveMessage("");
    try {
      const locationLabel = flow.location?.address || flow.zone || "участок";
      const timestamp = new Date();
      const title = `Подборка · ${locationLabel} · ${timestamp.toLocaleDateString("ru-RU")}`;

      await api.saveMoodboard({
        title,
        createdAt: timestamp.toISOString(),
        snapshot: {
          ...flow,
          plants,
          palette,
          harmonyPartners
        }
      });
      setSaveMessage("Подборка сохранена. Ее можно открыть в разделе «Мой сад».");
    } catch (error) {
      setSaveMessage(error?.message || "Не удалось сохранить мудборд.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page" id="moodboard-export">
      <h1 className="page-title">Мудборд</h1>
      <p className="subtitle">Подбор растений по палитре, гармонии и локации (до 15 карточек за раз).</p>
      {!!flow.photoPreview && (
        <div className="moodboard-cover">
          <img src={flow.photoPreview} alt="Загруженный участок" className="moodboard-cover-image" />
          <div className="moodboard-cover-copy">
            <strong>Исходное фото участка</strong>
            <span>Снимок сохранён в текущем подборе, чтобы было проще сравнить палитру и рекомендации.</span>
          </div>
        </div>
      )}
      <div className="mood-toolbar">
        <div className="row wrap">
          {FILTERS.map((item) => (
            <button key={item.id} onClick={() => setFilter(item.id)} className={`btn ${filter === item.id ? "btn-primary" : "btn-outline"}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="row">
          <Button variant="outline" onClick={() => exportElementToPdf("moodboard-export", "moodboard.pdf")}>
            Скачать PDF
          </Button>
          <Button variant="outline" onClick={showAnotherSelection} disabled={!hasMultipleBatches}>
            Показать другую подборку
          </Button>
          <Button onClick={saveMoodboard} disabled={!plants.length || saving}>
            {saving ? "Сохраняем..." : "Сохранить мудборд"}
          </Button>
        </div>
      </div>
      {!!saveMessage && <p className="subtitle">{saveMessage}</p>}
      <div className="palette">
        {[...palette, ...harmonyPartners].map((color, index) => (
          <span key={`${color}-${index}`} className="swatch" style={{ backgroundColor: color }} />
        ))}
      </div>
      <p className="subtitle">Показано: {visibleRangeLabel}</p>
      <div className="mood-grid">
        {visiblePlants.map((plant) => (
          <article key={plant.id} className="mood-card">
            <div className="mood-card-top">
              <span className="match-chip">{plant.matchPercent || 0}% совп.</span>
              <div className="mood-card-badges">
                <span className="mood-badge">Зона {plant.zone || "5b"}</span>
                <span className="mood-badge">{plant.care_difficulty || "Уход: средний"}</span>
              </div>
            </div>
            <div className="mood-card-body">
              <h3>{plant.nameRu}</h3>
              {!!plant.nameLat && <p className="mood-card-latin">{plant.nameLat}</p>}
              <p className="mood-card-summary">{getMatchLabel(Number(plant.matchPercent || 0))}</p>
              <p className="mood-card-description">{getPlantDescription(plant)}</p>
              <div className="mood-card-meta">
                <span>Зона зимостойкости: {plant.zone || "5b"}</span>
                <span>Уход: {plant.care_difficulty || "средний"}</span>
                {plant.height_cm ? <span>Высота до {plant.height_cm} см</span> : <span>Высота уточняется</span>}
                {plant.width_cm ? <span>Ширина до {plant.width_cm} см</span> : <span>Ширина зависит от сорта</span>}
              </div>
              {!!plant.colors?.length && (
                <div className="mood-card-colors">
                  <span className="mood-card-colors-label">Цвета растения</span>
                  <div className="mood-card-swatches">
                    {plant.colors.slice(0, 5).map((color) => (
                      <span
                        key={`${plant.id}-${color.hex_code}`}
                        className="mood-card-swatch"
                        style={{ backgroundColor: color.hex_code }}
                        title={color.name || color.hex_code}
                      />
                    ))}
                  </div>
                </div>
              )}
              <Link to={`/plant/${plant.id}`} className="btn btn-outline mood-card-link">Подробнее →</Link>
            </div>
          </article>
        ))}
        {!visiblePlants.length && <p>Нет результатов. Вернитесь к загрузке и анализу.</p>}
      </div>
    </section>
  );
}
