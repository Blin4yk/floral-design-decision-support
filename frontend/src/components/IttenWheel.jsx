import chroma from "chroma-js";

const ITTEN_COLORS = [
  "#E8392A",
  "#F06020",
  "#F09020",
  "#E8C020",
  "#D8D020",
  "#90C030",
  "#38A840",
  "#20A898",
  "#2878C8",
  "#6848B8",
  "#9878B8",
  "#C8706A"
];

function polarToCartesian(cx, cy, radius, angle) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

function wedgePath(cx, cy, rOuter, rInner, start, end) {
  const p1 = polarToCartesian(cx, cy, rOuter, start);
  const p2 = polarToCartesian(cx, cy, rOuter, end);
  const p3 = polarToCartesian(cx, cy, rInner, end);
  const p4 = polarToCartesian(cx, cy, rInner, start);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
}

function getClosestIttenIndex(hex) {
  const hue = chroma(hex).hsl()[0];
  const normalized = Number.isNaN(hue) ? 0 : hue;
  const step = 360 / 12;
  return Math.round(normalized / step) % 12;
}

export default function IttenWheel({ selectedColor, photoPalette, onSelectColor }) {
  const cx = 160;
  const cy = 160;
  const outer = 140;
  const inner = 72;
  const step = 360 / 12;

  return (
    <div className="itten-wrap">
      <svg viewBox="0 0 320 320" className="itten-svg" aria-label="Круг Иттена">
        {ITTEN_COLORS.map((color, index) => {
          const start = -90 + index * step;
          const end = start + step;
          const active = selectedColor && getClosestIttenIndex(selectedColor) === index;
          return (
            <path
              key={color}
              d={wedgePath(cx, cy, outer, inner, start, end)}
              fill={color}
              stroke={active ? "#111" : "#f7f3ec"}
              strokeWidth={active ? 4 : 2}
              onClick={() => onSelectColor(color)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r="56" fill="#f7f3ec" />
        <text x={cx} y={cy - 6} textAnchor="middle" className="itten-center-title">
          Круг Иттена
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="itten-center-subtitle">
          клик по сегменту
        </text>
        {photoPalette.map((color, i) => {
          const idx = getClosestIttenIndex(color);
          const angle = -90 + idx * step + step / 2;
          const pos = polarToCartesian(cx, cy, outer - 10, angle);
          return (
            <circle
              key={`${color}-${i}`}
              cx={pos.x}
              cy={pos.y}
              r="8"
              fill={color}
              stroke="#111"
              strokeWidth="2"
              onClick={() => onSelectColor(color)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
