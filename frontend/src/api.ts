import axios from "axios";
const API = "http://localhost:4000/api";

export const getTeams = async () => (await axios.get(`${API}/teams`)).data;

// Alta mínima: un jugador
export const addPlayerMinimal = async (payload: { name: string; teamName: string; slug?: string }) =>
  (await axios.post(`${API}/players/minimal`, payload)).data;

// Alta masiva: lista de nombres para un equipo
export const addPlayersBulk = async (payload: { teamName: string; names: string[] }) =>
  (await axios.post(`${API}/players/minimal/bulk`, payload)).data;

// Listar jugadores por equipo (por id)
export const getPlayersByTeam = async (teamId: number) =>
  (await axios.get(`${API}/players/team/${teamId}`)).data;

// añade equipos en bulk
export const importTeams = async (names: string[]) =>
  (await axios.post(`${API}/teams/import`, { names })).data;
