// useMarketData.js
// Encapsula estado y derivadas de MarketPage: carga jugadores, métricas, filtrado, ordenación y vista.
import { useState, useEffect, useMemo, useCallback } from 'react';

// Declarar como const para evitar cualquier ambigüedad en export default
export const useMarketData = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [trend, setTrend] = useState('all'); // all | up | down | flat
  const [cardView, setCardView] = useState(false);
  const [sort, setSort] = useState({ field: 'market_value_num', dir: 'desc' });
  const [refreshKey, setRefreshKey] = useState(0); // Para refrescar TransferLog

  const fetchMarket = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/market');
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error cargando mercado:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Primera carga
  useEffect(()=> { fetchMarket(); }, [fetchMarket]);

  // Métricas derivadas
  const metrics = useMemo(()=> {
    if(!players.length) return null;
    const withValue = players.filter(p=> typeof p.market_value_num === 'number');
    const totalValue = withValue.reduce((a,p)=> a + (p.market_value_num||0), 0);
    const avgValue = withValue.length ? Math.round(totalValue / withValue.length) : 0;
    const rising = players.filter(p=> (p.market_delta||0) > 0).length;
    const falling = players.filter(p=> (p.market_delta||0) < 0).length;
    const stable = players.filter(p=> (p.market_delta||0) === 0).length;
    const avgDelta = players.length ? (
      players.reduce((a,p)=> a + (p.market_delta || 0),0)/players.length
    ) : 0;
    return { count: players.length, avgValue, rising, falling, stable, avgDelta };
  }, [players]);

  // Filtrado + ordenación
  const filteredPlayers = useMemo(()=> {
    let list = players;
    if(query.trim()){
      const q = query.toLowerCase();
      list = list.filter(p=> (p.name||'').toLowerCase().includes(q) || (p.team_name||'').toLowerCase().includes(q));
    }
    if(trend !== 'all'){
      list = list.filter(p=> {
        const d = p.market_delta || 0;
        if(trend === 'up') return d > 0;
        if(trend === 'down') return d < 0;
        if(trend === 'flat') return d === 0;
        return true;
      });
    }
    const { field, dir } = sort;
    const factor = dir === 'asc' ? 1 : -1;
    list = [...list].sort((a,b)=> {
      const av = a[field] ?? 0;
      const bv = b[field] ?? 0;
      if(typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * factor;
      if(av < bv) return -1 * factor;
      if(av > bv) return 1 * factor;
      return 0;
    });
    return list;
  }, [players, query, trend, sort]);

  const toggleSort = useCallback((field) => {
    setSort(s => {
      if(s.field === field){
        return { field, dir: s.dir === 'asc' ? 'desc':'asc' };
      }
      return { field, dir: 'asc' };
    });
  }, []);

  const toggleView = useCallback(()=> setCardView(v=> !v), []);

  // Refresca mercado y fuerza refresco del log
  const refresh = useCallback(async ()=> {
    await fetchMarket();
    setRefreshKey(k=> k+1);
  }, [fetchMarket]);

  return {
    // raw
    players, loading,
    // state
    query, setQuery,
    trend, setTrend,
    sort, setSort, toggleSort,
    cardView, setCardView, toggleView,
    refreshKey,
    // derived
    metrics, filteredPlayers,
    // actions
    fetchMarket, refresh
  };
};

export default useMarketData;
