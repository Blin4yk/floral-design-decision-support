const API_BASE = import.meta.env.VITE_API_URL || "";

class FastAPIClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(path, options = {}) {
    const token = localStorage.getItem("flora_token");
    const headers = options.body instanceof FormData ? {} : { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.detail || "Ошибка запроса");
    }

    return response.json();
  }

  register(payload) {
    return this.request("/api/auth/register", { method: "POST", body: JSON.stringify(payload) });
  }

  login(payload) {
    return this.request("/api/auth/login", { method: "POST", body: JSON.stringify(payload) });
  }

  getYandexAuthUrl() {
    return this.request("/api/auth/yandex/url");
  }

  me() {
    return this.request("/api/auth/me");
  }

  uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    return this.request("/api/upload", { method: "POST", body: formData });
  }

  processImage(file, nClusters = 3, ignoreBg = true) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("n_clusters", String(nClusters));
    formData.append("ignore_bg", String(ignoreBg));
    return this.request("/api/v1/images/process", { method: "POST", body: formData });
  }

  saveHarmony(payload) {
    return this.request("/api/harmony", { method: "POST", body: JSON.stringify(payload) });
  }

  matchPlants(payload) {
    return this.request("/api/match", { method: "POST", body: JSON.stringify(payload) });
  }

  getPlant(id) {
    return this.request(`/api/plants/${id}`);
  }

  getMyGarden() {
    return this.request("/api/user/garden");
  }

  addToGarden(plantId) {
    return this.request("/api/user/garden", {
      method: "POST",
      body: JSON.stringify({ plantId })
    });
  }

  removeFromGarden(plantId) {
    return this.request(`/api/user/garden/${plantId}`, { method: "DELETE" });
  }

  getZone(lat, lng) {
    return this.request(`/api/location/zone?lat=${lat}&lng=${lng}`);
  }
}

export const api = new FastAPIClient(API_BASE);
