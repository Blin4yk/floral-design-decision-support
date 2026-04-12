import { useState, useRef } from "react";

// ─── Design tokens from SVG prototypes ────────────────────────────────────
const C = {
  bg:        "#f7f3ec",
  nav:       "#f0ebe0",
  border:    "#c8dbc4",
  dark:      "#1a2e1a",
  darkMid:   "#2d4a2d",
  green:     "#7a9e72",
  greenDark: "#4a6741",
  text:      "#5a6e57",
  textLight: "#a0b49c",
  cream:     "#f0ebe0",
  card:      "#e4ddd0",
  white:     "#ffffff",
};

// ─── Shared components ─────────────────────────────────────────────────────

function Nav({ step, onBack }) {
  return (
    <header style={{
      background: C.nav, borderBottom: `1px solid ${C.border}`,
      display: "flex", alignItems: "center", padding: "0 32px",
      height: 60, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", background: C.dark,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ width: 10, height: 16, borderRadius: 5, background: C.green, opacity: 0.7 }} />
        </div>
        <span style={{ fontFamily: "Georgia, serif", fontWeight: 600, fontSize: 18, color: C.dark }}>
          Flora Vision
        </span>
      </div>
      <div style={{ flex: 1 }} />
      {onBack && (
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.text, fontSize: 13, fontFamily: "sans-serif",
        }}>
          ← Изменить запрос
        </button>
      )}
      {!onBack && step && (
        <div style={{ display: "flex", gap: 8 }}>
          {["Как это работает", "Примеры"].map(t => (
            <span key={t} style={{ fontSize: 14, color: C.text, fontFamily: "sans-serif", padding: "0 12px", cursor: "pointer" }}>{t}</span>
          ))}
          <button style={{
            background: C.dark, color: C.cream, border: "none", borderRadius: 18,
            padding: "8px 20px", fontSize: 13, fontFamily: "sans-serif", cursor: "pointer",
          }}>Начать бесплатно</button>
        </div>
      )}
    </header>
  );
}

function Btn({ children, onClick, outline, wide, style: s }) {
  return (
    <button onClick={onClick} style={{
      background: outline ? "transparent" : C.dark,
      color: outline ? C.text : C.cream,
      border: outline ? `1.5px solid ${C.border}` : "none",
      borderRadius: 28, padding: wide ? "16px 40px" : "12px 28px",
      fontSize: 15, fontFamily: "sans-serif", cursor: "pointer",
      fontWeight: 500, width: wide ? "100%" : undefined, ...s,
    }}>{children}</button>
  );
}

function Label({ children }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: "sans-serif", letterSpacing: "0.1em",
      color: C.greenDark, marginBottom: 8,
    }}>{children}</div>
  );
}

// ─── Step indicator (sidebar style from screen 4) ─────────────────────────
function StepSidebar({ current }) {
  const steps = ["Фото участка", "Круг Иттена", "Локация"];
  return (
    <div style={{
      width: 280, background: C.dark, padding: "40px 24px", flexShrink: 0,
      display: "flex", flexDirection: "column", gap: 0,
    }}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: done ? C.green : active ? C.green : "transparent",
                border: done || active ? "none" : `2px solid #3a5a3a`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 14, color: done || active ? C.dark : "#3a5a3a", fontFamily: "sans-serif" }}>
                  {done ? "✓" : i + 1}
                </span>
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.green, fontFamily: "sans-serif", letterSpacing: "0.08em" }}>ШАГ {i + 1}</div>
                <div style={{
                  fontSize: active ? 18 : 16, fontWeight: active ? 600 : 400,
                  color: active ? C.cream : done ? C.green : "#5a6e57",
                  fontFamily: active ? "Georgia, serif" : "sans-serif",
                }}>{s}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ marginLeft: 15, width: 2, height: 24, background: "#3a5a3a", borderRadius: 1 }} />
            )}
          </div>
        );
      })}
      {/* decorative plant */}
      <div style={{ flex: 1 }} />
      <svg width="200" height="180" viewBox="0 0 200 180" style={{ opacity: 0.5 }}>
        <line x1="100" y1="170" x2="100" y2="40" stroke="#3a5a3a" strokeWidth="2" />
        <ellipse cx="72" cy="100" rx="52" ry="20" fill="#2d4a2d" transform="rotate(-20 72 100)" />
        <ellipse cx="130" cy="90" rx="48" ry="18" fill="#243e24" transform="rotate(20 130 90)" />
        <ellipse cx="75" cy="70" rx="36" ry="14" fill="#2d4a2d" transform="rotate(-25 75 70)" />
        <ellipse cx="128" cy="65" rx="34" ry="13" fill="#3a5a3a" transform="rotate(28 128 65)" />
      </svg>
    </div>
  );
}

