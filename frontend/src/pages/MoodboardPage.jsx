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

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

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
    setOrderedPlants(shuffle(filtered));
    setBatchIndex(0);
  }, [filtered]);

  const visiblePlants = useMemo(() => {
    if (orderedPlants.length <= MAX_MOODBOARD_PLANTS) {
      return orderedPlants;
    }
    const start = batchIndex * MAX_MOODBOARD_PLANTS;
    return orderedPlants.slice(start, start + MAX_MOODBOARD_PLANTS);
  }, [orderedPlants, batchIndex]);

  const hasMultipleBatches = orderedPlants.length > MAX_MOODBOARD_PLANTS;
  const maxBatchIndex = hasMultipleBatches ? Math.ceil(orderedPlants.length / MAX_MOODBOARD_PLANTS) - 1 : 0;

  const showAnotherSelection = () => {
    if (!hasMultipleBatches) {
      return;
    }
    if (batchIndex < maxBatchIndex) {
      setBatchIndex((prev) => prev + 1);
      return;
    }
    setOrderedPlants(shuffle(orderedPlants));
    setBatchIndex(0);
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
      <p className="subtitle">Показано: {visiblePlants.length} из {filtered.length}</p>
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
