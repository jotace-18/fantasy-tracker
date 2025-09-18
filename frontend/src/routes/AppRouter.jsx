import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard";
import PlayersPage from "../pages/PlayersPage";
import TeamsPage from "../pages/TeamsPage";
import Analysis from "../pages/Analysis";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
