import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import PlayersPage from "./pages/PlayersPage";
import MinimalPlayersList from "./components/MinimalPlayersList";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 10, background: "#eee", marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>Jugadores</Link>
        <Link to="/minimal">Minimal Players</Link>
      </nav>

      <Routes>
        <Route path="/" element={<PlayersPage />} />
        <Route path="/minimal" element={<MinimalPlayersList />} />
      </Routes>
    </BrowserRouter>
  );
}
