import chroma from "chroma-js";

export const HARMONY_TYPES = {
  analogous: "Аналогичная",
  complementary: "Контрастная",
  triadic: "Триада",
  splitComplementary: "Расщепленная"
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
    case "splitComplementary":
      return [rotateHue(baseColor, 150), rotateHue(baseColor, 210)];
    default:
      return [];
  }
};
