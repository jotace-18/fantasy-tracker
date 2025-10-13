// src/pages/RecommendationsPage.jsx
import React, { memo, useState } from 'react';
import {
  Box, HStack, Text, Badge, Input, Thead, Tbody, Tr, Th, Td,
  Tooltip, IconButton, Switch, FormControl, FormLabel, Select, Progress,
  Button, Textarea, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, useDisclosure, useToast, VStack
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTableShell } from '../components/ui/DataTableShell';
import useRecommendationsData from '../hooks/useRecommendationsData';
import { InfoOutlineIcon, CopyIcon } from '@chakra-ui/icons';
import CatalystBadge from '../components/CatalystBadge';
import BubbleBadge from '../components/BubbleBadge';

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

const TrendBadge = memo(({ trend }) => {
  // Escala clara de tendencias:
  // >3%: 🚀 Brutal (verde fuerte)
  // 1-3%: 📈 Buena (amarillo/naranja)
  // 0-1%: ➡️ Neutra (gris)
  // <0%: 📉 Negativa (rojo)
  
  let color, icon, label;
  
  if (trend >= 3.0) {
    color = 'green';
    icon = '🚀';
    label = `${trend.toFixed(1)}%`;
  } else if (trend >= 1.0) {
    color = 'orange';
    icon = '📈';
    label = `${trend.toFixed(1)}%`;
  } else if (trend >= 0) {
    color = 'gray';
    icon = '➡️';
    label = `${trend.toFixed(1)}%`;
  } else {
    color = 'red';
    icon = '📉';
    label = `${trend.toFixed(1)}%`;
  }
  
  return (
    <Badge colorScheme={color} display="inline-flex" alignItems="center" gap={1}>
      <span>{icon}</span>
      <span>{label}</span>
    </Badge>
  );
});

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

const PriceCell = memo(({ source, availability, price, marketValue, suggestedBid, money }) => {
  let label = 'Mercado';
  let scheme = 'teal';
  let tooltipText = '';

  // Determinamos el estado basado en availability_status del backend
  if (source === 'clause' || availability === 'owned_clausulable') {
    label = 'Cláusula';
    scheme = 'purple';
    tooltipText = `Precio por cláusula del propietario: €${(price || 0).toLocaleString('es-ES')}`;
  } else if (availability === 'bank') {
    label = 'Banco';
    scheme = 'gray';
    tooltipText = 'Agente libre (fuera de mercado). Precio de referencia: valor de mercado';
  } else if (availability === 'market') {
    label = 'Mercado';
    scheme = 'teal';
    if (suggestedBid && marketValue) {
      const delta = suggestedBid - marketValue;
      tooltipText = `Puja Máx. Sugerida: €${suggestedBid.toLocaleString('es-ES')} (+€${delta.toLocaleString('es-ES')} sobre mercado)`;
    } else {
      tooltipText = `Valor de mercado: €${(price || 0).toLocaleString('es-ES')}`;
    }
  } else if (availability === 'owned_not_clausulable') {
    label = 'No disponible';
    scheme = 'red';
    tooltipText = 'Este jugador tiene propietario y no es clausulable. No está disponible para fichar.';
  }

  const content = (
    <>
      <Badge colorScheme={scheme} mr={2}>{label}</Badge>
      €<Euro value={price} />
    </>
  );

  if (tooltipText) {
    return (
      <Tooltip label={tooltipText}>
        <Text as='span' cursor='help'>{content}</Text>
      </Tooltip>
    );
  }
  
  return <Text as='span'>{content}</Text>;
});

const AffordabilityBar = memo(({ a, price, money }) => {
  const percentage = Math.round((a ?? 0) * 100);
  const tooltipLabel = money != null && price != null
    ? `Con tu dinero actual (€${money.toLocaleString('es-ES')}) puedes cubrir el ${percentage}% de los €${price.toLocaleString('es-ES')} que cuesta el jugador.`
    : `${percentage}% asequible`;
  
  return (
    <Tooltip label={tooltipLabel}>
      <Progress
        value={Math.min(percentage, 100)}
        size='sm'
        colorScheme={a == null ? 'gray' : a >= 0.8 ? 'green' : a >= 0.5 ? 'yellow' : 'red'}
        borderRadius='md'
        w='120px'
        cursor='help'
      />
    </Tooltip>
  );
});

