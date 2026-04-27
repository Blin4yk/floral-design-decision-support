import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "../components/Ui";
import { api } from "../services/api";
import { exportElementToPdf } from "../utils/pdf";

const toPercent = (value) => `${Math.max(0, Math.round(Number(value || 0) * 100))}%`;

const normalizeHex = (value) => String(value || "").trim().toUpperCase();

const getColorHexes = (plant) =>
  (plant?.colors || [])
    .map((item) => normalizeHex(item?.hex_code || item?.hexCode))
    .filter(Boolean);

const getPlantToneText = (plant) => {
  const care = plant?.care_difficulty || "средней сложности";
  const zone = plant?.zone || "5b";
  return `Подходит для зоны ${zone}, сохраняет декоративность в садовых композициях и относится к растениям ухода ${care}.`;
};

const getPlantImageUrl = (plant) => {
  const rawUrl = String(plant?.image_url || "").trim();
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith("data:")) {
    return rawUrl;
  }
  if (rawUrl.startsWith("/")) {
    return api.baseUrl ? `${api.baseUrl}${rawUrl}` : rawUrl;
  }
  return `${api.baseUrl}/${rawUrl}`.replace(/([^:]\/)\/+/g, "$1");
};

const getPlantPlacementText = (plant) => {
  if (plant?.height_cm && plant?.width_cm) {
    return `Рекомендуется как акцент или заполняющий элемент: высота до ${plant.height_cm} см, ширина до ${plant.width_cm} см.`;
  }
  if (plant?.height_cm) {
    return `Рекомендуется размещать растение с учетом высоты до ${plant.height_cm} см и свободного пространства вокруг куста.`;
  }
  return "Лучше высаживать растение в композиции с запасом пространства, чтобы оно сохраняло форму и цветовой акцент.";
};

const getPlantColorText = (plant) => {
  const names = (plant?.colors || [])
    .map((item) => item?.name)
    .filter(Boolean)
    .slice(0, 4);

  if (!names.length) {
    return "Растение поддерживает общую палитру участка и может использоваться как композиционный цветовой акцент.";
  }

  return `Основные декоративные оттенки растения: ${names.join(", ")}. Это помогает встроить его в палитру участка без визуального конфликта.`;
};

const buildCompatibility = (plant, plants) => {
  if (!plant || !plants?.length) return [];

  const sourceColors = new Set(getColorHexes(plant));

  return plants
    .filter((candidate) => Number(candidate?.id) !== Number(plant.id))
    .map((candidate) => {
      const candidateColors = getColorHexes(candidate);
      const sharedColors = candidateColors.filter((color) => sourceColors.has(color));
      const sharedColorScore = candidateColors.length ? sharedColors.length / candidateColors.length : 0;
      const sameZoneScore = candidate?.zone && candidate.zone === plant.zone ? 0.2 : 0;
      const sameCareScore = candidate?.care_difficulty && candidate.care_difficulty === plant.care_difficulty ? 0.15 : 0;
      const matchCloseness = 1 - Math.min(1, Math.abs(Number(candidate?.matchPercent || 0) - Number(plant?.matchPercent || 0)) / 100);
      const score = sharedColorScore * 0.55 + matchCloseness * 0.1 + sameZoneScore + sameCareScore;

      return {
        ...candidate,
        compatibilityScore: score,
        sharedColors
      };
    })
    .sort((left, right) => right.compatibilityScore - left.compatibilityScore)
    .slice(0, 4);
};

