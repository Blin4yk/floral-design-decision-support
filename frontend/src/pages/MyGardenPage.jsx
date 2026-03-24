import { useEffect, useState } from "react";
import { api } from "../services/api";
import { Button } from "../components/Ui";

export default function MyGardenPage() {
  const [plants, setPlants] = useState([]);

  const load = async () => {
    const response = await api.getMyGarden().catch(() => ({ plants: [] }));
    setPlants(response.plants || []);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    await api.removeFromGarden(id).catch(() => null);
    load();
  };

  return (
    <section className="page">
      <h1 className="page-title">Мои подборки</h1>
      <p className="subtitle">Сохраненные растения для текущего проекта участка.</p>
      <div className="grid">
        {plants.map((plant) => (
          <article key={plant.id} className="card">
            <h3>{plant.nameRu}</h3>
            <p>{plant.nameLat}</p>
            <Button variant="outline" onClick={() => remove(plant.id)}>
              Удалить из подборки
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
