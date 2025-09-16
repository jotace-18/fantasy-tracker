import axios from "axios";

const API_URL = "http://localhost:4000";

export async function getHealth() {
  const res = await axios.get(`${API_URL}/health`);
  return res.data;
}
