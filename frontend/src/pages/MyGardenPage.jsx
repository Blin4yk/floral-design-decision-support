import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { Button } from "../components/Ui";
import { hydrateFlow } from "../store/flowSlice";

export default function MyGardenPage() {
  const [moodboards, setMoodboards] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const load = async () => {
    const response = await api.getMyGarden().catch(() => ({ moodboards: [] }));
    setMoodboards(response.moodboards || []);
  };

  useEffect(() => {
    load();
  }, []);

  const openMoodboard = (moodboard) => {
    if (!moodboard?.snapshot) return;
    dispatch(hydrateFlow(moodboard.snapshot));
    navigate("/moodboard");
  };

  const remove = async (id) => {
    await api.removeFromGarden(id).catch(() => null);
    load();
  };

  return (
    <section className="page">
      <h1 className="page-title">Мои подборки</h1>
      <p className="subtitle">Сохранённые мудборды с палитрой, фотографией участка и ранее подобранными растениями.</p>
      <div className="saved-moodboards">
        {moodboards.map((moodboard) => (
          <article key={moodboard.id} className="saved-moodboard-card" onClick={() => openMoodboard(moodboard)} role="button" tabIndex={0} onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openMoodboard(moodboard);
            }
          }}>
            <div className="saved-moodboard-preview">
              {moodboard.snapshot?.photoPreview ? (
                <img src={moodboard.snapshot.photoPreview} alt={moodboard.title} className="saved-moodboard-image" />
              ) : (
                <div className="saved-moodboard-placeholder">Без фото</div>
              )}
            </div>
            <div className="saved-moodboard-content">
              <div className="saved-moodboard-top">
                <div>
                  <h3>{moodboard.title}</h3>
                  <p>{new Date(moodboard.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                <span className="saved-moodboard-count">{moodboard.snapshot?.plants?.length || 0} растений</span>
              </div>
              <p className="saved-moodboard-description">
                {moodboard.snapshot?.location?.address || "Локация не указана"} · зона {moodboard.snapshot?.zone || "5b"} ·
                гармония {moodboard.snapshot?.harmonyType || "analogous"}
              </p>
              {!!moodboard.snapshot?.palette?.length && (
                <div className="saved-moodboard-palette">
                  {moodboard.snapshot.palette.slice(0, 6).map((color, index) => (
                    <span key={`${moodboard.id}-${color}-${index}`} className="saved-moodboard-swatch" style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
              <div className="row wrap">
                <Button variant="outline" onClick={(event) => {
                  event.stopPropagation();
                  openMoodboard(moodboard);
                }}>
                  Открыть подборку
                </Button>
                <Button variant="secondary" onClick={(event) => {
                  event.stopPropagation();
                  remove(moodboard.id);
                }}>
                  Удалить
                </Button>
              </div>
            </div>
          </article>
        ))}
        {!moodboards.length && (
          <div className="card">
            <h3>Пока нет сохранённых мудбордов</h3>
            <p>Сформируйте подборку на странице мудборда и нажмите «Сохранить мудборд», чтобы она появилась здесь.</p>
          </div>
        )}
      </div>
    </section>
  );
}