/* 🆕 Componente: contexto táctico (v2.0 - Más sensible) */
const ContextBadge = memo(({ c }) => {
  if (c == null) return <Badge colorScheme='gray'>NA</Badge>;
  
  // Umbrales ajustados para el nuevo cálculo multiplicativo
  // Rango esperado: 0.60-2.00 (form × rival × home)
  // Neutro = 1.0 (todo en valores base)
  let scheme, label;
  if (c >= 1.25) {
    scheme = 'green';
    label = '🔥 Muy favorable';
  } else if (c >= 1.05) {
    scheme = 'green';
    label = '⚽ Favorable';
  } else if (c >= 0.95) {
    scheme = 'yellow';
    label = '➡️ Neutro';
  } else if (c >= 0.80) {
    scheme = 'orange';
    label = '⚠️ Difícil';
  } else {
    scheme = 'red';
    label = '❌ Muy difícil';
  }
  
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

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [exportText, setExportText] = useState('');

  const sellRecommendation = (score) => {
    if (score >= 0.6) return { label: '💸 Vender ya', color: 'red' };
    if (score >= 0.4) return { label: '⚖️ Mantener', color: 'yellow' };
    return { label: '🕓 Esperar', color: 'green' };
  };

  const generateTop10Summary = () => {
    const top10 = data.slice(0, 10);
    
    let summary = '📊 TOP 10 RECOMENDACIONES - BROKER DE MERCADO\n';
    summary += '='.repeat(80) + '\n\n';
    
    top10.forEach((player, index) => {
      // Formatear disponibilidad
      let availabilityText = 'N/A';
      if (player.availability_status === 'market') availabilityText = '🛒 Mercado';
      else if (player.availability_status === 'bank') availabilityText = '🏦 Banco';
      else if (player.availability_status === 'owned_clausulable') availabilityText = '🔓 Clausulable (Tuyo)';
      else if (player.availability_status === 'owned_not_clausulable') availabilityText = '🔒 No Clausulable (Tuyo)';
      else if (player.availability_status === 'owned_other') availabilityText = '👤 Otro manager';
      
      summary += `#${index + 1}. ${player.name || 'N/A'}\n`;
      summary += `   📈 Score: ${(player.score || 0).toFixed(2)}\n`;
      summary += `   💰 Precio a pagar: €${(player.price_to_pay || 0).toLocaleString('es-ES')}\n`;
      summary += `   📦 Disponibilidad: ${availabilityText}\n`;
      summary += `   📊 Tendencia: ${(player.trend_future || 0).toFixed(2)}%\n`;
      summary += `   💎 Infravaloración: ${((player.undervalue_factor || 0) * 100).toFixed(0)}%\n`;
      summary += `   ⚡ Momentum: ${((player.momentum || 0) * 100).toFixed(0)}%\n`;
      summary += `   👤 Titular próxima jornada: ${((player.titular_next_jor || 0) * 100).toFixed(0)}%\n`;
      summary += `   🎯 Factor contexto: ${(player.context_factor || 0).toFixed(2)}x\n`;
      summary += `   📉 Volatilidad: ${(player.volatility || 0).toFixed(2)}%\n`;
      summary += `   ⚠️ Riesgo: ${(player.risk_level_num || 0).toFixed(1)}/5\n`;
      summary += `   🏟️ Equipo: ${player.team_name || 'N/A'}\n`;
      summary += `   📅 Próximo rival: ${player.next_opponent || 'N/A'} (${player.next_location === 'home' ? '🏠 Casa' : '✈️ Fuera'})\n`;
      summary += `   💵 Oferta sugerida: €${(player.suggested_bid || 0).toLocaleString('es-ES')}\n`;
      if (player.catalyst && player.catalyst.has_catalyst) {
        const bonusPercent = Math.round((player.catalyst.bonus || 0) * 100);
        summary += `   ⚡ CATALIZADOR: ${player.catalyst.reasoning} (+${bonusPercent}%)\n`;
      }
      if (player.bubble && player.bubble.is_bubble) {
        const penaltyPercent = Math.abs(Math.round((player.bubble.penalty || 0) * 100));
        summary += `   ⚠️ BURBUJA: ${player.bubble.reasoning} (-${penaltyPercent}%)\n`;
      }
      summary += '\n';
    });
    
    summary += '='.repeat(80) + '\n';
    summary += `Generado: ${new Date().toLocaleString('es-ES')}\n`;
    summary += `Tu dinero disponible: €${(money || 0).toLocaleString('es-ES')}\n`;
    
    return summary;
  };

  const handleExport = () => {
    const summary = generateTop10Summary();
    setExportText(summary);
    onOpen();
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportText).then(() => {
      toast({
        title: '✅ Copiado al portapapeles',
        description: 'El resumen del Top 10 se ha copiado correctamente',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }).catch(() => {
      toast({
        title: '❌ Error al copiar',
        description: 'No se pudo copiar al portapapeles',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    });
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
      name: '💰 Broker de Mercado',
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
            maxW='280px'
          >
            <option value='market'>💰 Broker de Mercado</option>
            <option value='overall'>🔹 General (Próximamente)</option>
            <option value='performance'>⚽ Rendimiento (Próximamente)</option>
            <option value='sell'>📉 Broker de Ventas (Próximamente)</option>
          </Select>
        </FormControl>

        {mode === 'market' && data.length > 0 && (
          <Button
            size='sm'
            colorScheme='blue'
            leftIcon={<CopyIcon />}
            onClick={handleExport}
            isDisabled={loading}
          >
            Exportar Top 10
          </Button>
        )}

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
            ) : mode === 'market' ? (
              <>
                <Th isNumeric>
                  <Tooltip label='Precio a pagar: Cláusula (si es clausulable) o Valor de mercado (Mercado/Banco)'>
                    <Text as='span'>Valor</Text>
                  </Tooltip>
                </Th>
                <Th textAlign='center'>
                  <Tooltip label='Relación puntos/valor. ¡Alto = Ganga!'>
                    <Text as='span'>Infravaloración</Text>
                  </Tooltip>
                </Th>
                <Th textAlign='center'>
                  <Tooltip label='Tendencia futura del valor (regresión). Positiva sube, negativa baja'>
                    <Text as='span'>Tendencia</Text>
                  </Tooltip>
                </Th>
                <Th textAlign='center'>
                  <Tooltip label='Score global ponderado para el modo Mercado'>
                    <Text as='span'>Score</Text>
                  </Tooltip>
                </Th>
                <Th textAlign='center'>
                  <Tooltip label='Forma reciente (últimas jornadas). Más alto = mejor estado'>
                    <Text as='span'>Momentum</Text>
                  </Tooltip>
                </Th>
                <Th textAlign='center'>
                  <Tooltip label='Probabilidad de ser titular en la próxima jornada'>
                    <Text as='span'>Titular</Text>
                  </Tooltip>
                </Th>
                <Th textAlign='center'>
                  <Tooltip label='Factor contextual: rendimiento del equipo, rival y localía'>
                    <Text as='span'>Contexto ⚽</Text>
                  </Tooltip>
                </Th>
                <Th textAlign='center'>
                  <Tooltip label='Inestabilidad del precio. Alto = más oscilación (más riesgo)'>
                    <Text as='span'>Volatilidad</Text>
                  </Tooltip>
                </Th>
                <Th textAlign='center'>
                  <Tooltip label='Escala 1–5. Más alto = mayor riesgo (lesión/rotación)'>
                    <Text as='span'>Riesgo</Text>
                  </Tooltip>
                </Th>
              </>
            ) : (
              <>
                <Th textAlign='center'>Titular</Th>
                <Th isNumeric>Valor</Th>
                <Th textAlign='center'>Momentum</Th>
                <Th textAlign='center'>Score</Th>
                <Th textAlign='center'>Riesgo</Th>
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
                  {/* v2.0: Badges de catalizadores y burbujas */}
                  <HStack mt={1} spacing={1}>
                    <CatalystBadge catalyst={p.catalyst} />
                    <BubbleBadge bubble={p.bubble} />
                  </HStack>
                </Td>
                <Td>{p.team_name}</Td>

                {mode === 'market' ? (
                  <>
                    <Td isNumeric>
                      <PriceCell
                        source={p.value_source}
                        availability={p.availability_status}
                        price={p.price_to_pay}
                        marketValue={p.market_value_num}
                        suggestedBid={p.suggested_bid}
                        money={money}
                      />
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Infravaloración estimada: ${Math.round((p.undervalue_factor ?? 0) * 100)}% (alto = ganga)`}>
                        <Text as='span'><UndervalueBadge u={p.undervalue_factor} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Tendencia futura del valor: ${(p.trend_future ?? 0).toFixed(2)} (positiva sube, negativa baja)`}>
                        <Text as='span'><TrendBadge trend={p.trend_future} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Score (Mercado): ${(p.score ?? 0).toFixed(2)}`}>
                        <Text as='span'><ScoreBadge score={p.score} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Momentum (forma reciente): ${(p.momentum * 100).toFixed(0)}%`}>
                        <Text as='span'><MomentumBadge momentum={p.momentum} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Probabilidad de titularidad: ${Math.round(p.titular_next_jor * 100)}%`}>
                        <Text as='span'>
                          <Badge colorScheme={p.titular_next_jor >= 0.75 ? 'green' : p.titular_next_jor >= 0.5 ? 'yellow' : 'red'}>
                            {Math.round(p.titular_next_jor * 100)}%
                          </Badge>
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip
                        label={`Contexto del equipo: ${(p.context_factor ?? 1).toFixed(2)}x — ${
                          p.context_factor >= 1.25
                            ? '🔥 Muy favorable (rival débil, casa, buena forma)'
                            : p.context_factor >= 1.05
                            ? '⚽ Favorable (condiciones positivas)'
                            : p.context_factor >= 0.95
                            ? '➡️ Neutral (sin ventajas claras)'
                            : p.context_factor >= 0.80
                            ? '⚠️ Difícil (rival complicado o fuera)'
                            : '❌ Muy difícil (rival superior, fuera, mala forma)'
                        }`}
                      >
                        <Text as='span'>
                          <ContextBadge c={p.context_factor} />
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Volatilidad del precio: ${Math.round((p.volatility ?? 0) * 100)}% (más alto = más inestable)`}>
                        <Text as='span'><VolatilityBadge v={p.volatility} /></Text>
                      </Tooltip>
                    </Td>
                    <Td textAlign='center'>
                      <Tooltip label={`Riesgo (1–5): ${p.risk_level_num ?? 'NA'}`}>
                        <Text as='span'><RiskBadge value={p.risk_level_num} /></Text>
                      </Tooltip>
                    </Td>
                  </>
                ) : (
                  <>
                    <Td textAlign='center'>
                      <Badge colorScheme={p.titular_next_jor >= 0.75 ? 'green' : p.titular_next_jor >= 0.5 ? 'yellow' : 'red'}>
                        {Math.round(p.titular_next_jor * 100)}%
                      </Badge>
                    </Td>
                    <Td isNumeric>
                      <PriceCell
                        source={p.value_source}
                        availability={p.availability_status}
                        price={p.price_to_pay}
                        marketValue={p.market_value_num}
                        suggestedBid={p.suggested_bid}
                        money={money}
                      />
                    </Td>
                    <Td textAlign='center'>
                      <MomentumBadge momentum={p.momentum} />
                    </Td>
                    <Td textAlign='center'>
                      <ScoreBadge score={p.score} />
                    </Td>
                    <Td textAlign='center'>
                      <RiskBadge value={p.risk_level_num} />
                    </Td>
                  </>
                )}
              </Tr>
            );
          })}
        </Tbody>
      </DataTableShell>

      {/* Modal de Exportación */}
      <Modal isOpen={isOpen} onClose={onClose} size='xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>📊 Top 10 Recomendaciones</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={3} align='stretch'>
              <Textarea
                value={exportText}
                readOnly
                rows={20}
                fontFamily='monospace'
                fontSize='sm'
                resize='vertical'
              />
              <Button
                colorScheme='blue'
                leftIcon={<CopyIcon />}
                onClick={handleCopyToClipboard}
                w='full'
              >
                Copiar al portapapeles
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
