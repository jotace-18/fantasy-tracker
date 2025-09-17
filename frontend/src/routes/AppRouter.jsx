import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Dashboard from "../pages/Dashboard";
import Players from "../pages/Players";
import Teams from "../pages/Teams";
import Analysis from "../pages/Analysis";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/analysis" element={<Analysis />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
