import { useEffect, useState } from "react";
import { getTeams, importTeams } from "../api";

type Team = { id: number; name: string };

export default function TeamsList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [bulk, setBulk] = useState("");
  const [msg, setMsg] = useState("");

  const loadTeams = async () => setTeams(await getTeams());

  useEffect(() => { loadTeams(); }, []);

  const handleImport = async () => {
    const names = bulk
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    if (!names.length) return;
    await importTeams(names);
    setBulk("");
    setMsg(`${names.length} equipos añadidos.`);
    loadTeams();
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Equipos</h2>
      <textarea
        placeholder="Pega equipos, uno por línea"
        rows={6}
        style={{ width: "100%" }}
        value={bulk}
        onChange={e => setBulk(e.target.value)}
      />
      <div style={{ margin: "8px 0" }}>
        <button onClick={handleImport}>Añadir equipos</button>
      </div>
      {msg && <p>{msg}</p>}
      <ul>
        {teams.map(t => (
          <li key={t.id}>{t.name}</li>
        ))}
      </ul>
    </div>
  );
}
