import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Fetches recommendations from backend and provides client-side filters/sorting
export default function useRecommendationsData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('overall');

  // UI state
  const [query, setQuery] = useState('');
  const [risk, setRisk] = useState('all'); // all | low (0-1) | mid (2-3) | high (4-5)
  const [sort, setSort] = useState({ field: 'score', dir: 'desc' });
  const [riskUnder3, setRiskUnder3] = useState(true); // filtro principal: riesgo < 3
  const [onlyProbableXI, setOnlyProbableXI] = useState(false); // solo titulares probables

  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/analytics/recommendations?mode=${mode}`, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = Array.isArray(json?.data) ? json.data : [];
      // Normalize types
      const normalized = rows.map(r => ({
        ...r,
        market_value_num: typeof r.market_value === 'number' ? r.market_value : Number(r.market_value ?? 0),
        risk_level_num: r.risk_level == null ? null : Number(r.risk_level)
      }));
      setData(normalized);
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); return () => abortRef.current?.abort?.(); }, [fetchData, mode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = data;
    if (q) {
      out = out.filter(p => (p.name || '').toLowerCase().includes(q) || (p.team_name || '').toLowerCase().includes(q));
    }
    if (risk !== 'all') {
      out = out.filter(p => {
        const r = p.risk_level_num;
        if (r == null) return false;
        if (risk === 'low') return r <= 1;
        if (risk === 'mid') return r >= 2 && r <= 3;
        if (risk === 'high') return r >= 4;
        return true;
      });
    }
    if (riskUnder3) {
      out = out.filter(p => {
        const r = p.risk_level_num;
        return r != null ? r < 3 : false;
      });
    }
    if (onlyProbableXI) {
      out = out.filter(p => (p.titular_next_jor ?? 0) >= 0.5);
    }
    return out;
  }, [data, query, risk, riskUnder3, onlyProbableXI]);

  const sorted = useMemo(() => {
    const { field, dir } = sort;
    const mul = dir === 'asc' ? 1 : -1;
    const copy = [...filtered];
    copy.sort((a, b) => {
      let va = a[field];
      let vb = b[field];
      // fallbacks for our known fields
      if (field === 'market_value') { va = a.market_value_num; vb = b.market_value_num; }
      if (field === 'risk_level') { va = a.risk_level_num; vb = b.risk_level_num; }
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // nulls last
      if (vb == null) return -1;
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * mul;
      return (va > vb ? 1 : va < vb ? -1 : 0) * mul;
    });
    return copy;
  }, [filtered, sort]);

  const metrics = useMemo(() => {
    const count = data.length;
    const avgValue = count ? Math.round(data.reduce((s, p) => s + (p.market_value_num || 0), 0) / count) : 0;
    const risks = data.reduce((acc, p) => {
      const r = p.risk_level_num;
      acc[Number.isFinite(r) ? r : 'NA'] = (acc[Number.isFinite(r) ? r : 'NA'] || 0) + 1;
      return acc;
    }, {});
    const avgRisk = (() => {
      const vals = data.map(p => p.risk_level_num).filter(n => Number.isFinite(n));
      return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    })();
    return { count, avgValue, avgRisk, risks };
  }, [data]);

  const toggleSort = (field, defaultOrder = 'ASC') => {
    setSort(prev => {
      if (prev.field !== field) return { field, dir: defaultOrder.toLowerCase() };
      return { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
  };

  return {
    data: sorted,
    raw: data,
    loading,
    error,
    query, setQuery,
    risk, setRisk,
    riskUnder3, setRiskUnder3,
    onlyProbableXI, setOnlyProbableXI,
    sort, toggleSort,
    metrics,
    refresh: fetchData,
    mode, setMode,
  };
}
