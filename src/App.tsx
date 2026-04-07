import { HashRouter, Routes, Route } from "react-router";
import { HomePage } from "./pages/HomePage";
import { OverlayPage } from "./pages/OverlayPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/overlay" element={<OverlayPage />} />
      </Routes>
    </HashRouter>
  );
}
