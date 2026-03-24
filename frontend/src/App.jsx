import { Route, Routes } from "react-router-dom";
import { Footer, Header } from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import UploadPage from "./pages/UploadPage";
import HarmonyPage from "./pages/HarmonyPage";
import LocationPage from "./pages/LocationPage";
import MoodboardPage from "./pages/MoodboardPage";
import PlantPage from "./pages/PlantPage";
import MyGardenPage from "./pages/MyGardenPage";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/harmony" element={<HarmonyPage />} />
          <Route path="/location" element={<LocationPage />} />
          <Route path="/moodboard" element={<MoodboardPage />} />
          <Route path="/plant/:id" element={<PlantPage />} />
          <Route path="/my-garden" element={<MyGardenPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
