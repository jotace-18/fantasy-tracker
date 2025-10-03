import { useEffect, useState, useMemo } from "react";
import { Box, Text, Badge, HStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTableShell } from "../components/ui/DataTableShell";
import { PaginationControls } from "../components/ui/PaginationControls";
import { SortHeader } from "../components/ui/SortHeader";
import { AsyncState } from "../components/ui/AsyncState";
import { SearchInput } from "../components/ui/SearchInput";
import { OwnerBadge } from "../components/ui/OwnerBadge";
import { PositionBadge } from "../components/ui/PositionBadge";

function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("total_points");
  const [order, setOrder] = useState("DESC");
  const PAGE_SIZE = 10; // fijo
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = no búsqueda activa
  const searching = !!query.trim();

  useEffect(() => {
    // Si hay búsqueda activa se gestiona en otro efecto
    if (searching) return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`http://localhost:4000/api/players/top?page=${page}&limit=${PAGE_SIZE}&sortBy=${sortBy}&order=${order}`, { signal: controller.signal })
      .then(res => { if(!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data => { if(!cancelled){ setPlayers(Array.isArray(data.players)? data.players : []); setTotal(data.total||0);} })
      .catch(err => { if(!cancelled){ if(err.name !== 'AbortError'){ console.error('❌ Error al cargar jugadores:', err); setError(err.message||'Error desconocido'); } }})
      .finally(()=> { if(!cancelled) setLoading(false); });
    return () => { cancelled = true; controller.abort(); };
  }, [page, sortBy, order, searching]);

  // Efecto de búsqueda servidor (sin paginar, máximo 100)
  useEffect(()=>{
    if(!searching){ setSearchResults(null); return; }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`http://localhost:4000/api/players/search?name=${encodeURIComponent(query)}&limit=100&sort=total_points&order=DESC`, { signal: controller.signal })
      .then(res=>{ if(!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then(data=>{ if(!cancelled){ setSearchResults(data.data || []); }})
      .catch(err=>{ if(!cancelled){ if(err.name !== 'AbortError'){ console.error('❌ Error búsqueda jugadores:', err); setError(err.message||'Error desconocido'); } }})
      .finally(()=>{ if(!cancelled) setLoading(false); });
    return ()=> { cancelled = true; controller.abort(); };
  }, [query, searching]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSort = (field, defaultOrder = 'ASC') => {
    if (sortBy === field) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setOrder(defaultOrder);
      setPage(1);
    }
  };

  // Dataset base para render (si búsqueda: searchResults; si no: players paginados)
  const dataset = searching ? (searchResults || []) : players;
  const filtered = dataset; // búsqueda ya se hace en servidor

  const rows = useMemo(() => filtered.map((player, index) => {
    const rank = searching ? index + 1 : (page - 1) * PAGE_SIZE + index + 1;
    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
    return { player, rank, rankIcon };
  }), [filtered, page, searching]);

  return (
    <Box p={6}>
      <PageHeader
        title="Ranking de Jugadores"
        subtitle="Rendimiento y valor de mercado"
  meta={[
    searching ? `Resultados ${filtered.length}` : `Página ${page}/${totalPages}`,
    searching ? 'Búsqueda servidor' : null
  ].filter(Boolean)}
        icon={<span>🏅</span>}
  actions={[
          <Box key='search' borderRadius='lg' bg='white' _dark={{ bg:'gray.700', color:'gray.100' }} boxShadow='sm' px={2} py={1} minW='260px' color='gray.800'>
            <SearchInput value={query} onChange={(v)=>{ setQuery(v); setPage(1); }} placeholder='Buscar jugador / equipo / rol' />
          </Box>
  ]}
      />
      {/* KPI Summary Bar */}
      <HStack spacing={4} mt={4} mb={3} wrap='wrap'>
        {(() => {
          const sample = filtered.length ? filtered : dataset;
          const totalLoaded = dataset.length;
          const avgValue = sample.length ? (sample.reduce((a,p)=> a + (p.market_value_num||0),0)/sample.length/1_000_000).toFixed(1) : '-';
          const avgPoints = sample.length ? (sample.reduce((a,p)=> a + (p.total_points||0),0)/sample.length).toFixed(1) : '-';
          const topValue = sample.reduce((m,p)=> p.market_value_num> (m?.market_value_num||-1) ? p : m, null);
          const topPoints = sample.reduce((m,p)=> p.total_points> (m?.total_points||-1) ? p : m, null);
          const items = [
            { label:'Jugadores cargados', value: totalLoaded },
            { label:'Media Valor', value: avgValue !== '-' ? avgValue+'M' : '-' },
            { label:'Media Puntos', value: avgPoints },
            topValue ? { label:'Top Valor', value: (topValue.market_value_num/1_000_000).toFixed(1)+'M', hint: topValue.name } : null,
            topPoints ? { label:'Top Puntos', value: topPoints.total_points, hint: topPoints.name } : null
          ].filter(Boolean);
          return items.map(it => (
            <Box key={it.label} px={4} py={2} bg='gray.50' _dark={{ bg:'gray.700' }} borderRadius='md' boxShadow='sm' minW='140px'>
              <Text fontSize='xs' textTransform='uppercase' letterSpacing='.8px' color='gray.500' _dark={{ color:'gray.400' }} fontWeight='semibold'>{it.label}</Text>
              <Text fontSize='lg' fontWeight='bold' lineHeight='1.1'>
                {it.value}
                {it.hint && <Text as='span' fontSize='xs' ml={2} color='gray.500' _dark={{ color:'gray.400' }}>{it.hint}</Text>}
              </Text>
            </Box>
          ));
        })()}
      </HStack>
      <AsyncState loading={loading} error={error} empty={!loading && !error && players.length === 0} emptyMessage="Sin jugadores" >
        <DataTableShell maxH='65vh' stickyHeader hoverHighlight>
          <thead>
            <tr>
              <th style={{width:'60px'}}>#</th>
              <SortHeader field='name' currentField={sortBy} order={order} onSort={handleSort}>Jugador</SortHeader>
              <SortHeader field='team_name' currentField={sortBy} order={order} onSort={handleSort}>Equipo</SortHeader>
              <SortHeader field='position' currentField={sortBy} order={order} onSort={handleSort}>Posición</SortHeader>
              <SortHeader field='market_value' currentField={sortBy} order={order} onSort={handleSort} numeric defaultOrder='DESC'>Valor</SortHeader>
              <th>Propiedad</th>
              <SortHeader field='total_points' currentField={sortBy} order={order} onSort={handleSort} numeric defaultOrder='DESC'>Puntos</SortHeader>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ player, rankIcon }) => (
              <tr key={player.id} style={{ cursor:'pointer' }}>
                <td>
                  <Badge
                    fontSize='0.6rem'
                    px={2}
                    py={1}
                    borderRadius='full'
                    variant='solid'
                    colorScheme={rankIcon.includes('🥇') ? 'yellow' : rankIcon.includes('🥈') ? 'gray' : rankIcon.includes('🥉') ? 'orange':'teal'}
                  >{rankIcon}</Badge>
                </td>
                <td>
                  <HStack spacing={3} align='center'>
                    <Link to={`/players/${player.id}`} style={{ color: 'var(--chakra-colors-blue-600)', fontWeight: 700, fontSize:'1rem', letterSpacing:'.2px' }}>{player.name}</Link>
                    <PositionBadge position={player.position} />
                  </HStack>
                </td>
                <td>
                  {player.team_id ? (
                    <Link to={`/teams/${player.team_id}`} style={{ fontWeight:600, color:'var(--chakra-colors-blue-600)' }}>
                      {player.team_name}
                    </Link>
                  ) : (
                    <Text fontSize='sm' fontWeight='medium'>{player.team_name}</Text>
                  )}
                </td>
                <td><Text fontSize='sm' fontWeight='semibold'>{player.position}</Text></td>
                <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                  <Text as='span' fontWeight='semibold' fontSize='sm'>
                    {typeof player.market_value_num === 'number' && !isNaN(player.market_value_num)
                      ? (player.market_value_num/1_000_000).toFixed(1)+'M'
                      : '-'}
                  </Text>
                </td>
                <td><OwnerBadge owner_type={player.owner_type} participant_id={player.participant_id} participant_name={player.participant_name} /></td>
                <td style={{ textAlign:'right', whiteSpace:'nowrap' }}>
                  <Badge colorScheme={player.total_points < 0 ? 'red':'green'} variant='subtle' px={3} py={1.5} fontSize='0.85rem' fontWeight='bold' letterSpacing='.3px'>
                    {player.total_points}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTableShell>
      </AsyncState>
  {!searching && <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />}
    </Box>
  );
}

export default PlayersPage;
