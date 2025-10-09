import {
    Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Badge, Text, HStack, VStack,
    Grid, GridItem, Divider, Tag, Tooltip, Link, Input, Select, Button, Switch, Spacer,
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import usePortfolioInsights from '../hooks/usePortfolioInsights';
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ReferenceLine, Area } from 'recharts';

// =============================================================================================
// COMPONENTE 1: El "Vendómetro"
// =============================================================================================
function Vendometer({ level, status, color }) {
    const colors = {
        cyan: 'cyan.400', blue: 'blue.400', green: 'green.400',
        yellow: 'yellow.400', orange: 'orange.400', red: 'red.500',
    };
    const needleColor = colors[color] || 'gray.400';
    const percentage = level === 0 ? 30 : (level - 1) * 25;

    return (
        <Box position="relative" w="150px" h="75px" overflow="hidden">
            <Box position="absolute" top="0" left="0" w="100%" h="200%" borderRadius="50%" border="25px solid" borderColor="gray.200" _dark={{ borderColor: 'gray.700' }} clip="rect(0, 150px, 75px, 0)" />
            <Box position="absolute" top="0" left="0" w="100%" h="200%" borderRadius="50%" clip="rect(0, 150px, 75px, 0)" transform={`rotate(${percentage * 1.8}deg)`} transition="transform 0.5s ease-in-out">
                <Box position="absolute" top="0" left="0" w="100%" h="100%" borderRadius="50%" border="25px solid" borderColor={needleColor} clip="rect(0, 75px, 150px, 0)" />
            </Box>
            <VStack position="absolute" bottom="0" left="50%" transform="translateX(-50%)" spacing={0}>
                <Text fontSize="sm" fontWeight="bold" color={needleColor}>{status}</Text>
            </VStack>
        </Box>
    );
}

// =============================================================================================
// COMPONENTE 2: El Gráfico de ROI
// =============================================================================================
function RoiChart({ buyPrice, marketValue, marketHistory = [] }) {
    const chartData = marketHistory;
    if (!chartData || chartData.length === 0) {
        return <Box h="80px" mt={4} display="flex" alignItems="center" justifyContent="center"><Text fontSize="sm" color="gray.500">No hay historial de mercado para este jugador.</Text></Box>;
    }
    
    const marketValues = chartData.map(d => d.value);
    const yAxisMin = Math.min(buyPrice, ...marketValues);
    const yAxisMax = Math.max(buyPrice, ...marketValues);
    const padding = (yAxisMax - yAxisMin) * 0.1;
    const domainMin = Math.floor(yAxisMin - padding);
    const domainMax = Math.ceil(yAxisMax + padding);

    const roi = buyPrice > 0 ? (marketValue - buyPrice) / buyPrice : 0;
    const getRoiColor = () => {
        if (roi > 1.0) return 'teal';
        if (roi > 0) return 'green';
        if (roi > -0.25) return 'orange';
        return 'red';
    };
    const strokeColor = getRoiColor();
    const formatDate = (tickItem) => {
        try { return new Date(tickItem).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); } 
        catch (e) { return tickItem; }
    };

    return (
        <Box h="80px" mt={4}>
            <ResponsiveContainer width="100%" height={80}>
                <LineChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                    <RTooltip contentStyle={{ background: useColorModeValue('white', 'gray.800'), border: '1px solid', borderColor: 'gray.200', borderRadius: 'md' }} formatter={(value) => `${value.toLocaleString('es-ES')}€`} labelFormatter={formatDate} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} />
                    <YAxis domain={[domainMin, domainMax]} hide />
                    <Line type="monotone" dataKey="value" name="Valor de Mercado" stroke={useColorModeValue(`var(--chakra-colors-${strokeColor}-500)`, `var(--chakra-colors-${strokeColor}-300)`)} strokeWidth={2} dot={false} />
                    <ReferenceLine y={buyPrice} label={{ value: "Compra", position: 'insideTopLeft', fill: useColorModeValue('gray.600', 'gray.300'), fontSize: 10 }} stroke="gray" strokeDasharray="3 3" strokeWidth={2} ifOverflow="visible" />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
}

