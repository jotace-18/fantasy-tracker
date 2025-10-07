// src/pages/RecommendationsPage.jsx
import React, { memo } from 'react';
import {
  Box, HStack, Text, Badge, Input, Thead, Tbody, Tr, Th, Td,
  Tooltip, IconButton, Switch, FormControl, FormLabel, Select, Progress
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTableShell } from '../components/ui/DataTableShell';
import useRecommendationsData from '../hooks/useRecommendationsData';
import { InfoOutlineIcon } from '@chakra-ui/icons';

const Euro = ({ value }) => (typeof value === 'number' ? value.toLocaleString('es-ES') : value ?? '-');

const RiskBadge = memo(({ value }) => {
  if (value == null) return <Badge colorScheme='gray'>NA</Badge>;
  const scheme = value <= 1 ? 'green' : value <= 3 ? 'yellow' : 'red';
  return <Badge colorScheme={scheme}>{value}</Badge>;
});

const MomentumBadge = memo(({ momentum }) => (
  <Badge colorScheme={momentum >= 0.7 ? 'green' : momentum >= 0.4 ? 'yellow' : 'red'}>
    {momentum >= 0.7 ? '📈 Buena' : momentum >= 0.4 ? '➡️ Normal' : '📉 Mala'}
  </Badge>
));

const TrendBadge = memo(({ trend }) => (
  <Badge colorScheme={trend > 0.05 ? 'green' : trend < -0.05 ? 'red' : 'yellow'}>
    {trend > 0.05 ? '📈' : trend < -0.05 ? '📉' : '➡️'}
  </Badge>
));

const VolatilityBadge = memo(({ v }) => (
  <Badge colorScheme={v < 0.2 ? 'green' : v < 0.5 ? 'yellow' : 'red'}>
    {(v * 100).toFixed(0)}%
  </Badge>
));

const UndervalueBadge = memo(({ u }) => (
  <Badge colorScheme={u > 0.7 ? 'green' : u > 0.5 ? 'yellow' : 'red'}>
    {(u * 100).toFixed(0)}%
  </Badge>
));

const ScoreBadge = memo(({ score }) => (
  typeof score === 'number'
    ? <Badge colorScheme={score > 0.7 ? 'green' : score > 0.5 ? 'yellow' : 'red'}>{score.toFixed(2)}</Badge>
    : '-' 
));

const PriceCell = memo(({ source, availability, price, marketValue, trendFuture, volatility, undervalue, money }) => {
  let label = 'Mercado';
  let scheme = 'teal';
  if (source === 'clause') {
    label = 'Cláusula';
    scheme = 'purple';
  } else if (availability === 'bank') {
    label = 'Banco';
    scheme = 'gray';
  } else if (availability === 'market') {
    label = 'Mercado';
    scheme = 'teal';
  }
  // Sugerencia de puja máxima (umbral de rentabilidad): SIEMPRE > valor de mercado
  let maxBid = null;
  if (availability === 'market' && typeof marketValue === 'number' && marketValue > 0) {
    const oi = Math.max(0, Math.min(1,
      (Math.max(undervalue ?? 0, 0) * 0.4) +
      (Math.max(trendFuture ?? 0, 0) * 0.4) +
      ((1 - Math.max(Math.min(volatility ?? 0, 1), 0)) * 0.2)
    ));
    // Premium mínimo del 5% y hasta +35% según oportunidad
    const factor = 1.05 + oi * 0.30; // [1.05, 1.35]
    let raw = Math.floor(marketValue * factor);
    if (raw <= marketValue) raw = marketValue + 1; // garantizar > mercado
    maxBid = raw; // umbral teórico, no limitado por tu dinero
  }
  const content = (
    <>
      <Badge colorScheme={scheme} mr={2}>{label}</Badge>
      €<Euro value={price} />
    </>
  );
  if (availability === 'market' && maxBid) {
    const delta = maxBid - (marketValue || 0);
    const label = `Puja máx. sugerida (umbral de rentabilidad): €${maxBid.toLocaleString('es-ES')}  •  +€${delta.toLocaleString('es-ES')} sobre mercado`;
    return (
      <Tooltip label={label}>
        <Text as='span'>{content}</Text>
      </Tooltip>
    );
  }
  if (source === 'clause') {
    return (
      <Tooltip label='Precio por cláusula del propietario'>
        <Text as='span'>{content}</Text>
      </Tooltip>
    );
  }
  if (availability === 'bank') {
    return (
      <Tooltip label='Agente libre (fuera de mercado). Precio de referencia: valor de mercado'>
        <Text as='span'>{content}</Text>
      </Tooltip>
    );
  }
  return content;
});

