import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Input, Button } from "../components/Ui";
import { api } from "../services/api";
import { setAuth } from "../store/authSlice";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", zone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.email || form.password.length < 6) {
      setError("Проверьте email и пароль (минимум 6 символов)");
      return;
    }

    try {
      setLoading(true);
      const response =
        mode === "login"
          ? await api.login({ email: form.email, password: form.password })
          : await api.register({
              name: form.name,
              email: form.email,
              password: form.password,
              zone: form.zone || undefined
            });

      dispatch(setAuth(response));
      navigate("/upload");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loginViaYandex = async () => {
    try {
      const response = await api.getYandexAuthUrl();
      window.open(response.url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Не удалось получить ссылку для входа через Яндекс");
    }
  };

  return (
    <section className="auth-layout">
      <aside className="auth-left">
        <h2>Добро пожаловать в мир цветов</h2>
        <p>Создай аккаунт и начни подбирать растения для сада.</p>
        <ul className="auth-benefits">
          <li>Анализ цвета из фото через ИИ</li>
          <li>3 400+ растений в базе</li>
          <li>Учет климатической зоны</li>
          <li>Карточки ухода за растением</li>
        </ul>
      </aside>
      <div className="page">
        <div className="tabs">
          <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>
            Регистрация
          </button>
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
            Войти
          </button>
        </div>
        <form onSubmit={submit} className="card">
          <h1 style={{ margin: "0 0 4px 0", fontFamily: "Georgia, serif", fontSize: "36px" }}>Создать аккаунт</h1>
          {mode === "register" && (
            <div className="row">
              <Input
                label="Имя"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Input
                label="Фамилия"
                value={form.surname}
                onChange={(e) => setForm((prev) => ({ ...prev, surname: e.target.value }))}
              />
            </div>
          )}
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            label="Пароль"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          {mode === "register" && (
            <Input
              label="Климатическая зона (опционально)"
              value={form.zone}
              onChange={(e) => setForm((prev) => ({ ...prev, zone: e.target.value }))}
            />
          )}
          <label className="row" style={{ marginBottom: "12px" }}>
            <input type="checkbox" required={mode === "register"} />
            <span>Принимаю условия использования</span>
          </label>
          {error && <p className="error">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Отправка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
          <div className="auth-divider">
            <span>или</span>
          </div>
          <Button type="button" variant="outline" onClick={loginViaYandex}>
            Войти через Яндекс
          </Button>
        </form>
      </div>
    </section>
  );
}
