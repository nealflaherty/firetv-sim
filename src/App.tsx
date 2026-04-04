import { BrowserRouter, Routes, Route } from 'react-router'
import { HomePage } from './pages/HomePage'
import { OverlayPage } from './pages/OverlayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/overlay" element={<OverlayPage />} />
      </Routes>
    </BrowserRouter>
  )
}
