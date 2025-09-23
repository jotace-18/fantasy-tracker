import { useEffect, useState } from "react";

// Devuelve un array: [{ jornada, rank }], donde rank es la posición del participante según puntos acumulados hasta esa jornada
export default function useCumulativeRankHistory(participantId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch("/api/participants/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        // 1. Obtener todas las jornadas
        const allJornadas = Array.from(
          new Set(data.flatMap((p) => p.history.map((h) => h.jornada)))
        ).sort((a, b) => a - b);
        // 2. Para cada jornada, calcular suma acumulada de puntos para cada participante
        const cumulativeByParticipant = {};
        data.forEach((p) => {
          let sum = 0;
          cumulativeByParticipant[p.id] = allJornadas.map((j) => {
            const h = p.history.find((h) => h.jornada === j);
            sum += h ? h.points : 0;
            return { jornada: j, totalPoints: sum };
          });
        });
        // 3. Para cada jornada, calcular el ranking de suma acumulada
        const participantRankHistory = allJornadas.map((j, idx) => {
          // Array de {id, totalPoints} para esta jornada
          const pointsArr = Object.entries(cumulativeByParticipant).map(([id, arr]) => ({
            id,
            totalPoints: arr[idx].totalPoints,
          }));
          // Ordenar por totalPoints desc
          pointsArr.sort((a, b) => b.totalPoints - a.totalPoints);
          // Buscar el participante
          const pos = pointsArr.findIndex((p) => String(p.id) === String(participantId));
          return {
            jornada: j,
            rank: pos >= 0 ? pos + 1 : null,
          };
        });
        setHistory(participantRankHistory);
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
