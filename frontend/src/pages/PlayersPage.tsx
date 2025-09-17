import { useEffect, useMemo, useState } from "react";
import { getTeams, addPlayerMinimal, addPlayersBulk, getPlayersByTeam } from "../api";

type Team = { id: number; name: string };
type Player = { id: number; name: string; slug?: string; team_id: number };

export default function PlayersPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string>("");

  const [name, setName] = useState("");
  const [bulk, setBulk] = useState("");

  const [players, setPlayers] = useState<Player[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const t = await getTeams();
      setTeams(t);
      if (t.length) {
        setSelectedTeamId(t[0].id);
        setSelectedTeamName(t[0].name);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      getPlayersByTeam(selectedTeamId).then(setPlayers).catch(() => setPlayers([]));
    }
  }, [selectedTeamId]);

  const teamOptions = useMemo(() => teams.map(t => ({ id: t.id, name: t.name })), [teams]);

  const handleChangeTeam = (idStr: string) => {
    const id = Number(idStr);
    setSelectedTeamId(id);
    const t = teams.find(x => x.id === id);
    setSelectedTeamName(t?.name || "");
    setMsg("");
  };

  const handleAddPlayer = async () => {
    if (!name || !selectedTeamName) return;
    await addPlayerMinimal({ name, teamName: selectedTeamName });
    setName("");
    if (selectedTeamId) {
      const updated = await getPlayersByTeam(selectedTeamId);
      setPlayers(updated);
    }
    setMsg("Jugador añadido.");
  };

  const handleBulk = async () => {
    if (!bulk.trim() || !selectedTeamName) return;
    const names = bulk
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    if (!names.length) return;

    await addPlayersBulk({ teamName: selectedTeamName, names });
    setBulk("");
    if (selectedTeamId) {
      const updated = await getPlayersByTeam(selectedTeamId);
      setPlayers(updated);
    }
    setMsg(`${names.length} jugadores añadidos.`);
  };

  return (
    <div style={{ padding: 20, fontFamily: "system-ui", maxWidth: 920, margin: "0 auto" }}>
      <h1>Fantasy Tracker – Alta mínima para Scraper</h1>

      {/* Selección de equipo */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <label>Equipo:</label>
        <select value={selectedTeamId ?? ""} onChange={(e) => handleChangeTeam(e.target.value)}>
          {teamOptions.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Alta individual */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          placeholder="Nombre del jugador"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ minWidth: 240 }}
        />
        <button onClick={handleAddPlayer}>Añadir jugador</button>
      </div>

      {/* Alta masiva */}
      <div style={{ marginBottom: 12 }}>
        <textarea
          placeholder={`Pega varios nombres (uno por línea)\nEj:\nMikel Jauregizar\nPedri\nBellingham`}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          rows={6}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        <div style={{ marginTop: 6 }}>
          <button onClick={handleBulk}>Añadir lista</button>
        </div>
      </div>

      {msg && <p>{msg}</p>}

      {/* Lista del equipo seleccionado */}
      <h2>Jugadores del equipo</h2>
      {!players.length && <p>No hay jugadores en este equipo todavía.</p>}
      <ul>
        {players.map(p => (
          <li key={p.id}>{p.name} <small style={{ color: "#666" }}>{p.slug ? `(${p.slug})` : ""}</small></li>
        ))}
      </ul>
    </div>
  );
}
