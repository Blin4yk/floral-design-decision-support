import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Modal } from "../components/Ui";
import { api } from "../services/api";
import { exportElementToPdf } from "../utils/pdf";

export default function PlantPage() {
  const { id } = useParams();
  const token = useSelector((state) => state.auth.token);
  const [plant, setPlant] = useState(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getPlant(id).then((res) => setPlant(res.plant)).catch(() => setPlant(null));
  }, [id]);

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
        <p className="subtitle">{plant.nameLat}</p>
        <h2 className="page-title" style={{ color: "#f0ebe0", fontSize: "44px" }}>{plant.nameRu}</h2>
      </div>
      <div className="plant-info">
        <p>{plant.description}</p>
        <div className="stats-row">
          <div className="stat-box"><small>Высота</small><strong>90 см</strong></div>
          <div className="stat-box"><small>Полив</small><strong>умеренный</strong></div>
          <div className="stat-box"><small>Солнце</small><strong>полное</strong></div>
          <div className="stat-box"><small>Зона</small><strong>{plant.zone || "5b"}</strong></div>
        </div>
        <div className="card">
          <p>Календарь посадки: май - сентябрь</p>
          <p>Хорошо сочетается с: {(plant.compatibility || []).slice(0, 3).join(", ")}</p>
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
        <ul>
          {(plant.compatibility || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Modal>
    </section>
  );
}
