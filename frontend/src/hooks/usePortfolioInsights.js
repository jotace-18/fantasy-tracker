import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function usePortfolioInsights(participantId = 8) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/portfolio/${participantId}/insights`, { signal: controller.signal });
      if (!res.ok) throw new Error('HTTP error');
      const json = await res.json();
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort?.();
  }, [fetchData]);

  const xiCandidates = useMemo(() => items.filter(i => i.xi_candidate), [items]);
  const toSell = useMemo(() => items.filter(i => i.should_sell), [items]);
  const toClause = useMemo(() => items.filter(i => i.should_increase_clause), [items]);

  return { loading, error, items, xiCandidates, toSell, toClause, refresh: fetchData };
}
