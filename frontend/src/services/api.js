const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

function createRequestError(payload) {
  const detail = payload?.detail;
  if (typeof detail === "string") return new Error(detail);
  if (Array.isArray(detail)) {
    const text = detail
      .map((item) => item?.msg || item?.message || "")
      .filter(Boolean)
      .join("; ");
    if (text) return new Error(text);
  }
  return new Error(payload?.message || "Ошибка запроса");
}

function normalizeAuthPayload(payload) {
  const token = payload?.token || null;
  const user = payload?.user || null;
  if (!token && !user) return payload;
  return { token, user };
}

function mapPlant(plant, index) {
  return {
    id: plant?.id ?? index + 1,
    nameRu: plant?.name || "Без названия",
    nameLat: "",
    description: plant?.description || "",
    height_cm: plant?.height_cm || null,
    width_cm: plant?.width_cm || null,
    care_difficulty: plant?.care_difficulty || null,
    image_url: plant?.image_url || null,
    colors: plant?.colors || [],
    matchPercent: Number(plant?.match_percent ?? plant?.matchPercent ?? 0),
    zone: plant?.zone || null
  };
}

class FastAPIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async _requestOnce(path, options = {}) {
    const token = localStorage.getItem("flora_token");
    const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });

    const hasBody = response.status !== 204;
    const payload = hasBody ? await response.json().catch(() => ({})) : {};

    if (!response.ok) {
      const error = createRequestError(payload);
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  async register(payload) {
    const fallbackUserName = payload?.name?.trim() || payload?.email?.split("@")?.[0] || "Пользователь";
    return normalizeAuthPayload({
      token: `local-token-${Date.now()}`,
      user: { name: fallbackUserName, email: payload?.email || "", zone: payload?.zone || "5b" }
    });
  }

  async login(payload) {
    return normalizeAuthPayload({
      token: `local-token-${Date.now()}`,
      user: { name: payload?.email?.split("@")?.[0] || "Пользователь", email: payload?.email || "", zone: "5b" }
    });
  }

  async getYandexAuthUrl() {
    return { url: "https://oauth.yandex.ru/" };
  }

  async me() {
    return { user: null };
  }

  async extractColors(file) {
    const formData = new FormData();
    formData.append("photo", file);
    const payload = await this._requestOnce("/api/colors/extract", { method: "POST", body: formData });
    return {
      palette: (payload?.palette || []).map((item) => String(item).toUpperCase()),
      colors: (payload?.dominant_colors || []).map((item) => ({
        hex: String(item?.hex || "").toUpperCase(),
        rgb: Array.isArray(item?.rgb) ? item.rgb : [0, 0, 0],
        percentage: Number(item?.weight || 0)
      })),
      dominantColors: payload?.dominant_colors || []
    };
  }

  async generateHarmony({ baseColor, harmonyType }) {
    const payload = await this._requestOnce("/api/harmony", {
      method: "POST",
      body: JSON.stringify({ base_color: baseColor, harmony_type: harmonyType })
    });
    return { harmony_colors: (payload?.harmony_colors || []).map((item) => String(item).toUpperCase()) };
  }

  async getSoilTypes() {
    return this._requestOnce("/api/soil-types");
  }

  uploadImage(file) {
    return this.extractColors(file);
  }

  processImage(file, nClusters = 3, ignoreBg = true) {
    void nClusters;
    void ignoreBg;
    return this.extractColors(file);
  }

  saveHarmony(payload) {
    return this.generateHarmony(payload);
  }

  matchPlants(payload) {
    return this._requestOnce("/api/recommend", {
      method: "POST",
      body: JSON.stringify({
        city: payload?.city || "Москва",
        soil_type: payload?.soil_type || "Суглинок",
        photo_palette: payload?.photo_palette || [],
        harmony_colors: payload?.harmony_colors || [],
        top_n: payload?.top_n || 30,
        w3: payload?.w3 ?? 0.6,
        w4: payload?.w4 ?? 0.4
      })
    }).then((response) => ({
      zone: response?.zone || "5b",
      plants: (response?.recommended_plants || []).map((plant, index) => mapPlant(plant, index)),
      total: (response?.recommended_plants || []).length
    }));
  }

  getPlant(id) {
    return Promise.resolve({
      plant: {
        id: Number(id),
        nameRu: "Растение",
        nameLat: "",
        description: "Карточка растения доступна после подбора в мудборде.",
        compatibility: [],
        zone: "5b"
      }
    });
  }

  getMyGarden() {
    return Promise.resolve({ plants: [] });
  }

  addToGarden(plantId) {
    void plantId;
    return Promise.resolve({ success: true });
  }

  removeFromGarden(plantId) {
    void plantId;
    return Promise.resolve({ success: true });
  }

  getZone(lat, lng) {
    void lat;
    void lng;
    return Promise.resolve({ zone: "5b", city: "Москва" });
  }
}

export const api = new FastAPIClient(API_BASE);
