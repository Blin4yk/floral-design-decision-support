import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <section className="page">
      <div className="hero">
        <div className="page">
          <span className="step-pill">КОМПЬЮТЕРНОЕ ЗРЕНИЕ</span>
          <h1>Подбери растения под цвет сада</h1>
          <p>Загрузи фото участка - мы извлечем палитру, наложим круг Иттена и подберем растения.</p>
          <div className="row">
            <Link to="/upload" className="btn btn-primary">
              Анализировать сад
            </Link>
            <Link to="/moodboard" className="btn btn-secondary">Смотреть примеры</Link>
          </div>
          <div className="stat-grid">
            <div className="stat">
              <strong>3 400+</strong>
              <span>видов растений в базе</span>
            </div>
            <div className="stat">
              <strong>98%</strong>
              <span>точность анализа</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3>Три шага до мудборда</h3>
          <div className="steps-grid">
            <article>
              <span className="step-pill">Шаг 1</span>
              <p>Загрузите фотографию участка.</p>
            </article>
            <article>
              <span className="step-pill">Шаг 2</span>
              <p>Выберите цветовую гармонию по кругу Иттена.</p>
            </article>
            <article>
              <span className="step-pill">Шаг 4</span>
              <p>Укажите локацию и получите мудборд.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
