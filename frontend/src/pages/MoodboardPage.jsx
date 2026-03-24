import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "../components/Ui";
import { exportElementToPdf } from "../utils/pdf";

const FILTERS = [
  { id: "all", label: "Все" },
  { id: "flowering", label: "Цветущие" },
  { id: "shade", label: "Теневые" }
];

export default function MoodboardPage() {
  const [filter, setFilter] = useState("all");
  const { plants, palette, harmonyPartners } = useSelector((state) => state.flow);

  const filtered = useMemo(() => {
    if (filter === "flowering") return plants.filter((p) => p.flowering);
    if (filter === "shade") return plants.filter((p) => p.shade);
    return plants;
  }, [filter, plants]);

  return (
    <section className="page" id="moodboard-export">
      <h1 className="page-title">Мудборд</h1>
      <p className="subtitle">Подбор растений по палитре, гармонии и локации.</p>
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
          <Button>Сохранить мудборд</Button>
        </div>
      </div>
      <div className="palette">
        {[...palette, ...harmonyPartners].map((color, index) => (
          <span key={`${color}-${index}`} className="swatch" style={{ backgroundColor: color }} />
        ))}
      </div>
      <div className="mood-grid">
        {filtered.map((plant) => (
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
        {!filtered.length && <p>Нет результатов. Вернитесь к загрузке и анализу.</p>}
      </div>
    </section>
  );
}