export default function PlantPage() {
  const { id } = useParams();
  const token = useSelector((state) => state.auth.token);
  const plants = useSelector((state) => state.flow.plants);
  const [plant, setPlant] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const selectedPlant = useMemo(
    () => (plants || []).find((item) => Number(item?.id) === Number(id)) || null,
    [id, plants]
  );

  useEffect(() => {
    if (selectedPlant) {
      setPlant(selectedPlant);
      return;
    }
    api.getPlant(id).then((res) => setPlant(res.plant)).catch(() => setPlant(null));
  }, [id, selectedPlant]);

  const compatibilityPlants = useMemo(() => buildCompatibility(plant, plants), [plant, plants]);
  const compatibilityNames = compatibilityPlants.map((item) => item.nameRu).join(", ");

  const addToGarden = async () => {
    if (!token) {
      navigate("/auth");
      return;
    }
    await api.addToGarden(id);
  };

  if (!plant) return <section className="page">Загрузка растения...</section>;

  return (
    <section className="plant-layout" id="plant-export">
      <div className="plant-photo">
        {getPlantImageUrl(plant) && (
          <img src={getPlantImageUrl(plant)} alt={plant.nameRu} className="plant-detail-image" />
        )}
        <span className="plant-photo-chip">{plant.matchPercent || 0}% совпадение с подборкой</span>
        {!!plant.nameLat && <p className="subtitle">{plant.nameLat}</p>}
        <h2 className="page-title" style={{ color: "#f0ebe0", fontSize: "44px" }}>{plant.nameRu}</h2>
        <p className="plant-photo-text">{getPlantToneText(plant)}</p>
      </div>
      <div className="plant-info">
        <div className="plant-copy">
          <p>{plant.description || "Описание растения будет дополнено после загрузки данных из каталога."}</p>
          <p>{getPlantPlacementText(plant)}</p>
          <p>{getPlantColorText(plant)}</p>
        </div>
        <div className="stats-row">
          <div className="stat-box"><small>Высота</small><strong>{plant.height_cm ? `${plant.height_cm} см` : "уточняется"}</strong></div>
          <div className="stat-box"><small>Ширина</small><strong>{plant.width_cm ? `${plant.width_cm} см` : "уточняется"}</strong></div>
          <div className="stat-box"><small>Уход</small><strong>{plant.care_difficulty || "средний"}</strong></div>
          <div className="stat-box"><small>Зона</small><strong>{plant.zone || "5b"}</strong></div>
        </div>
        <div className="plant-panels">
          <div className="card plant-panel">
            <h3>Почему растение подходит</h3>
            <p>Совпадение по общей подборке: <strong>{plant.matchPercent || 0}%</strong>.</p>
            <p>Цветовой скор: <strong>{plant.colorScore ? toPercent(plant.colorScore) : "не рассчитан"}</strong>.</p>
            <p>Гармонический скор: <strong>{plant.harmonyScore ? toPercent(plant.harmonyScore) : "не рассчитан"}</strong>.</p>
          </div>
          <div className="card plant-panel">
            <h3>Рекомендации по размещению</h3>
            <p>Лучше использовать растение в зоне, где важен мягкий переход между цветами участка и цветущими акцентами.</p>
            <p>Зона зимостойкости: <strong>{plant.zone || "5b"}</strong>, уровень ухода: <strong>{plant.care_difficulty || "средний"}</strong>.</p>
            <p>Ориентировочный календарь посадки: <strong>май - сентябрь</strong>.</p>
          </div>
        </div>
        {!!plant.colors?.length && (
          <div className="card plant-panel">
            <h3>Палитра растения</h3>
            <div className="plant-color-list">
              {plant.colors.map((color) => (
                <div key={`${plant.id}-${color.hex_code}`} className="plant-color-item">
                  <span className="plant-color-swatch" style={{ backgroundColor: color.hex_code }} />
                  <div>
                    <strong>{color.name || "Оттенок"}</strong>
                    <p>{color.hex_code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="card plant-panel">
          <h3>Совместимость в композиции</h3>
          <p>
            {compatibilityNames
              ? `Лучше всего сочетается с такими растениями из текущей подборки: ${compatibilityNames}.`
              : "Совместимость будет доступна после формирования более широкой подборки в мудборде."}
          </p>
          {!!compatibilityPlants.length && (
            <div className="compatibility-grid">
              {compatibilityPlants.map((item) => (
                <Link key={item.id} to={`/plant/${item.id}`} className="compatibility-card">
                  <span className="compatibility-card-score">{Math.max(1, Math.round(item.compatibilityScore * 100))}% совмест.</span>
                  <strong>{item.nameRu}</strong>
                  <span>Зона {item.zone || "5b"}</span>
                  <span>Уход: {item.care_difficulty || "средний"}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="row">
          <Button onClick={addToGarden}>Добавить в сад</Button>
          <Button variant="outline" onClick={() => exportElementToPdf("plant-export", `${plant.nameRu}.pdf`)}>
            Скачать PDF
          </Button>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Показать совместимость
          </Button>
        </div>
      </div>
      <Modal open={open} title="Хорошо сочетается с" onClose={() => setOpen(false)}>
        {compatibilityPlants.length ? (
          <div className="compatibility-grid modal-compatibility-grid">
            {compatibilityPlants.map((item) => (
              <Link key={`modal-${item.id}`} to={`/plant/${item.id}`} className="compatibility-card" onClick={() => setOpen(false)}>
                <span className="compatibility-card-score">{Math.max(1, Math.round(item.compatibilityScore * 100))}% совмест.</span>
                <strong>{item.nameRu}</strong>
                <span>{item.description || "Растение из текущей композиции."}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p>Для этого растения пока нет достаточного количества соседних карточек, чтобы показать совместимость.</p>
        )}
      </Modal>
    </section>
  );
}
