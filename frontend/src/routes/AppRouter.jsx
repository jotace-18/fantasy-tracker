import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard";
import PlayersPage from "../pages/PlayersPage";
import TeamsPage from "../pages/TeamsPage";
import Analysis from "../pages/Analysis";
import TeamDetailPage from "../pages/TeamDetailPage";
import PlayerDetailPage from "../pages/PlayerDetailPage";
import MyTeamPage from "../pages/MyTeamPage";


import LeaderboardPage from "../pages/LeaderboardPage";
import CalendarPage from "../pages/CalendarPage";
import ParticipantProfilePage from "../pages/ParticipantProfilePage";
import MarketPage from "../pages/MarketPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/teams/:id" element={<TeamDetailPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/my-team" element={<MyTeamPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/participants/:id" element={<ParticipantProfilePage />} />
          <Route path="/market" element={<MarketPage />} />
  </Routes>
      </Layout>
    </BrowserRouter>
  );
}
