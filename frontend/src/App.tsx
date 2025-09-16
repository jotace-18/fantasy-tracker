import { useState } from "react";
import { getHealth } from "./api";

function App() {
  const [status, setStatus] = useState<string>("");

  const checkHealth = async () => {
    try {
      const data = await getHealth();
      setStatus(JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setStatus("❌ Error al conectar con el backend");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Fantasy Tracker - Frontend</h1>
      <button onClick={checkHealth}>Comprobar Backend</button>
      <p>{status}</p>
    </div>
  );
}

export default App;
