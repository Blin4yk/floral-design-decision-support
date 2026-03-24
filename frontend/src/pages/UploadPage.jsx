import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Ui";
import StepSidebar from "../components/StepSidebar";
import { api } from "../services/api";
import { setPalette } from "../store/flowSlice";

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const toHex = (rgb) =>
  `#${rgb
    .map((v) => Math.max(0, Math.min(255, Number(v))).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onFile = (incoming) => {
    setError("");
    if (!incoming) return;
    if (!ALLOWED_TYPES.includes(incoming.type)) {
      setError("Поддерживаются только JPG и PNG.");
      return;
    }
    if (incoming.size > MAX_SIZE) {
      setError("Размер файла превышает 10 МБ.");
      return;
    }
    setFile(incoming);
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const process = await api.processImage(file).catch(() => null);
      const colorsFromProcess = (process?.colors || [])
        .map((item) => item?.rgb)
        .filter((rgb) => Array.isArray(rgb) && rgb.length === 3)
        .map((rgb) => toHex(rgb));

      if (colorsFromProcess.length) {
        dispatch(setPalette(colorsFromProcess));
      } else {
        const fallback = await api.uploadImage(file);
        dispatch(setPalette(fallback.palette || []));
      }
      navigate("/harmony");
    } catch (e) {
      setError(e.message || "Не удалось загрузить фото.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="workbench">
      <StepSidebar activeStep={1} />
      <div className="page">
        <p className="step-meta">ШАГ 1 ИЗ 3</p>
        <h1 className="page-title">Загрузи фото своего участка</h1>
        <p className="subtitle">Алгоритм автоматически извлечет цветовую палитру из снимка.</p>
        <div className="card">
          <div className="upload-zone">
            <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => onFile(e.target.files?.[0])} />
            <ul>
              <li>Хорошее освещение без сильных фильтров.</li>
              <li>В кадре должен быть весь участок.</li>
              <li>Снимайте в естественных цветах.</li>
            </ul>
          </div>
          {file && <p>Выбран файл: {file.name}</p>}
          {error && <p className="error">{error}</p>}
          <Button onClick={upload} disabled={!file || loading}>
            {loading ? "Загрузка..." : "Загрузить и продолжить"}
          </Button>
        </div>
      </div>
    </section>
  );
}
