// src/pages/PlayerDetailPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Text, Skeleton, SimpleGrid, Badge, HStack, Link, Flex } from "@chakra-ui/react";
import { Link as RouterLink } from 'react-router-dom';
import { PlayerHeaderCard } from "../components/player/PlayerHeaderCard";
import { PlayerStatsGrid } from "../components/player/PlayerStatsGrid";
import OwnershipClauseCard from "../components/player/OwnershipClauseCard";
import { MarketEvolutionChart } from "../components/player/MarketEvolutionChart";
import { PointsHistoryCard } from "../components/player/PointsHistoryCard";
import { PlayerPointsTrendChart } from "../components/player/PlayerPointsTrendChart";

// helpers
const toInt = (v) => {
  if (typeof v === "number") return v;
  if (v == null) return null;
  const n = Number(String(v).replace(/\./g, "").replace(/,/g, "").replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const parseDateTs = (s) => {
  if (!s) return null;
  // soporta dd/mm/yyyy o yyyy-mm-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/").map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
};
const euro = (n) => (typeof n === "number" ? n.toLocaleString("es-ES") : n ?? "-");

function PlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(() => sessionStorage.getItem('chart_range') || 'all'); // '7' | '14' | 'all'
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [nextMatch, setNextMatch] = useState(null); // { jornada, esLocal, rivalNombre, rivalSlug, rivalId, fecha, estado }

  const slugify = (str)=> String(str||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9\s-]/g,'')
    .trim().replace(/\s+/g,'-').replace(/-+/g,'-');

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:4000/api/players/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPlayer(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error al cargar detalle del jugador:", err);
        setLoading(false);
      });
  }, [id]);

  // Obtener calendario y determinar próximo rival
  useEffect(()=>{
    let abort=false;
    if(!player) return;
    const teamId = player.team_id; // asumimos que el endpoint player incluye team_id
    if(!teamId){ setNextMatch(null); return; }
    Promise.all([
      fetch('http://localhost:4000/api/calendar/next?limit=38').then(r=>r.json()),
      fetch('http://localhost:4000/api/clock').then(r=>r.json()).catch(()=>({currentTime:new Date().toISOString()}))
    ]).then(([calData,clockData])=>{
      if(abort) return;
      const now = new Date(clockData.currentTime);
      // Nueva lógica solicitada:
      // 1. La "próxima jornada" es la primera jornada cuyo fecha_cierre AÚN NO ha pasado (fecha_cierre > now).
      // 2. No importa si los enfrentamientos anteriores tienen partidos sin goles cargados: el criterio de cierre es la fecha_cierre.
      // 3. Una vez identificada esa jornada, buscamos el enfrentamiento del equipo del jugador.
      // 4. Si en esa jornada no aparece (edge case), buscamos en la siguiente futura, manteniendo la misma regla.

      const jornadasOrdenadas = [...calData].sort((a,b)=>{
        // ordenar por fecha_cierre si existe; fallback a numero
        const aC = a.fecha_cierre ? new Date(a.fecha_cierre).getTime() : Infinity;
        const bC = b.fecha_cierre ? new Date(b.fecha_cierre).getTime() : Infinity;
        if(aC !== bC) return aC - bC;
        return (a.numero||0) - (b.numero||0);
      });

      // filtrar solo jornadas con fecha_cierre futura
      const futuras = jornadasOrdenadas.filter(j=>{
        if(!j.fecha_cierre) return false; // si no hay fecha_cierre no podemos determinar; descartamos para evitar falsos positivos
        return new Date(j.fecha_cierre).getTime() > now.getTime();
      });

      // fallback si ninguna tiene fecha_cierre futura (temporada finalizada o datos incompletos): usar última jornada sin cerrar basada en goles
      let candidata = futuras[0];
      if(!candidata){
        candidata = jornadasOrdenadas.find(j=>{
          const enfList = j.enfrentamientos||[];
            return enfList.some(e=> e.goles_local==null || e.goles_visitante==null);
        });
      }

      if(!candidata){
        setNextMatch(null);
        return;
      }

      // Intentar encontrar enfrentamiento del equipo en la jornada candidata; si no está, buscar en subsiguientes futuras
      const candidatasParaBuscar = [candidata, ...futuras.slice(1)];
      for(const jornada of candidatasParaBuscar){
        const enfList = jornada.enfrentamientos || [];
        const enf = enfList.find(e=> e.equipo_local_id===teamId || e.equipo_visitante_id===teamId);
        if(!enf) continue; // probar siguiente jornada futura

        const esLocal = enf.equipo_local_id===teamId;
        const rivalNombre = esLocal ? (enf.equipo_visitante_alias||enf.equipo_visitante_nombre) : (enf.equipo_local_alias||enf.equipo_local_nombre);
        const rivalId = esLocal ? enf.equipo_visitante_id : enf.equipo_local_id;
        const rivalSlug = slugify(rivalNombre);
        const fecha = enf.fecha_partido ? new Date(enf.fecha_partido).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : null;
        setNextMatch({
          jornada: jornada.numero,
          esLocal,
          rivalNombre,
          rivalSlug,
          rivalId,
          fecha,
          estado: enf.estado
        });
        return;
      }

      // Si no hay enfrentamiento en jornadas futuras (extraño), limpiamos
      setNextMatch(null);
    }).catch(e=>{ if(!abort) setNextMatch(null); console.error('[PlayerDetail] calendario/clock error',e); });
    return ()=>{abort=true};
  },[player]);

  const { historySorted, maxItem, minItem } = useMemo(() => {
    const raw = player?.market?.history || [];
    const mapped = raw
      .map((h) => ({
        ts: parseDateTs(h.date),
        dateLabel: h.date,
        value: toInt(h.value),
      }))
      .filter((x) => x.ts && x.value != null)
      .sort((a, b) => a.ts - b.ts);

    let maxItem = null;
    let minItem = null;
    for (const it of mapped) {
      if (!maxItem || it.value > maxItem.value) maxItem = it;
      if (!minItem || it.value < minItem.value) minItem = it;
    }
    return { historySorted: mapped, maxItem, minItem };
  }, [player]);

  const displayHistory = useMemo(() => {
    if (!historySorted.length) return historySorted;
    if (range === 'all') return historySorted;
    const n = parseInt(range, 10);
    if (Number.isNaN(n) || historySorted.length <= n) return historySorted;
    return historySorted.slice(historySorted.length - n);
  }, [historySorted, range]);

  useEffect(() => {
    sessionStorage.setItem('chart_range', range);
  }, [range]);

  if (loading) {
    return (
      <Box p={6}>
        <SimpleGrid columns={[1,2,4]} spacing={6} mb={6}>
          {Array.from({length:4}).map((_,i)=>(
            <Skeleton key={i} height="120px" borderRadius="xl" />
          ))}
        </SimpleGrid>
        <Skeleton height="180px" borderRadius="2xl" mb={6} />
        <Skeleton height="340px" borderRadius="2xl" mb={6} />
        <Skeleton height="280px" borderRadius="2xl" />
      </Box>
    );
  }

  if (!player) {
    return (
      <Box textAlign="center" mt="10">
        <Text color="red.500" fontWeight="bold" fontSize="xl">
          Jugador no encontrado
        </Text>
      </Box>
    );
  }

  const mvCurrent = toInt(player.market.current);
  const mvMax = toInt(player.market.max);
  const mvMin = toInt(player.market.min);
  const stats = [
    {label:'Valor Actual', value: mvCurrent, color:'teal.600', delta: player.market.delta, isMoney:true},
    {label:'Valor Máximo', value: mvMax, color:'green.500', isMoney:true},
    {label:'Valor Mínimo', value: mvMin, color:'red.500', isMoney:true},
    {label:'Puntos Totales', value: player.points.total, color:'purple.600', help:`Media: ${player.points.avg}`},
  ];

  return (
    <Box p={6}>
  <PlayerHeaderCard player={player} />
  <OwnershipClauseCard player={player} />
      {nextMatch && (
        <Box
          as={Flex}
          mb={6}
          align='center'
          gap={4}
          p={4}
          borderRadius='2xl'
          bgGradient='linear(to-r, gray.50, gray.100)'
          _dark={{ bgGradient: 'linear(to-r, gray.700, gray.600)', borderColor: 'gray.600' }}
          borderWidth='1px'
          flexWrap='wrap'
        >
          <Badge colorScheme={nextMatch.esLocal ? 'green' : 'purple'}>{nextMatch.esLocal ? 'LOCAL' : 'VISITANTE'}</Badge>
          <Badge colorScheme='blue'>J {nextMatch.jornada}</Badge>
          <HStack spacing={2}>
            <Text fontWeight='bold'>Próximo:</Text>
            <Text fontSize='sm' color='gray.600' _dark={{ color: 'gray.300' }}>vs</Text>
            <Link as={RouterLink} to={`/teams/${nextMatch.rivalSlug || nextMatch.rivalId}`} fontWeight='semibold' _hover={{ textDecoration: 'underline' }}>{nextMatch.rivalNombre}</Link>
          </HStack>
          {nextMatch.fecha && <Badge variant='subtle' colorScheme='gray'>{nextMatch.fecha}</Badge>}
          {nextMatch.estado && <Badge variant='outline' colorScheme='orange'>{nextMatch.estado}</Badge>}
        </Box>
      )}
      <PlayerStatsGrid stats={stats} />
      <MarketEvolutionChart history={displayHistory} range={range} onRangeChange={setRange} maxItem={maxItem} minItem={minItem} />
  <PointsHistoryCard history={player.points.history} showHeatmap={showHeatmap} onToggle={() => setShowHeatmap(h => !h)} />
  <PlayerPointsTrendChart history={player.points.history} />
    </Box>
  );
}

// Componente AnimatedNumber
function AnimatedNumber({ value, color, isMoney }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value == null) return;
    const start = 0;
    const duration = 650; // ms
    const startTs = performance.now();
    let frame;
    const step = (now) => {
      const p = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const current = Math.round(start + (value - start) * eased);
      setDisplay(current);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <StatNumber color={color}>{value == null ? '-' : `${isMoney? euro(display): display}${isMoney? ' €': ''}`}</StatNumber>
  );
}

export default PlayerDetailPage;