// =============================================================================================
// COMPONENTE 3: La Tarjeta de Activo (Player Asset Card) - ¡CON UMBRALES CORREGIDOS!
// =============================================================================================
function PlayerAssetCard({ player }) {
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const accentColor = player.market_state_color || 'gray';

    const Kpi = ({ label, value, ...props }) => (
        <Box textAlign="center">
            <Text fontSize="xs" color="gray.500" noOfLines={1}>{label}</Text>
            <Text fontWeight="bold" {...props}>{value}</Text>
        </Box>
    );

    const TrendKpi = ({ trend }) => {
        // --- ¡UMBRALES CORREGIDOS! ---
        // Se reduce el umbral de 0.05 a 0.005 para ser 10x más sensible.
        const threshold = 0.005;
        const trendIcon = trend > threshold ? '📈' : trend < -threshold ? '📉' : '➡️';
        const trendColor = trend > threshold ? 'green.500' : trend < -threshold ? 'red.500' : 'orange.400';
        const trendText = trend > threshold ? 'Al alza' : trend < -threshold ? 'A la baja' : 'Estable';
        // --- FIN DE LA CORRECCIÓN ---

        return (
            <Box textAlign="center">
                <Text fontSize="xs" color="gray.500">Tendencia</Text>
                <Tooltip label={`Tendencia de mercado: ${trendText}`}>
                    <HStack justify="center" align="center" spacing={1}>
                        <Text fontSize="xl" color={trendColor}>{trendIcon}</Text>
                        <Text fontWeight="bold" color={trendColor} display={{ base: 'none', md: 'inline' }}>
                            {trendText}
                        </Text>
                    </HStack>
                </Tooltip>
            </Box>
        );
    };

    return (
        <Box borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor} overflow="hidden">
            <Box borderTop="4px solid" borderColor={`${accentColor}.400`} p={4}>
                <HStack justify="space-between">
                    <Box>
                        <Heading size="md">
                            <Link as={RouterLink} to={`/players/${player.player_id}`} color="blue.500">{player.player_name}</Link>
                        </Heading>
                        <Text fontSize="sm" color="gray.500">{player.team_name} ({player.position})</Text>
                    </Box>
                    <Vendometer level={player.market_state_level} status={player.market_state_status} color={player.market_state_color} />
                </HStack>
                <Accordion allowToggle>
                    <AccordionItem border="none">
                        <AccordionButton px={0} mt={2} _hover={{ bg: 'transparent' }}>
                            <Grid templateColumns="repeat(5, 1fr)" gap={{ base: 1, md: 2 }} flex="1" textAlign="center" alignItems="center">
                                <Kpi label="Compra" value={`${(player.buy_price / 1000000).toFixed(2)}M€`} />
                                <Kpi label="Valor Actual" value={`${(player.market_value_num / 1000000).toFixed(2)}M€`} />
                                <Kpi label="ROI" value={`${(player.roi * 100).toFixed(0)}%`} color={player.roi >= 0 ? 'green.500' : 'red.500'} fontSize="xl" />
                                <Kpi label="Cláusula" value={`${(player.clause_value_num / 1000000).toFixed(1)}M€`} />
                                <TrendKpi trend={player.metrics.trend_future} />
                            </Grid>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4} px={0}>
                            <RoiChart buyPrice={player.buy_price} marketValue={player.market_value_num} marketHistory={player.market_history} />
                            <VStack align="stretch" spacing={3} mt={4}>
                                <Box>
                                    <Heading size="xs" color={`${accentColor}.500`}>ESTADO DE MERCADO</Heading>
                                    <Text fontSize="sm">{player.market_state_advice}</Text>
                                    {player.days_since_buy <= 10 && player.days_since_buy >= 0 && <Tag mt={2} size="sm" colorScheme="cyan">Fichado hace {player.days_since_buy} días</Tag>}
                                </Box>
                                <Divider />
                                <Box>
                                    <Heading size="xs" color={player.clause_strategy_should_invest ? "orange.500" : "gray.500"}>
                                        ESTRATEGIA DE CLÁUSULA
                                    </Heading>
                                    <Text fontSize="sm">{player.clause_strategy_advice}</Text>
                                </Box>
                            </VStack>
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>
            </Box>
        </Box>
    );
}


