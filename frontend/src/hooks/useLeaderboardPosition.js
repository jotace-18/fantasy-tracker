import { useEffect, useState } from "react";

export default function useLeaderboardPosition(participantId) {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch("/api/participants/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        // Ordenar igual que en LeaderboardPage (por puntos totales descendente)
        const sorted = [...data].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
        const ids = sorted.map((p) => p.id);
        console.log('[DEBUG][useLeaderboardPosition] participantId:', participantId, 'Sorted Leaderboard ids:', ids);
        const idx = sorted.findIndex((p) => String(p.id) === String(participantId));
        setPosition(idx >= 0 ? idx + 1 : null);
        setLoading(false);
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [participantId]);

  return { position, loading };
}
