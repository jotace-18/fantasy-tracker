import { useEffect, useState } from "react";
import {
  getMinimalPlayers,
  addMinimalPlayer,
  deleteMinimalPlayer,
} from "../api";

type MinimalPlayer = {
  id: number;
  name: string;
  slug: string;
};

export default function MinimalPlayersList() {
  const [players, setPlayers] = useState<MinimalPlayer[]>([]);
  const [newName, setNewName] = useState("");

  const load = async () => {
    const data = await getMinimalPlayers();
    setPlayers(data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!newName) return;
    await addMinimalPlayer(newName);
    setNewName("");
    load();
  };

  const handleDelete = async (id: number) => {
    await deleteMinimalPlayer(id);
    load();
  };

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Minimal Players</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Nombre del jugador"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button onClick={handleAdd}>Añadir</button>
      </div>

      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.name} ({p.slug}){" "}
            <button onClick={() => handleDelete(p.id)}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
