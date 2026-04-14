import chroma from "chroma-js";

export const HARMONY_TYPES = {
  analogous: "Аналогичная",
  complementary: "Контрастная",
  triadic: "Триада",
  tetradic: "Тетрада",
  splitComplementary: "Расщепленная"
};

export const ITTEN_SECTOR_COUNT = 12;

export const getIttenSectorIndex = (hex) => {
  const hue = chroma(hex).hsl()[0];
  const normalized = Number.isNaN(hue) ? 0 : hue;
  const step = 360 / ITTEN_SECTOR_COUNT;
  return Math.round(normalized / step) % ITTEN_SECTOR_COUNT;
};

const rotateHue = (hex, deg) => {
  const [h, s, l] = chroma(hex).hsl();
  const hue = (h + deg + 360) % 360;
  return chroma.hsl(hue, s, l).hex();
};

export const getHarmonyPartners = (baseColor, type) => {
  if (!baseColor) return [];

  switch (type) {
    case "analogous":
      return [rotateHue(baseColor, -30), rotateHue(baseColor, 30)];
    case "complementary":
      return [rotateHue(baseColor, 180)];
    case "triadic":
      return [rotateHue(baseColor, 120), rotateHue(baseColor, 240)];
    case "tetradic":
      return [rotateHue(baseColor, 90), rotateHue(baseColor, 180), rotateHue(baseColor, 270)];
    case "splitComplementary":
      return [rotateHue(baseColor, 150), rotateHue(baseColor, 210)];
    default:
      return [];
  }
};
