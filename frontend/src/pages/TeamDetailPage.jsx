import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Spinner, Text, Heading, SimpleGrid, VStack, Card, CardHeader, CardBody } from '@chakra-ui/react';
import TeamRosterTable from '../components/team/TeamRosterTable';
import SurroundingClassification from '../components/team/SurroundingClassification';
import UpcomingMatches from '../components/team/UpcomingMatches';

function normalizaNombre(nombre){
  return nombre ? nombre.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim() : '';
}

export default function TeamDetailPage(){
  const { id: param } = useParams();
  const isNumericId = useMemo(()=>/^\d+$/.test(param),[param]);
  const teamIdentifier = param;
  const [players,setPlayers] = useState([]);
  const [loading,setLoading] = useState(true);
  const [sortBy,setSortBy] = useState('total_points');
  const [order,setOrder] = useState('DESC');
  const [teams,setTeams] = useState([]);
  const [equipoActualNombre,setEquipoActualNombre] = useState('');
  const [calendar,setCalendar] = useState([]);
  const [loadingExtra,setLoadingExtra] = useState(true);
  const [derivedTeamId,setDerivedTeamId] = useState(null);
  const [slugFetchTried,setSlugFetchTried] = useState(false);
  const [fallbackTried,setFallbackTried] = useState(false);
  const [fallbackLoading,setFallbackLoading] = useState(false);

  const slugify = (str)=> String(str||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9\s-]/g,'')
    .trim().replace(/\s+/g,'-').replace(/-+/g,'-');

  useEffect(()=>{
    setLoading(true);
    setSlugFetchTried(false);
    setFallbackTried(false);
    let abort=false;
    (async()=>{
      try{
        const url = isNumericId
          ? `http://localhost:4000/api/teams/${teamIdentifier}/players?sortBy=${sortBy}&order=${order}`
          : `http://localhost:4000/api/players/teams/${teamIdentifier}/players`;
        const res = await fetch(url);
        if(!res.ok) throw new Error('resp no OK');
        const data = await res.json();
        if(abort) return; setPlayers(Array.isArray(data)?data:[]); if(!isNumericId) setSlugFetchTried(true);
      }catch(e){
        console.error('[TeamDetail] error fetch principal',e);
        if(!isNumericId) setSlugFetchTried(true);
        if(!isNumericId && /^\d+$/.test(teamIdentifier)){
          try{const r2=await fetch(`http://localhost:4000/api/teams/${teamIdentifier}/players?sortBy=${sortBy}&order=${order}`);const d2=await r2.json();if(!abort) setPlayers(Array.isArray(d2)?d2:[]);}catch(e2){console.error('[TeamDetail] fallback id directo falló',e2);} }
        else if(!abort){ setPlayers([]);}      
      }finally{ if(!abort) setLoading(false);}    
    })();
    return ()=>{abort=true};
  },[teamIdentifier,isNumericId,sortBy,order]);

  useEffect(()=>{
    setLoadingExtra(true);
    let abort=false;
    Promise.all([
      fetch('http://localhost:4000/api/teams').then(r=>r.json()),
      fetch('http://localhost:4000/api/calendar/next?limit=38').then(r=>r.json()),
      fetch('http://localhost:4000/api/clock').then(r=>r.json())
    ]).then(([teamsData,calendarData,clockData])=>{
      if(abort) return; const sorted=[...teamsData].sort((a,b)=>(a.position??99)-(b.position??99)); setTeams(sorted);
      let equipo = isNumericId ? sorted.find(t=>String(t.id)===String(teamIdentifier)) : sorted.find(t=>t.slug===teamIdentifier);
      if(!equipo && !isNumericId){ equipo = sorted.find(t=>slugify(t.name)===teamIdentifier); }
      setEquipoActualNombre(equipo?equipo.name:''); if(equipo) setDerivedTeamId(equipo.id);
      const now=new Date(clockData.currentTime); const TOL=3*24*60*60*1000; let idx=0;
      for(let i=0;i<calendarData.length;i++){ const j=calendarData[i]; if(j.fecha_cierre){ const cierre=new Date(j.fecha_cierre); if(cierre.getTime()+TOL>now.getTime()){ idx=i; break; } } }
      if(idx>calendarData.length-3) idx=Math.max(0,calendarData.length-3);
      setCalendar(calendarData.slice(idx,idx+3));
      setLoadingExtra(false);
    }).catch(e=>{ console.error('[TeamDetail] extra error',e); if(!abort) setLoadingExtra(false); });
    return ()=>{abort=true};
  },[teamIdentifier,isNumericId]);

  const surroundingTeams = useMemo(()=>{
    if(!teams.length) return [];
    const idx = isNumericId
      ? teams.findIndex(t=>String(t.id)===String(teamIdentifier))
      : (()=>{ let i=teams.findIndex(t=>t.slug===teamIdentifier); if(i===-1) i=teams.findIndex(t=>slugify(t.name)===teamIdentifier); return i; })();
    if(idx===-1) return [];
    return teams.slice(Math.max(0,idx-2),idx+3);
  },[teams,isNumericId,teamIdentifier]);

  useEffect(()=>{
    let abort=false;
    const needsFallback = !isNumericId && slugFetchTried && !fallbackTried && players.length===0 && derivedTeamId;
    if(needsFallback){(async()=>{try{setFallbackLoading(true); const r=await fetch(`http://localhost:4000/api/teams/${derivedTeamId}/players?sortBy=${sortBy}&order=${order}`); if(!r.ok) throw new Error('fallback no ok'); const d=await r.json(); if(!abort) setPlayers(Array.isArray(d)?d:[]);}catch(e){console.error('[TeamDetail] fallback derivado error',e);}finally{ if(!abort){ setFallbackLoading(false); setFallbackTried(true);} }})();}
    return ()=>{abort=true};
  },[isNumericId,slugFetchTried,fallbackTried,players.length,derivedTeamId,sortBy,order]);

  const handleSort = (field,defaultOrder='ASC')=>{
    if(sortBy===field){ setOrder(order==='ASC'?'DESC':'ASC'); } else { setSortBy(field); setOrder(defaultOrder);} };
  const renderArrow=(field)=> sortBy===field ? (order==='ASC'?' ▲':' ▼') : '';

  if(loading){
    return <Box textAlign='center' mt='10'><Spinner size='xl'/><Text mt='2'>Cargando equipo...</Text></Box>;
  }

  return <Box p={6} maxW='1400px' mx='auto'>
    <Heading size='lg' mb={6} textAlign='center'>{equipoActualNombre?`Detalles de ${equipoActualNombre}`:`Equipo: ${teamIdentifier}`}</Heading>
    <SimpleGrid columns={{base:1,md:2}} spacing={8}>
      <Card>
        <CardHeader><Heading size='md'>Plantilla</Heading></CardHeader>
        <CardBody>
          <TeamRosterTable players={players} sortBy={sortBy} order={order} handleSort={handleSort} renderArrow={renderArrow} loadingFallback={fallbackLoading}/>
        </CardBody>
      </Card>
      <VStack spacing={6} align='stretch'>
        <Card>
          <CardHeader><Heading size='md'>Clasificación alrededor</Heading></CardHeader>
          <CardBody>
            <SurroundingClassification teams={teams} surroundingTeams={surroundingTeams} currentIdentifier={teamIdentifier} isNumericId={isNumericId} loading={loadingExtra} slugify={slugify}/>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><Heading size='md'>Próximas jornadas</Heading></CardHeader>
          <CardBody>
            {loadingExtra ? <Spinner size='lg'/> : <UpcomingMatches calendar={calendar} teamId={derivedTeamId} teamName={equipoActualNombre} normalizeFn={normalizaNombre}/>}  
          </CardBody>
        </Card>
      </VStack>
    </SimpleGrid>
  </Box>;
}
