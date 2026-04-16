import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "../components/Ui";
import { exportElementToPdf } from "../utils/pdf";

const FILTERS = [
  { id: "all", label: "Все" },
  { id: "flowering", label: "Цветущие" },
  { id: "shade", label: "Теневые" }
];

const MAX_MOODBOARD_PLANTS = 15;

export default function MoodboardPage() {
  const [filter, setFilter] = useState("all");
  const [orderedPlants, setOrderedPlants] = useState([]);
  const [batchIndex, setBatchIndex] = useState(0);
  const { plants, palette, harmonyPartners } = useSelector((state) => state.flow);

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

  return (
    <section className="page" id="moodboard-export">
      <h1 className="page-title">Мудборд</h1>
      <p className="subtitle">Подбор растений по палитре, гармонии и локации (до 15 карточек за раз).</p>
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
          <Button>Сохранить мудборд</Button>
        </div>
      </div>
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
            </div>
            <div className="mood-card-body">
              <h3>{plant.nameRu}</h3>
              <p>{plant.nameLat}</p>
              <p>Зона: {plant.zone || "5b"} · Полив: умеренный</p>
              <Link to={`/plant/${plant.id}`} className="btn btn-outline">Подробнее →</Link>
            </div>
          </article>
        ))}
        {!visiblePlants.length && <p>Нет результатов. Вернитесь к загрузке и анализу.</p>}
      </div>
    </section>
  );
}
