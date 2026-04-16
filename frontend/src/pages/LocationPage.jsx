import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Ui";
import StepSidebar from "../components/StepSidebar";
import { api } from "../services/api";
import { setLocation, setPlants } from "../store/flowSlice";

export default function LocationPage() {
  const [regionQuery, setRegionQuery] = useState("");
  const [regionOptions, setRegionOptions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
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

  useEffect(() => {
    let cancelled = false;
    api
      .getRegions(regionQuery)
      .then((items) => {
        if (!cancelled) {
          setRegionOptions(items || []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRegionOptions([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [regionQuery]);

  const selectRegion = (item) => {
    setSelectedRegion(item);
    setRegionQuery(item?.name || "");
    if (item?.zone) {
      setZoneLabel(item.zone);
      dispatch(
        setLocation({
          location: { address: item.name },
          zone: item.zone
        })
      );
    }
    setRegionOptions([]);
  };

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
        city: selectedRegion?.name || regionQuery || flow.location?.address || "Москва",
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
          <label className="field autocomplete">
            <span>Регион или город</span>
            <input
              className="input"
              value={regionQuery}
              onChange={(e) => {
                setRegionQuery(e.target.value);
                setSelectedRegion(null);
              }}
              placeholder="Начните вводить название региона"
            />
            {!!regionOptions.length && (
              <div className="autocomplete-menu">
                {regionOptions.map((item) => (
                  <button
                    key={`${item.name}-${item.zone}`}
                    type="button"
                    className="autocomplete-option"
                    onClick={() => selectRegion(item)}
                  >
                    <span>{item.name}</span>
                    <small>{item.zone}</small>
                  </button>
                ))}
              </div>
            )}
          </label>
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
