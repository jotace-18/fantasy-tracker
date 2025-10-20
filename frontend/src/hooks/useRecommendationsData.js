import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Hook principal de recomendaciones
export default function useRecommendationsData() {
  const [allPlayers, setAllPlayers] = useState([]); // ✨ TODOS los jugadores con score
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('market'); // 💰 Modo por defecto: Broker de Mercado
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
      // 🚀 NUEVA ESTRATEGIA: Traer TODOS los jugadores con score calculado
      // Usa el caché del backend (5 min), así la búsqueda es instantánea
      const res = await fetch(
        `/api/analytics/recommendations?mode=${mode}&participant_id=${participantId}&all=true`,
        { signal: controller.signal }
      );
      
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

      setAllPlayers(normalized); // Guardamos TODOS los jugadores
      console.log(`[useRecommendationsData] ✅ Cargados ${normalized.length} jugadores (cached: ${json.cached || false})`);
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
    let out = allPlayers; // Ahora filtramos sobre TODOS los jugadores
    const q = query.trim().toLowerCase();
    
    // 🔍 BÚSQUEDA: Filtra por nombre o equipo
    if (q) {
      out = out.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.team_name || '').toLowerCase().includes(q)
      );
    }
    
    // 🛡️ FILTRO: Riesgo < 3
    if (riskUnder3 && mode !== 'sell') {
      out = out.filter(p => (p.risk_level_num ?? 99) < 3);
    }
    
    // 👔 FILTRO: Solo titulares probables
    if (onlyProbableXI && mode !== 'sell') {
      out = out.filter(p => (p.titular_next_jor ?? 0) >= 0.5);
    }
    
    return out;
  }, [allPlayers, query, riskUnder3, onlyProbableXI, mode]);

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

  // 🎯 LÓGICA DE VISUALIZACIÓN:
  // - Si NO hay búsqueda activa: Mostrar solo TOP 10
  // - Si HAY búsqueda: Mostrar TODOS los resultados filtrados
  const displayData = useMemo(() => {
    const hasSearch = query.trim().length > 0;
    
    if (hasSearch) {
      // Con búsqueda: mostrar todos los resultados
      console.log(`[useRecommendationsData] 🔍 Búsqueda activa: mostrando ${sorted.length} resultados`);
      return sorted;
    } else {
      // Sin búsqueda: solo top 10
      const top10 = sorted.slice(0, 10);
      console.log(`[useRecommendationsData] 📊 Vista normal: mostrando top ${top10.length} de ${allPlayers.length}`);
      return top10;
    }
  }, [sorted, query, allPlayers.length]);

  const toggleSort = (field, defaultOrder = 'ASC') => {
    setSort(prev =>
      prev.field !== field
        ? { field, dir: defaultOrder.toLowerCase() }
        : { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    );
  };

  return {
    data: displayData, // Retornamos displayData en lugar de sorted
    loading,
    error,
    query, setQuery,
    sort, toggleSort,
    riskUnder3, setRiskUnder3,
    onlyProbableXI, setOnlyProbableXI,
    mode, setMode,
    money,
    refresh: fetchData,
    // 📊 Métricas adicionales para mostrar info al usuario
    totalPlayers: allPlayers.length,
    filteredCount: sorted.length,
    isSearchActive: query.trim().length > 0,
  };
}
