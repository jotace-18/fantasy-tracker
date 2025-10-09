import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function usePortfolioData(participantId = 8) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [top, setTop] = useState([]);
  const [worst, setWorst] = useState([]);
  const [sell, setSell] = useState([]);
  const [clauses, setClauses] = useState([]);
  const [xi, setXi] = useState([]);
  const [market, setMarket] = useState([]);

  const abortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const [sRes, hRes, tRes, oRes] = await Promise.all([
        fetch(`/api/portfolio/${participantId}/summary`, { signal: controller.signal }),
        fetch(`/api/portfolio/${participantId}`, { signal: controller.signal }),
        fetch(`/api/portfolio/${participantId}/top`, { signal: controller.signal }),
        fetch(`/api/portfolio/${participantId}/advice/overview`, { signal: controller.signal }),
      ]);
      if (!sRes.ok || !hRes.ok || !tRes.ok || !oRes.ok) throw new Error('HTTP error');

      const [sJson, hJson, tJson, oJson] = await Promise.all([
        sRes.json(), hRes.json(), tRes.json(), oRes.json(),
      ]);
      setSummary(sJson.summary || null);
      setHistory(Array.isArray(hJson.data) ? hJson.data : []);
      setTop(Array.isArray(tJson.top) ? tJson.top : []);
      setWorst(Array.isArray(tJson.worst) ? tJson.worst : []);
      setSell(Array.isArray(oJson.sell) ? oJson.sell : []);
      setClauses(Array.isArray(oJson.clauses) ? oJson.clauses : []);
      setXi(Array.isArray(oJson.xi) ? oJson.xi : []);
      setMarket(Array.isArray(oJson.market) ? oJson.market : []);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [participantId]);

  useEffect(() => {
    fetchAll();
    return () => abortRef.current?.abort?.();
  }, [fetchAll]);

  const kpis = useMemo(() => {
    const s = summary || {};
    return [
      { label: 'Invertido', value: s.total_invested, color: 'gray', currency: true },
      { label: 'Recuperado', value: s.total_recovered, color: 'blue', currency: true },
      { label: 'Beneficio neto', value: s.net_profit, color: (s.net_profit ?? 0) >= 0 ? 'green' : 'red', currency: true },
      { label: 'ROI', value: s.roi_percent != null ? `${s.roi_percent}%` : '-', color: 'teal', currency: false },
      { label: 'Activos', value: s.active_count, color: 'purple', currency: false },
      { label: 'Vendidos', value: s.sold_count, color: 'orange', currency: false },
    ];
  }, [summary]);

  return {
    loading, error,
    summary, history, top, worst,
    sell, clauses, xi, market,
    kpis,
    refresh: fetchAll,
  };
}