// ─── Screen 1: Landing ─────────────────────────────────────────────────────
function Landing({ go }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Nav step />
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        {/* Left */}
        <div style={{ flex: 1, padding: "48px 56px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 15, padding: "6px 16px", marginBottom: 40,
          }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.green }} />
            <span style={{ fontSize: 12, color: C.greenDark, fontFamily: "sans-serif", letterSpacing: "0.06em" }}>
              КОМПЬЮТЕРНОЕ ЗРЕНИЕ
            </span>
          </div>

          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 600, fontSize: 72, color: C.dark, lineHeight: 1.05, margin: "0 0 24px" }}>
            Подбери<br />растения под<br />
            <em style={{ color: C.greenDark }}>цвет сада</em>
          </h1>

          <p style={{ fontSize: 17, color: C.text, fontFamily: "sans-serif", lineHeight: 1.6, marginBottom: 36 }}>
            Загрузи фото участка — мы извлечём палитру,<br />
            наложим круг Иттена и подберём растения.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 48 }}>
            <Btn onClick={() => go("upload")}>Анализировать сад</Btn>
            <span style={{ fontSize: 15, color: C.text, fontFamily: "sans-serif", cursor: "pointer" }}>
              → Смотреть примеры
            </span>
          </div>

          {/* Stats */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 18, padding: "20px 32px",
            display: "inline-flex", alignItems: "center", gap: 0,
          }}>
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 600, color: C.dark }}>3 400+</div>
              <div style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif" }}>видов растений в базе</div>
            </div>
            <div style={{ width: 1, height: 48, background: C.border, margin: "0 32px" }} />
            <div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 600, color: C.dark }}>98%</div>
              <div style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif" }}>точность анализа</div>
            </div>
          </div>
        </div>

        {/* Right — dark panel with decorative plant */}
        <div style={{
          width: 560, background: C.dark, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
          padding: 32, position: "relative", overflow: "hidden",
        }}>
          <svg width="100%" height="100%" viewBox="0 0 560 740" style={{ position: "absolute", top: 0, left: 0 }}>
            {/* grid lines */}
            <line x1="280" y1="0" x2="280" y2="740" stroke="#2d4a2d" strokeWidth="1" />
            <line x1="0" y1="370" x2="560" y2="370" stroke="#2d4a2d" strokeWidth="1" />
            {/* stem */}
            <line x1="280" y1="740" x2="280" y2="140" stroke="#4a6741" strokeWidth="4" />
            {/* leaves */}
            {[
              { cx: 200, cy: 460, rx: 90, ry: 34, r: -28 },
              { cx: 196, cy: 385, rx: 74, ry: 26, r: -18 },
              { cx: 356, cy: 440, rx: 90, ry: 34, r: 28 },
              { cx: 352, cy: 370, rx: 74, ry: 26, r: 22 },
              { cx: 207, cy: 295, rx: 62, ry: 22, r: -22 },
              { cx: 350, cy: 280, rx: 60, ry: 20, r: 24 },
            ].map((l, i) => (
              <ellipse key={i} cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry}
                fill={i % 2 ? "#243e24" : "#2d4a2d"} transform={`rotate(${l.r} ${l.cx} ${l.cy})`} />
            ))}
            {/* flower */}
            {[0, 60, 120, 180, 240, 300].map((a, i) => (
              <circle key={i} cx={280 + 26 * Math.cos(a * Math.PI / 180)} cy={152 + 26 * Math.sin(a * Math.PI / 180)}
                r="18" fill="#c8dbc4" opacity="0.7" />
            ))}
            <circle cx="280" cy="152" r="14" fill="#d4a040" />
          </svg>

          {/* Palette bar */}
          <div style={{
            position: "relative", zIndex: 1,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18, padding: "16px 24px", width: "100%",
          }}>
            <div style={{ fontSize: 11, color: C.green, fontFamily: "sans-serif", letterSpacing: "0.08em", marginBottom: 10 }}>
              ВЫБРАННАЯ ПАЛИТРА
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {["#9878c8", "#38a840", "#e8a820", "#2878c8", "#c0706a", "#20a898"].map(c => (
                <div key={c} style={{ width: 28, height: 28, borderRadius: "50%", background: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works strip */}
      <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: "32px 56px" }}>
        <Label>КАК ЭТО РАБОТАЕТ</Label>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 30, color: C.dark, margin: "0 0 24px" }}>
          Три шага до мудборда
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[
            { n: 1, label: "Фото" },
            { n: 2, label: "Желаемая палитра" },
            { n: 3, label: "Локация" },
            { n: 4, label: "Мудборд", green: true },
          ].map((s, i, arr) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: s.green ? C.green : C.dark,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 18, color: s.green ? C.dark : C.cream, fontFamily: "sans-serif" }}>{s.n}</span>
                </div>
                <span style={{ fontSize: 13, color: C.dark, fontFamily: "sans-serif" }}>{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div style={{
                  width: 80, height: 1, borderTop: `1.5px dashed ${C.border}`, margin: "0 12px 24px",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2: Auth ────────────────────────────────────────────────────────
function Auth({ go }) {
  const [mode, setMode] = useState("login");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: C.white, border: `1px solid ${C.border}`, borderRadius: 24,
        padding: 48, width: 420,
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 10, height: 20, borderRadius: 5, background: C.green, opacity: 0.7 }} />
          </div>
        </div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 28, color: C.dark, textAlign: "center", marginBottom: 8 }}>
          {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
        </h2>
        <p style={{ fontSize: 14, color: C.text, fontFamily: "sans-serif", textAlign: "center", marginBottom: 32 }}>
          {mode === "login" ? "Войдите, чтобы сохранять мудборды" : "Начните анализировать свой сад"}
        </p>

        {[
          { label: "Email", type: "email", placeholder: "your@email.com" },
          { label: "Пароль", type: "password", placeholder: "••••••••" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <Label>{f.label}</Label>
            <input type={f.type} placeholder={f.placeholder} style={{
              width: "100%", padding: "12px 16px", borderRadius: 12,
              border: `1px solid ${C.border}`, background: C.bg,
              fontFamily: "sans-serif", fontSize: 14, color: C.dark,
              outline: "none", boxSizing: "border-box",
            }} />
          </div>
        ))}

        <Btn onClick={() => go("upload")} wide style={{ marginTop: 8, marginBottom: 20 }}>
          {mode === "login" ? "Войти" : "Зарегистрироваться"}
        </Btn>

        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif" }}>
            {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <span onClick={() => setMode(mode === "login" ? "register" : "login")}
              style={{ color: C.greenDark, cursor: "pointer", textDecoration: "underline" }}>
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 3: Photo Upload ────────────────────────────────────────────────
function PhotoUpload({ go }) {
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const ref = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) setUploaded(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Nav />
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <StepSidebar current={0} />
        <div style={{ flex: 1, padding: "48px 56px" }}>
          <Label>ШАГ 1 ИЗ 3 — ФОТО УЧАСТКА</Label>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 52, color: C.dark, margin: "12px 0 16px" }}>
            Загрузите фото участка
          </h1>
          <p style={{ fontSize: 16, color: C.text, fontFamily: "sans-serif", marginBottom: 40, lineHeight: 1.6 }}>
            Система извлечёт цветовую палитру и наложит её на круг Иттена.<br />
            Лучший результат — фото при дневном свете без сильных теней.
          </p>

          {/* Drop zone */}
          <div
            onClick={() => ref.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? C.greenDark : C.border}`,
              borderRadius: 24, padding: "64px 40px", textAlign: "center",
              background: dragging ? "#eef5ec" : uploaded ? "#eef5ec" : C.card,
              cursor: "pointer", transition: "all 0.2s", marginBottom: 32,
            }}
          >
            <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
              onChange={() => setUploaded(true)} />
            {uploaded ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: C.dark, fontFamily: "Georgia, serif" }}>Фото загружено!</div>
                <div style={{ fontSize: 14, color: C.text, fontFamily: "sans-serif", marginTop: 8 }}>Нажмите, чтобы заменить</div>
              </>
            ) : (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: 16, background: C.card,
                  border: `1px solid ${C.border}`, margin: "0 auto 20px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.greenDark} strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: C.dark, fontFamily: "Georgia, serif", marginBottom: 8 }}>
                  Перетащите фото сюда
                </div>
                <div style={{ fontSize: 14, color: C.text, fontFamily: "sans-serif" }}>
                  или нажмите для выбора · JPG, PNG до 15 МБ
                </div>
              </>
            )}
          </div>

          {/* Tips */}
          <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
            {["Дневной свет", "Весь участок в кадре", "Без засветки"].map(tip => (
              <div key={tip} style={{
                flex: 1, background: C.white, border: `1px solid ${C.border}`,
                borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
                <span style={{ fontSize: 13, color: C.text, fontFamily: "sans-serif" }}>{tip}</span>
              </div>
            ))}
          </div>

          <Btn onClick={() => go("color")} style={{ opacity: uploaded ? 1 : 0.5 }}>
            Далее — выбрать гармонию →
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 4: Color / Itten wheel ────────────────────────────────────────
function ColorPicker({ go }) {
  const [harmony, setHarmony] = useState("analogous");
  const harmonies = [
    { id: "analogous", label: "Аналогичная", sub: "соседи по кругу" },
    { id: "complementary", label: "Контрастная", sub: "противоположность" },
    { id: "triadic", label: "Триада", sub: "три угла 120°" },
    { id: "split", label: "Расщеплённая", sub: "сплит-комплемент" },
  ];

  // Itten wheel segments (12 sectors)
  const sectors = [
    { color: "#E8392A" }, { color: "#F06020" }, { color: "#F09020" },
    { color: "#E8C020" }, { color: "#D8D020" }, { color: "#90C030" },
    { color: "#38A840" }, { color: "#20A898" }, { color: "#2878C8" },
    { color: "#6848B8" }, { color: "#9838A8" }, { color: "#C82870" },
  ];
  const innerColors = [
    "#C8706A", "#D09060", "#D0B068", "#C8C870",
    "#A0C070", "#68B878", "#70B0A8", "#7090C8",
    "#9070C8", "#B068B8", "#C06890", "#C86878",
  ];

  const cx = 180, cy = 180, r = 160, ri = 100;
  const slice = (2 * Math.PI) / 12;

  const pathFor = (i, outerR, innerR) => {
    const a1 = i * slice - Math.PI / 2;
    const a2 = (i + 1) * slice - Math.PI / 2;
    const x1 = cx + outerR * Math.cos(a1), y1 = cy + outerR * Math.sin(a1);
    const x2 = cx + outerR * Math.cos(a2), y2 = cy + outerR * Math.sin(a2);
    const x3 = cx + innerR * Math.cos(a2), y3 = cy + innerR * Math.sin(a2);
    const x4 = cx + innerR * Math.cos(a1), y4 = cy + innerR * Math.sin(a1);
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 0 0 ${x4} ${y4} Z`;
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Nav />
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <StepSidebar current={1} />
        <div style={{ flex: 1, padding: "40px 48px", display: "flex", gap: 48 }}>
          {/* Left: controls */}
          <div style={{ flex: 1 }}>
            <Label>ШАГ 2 ИЗ 3 — ЦВЕТОВАЯ ГАРМОНИЯ</Label>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 48, color: C.dark, margin: "12px 0 12px" }}>
              Круг Иттена
            </h1>
            <p style={{ fontSize: 15, color: C.text, fontFamily: "sans-serif", marginBottom: 28, lineHeight: 1.6 }}>
              Мы нашли цвета участка. Выберите тип гармонии —<br />система найдёт партнёров.
            </p>

            <Label>ТИП ГАРМОНИИ</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
              {harmonies.map(h => (
                <button key={h.id} onClick={() => setHarmony(h.id)} style={{
                  background: harmony === h.id ? C.dark : C.card,
                  color: harmony === h.id ? C.cream : C.dark,
                  border: harmony === h.id ? "none" : `1px solid ${C.border}`,
                  borderRadius: 16, padding: "12px 20px", cursor: "pointer",
                  fontFamily: "sans-serif", textAlign: "left",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{h.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{h.sub}</div>
                </button>
              ))}
            </div>

            <Label>ЦВЕТА УЧАСТКА (ИЗВЛЕЧЕНО)</Label>
            <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
              {["#38A840", "#2878C8", "#90C030", "#20A898", "#6848B8"].map((c, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: c, marginBottom: 4, border: `2px solid ${C.white}`, boxShadow: "0 0 0 1px #c8dbc4" }} />
                  <div style={{ fontSize: 9, color: C.text, fontFamily: "monospace" }}>{c}</div>
                </div>
              ))}
            </div>

            <Btn onClick={() => go("location")}>Далее — укажите локацию →</Btn>
          </div>

          {/* Right: Itten wheel */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="360" height="360" viewBox="0 0 360 360">
              {sectors.map((s, i) => (
                <path key={i} d={pathFor(i, r, ri)} fill={s.color}
                  stroke="#f7f3ec" strokeWidth="2" style={{ cursor: "pointer" }} />
              ))}
              {innerColors.map((c, i) => (
                <path key={i} d={pathFor(i, ri, 50)} fill={c}
                  stroke="#f7f3ec" strokeWidth="1.5" />
              ))}
              <circle cx={cx} cy={cy} r="50" fill="#f7f3ec" />
              {/* selected markers */}
              {harmony === "analogous" && [6, 7, 8].map(i => {
                const a = (i + 0.5) * slice - Math.PI / 2;
                return <circle key={i} cx={cx + (r - 20) * Math.cos(a)} cy={cy + (r - 20) * Math.sin(a)}
                  r="10" fill={C.white} stroke={C.dark} strokeWidth="2" />;
              })}
              {harmony === "complementary" && [6, 0].map(i => {
                const a = (i + 0.5) * slice - Math.PI / 2;
                return <circle key={i} cx={cx + (r - 20) * Math.cos(a)} cy={cy + (r - 20) * Math.sin(a)}
                  r="10" fill={C.white} stroke={C.dark} strokeWidth="2" />;
              })}
              {harmony === "triadic" && [6, 2, 10].map(i => {
                const a = (i + 0.5) * slice - Math.PI / 2;
                return <circle key={i} cx={cx + (r - 20) * Math.cos(a)} cy={cy + (r - 20) * Math.sin(a)}
                  r="10" fill={C.white} stroke={C.dark} strokeWidth="2" />;
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 5: Location ────────────────────────────────────────────────────
function Location({ go }) {
  const [input, setInput] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Nav />
      <div style={{ display: "flex", minHeight: "calc(100vh - 60px)" }}>
        <StepSidebar current={2} />
        <div style={{ flex: 1, padding: "48px 56px" }}>
          <Label>ШАГ 3 ИЗ 3 — ЛОКАЦИЯ</Label>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 48, color: C.dark, margin: "12px 0 12px" }}>
            Где находится ваш участок?
          </h1>
          <p style={{ fontSize: 15, color: C.text, fontFamily: "sans-serif", marginBottom: 36, lineHeight: 1.6 }}>
            По координатам мы определим состав почвы и климатическую зону —<br />
            чтобы рекомендовать только те растения, которые у вас выживут.
          </p>

          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: C.white, border: `1.5px solid ${C.border}`,
            borderRadius: 16, padding: "8px 16px", marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Введите адрес или название города..."
              style={{
                flex: 1, border: "none", outline: "none", fontSize: 15,
                fontFamily: "sans-serif", color: C.dark, background: "transparent",
              }} />
          </div>

          {/* Fake map */}
          <div style={{
            height: 280, borderRadius: 20, background: "#d4e6d0",
            border: `1px solid ${C.border}`, position: "relative",
            overflow: "hidden", marginBottom: 28,
          }}>
            <svg width="100%" height="100%" viewBox="0 0 600 280">
              {/* Grid */}
              {[0, 1, 2, 3].map(i => (
                <line key={i} x1={i * 150} y1="0" x2={i * 150} y2="280" stroke="#c0d8bc" strokeWidth="1" />
              ))}
              {[0, 1, 2].map(i => (
                <line key={i} x1="0" y1={i * 93} x2="600" y2={i * 93} stroke="#c0d8bc" strokeWidth="1" />
              ))}
              {/* Park patches */}
              <rect x="50" y="40" width="120" height="80" rx="8" fill="#acd4a4" opacity="0.6" />
              <rect x="300" y="120" width="160" height="100" rx="8" fill="#acd4a4" opacity="0.5" />
              {/* Roads */}
              <rect x="0" y="130" width="600" height="8" fill="#e8e0d0" opacity="0.8" />
              <rect x="220" y="0" width="8" height="280" fill="#e8e0d0" opacity="0.8" />
              {/* Pin */}
              <circle cx="300" cy="140" r="16" fill={C.dark} />
              <circle cx="300" cy="140" r="8" fill={C.green} />
              <line x1="300" y1="156" x2="300" y2="200" stroke={C.dark} strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
              {["+", "−"].map(b => (
                <div key={b} style={{
                  width: 32, height: 32, background: C.white, borderRadius: 8,
                  border: `1px solid ${C.border}`, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", fontSize: 18, color: C.dark,
                }}>{b}</div>
              ))}
            </div>
          </div>

          {/* Soil info */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "16px 20px", marginBottom: 32,
            display: "flex", gap: 24,
          }}>
            {[
              { label: "pH почвы", value: "6.4", sub: "слабокислая" },
              { label: "Климатическая зона", value: "5b", sub: "Москва и область" },
              { label: "Состав почвы", value: "Суглинок", sub: "хорошая аэрация" },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 10, color: C.text, fontFamily: "sans-serif", letterSpacing: "0.06em", marginBottom: 4 }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: C.dark, fontFamily: "Georgia, serif" }}>{item.value}</div>
                <div style={{ fontSize: 12, color: C.text, fontFamily: "sans-serif" }}>{item.sub}</div>
              </div>
            ))}
          </div>

          <Btn onClick={() => go("moodboard")}>Создать мудборд →</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 6: Moodboard ──────────────────────────────────────────────────
