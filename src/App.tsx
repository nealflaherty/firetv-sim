import { HashRouter, Routes, Route } from "react-router";
import { HomePage } from "./pages/HomePage";
import { OverlayPage } from "./pages/OverlayPage";
import { DebugPage } from "./pages/DebugPage";
import { DebugGridPage } from "./pages/DebugGridPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/overlay" element={<OverlayPage />} />
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/grid" element={<DebugGridPage />} />
      </Routes>
    </HashRouter>
  );
}