const AffordabilityBar = memo(({ a }) => (
  <Progress
    value={Math.min((a ?? 0) * 100, 100)}
    size='sm'
    colorScheme={a == null ? 'gray' : a >= 0.8 ? 'green' : a >= 0.5 ? 'yellow' : 'red'}
    borderRadius='md'
    w='120px'
    title={`${Math.round((a ?? 0) * 100)}% asequible`}
  />
));

/* 🆕 Nuevo componente: contexto táctico */
const ContextBadge = memo(({ c }) => {
  if (c == null) return <Badge colorScheme='gray'>NA</Badge>;
  const scheme = c >= 1.05 ? 'green' : c >= 0.95 ? 'yellow' : 'red';
  const label =
    c >= 1.05 ? '⚽ Partido favorable' :
    c >= 0.95 ? '➡️ Neutro' :
    '❌ Desfavorable';
  return <Badge colorScheme={scheme}>{label}</Badge>;
});

// ------------------------------- Main Component -------------------------------
export default function RecommendationsPage() {
  const {
    data, loading, error,
    query, setQuery,
    riskUnder3, setRiskUnder3,
    onlyProbableXI, setOnlyProbableXI,
    mode, setMode,
    money
  } = useRecommendationsData();

  const sellRecommendation = (score) => {
    if (score >= 0.6) return { label: '💸 Vender ya', color: 'red' };
    if (score >= 0.4) return { label: '⚖️ Mantener', color: 'yellow' };
    return { label: '🕓 Esperar', color: 'green' };
  };

  const formulaText = {
    overall: {
      name: '🔹 General',
      desc: 'Equilibrio entre riesgo, rendimiento y valor.',
    },
    performance: {
      name: '⚽ Rendimiento',
      desc: 'Priorizan jugadores con buenos puntos y tendencia.',
    },
    market: {
      name: '💰 Mercado',
      desc: 'Optimiza según valor, tendencia y contexto del equipo.',
    },
    sell: {
      name: '📉 Broker de Ventas',
      desc: 'Detecta cuándo vender según tendencia, riesgo y revalorización.',
    },
  }[mode];

  return (
    <Box p={6} maxW='1400px' mx='auto'>
      <PageHeader
        title={formulaText.name}
        subtitle={formulaText.desc}
        icon={<span>{mode === 'sell' ? '📉' : '🧠'}</span>}
      />

      {/* 💰 Dinero actual */}
      {money != null && (
        <Box mb={4} p={3} bg='yellow.50' _dark={{ bg: 'yellow.900' }} borderRadius='lg' border='1px solid' borderColor='yellow.200'>
          💰{' '}
          <Text as='span'>
            Tu dinero actual:{' '}
            <Text as='span' color='teal.600'>
              €{money.toLocaleString('es-ES')}
            </Text>
          </Text>
        </Box>
      )}

      {/* Toolbar */}
      <HStack spacing={4} mb={4} flexWrap='wrap' align='center'>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Buscar por nombre o equipo…'
          size='sm'
          bg='white'
          _dark={{ bg: 'gray.700' }}
          maxW='300px'
        />

        <FormControl display='flex' alignItems='center' w='auto'>
          <FormLabel mb='0' fontSize='sm'>
            Modo
          </FormLabel>
          <Select
            size='sm'
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            bg='white'
            _dark={{ bg: 'gray.700' }}
            maxW='240px'
          >
            <option value='overall'>🔹 General</option>
            <option value='performance'>⚽ Rendimiento</option>
            <option value='market'>💰 Mercado</option>
            <option value='sell'>📉 Broker de Ventas</option>
          </Select>
        </FormControl>

        {mode !== 'sell' && (
          <>
            <FormControl display='flex' alignItems='center' w='auto'>
              <FormLabel mb='0' fontSize='sm'>
                Riesgo {'<'} 3
              </FormLabel>
              <Switch
                isChecked={riskUnder3}
                onChange={(e) => setRiskUnder3(e.target.checked)}
                size='sm'
                colorScheme='teal'
              />
            </FormControl>

            <FormControl display='flex' alignItems='center' w='auto'>
              <FormLabel mb='0' fontSize='sm'>
                Solo titulares
              </FormLabel>
              <Switch
                isChecked={onlyProbableXI}
                onChange={(e) => setOnlyProbableXI(e.target.checked)}
                size='sm'
                colorScheme='purple'
              />
            </FormControl>
          </>
        )}
      </HStack>

      {/* Tabla */}
      <DataTableShell maxH='70vh' stickyHeader hoverHighlight>
        <Thead>
          <Tr>
            <Th>
              {mode === 'market' ? (
                <Tooltip label='Nombre del jugador (clic para ver ficha)'>
                  <Text as='span'>Jugador</Text>
                </Tooltip>
              ) : 'Jugador'}
            </Th>
            <Th>
              {mode === 'market' ? (
                <Tooltip label='Equipo actual del jugador'>
                  <Text as='span'>Equipo</Text>
                </Tooltip>
              ) : 'Equipo'}
            </Th>
            {mode === 'sell' ? (
              <>
                <Th textAlign='center'>Momentum</Th>
                <Th textAlign='center'>Tendencia</Th>
                <Th textAlign='center'>Volatilidad</Th>
                <Th textAlign='center'>Δ Valor</Th>
                <Th textAlign='center'>Riesgo</Th>
                <Th textAlign='center'>Recomendación</Th>
              </>
            ) : (
              <>
                <Th textAlign='center'>
                  {mode === 'market' ? (
                    <Tooltip label='Probabilidad de ser titular en la próxima jornada'>
                      <Text as='span'>Titular</Text>
                    </Tooltip>
                  ) : 'Titular'}
                </Th>
                <Th isNumeric>
                  {mode === 'market' ? (
                    <Tooltip label='Precio a pagar: Cláusula (si es clausulable) o Valor de mercado (Mercado/Banco)'>
                      <Text as='span'>Valor</Text>
                    </Tooltip>
                  ) : 'Valor'}
                </Th>
                <Th textAlign='center'>
                  {mode === 'market' ? (
                    <Tooltip label='Forma reciente (últimas jornadas). Más alto = mejor estado'>
                      <Text as='span'>Momentum</Text>
                    </Tooltip>
                  ) : 'Momentum'}
                </Th>
                {mode === 'market' && (
                  <>
                    <Th textAlign='center'>
                      <Tooltip label='Qué porcentaje del precio puedes cubrir con tu dinero actual'>
                        <Text as='span'>Asequibilidad</Text>
                      </Tooltip>
                    </Th>
                    <Th textAlign='center'>
                      <Tooltip label='Tendencia futura del valor (regresión). Positiva sube, negativa baja'>
                        <Text as='span'>Tendencia</Text>
                      </Tooltip>
                    </Th>
                    <Th textAlign='center'>
                      <Tooltip label='Inestabilidad del precio. Alto = más oscilación (más riesgo)'>
                        <Text as='span'>Volatilidad</Text>
                      </Tooltip>
                    </Th>
                    <Th textAlign='center'>
                      <Tooltip label='Relación puntos/valor. Alto = ganga (infravalorado)'>
                        <Text as='span'>Infravaloración</Text>
                      </Tooltip>
                    </Th>
                    {/* 🆕 Nueva columna de contexto */}
                    <Th textAlign='center'>
                      <Tooltip label='Factor contextual: rendimiento del equipo, rival y localía'>
                        <Text as='span'>Contexto ⚽</Text>
                      </Tooltip>
                    </Th>
                  </>
                )}
                <Th textAlign='center'>
                  {mode === 'market' ? (
                    <Tooltip label='Score global ponderado para el modo Mercado'>
                      <Text as='span'>Score</Text>
                    </Tooltip>
                  ) : 'Score'}
                </Th>
                <Th textAlign='center'>
                  {mode === 'market' ? (
                    <Tooltip label='Escala 1–5. Más alto = mayor riesgo (lesión/rotación)'>
                      <Text as='span'>Riesgo</Text>
                    </Tooltip>
                  ) : 'Riesgo'}
                </Th>
              </>
            )}
          </Tr>
        </Thead>

        <Tbody>
          {loading && <Tr><Td colSpan={10} py={12} textAlign='center'>Cargando…</Td></Tr>}
          {!loading && error && <Tr><Td colSpan={10} py={12} textAlign='center' color='red.500'>Error: {error}</Td></Tr>}
          {!loading && !error && data.length === 0 && (
            <Tr><Td colSpan={10} py={12} textAlign='center' color='gray.500'>Sin resultados</Td></Tr>
          )}

          {!loading && !error && data.map(p => {
            if (mode === 'sell') {
              const reco = sellRecommendation(p.score);
              return (
                <Tr key={p.id}>
                  <Td fontWeight='semibold' color='teal.600'>{p.name}</Td>
                  <Td>{p.team_name}</Td>
                  <Td textAlign='center'>
                    <MomentumBadge momentum={p.momentum} />
                  </Td>
                  <Td textAlign='center'><TrendBadge trend={p.trend_future} /></Td>
                  <Td textAlign='center'><VolatilityBadge v={p.volatility} /></Td>
                  <Td textAlign='center'>
                    <Badge colorScheme={p.market_delta?.includes('+') ? 'green' : 'red'}>
                      {p.market_delta || '—'}
                    </Badge>
                  </Td>
                  <Td textAlign='center'><RiskBadge value={p.risk_level_num} /></Td>
                  <Td textAlign='center'><Badge colorScheme={reco.color}>{reco.label}</Badge></Td>
                </Tr>
              );
            }

            const highlight = p.score >= 0.7;
            return (
              <Tr key={p.id}
                bg={highlight ? 'green.50' : undefined}
                _dark={{ bg: highlight ? 'green.900' : undefined }}
                borderLeft={highlight ? '4px solid' : undefined}
                borderLeftColor={highlight ? 'green.400' : undefined}
              >
                <Td fontWeight='semibold' color='teal.600'>
                  <Link to={`/players/${p.id}`}>{p.name}</Link>
                </Td>
                <Td>{p.team_name}</Td>
                <Td textAlign='center'>
                  {mode === 'market' ? (
                    <Tooltip label={`Probabilidad de titularidad: ${Math.round(p.titular_next_jor * 100)}%`}>
                      <Text as='span'>
                        <Badge colorScheme={p.titular_next_jor >= 0.75 ? 'green' : p.titular_next_jor >= 0.5 ? 'yellow' : 'red'}>
                          {Math.round(p.titular_next_jor * 100)}%
                        </Badge>
                      </Text>
                    </Tooltip>
                  ) : (
                    <Badge colorScheme={p.titular_next_jor >= 0.75 ? 'green' : p.titular_next_jor >= 0.5 ? 'yellow' : 'red'}>
                      {Math.round(p.titular_next_jor * 100)}%
                    </Badge>
                  )}
                </Td>
                <Td isNumeric>
                  <PriceCell
                    source={p.value_source}
                    availability={p.availability_status}
                    price={p.price_to_pay}
                    marketValue={p.market_value_num}
                    trendFuture={p.trend_future}
                    volatility={p.volatility}
                    undervalue={p.undervalue_factor}
                    money={money}
                  />
                </Td>
                <Td textAlign='center'>
                  {mode === 'market' ? (
                    <Tooltip label={`Momentum (forma reciente): ${(p.momentum * 100).toFixed(0)}%`}>
                      <Text as='span'><MomentumBadge momentum={p.momentum} /></Text>
                    </Tooltip>
                  ) : <MomentumBadge momentum={p.momentum} />}
                </Td>

                {mode === 'market' && (
                  <>
                    <Td textAlign='center'>
                      <Tooltip label={`Asequibilidad: ${Math.round((p.affordability ?? 0) * 100)}% con tu dinero`}>
                        <Text as='span'><AffordabilityBar a={p.affordability} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Tendencia futura del valor: ${(p.trend_future ?? 0).toFixed(2)} (positiva sube, negativa baja)`}>
                        <Text as='span'><TrendBadge trend={p.trend_future} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Volatilidad del precio: ${Math.round((p.volatility ?? 0) * 100)}% (más alto = más inestable)`}>
                        <Text as='span'><VolatilityBadge v={p.volatility} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Infravaloración estimada: ${Math.round((p.undervalue_factor ?? 0) * 100)}% (alto = ganga)`}>
                        <Text as='span'><UndervalueBadge u={p.undervalue_factor} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip
                        label={`Contexto del equipo: ${(p.context_factor ?? 1).toFixed(2)}x — ${
                          p.context_factor >= 1.05
                            ? 'Partido favorable (local, buena forma)'
                            : p.context_factor <= 0.95
                            ? 'Partido difícil (fuera, rival duro)'
                            : 'Neutral'
                        }`}
                      >
                        <Text as='span'>
                          <ContextBadge c={p.context_factor} />
                        </Text>
                      </Tooltip>
                    </Td>
                  </>
                )}

                <Td textAlign='center'>
                  {mode === 'market' ? (
                    <Tooltip label={`Score (Mercado): ${(p.score ?? 0).toFixed(2)}`}>
                      <Text as='span'><ScoreBadge score={p.score} /></Text>
                    </Tooltip>
                  ) : <ScoreBadge score={p.score} />}
                </Td>
                <Td textAlign='center'>
                  {mode === 'market' ? (
                    <Tooltip label={`Riesgo (1–5): ${p.risk_level_num ?? 'NA'}`}>
                      <Text as='span'><RiskBadge value={p.risk_level_num} /></Text>
                    </Tooltip>
                  ) : <RiskBadge value={p.risk_level_num} />}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </DataTableShell>
    </Box>
  );
}