const PLANTS = [
  { name: "Лаванда узколистная", latin: "Lavandula angustifolia", match: 97, color: "#9878c8", height: "40–80 см", bloom: "Июнь — Август", water: "Низкий", zone: "5–9", bg: "#7a8ab0", leaf: "#5a7840" },
  { name: "Эхинацея пурпурная", latin: "Echinacea purpurea", match: 93, color: "#c0706a", height: "60–120 см", bloom: "Июль — Сентябрь", water: "Умеренный", zone: "3–9", bg: "#88a0c8", leaf: "#4a6830" },
  { name: "Котовник Фассена", latin: "Nepeta × faassenii", match: 91, color: "#8870c0", height: "30–50 см", bloom: "Май — Август", water: "Низкий", zone: "4–8", bg: "#a090c8", leaf: "#507850" },
  { name: "Вероника колосистая", latin: "Veronica spicata", match: 88, color: "#4878b8", height: "30–60 см", bloom: "Июнь — Июль", water: "Умеренный", zone: "3–8", bg: "#8090b8", leaf: "#486040" },
  { name: "Дельфиниум культурный", latin: "Delphinium cultorum", match: 86, color: "#2858a8", height: "80–200 см", bloom: "Июнь — Июль", water: "Высокий", zone: "3–7", bg: "#6878a8", leaf: "#405830" },
  { name: "Шалфей дубравный", latin: "Salvia nemorosa", match: 84, color: "#7858b0", height: "30–50 см", bloom: "Май — Июль", water: "Низкий", zone: "5–9", bg: "#9080b8", leaf: "#4a6038" },
];

