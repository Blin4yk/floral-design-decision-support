import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../components/Ui";
import StepSidebar from "../components/StepSidebar";
import { api } from "../services/api";
import { setLocation, setPlants } from "../store/flowSlice";

export default function LocationPage() {
  const [address, setAddress] = useState("");
  const [soilType, setSoilType] = useState("Суглинок");
  const [soilOptions, setSoilOptions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [zoneLabel, setZoneLabel] = useState("");
  const flow = useSelector((state) => state.flow);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getSoilTypes()
      .then((items) => {
        const names = (items || []).map((item) => item?.name).filter(Boolean);
        setSoilOptions(names);
        setSoilType((prev) => (names.length && !names.includes(prev) ? names[0] : prev));
      })
      .catch(() => setSoilOptions([]));
  }, []);

  const detect = () => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const zone = await api.getZone(coords.latitude, coords.longitude).catch(() => ({ zone: "5b" }));
        const nextZone = zone.zone || "5b";
        setZoneLabel(nextZone);
        dispatch(
          setLocation({
            location: { lat: coords.latitude, lng: coords.longitude, address: "Геолокация" },
            zone: nextZone
          })
        );
      },
      () => setError("Не удалось определить местоположение.")
    );
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const photoPalette = [...new Set(flow.palette || [])];
      const harmonyColors = [...new Set(flow.harmonyPartners || [])];
      if (!photoPalette.length) {
        throw new Error("Сначала загрузите изображение и выберите гармонию.");
      }
      const payload = {
        city: address || flow.location?.address || "Москва",
        soil_type: soilType || "Суглинок",
        photo_palette: photoPalette,
        harmony_colors: harmonyColors,
        top_n: 45,
        w3: 0.6,
        w4: 0.4
      };
      const response = await api.matchPlants(payload);
      if (response?.zone) {
        setZoneLabel(response.zone);
      }
      dispatch(setPlants(response.plants || []));
      navigate("/moodboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="workbench">
      <StepSidebar activeStep={3} />
      <div className="page">
        <p className="step-meta">ШАГ 3 ИЗ 3 - ПОСЛЕДНИЙ</p>
        <h1 className="page-title">Где находится ваш участок?</h1>
        <p className="subtitle">Нужно для учета климатической зоны и сезонности посадки.</p>
        <div className="card">
          <Input label="Адрес" value={address} onChange={(e) => setAddress(e.target.value)} />
          <label className="field">
            <span>Тип почвы</span>
            <select value={soilType} onChange={(e) => setSoilType(e.target.value)}>
              {soilOptions.length ? (
                soilOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))
              ) : (
                <option value={soilType}>{soilType}</option>
              )}
            </select>
          </label>
          <div className="row">
            <Button variant="outline" onClick={detect}>
              Определить мое местоположение
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? "Подбираем..." : "Подобрать"}
            </Button>
          </div>
          {zoneLabel && <p>Зона зимостойкости: {zoneLabel}</p>}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </section>
  );
}
