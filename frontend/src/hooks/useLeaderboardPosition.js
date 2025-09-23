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
        const idx = data.findIndex((p) => String(p.id) === String(participantId));
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
