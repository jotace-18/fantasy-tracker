import { useEffect, useState, useMemo } from "react";
import { Box, Text, Badge, HStack, Flex, Select, Spinner, useDisclosure, Button } from "@chakra-ui/react";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTableShell } from "../components/ui/DataTableShell";
import { AsyncState } from "../components/ui/AsyncState";
import AddPointsModal from "../components/AddPointsModal";

export default function LeaderboardPage(){
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jornada, setJornada] = useState('total');
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(()=>{
    let cancelled=false;
    setLoading(true); setError(null);
    fetch('http://localhost:4000/api/participants/leaderboard')
      .then(r=>{ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(data=>{ if(!cancelled) setParticipants(Array.isArray(data)? data:[]); })
      .catch(err=>{ if(!cancelled){ console.error('❌ Error leaderboard:', err); setError(err.message||'Error desconocido'); }})
      .finally(()=>{ if(!cancelled) setLoading(false); });
    return ()=> { cancelled=true; };
  },[]);

  const jornadas = useMemo(()=> Array.from(new Set(participants.flatMap(p=> p.history.map(h=> h.jornada)))).sort((a,b)=> a-b), [participants]);

  const ranked = useMemo(()=> {
    return participants.map(p=> {
      // Aseguramos orden por jornada ascendente para cálculos consistentes
      const history = [...p.history].sort((a,b)=> a.jornada - b.jornada);
      const jornadasCount = history.length || 1;
      const avg = p.total_points && jornadasCount ? (p.total_points / jornadasCount) : 0;

      // Puntos mostrados según selector
      let pts;
      if(jornada==='total') {
        pts = p.total_points;
      } else {
        const current = history.find(h=> h.jornada===Number(jornada));
        pts = current ? current.points : 0;
      }

      // Delta:
      // - En vista total: diferencia entre la última jornada registrada y la anterior.
      // - En vista de jornada específica: puntos esa jornada - puntos jornada anterior inmediata.
      let delta = null;
      if(history.length > 1) {
        if(jornada==='total') {
          const last = history[history.length-1].points;
            const prev = history[history.length-2].points;
            delta = last - prev; // int (puntos ya enteros)
        } else {
          const idx = history.findIndex(h=> h.jornada===Number(jornada));
          if(idx > 0) {
            const cur = history[idx].points;
            const prev = history[idx-1].points;
            delta = cur - prev;
          }
        }
      }

      return { ...p, points: pts, avgPoints: avg, delta, isUser: p.id === 8 };
    }).sort((a,b)=> b.points - a.points);
  }, [participants, jornada]);

  const avgPoints = ranked.length ? (ranked.reduce((a,p)=> a+p.points,0)/ranked.length).toFixed(1) : '-';
  const totalPoints = ranked.reduce((a,p)=> a+p.points,0);
  const topMoney = ranked.reduce((m,p)=> p.money > (m?.money||-Infinity) ? p : m, null);

  const colorFor = (pts)=> pts >= 90 ? 'green' : pts>=70? 'teal' : pts>=50? 'blue' : pts>=35? 'cyan' : pts>=20? 'yellow' : pts>=10? 'orange' : 'purple';

  return (
    <Box p={6} maxW='1400px' mx='auto'>
      <PageHeader
        title='Leaderboard'
        subtitle='Clasificación de participantes'
        icon={<span>🏆</span>}
        meta={[ jornada==='total' ? 'Total acumulado' : `Jornada ${jornada}`, `Participantes ${ranked.length}` ]}
        actions={[
          <Select key='j' size='sm' value={jornada} onChange={e=> setJornada(e.target.value)} width='170px' bg='white' color='gray.800' _dark={{ bg:'gray.700', color:'gray.100' }}>
            <option value='total'>🌍 Total</option>
            {jornadas.map(j=> <option key={j} value={j}>Jornada {j}</option>)}
          </Select>,
          <Button key='add' size='sm' colorScheme='teal' onClick={onOpen}>➕ Puntos</Button>
        ]}
      />
      {/* KPIs */}
      <HStack spacing={4} mt={4} mb={3} wrap='wrap'>
        <Box px={4} py={2} bg='gray.50' _dark={{ bg:'gray.700' }} borderRadius='md' boxShadow='sm'>
          <Text fontSize='xs' textTransform='uppercase' letterSpacing='.7px' color='gray.500' _dark={{ color:'gray.400' }} fontWeight='semibold'>Media puntos</Text>
          <Text fontSize='lg' fontWeight='bold'>{avgPoints}</Text>
        </Box>
        <Box px={4} py={2} bg='gray.50' _dark={{ bg:'gray.700' }} borderRadius='md' boxShadow='sm'>
          <Text fontSize='xs' textTransform='uppercase' letterSpacing='.7px' color='gray.500' _dark={{ color:'gray.400' }} fontWeight='semibold'>Total puntos</Text>
          <Text fontSize='lg' fontWeight='bold'>{totalPoints}</Text>
        </Box>
        {topMoney && <Box px={4} py={2} bg='gray.50' _dark={{ bg:'gray.700' }} borderRadius='md' boxShadow='sm'>
          <Text fontSize='xs' textTransform='uppercase' letterSpacing='.7px' color='gray.500' _dark={{ color:'gray.400' }} fontWeight='semibold'>Top dinero</Text>
          <Text fontSize='lg' fontWeight='bold'>€{(topMoney.money||0).toLocaleString('es-ES')} <Text as='span' fontSize='xs' ml={1} color='gray.500' _dark={{ color:'gray.400' }}>{topMoney.name}</Text></Text>
        </Box>}
      </HStack>
      <AddPointsModal isOpen={isOpen} onClose={onClose} participants={participants} onSaved={()=> window.location.reload()} />
      <AsyncState loading={loading} error={error} empty={!loading && !error && ranked.length===0} emptyMessage='Sin participantes'>
        <DataTableShell maxH='70vh' stickyHeader hoverHighlight>
          <thead>
            <tr>
              <th style={{ width:'55px' }}>#</th>
              <th style={{ minWidth:'220px' }}>Participante</th>
              <th style={{ textAlign:'right', width:'140px' }}>Dinero</th>
              <th style={{ textAlign:'right', width:'110px' }}>Media</th>
              <th style={{ textAlign:'right', width:'110px' }}>Δ</th>
              <th style={{ textAlign:'right', width:'110px' }}>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((p,i)=> {
              const rank = i+1;
              const badge = rank===1? '🥇' : rank===2? '🥈' : rank===3? '🥉' : `#${rank}`;
              const deltaDisplay = p.delta==null ? '—' : (p.delta>0? `+${p.delta}` : p.delta===0? '0' : p.delta);
              return (
                <tr key={p.id} style={{ cursor:'pointer', background: p.isUser ? 'var(--chakra-colors-teal-50)' : undefined }}>
                  <td>
                    <Badge fontSize='0.6rem' px={2} py={1} borderRadius='full' variant='solid' boxShadow={p.isUser? '0 0 0 2px var(--chakra-colors-teal-300)':''} colorScheme={badge.includes('🥇')? 'yellow' : badge.includes('🥈')? 'gray' : badge.includes('🥉')? 'orange':'teal'}>{badge}</Badge>
                  </td>
                  <td>
                    <Text as='a' href={p.name==='Jc'? '/my-team' : `/participants/${p.id}`} fontWeight={p.isUser? 'bold' : (rank<=3? 'semibold':'medium')} color={p.isUser? 'teal.700':'blue.600'} _hover={{ textDecoration:'underline', color: p.isUser? 'teal.800':'blue.700' }}>{p.name}</Text>
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <Badge bg={p.money>=0? 'green.100':'red.100'} color={p.money>=0? 'green.700':'red.700'} px={3} py={1.5} fontSize='0.75rem' fontWeight='bold' borderRadius='full'>€{(p.money||0).toLocaleString('es-ES')}</Badge>
                  </td>
                  <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                    <Text as='span' fontSize='0.75rem' fontWeight='semibold'>{p.avgPoints.toFixed(1)}</Text>
                  </td>
                  <td style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                    <Badge px={2} py={1} fontSize='0.65rem' borderRadius='full' colorScheme={p.delta>0? 'green': p.delta<0? 'red':'gray'} variant='subtle'>{deltaDisplay}</Badge>
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <Badge colorScheme={colorFor(p.points)} variant='solid' px={3} py={1.5} fontSize='0.8rem' fontWeight='bold' borderRadius='full'>{p.points}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTableShell>
      </AsyncState>
    </Box>
  );
}