// =============================================================================================
// COMPONENTE PRINCIPAL: La Página de Portfolio (PortfolioPlayersPage)
// =============================================================================================
export default function PortfolioPlayersPage() {
    const { loading, error, items, refresh } = usePortfolioInsights(8);
    const [q, setQ] = useState('');
    const [sortKey, setSortKey] = useState('VENDIBILITY_LEVEL');

    const normalizedQ = q.trim().toLowerCase();
    const sortedItems = useMemo(() => {
        let arr = [...items];
        if (normalizedQ) {
            arr = arr.filter(p =>
                (p.player_name || '').toLowerCase().includes(normalizedQ) ||
                (p.team_name || '').toLowerCase().includes(normalizedQ)
            );
        }
        arr.sort((a, b) => {
            switch (sortKey) {
                case 'ROI':
                    return (b.roi || 0) - (a.roi || 0);
                case 'VALUE':
                    return (b.market_value_num || 0) - (a.market_value_num || 0);
                case 'CLAUSE_URGENCY':
                    const urgencyA = a.clause_strategy_urgency === 'ALTA' ? 2 : a.clause_strategy_urgency === 'MEDIA' ? 1 : 0;
                    const urgencyB = b.clause_strategy_urgency === 'ALTA' ? 2 : b.clause_strategy_urgency === 'MEDIA' ? 1 : 0;
                    return urgencyB - urgencyA;
                case 'VENDIBILITY_LEVEL':
                default:
                    const levelA = a.market_state_level <= 1 ? -1 : a.market_state_level;
                    const levelB = b.market_state_level <= 1 ? -1 : b.market_state_level;
                    return levelB - levelA;
            }
        });
        return arr;
    }, [items, normalizedQ, sortKey]);

    return (
        <Box p={6} maxW={{ base: '100%', lg: '1600px' }} mx="auto">
            <PageHeader title='Gestor de Activos' subtitle='Tu dashboard estratégico para la gestión de plantilla' icon={<span>🧠</span>} />
            <Box borderWidth="1px" borderRadius="lg" p={4} mb={6} bg={useColorModeValue('gray.50', 'gray.900')}>
                <HStack spacing={4}>
                    <Input size="sm" placeholder='Buscar jugador...' value={q} onChange={e => setQ(e.target.value)} maxW='300px' />
                    <Select size="sm" value={sortKey} onChange={e => setSortKey(e.target.value)} maxW='250px' >
                        <option value='VENDIBILITY_LEVEL'>Ordenar por: Urgencia de Venta</option>
                        <option value='ROI'>Ordenar por: Mayor ROI</option>
                        <option value='VALUE'>Ordenar por: Mayor Valor</option>
                        <option value='CLAUSE_URGENCY'>Ordenar por: Urgencia de Cláusula</option>
                    </Select>
                    <Spacer />
                    <Button size="sm" onClick={refresh} isLoading={loading}>Refrescar</Button>
                </HStack>
            </Box>

            {loading && <Text>Cargando tu cartera de activos...</Text>}
            {error && <Text color="red.500">Error al cargar los datos: {error}</Text>}

            {!loading && !error && (
                <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
                    {sortedItems.map(player => (
                        <PlayerAssetCard key={player.player_id} player={player} />
                    ))}
                </SimpleGrid>
            )}
             {!loading && !error && sortedItems.length === 0 && (
                <Box textAlign="center" p={10} borderWidth="1px" borderRadius="lg">
                    <Heading size="md">No hay jugadores en tu plantilla</Heading>
                    <Text mt={2}>Ve al mercado y empieza a construir tu dinastía.</Text>
                </Box>
            )}
        </Box>
    );
}