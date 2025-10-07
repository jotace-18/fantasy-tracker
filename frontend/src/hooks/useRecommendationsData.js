import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Hook principal de recomendaciones
export default function useRecommendationsData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('overall');
  const [money, setMoney] = useState(null);

  const participantId = 8; // ID fijo para pruebas

  const [query, setQuery] = useState('');
  const [riskUnder3, setRiskUnder3] = useState(true);
  const [onlyProbableXI, setOnlyProbableXI] = useState(false);
  const [sort, setSort] = useState({ field: 'score', dir: 'desc' });

  const abortRef = useRef(null);

  /* --------------------------- 🔹 Obtener dinero --------------------------- */
  const fetchMoney = useCallback(async () => {
    try {
      const res = await fetch(`/api/participants/${participantId}/money`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const dinero = json.money ?? json.data?.money ?? 0;
      setMoney(Number(dinero));
    } catch (e) {
      console.error('Error al obtener dinero:', e);
      setMoney(0);
    }
  }, [participantId]);

  /* ------------------------- 🔹 Obtener recomendaciones ------------------------- */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/analytics/recommendations?mode=${mode}&participant_id=${participantId}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];

      const normalized = rows.map(r => ({
        ...r,
        market_value_num: Number(r.market_value ?? 0),
        risk_level_num: r.risk_level == null ? null : Number(r.risk_level),
        affordability_num: Number(r.affordability ?? 0),
        sell_score: Number(r.score ?? 0),
      }));

      setData(normalized);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [mode, participantId]);

  /* -------------------------- 🔹 Inicialización -------------------------- */
  useEffect(() => {
    fetchMoney();
    fetchData();
    return () => abortRef.current?.abort?.();
  }, [fetchMoney, fetchData]);

  /* --------------------------- 🔹 Filtros y orden --------------------------- */
  const filtered = useMemo(() => {
    let out = data;
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.team_name || '').toLowerCase().includes(q)
      );
    }
    if (riskUnder3 && mode !== 'sell') {
      out = out.filter(p => (p.risk_level_num ?? 99) < 3);
    }
    if (onlyProbableXI && mode !== 'sell') {
      out = out.filter(p => (p.titular_next_jor ?? 0) >= 0.5);
    }
    return out;
  }, [data, query, riskUnder3, onlyProbableXI, mode]);

  const sorted = useMemo(() => {
    const { field, dir } = sort;
    const mul = dir === 'asc' ? 1 : -1;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va > vb ? 1 : va < vb ? -1 : 0) * mul;
    });
    return copy;
  }, [filtered, sort]);

  const toggleSort = (field, defaultOrder = 'ASC') => {
    setSort(prev =>
      prev.field !== field
        ? { field, dir: defaultOrder.toLowerCase() }
        : { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    );
  };

  return {
    data: sorted,
    loading,
    error,
    query, setQuery,
    sort, toggleSort,
    riskUnder3, setRiskUnder3,
    onlyProbableXI, setOnlyProbableXI,
    mode, setMode,
    money,
    refresh: fetchData,
  };
}
