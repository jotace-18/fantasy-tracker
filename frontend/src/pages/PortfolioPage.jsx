import { Box, SimpleGrid, Stat, StatLabel, StatNumber, Heading, Text, HStack, VStack, Badge, Progress, Grid, GridItem, Tooltip, Divider, Flex } from '@chakra-ui/react';
import { PageHeader } from '../components/ui/PageHeader';
import usePortfolioData from '../hooks/usePortfolioData';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

function Euro({ v }) {
  if (v == null) return '-';
  if (typeof v === 'string' && v.endsWith('%')) return v;
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return `€${n.toLocaleString('es-ES')}`;
}

function KPI({ label, value, color, currency }){
  return (
    <Stat p={4} borderWidth='1px' borderRadius='lg' bg='white' _dark={{ bg:'gray.800' }}>
      <StatLabel>{label}</StatLabel>
      <StatNumber color={`${color}.500`}>{currency ? <Euro v={value} /> : (value ?? '-')}</StatNumber>
    </Stat>
  );
}

function Card({ title, children, color='gray' }){
  return (
    <Box borderWidth='1px' borderRadius='lg' p={4} bg='white' _dark={{ bg:'gray.800' }}>
      <Heading size='sm' mb={3} color={`${color}.500`}>{title}</Heading>
      {children}
    </Box>
  );
}

export default function PortfolioPage(){
  const { loading, error, kpis, history, top, worst, sell, clauses, xi, market } = usePortfolioData(8);

  // Derivar series simples para gráficos
  const timeline = history.map(h => ({
    date: (h.transfer_date || '').slice(0,10),
    invested: h.direction === 'in' ? Number(h.amount||0) : 0,
    recovered: h.direction === 'out' ? Number(h.amount||0) : 0,
  }));
  // Acumulados rápidos (cliente) por fecha
  const acc = {};
  let inv=0, rec=0;
  timeline.forEach(d=>{
    inv += d.invested; rec += d.recovered;
    acc[d.date] = { date:d.date, invested: inv, recovered: rec, net: rec - inv };
  });
  const timelineAcc = Object.values(acc);

  return (
    <Box p={6} maxW='1400px' mx='auto'>
      <PageHeader title='Portfolio Inteligente' subtitle='Visión financiera y táctica unificada de tu plantilla' icon={<span>📊</span>} />

      {/* 1️⃣ Resumen financiero */}
      <Heading size='md' mb={3}>Resumen financiero</Heading>
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={3} mb={4}>
        {kpis.map((k, i) => <KPI key={i} {...k} />)}
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={4} mb={8}>
        <GridItem>
          <Card title='Evolución acumulada (invertido/recuperado/neto)' color='blue'>
            <Box h='260px'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={timelineAcc}>
                  <XAxis dataKey='date' hide={timelineAcc.length>12} />
                  <YAxis />
                  <RTooltip formatter={(v)=>`€${Number(v).toLocaleString('es-ES')}`} />
                  <Legend />
                  <Line type='monotone' dataKey='invested' stroke='#8884d8' name='Invertido' dot={false} />
                  <Line type='monotone' dataKey='recovered' stroke='#82ca9d' name='Recuperado' dot={false} />
                  <Line type='monotone' dataKey='net' stroke='#3182ce' name='Neto' dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </GridItem>
        <GridItem>
          <Card title='Distribución del XI por posición' color='purple'>
            <Box h='260px'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie dataKey='value' data={[
                    { name:'GK', value: xi.filter(x=>x.position==='GK').length },
                    { name:'DEF', value: xi.filter(x=>x.position==='DEF').length },
                    { name:'MID', value: xi.filter(x=>x.position==='MID').length },
                    { name:'FWD', value: xi.filter(x=>x.position==='FWD').length },
                  ]} outerRadius={80} label>
                    {['#63b3ed','#68d391','#f6ad55','#fc8181'].map((c,i)=>(<Cell key={i} fill={c} />))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </GridItem>
      </Grid>

      {/* 2️⃣ Recomendaciones de venta */}
      <Heading size='md' mb={3}>Recomendaciones de venta</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mb={6}>
        {sell.map((p) => (
          <Card key={p.player_id} title={`${p.player_name} — ${p.team_name}`} color='red'>
            <VStack align='start' spacing={2}>
              <Text>Score venta: <Badge colorScheme='red'>{(p.score ?? 0).toFixed(2)}</Badge></Text>
              <Text>{p.advice_text}</Text>
            </VStack>
          </Card>
        ))}
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4} mb={8}>
        <GridItem>
          <Card title='Top ventas por beneficio' color='green'>
            <Box h='260px'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={top.map(t=>({ name: t.player_name, profit: Number(t.profit||0) }))}>
                  <XAxis dataKey='name' hide />
                  <YAxis />
                  <RTooltip formatter={(v)=>`€${Number(v).toLocaleString('es-ES')}`} />
                  <Bar dataKey='profit' fill='#38a169' />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </GridItem>
        <GridItem>
          <Card title='Peores ventas (pérdida)' color='red'>
            <Box h='260px'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={worst.map(t=>({ name: t.player_name, loss: Math.abs(Number(t.profit||0)) }))}>
                  <XAxis dataKey='name' hide />
                  <YAxis />
                  <RTooltip formatter={(v)=>`€${Number(v).toLocaleString('es-ES')}`} />
                  <Bar dataKey='loss' fill='#e53e3e' />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </GridItem>
      </Grid>

      {/* 3️⃣ Recomendaciones de cláusula */}
      <Heading size='md' mb={3}>Recomendaciones de cláusula</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mb={6}>
        {clauses.map((p) => (
          <Card key={p.player_id} title={`${p.player_name} — ${p.team_name}`} color='green'>
            <VStack align='start' spacing={2}>
              <Text>Prioridad: <Badge colorScheme='green'>{(p.score ?? 0).toFixed(2)}</Badge></Text>
              <Text>{p.advice_text}</Text>
            </VStack>
          </Card>
        ))}
      </SimpleGrid>

      {/* 4️⃣ XI Recomendado */}
      <Heading size='md' mb={3}>XI recomendado</Heading>
      {xi.length === 0 ? (
        <Text mb={6} fontSize='sm' opacity={0.8}>No hay XI recomendado todavía. Asegúrate de tener datos recientes de rendimiento. Esta sección ahora incluye tus propios jugadores.</Text>
      ) : (
        <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(6, 1fr)' }} gap={3} mb={6}>
          {xi.map((p) => (
            <GridItem key={p.player_id} colSpan={1}>
              <Card title={`${p.player_name}`} color='purple'>
                <Text fontSize='sm'>{p.position || '—'} • {p.team_name}</Text>
                <Text fontSize='sm'>Score: {(p.score ?? 0).toFixed(2)}</Text>
              </Card>
            </GridItem>
          ))}
        </Grid>
      )}

      {/* 5️⃣ Oportunidades de mercado */}
      <Heading size='md' mb={3}>Oportunidades de mercado</Heading>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
        {market.map((p) => (
          <Card key={p.player_id} title={`${p.player_name} — ${p.team_name}`} color='blue'>
            <HStack justify='space-between'>
              <Text>Score: <Badge colorScheme='blue'>{(p.score ?? 0).toFixed(2)}</Badge></Text>
              <Progress value={Math.min((p.score ?? 0) * 100, 100)} w='120px' size='sm' colorScheme='blue' borderRadius='md' />
            </HStack>
            <Text mt={2}>{p.advice_text}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}
