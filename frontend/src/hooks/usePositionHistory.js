import { useEffect, useState } from "react";

// Devuelve un array: [{ jornada, position }]
export default function usePositionHistory(participantId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch("/api/participants/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        // Construir historia de posiciones por jornada
        // 1. Obtener todas las jornadas
        const allJornadas = Array.from(
          new Set(data.flatMap((p) => p.history.map((h) => h.jornada)))
        ).sort((a, b) => a - b);
        // 2. Para cada jornada, ordenar por puntos de esa jornada y buscar la posición del participante
        const posHistory = allJornadas.map((jornada) => {
          // Ordenar participantes por puntos de esa jornada (desc), si no tiene, 0
          const sorted = [...data].sort((a, b) => {
            const pa = a.history.find((h) => h.jornada === jornada)?.points || 0;
            const pb = b.history.find((h) => h.jornada === jornada)?.points || 0;
            return pb - pa;
          });
          const idx = sorted.findIndex((p) => String(p.id) === String(participantId));
          return { jornada, position: idx >= 0 ? idx + 1 : null };
        });
        setHistory(posHistory);
        setLoading(false);
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [participantId]);

  return { history, loading };
}