function PlantCard({ plant, onClick, flipped }) {
  return (
    <div onClick={onClick} style={{
      borderRadius: 18, overflow: "hidden", cursor: "pointer",
      border: flipped ? `1px solid ${C.border}` : "none",
      background: flipped ? C.white : "transparent",
      height: 300, transition: "box-shadow 0.2s",
      boxShadow: flipped ? "0 4px 20px rgba(0,0,0,0.08)" : "none",
    }}>
      {!flipped ? (
        // Front
        <div style={{ height: "100%", background: C.dark, display: "flex", flexDirection: "column" }}>
          {/* Photo area */}
          <div style={{ flex: 1, background: plant.bg, position: "relative" }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: plant.leaf }} />
            {/* Flower stems */}
            <div style={{ position: "absolute", bottom: 50, left: 0, right: 0, display: "flex", justifyContent: "space-around" }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ width: 7, height: 28, borderRadius: 4, background: plant.color, opacity: 0.9 }} />
              ))}
            </div>
            {/* Match badge */}
            <div style={{
              position: "absolute", top: 10, left: 10,
              background: C.green, borderRadius: 11, padding: "4px 10px",
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.dark, fontFamily: "sans-serif" }}>
                {plant.match}% совп.
              </span>
            </div>
            {/* Color dot */}
            <div style={{
              position: "absolute", top: 10, right: 10,
              width: 22, height: 22, borderRadius: "50%",
              background: plant.color, border: `2px solid ${C.white}`,
            }} />
          </div>
          {/* Footer */}
          <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.cream, fontFamily: "Georgia, serif" }}>{plant.name}</div>
              <div style={{ fontSize: 10, color: plant.color, fontFamily: "sans-serif", fontStyle: "italic" }}>{plant.latin}</div>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: C.darkMid,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, color: C.green }}>↺</span>
            </div>
          </div>
        </div>
      ) : (
        // Back
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "10px 16px", background: C.bg, textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 10, color: C.textLight, fontFamily: "sans-serif" }}>обратная сторона  ↺</span>
          </div>
          <div style={{ flex: 1, padding: "16px", borderLeft: `4px solid ${plant.color}` }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.dark, fontFamily: "Georgia, serif", marginBottom: 4 }}>{plant.name}</div>
            <div style={{ fontSize: 11, color: C.text, fontFamily: "sans-serif", fontStyle: "italic", marginBottom: 12 }}>{plant.latin}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[plant.color, plant.color + "99", plant.color + "66"].map((c, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c }} />
              ))}
              <span style={{ fontSize: 11, color: C.text, fontFamily: "sans-serif" }}>{plant.match}% совп.</span>
            </div>
            {[
              ["Высота", plant.height],
              ["Цветение", plant.bloom],
              ["Полив", plant.water],
              ["Зимостойкость", `Зона ${plant.zone}`],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ height: 1, background: "#ece4d8", margin: "6px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.text, fontFamily: "sans-serif" }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.dark, fontFamily: "sans-serif" }}>{v}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Moodboard({ go }) {
  const [flipped, setFlipped] = useState({});
  const [filter, setFilter] = useState("all");

  const toggle = (i) => setFlipped(f => ({ ...f, [i]: !f[i] }));

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <Nav onBack={() => go("color")} />
      <div style={{ padding: "28px 36px" }}>
        {/* Header */}
        <Label>РЕЗУЛЬТАТ · {PLANTS.length} РАСТЕНИЙ · АНАЛОГИЧНАЯ ГАРМОНИЯ</Label>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 8 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, color: C.dark, margin: 0 }}>
            Ваш ботанический мудборд
          </h1>
          <Btn style={{ padding: "10px 20px" }}>Сохранить всё</Btn>
        </div>
        <p style={{ fontSize: 12, color: C.textLight, fontFamily: "sans-serif", fontStyle: "italic", marginBottom: 16 }}>
          Нажмите на карточку — переверните и увидите рекомендации по уходу
        </p>

        {/* Palette + filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 10, color: C.text, fontFamily: "sans-serif", letterSpacing: "0.08em" }}>ПАЛИТРА ИТТЕНА:</span>
            {["#38A840", "#2878C8", "#90C030", "#20A898", "#6848B8"].map(c => (
              <div key={c} style={{ width: 16, height: 16, borderRadius: "50%", background: c }} />
            ))}
            <span style={{ fontSize: 11, color: C.text, fontFamily: "sans-serif" }}>· Зона 5b · Москва</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["all", "Все"], ["bloom", "Цветущие"], ["shade", "Теневые"]].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} style={{
                background: filter === id ? C.dark : C.white,
                color: filter === id ? C.cream : C.text,
                border: `1px solid ${C.border}`, borderRadius: 12,
                padding: "8px 16px", fontSize: 12, fontFamily: "sans-serif", cursor: "pointer",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {PLANTS.map((plant, i) => (
            <PlantCard key={i} plant={plant} flipped={!!flipped[i]} onClick={() => toggle(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── App router ────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");

  const go = (s) => setScreen(s);

  const screens = {
    landing:  <Landing go={go} />,
    auth:     <Auth go={go} />,
    upload:   <PhotoUpload go={go} />,
    color:    <ColorPicker go={go} />,
    location: <Location go={go} />,
    moodboard:<Moodboard go={go} />,
  };

  return (
    <div style={{ fontFamily: "Georgia, serif", minHeight: "100vh" }}>
      {screens[screen]}
    </div>
  );
}
