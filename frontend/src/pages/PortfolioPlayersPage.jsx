import {
    Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, Badge, Text, HStack, VStack,
    Grid, GridItem, Divider, Tag, Tooltip, Link, Input, Select, Button, Switch, Spacer,
    Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, useColorModeValue,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter,
    Textarea, useDisclosure, useToast, IconButton
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import usePortfolioInsights from '../hooks/usePortfolioInsights';
import { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ReferenceLine, Area } from 'recharts';
import ExitTimingBadge from '../components/ExitTimingBadge';
import LiquidityBadge from '../components/LiquidityBadge';

// =============================================================================================
// COMPONENTE 1: El "Vendómetro" - Solo texto, sin semicírculo
// =============================================================================================
function Vendometer({ level, status, color, size = 'normal' }) {
    const colors = {
        cyan: 'cyan.400', blue: 'blue.400', teal: 'teal.400', green: 'green.400',
        yellow: 'yellow.400', orange: 'orange.400', red: 'red.500',
    };
    const textColor = colors[color] || 'gray.400';
    
    const tooltipText = `Nivel de vendibilidad: ${level} - ${status}`;

    return (
        <Tooltip label={tooltipText} fontSize="xs">
            <Box textAlign="right">
                <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color={textColor}>
                    {status === "Venta Urgente" ? "🗑️ " : ""}{status}
                </Text>
            </Box>
        </Tooltip>
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
    const isInXI = player.xi_recommendation?.should_be_in_xi;

    const Kpi = ({ label, value, tooltip, ...props }) => {
        const content = (
            <Box textAlign="center">
                <Text fontSize={{ base: '2xs', md: 'xs' }} color="gray.500" noOfLines={1}>{label}</Text>
                <Text fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }} {...props}>{value}</Text>
            </Box>
        );
        
        return tooltip ? (
            <Tooltip label={tooltip} fontSize="xs">
                {content}
            </Tooltip>
        ) : content;
    };

    const TrendKpi = ({ trend, marketHistory = [], currentValue = 0 }) => {
        // --- CALCULAR TENDENCIA DESDE HISTORIAL REAL ---
        let trendValue = 0;
        
        // Calcular tendencia basada en el historial de mercado real
        if (marketHistory && marketHistory.length > 1 && currentValue > 0) {
            const sortedHistory = [...marketHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
            const previousValue = sortedHistory.length > 1 ? sortedHistory[1].value : currentValue;
            
            // Calcular cambio porcentual desde el último valor
            const change = currentValue - previousValue;
            trendValue = previousValue > 0 ? change / previousValue : 0;
        }
        
        // Si no hay historial suficiente, usar el valor del backend
        if (trendValue === 0 && trend) {
            trendValue = Number(trend) || 0;
        }
        
        // Cualquier valor positivo = al alza, negativo = a la baja, exactamente 0 = estable
        const trendIcon = trendValue > 0 ? '📈' : trendValue < 0 ? '📉' : '➡️';
        const trendColor = trendValue > 0 ? 'green.500' : trendValue < 0 ? 'red.500' : 'orange.400';
        const trendText = trendValue > 0 ? 'Al alza' : trendValue < 0 ? 'A la baja' : 'Estable';
        // --- FIN DE LA CORRECCIÓN ---

        // Calcular cambios de valor basados en FECHAS REALES
        const formatChange = (diff) => {
            if (diff === 0) return '0€';
            const absValue = Math.abs(diff);
            const rounded = absValue >= 1000000 ? Math.round(absValue / 1000000) + 'M' : Math.round(absValue / 1000) + 'K';
            const sign = diff > 0 ? '+' : '-';
            return `${sign}${rounded}€`;
        };

        // Función para encontrar el valor más cercano a N días atrás
        const findValueNDaysAgo = (days) => {
            if (!marketHistory || marketHistory.length === 0) return null;
            
            const now = new Date();
            const targetDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            
            // Buscar el registro más cercano a la fecha objetivo
            let closest = null;
            let minDiff = Infinity;
            
            for (const record of marketHistory) {
                const recordDate = new Date(record.date);
                const diff = Math.abs(recordDate.getTime() - targetDate.getTime());
                
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = record.value;
                }
            }
            
            return closest;
        };

        let tooltipLabel = `Tendencia de mercado: ${trendText}`;
        
        if (marketHistory && marketHistory.length > 1 && currentValue > 0) {
            // Ordenar por fecha descendente
            const sortedHistory = [...marketHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // El valor más reciente debe ser el actual, el siguiente es el de "1 día antes"
            const value1d = sortedHistory.length > 1 ? sortedHistory[1].value : null;
            const value3d = findValueNDaysAgo(3);
            const value7d = findValueNDaysAgo(7);
            
            const change1d = value1d !== null ? currentValue - value1d : 0;
            const change3d = value3d !== null ? currentValue - value3d : 0;
            const change7d = value7d !== null ? currentValue - value7d : 0;
            
            tooltipLabel = `${trendText}\nÚlt. cambio: ${formatChange(change1d)} | 3D: ${formatChange(change3d)} | 7D: ${formatChange(change7d)}`;
        }

        return (
            <Box textAlign="center">
                <Text fontSize="xs" color="gray.500">Tendencia</Text>
                <Tooltip label={tooltipLabel} whiteSpace="pre-line">
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

    // Componente para el modal de exportación
    const ExportModal = ({ player }) => {
        const { isOpen, onOpen, onClose } = useDisclosure();
        const toast = useToast();

        const generateExportText = () => {
            const roi = player.roi || 0;
            const roiPct = (roi * 100).toFixed(1);
            const marketValue = (player.market_value_num / 1000000).toFixed(2);
            const buyPrice = (player.buy_price / 1000000).toFixed(2);
            const clauseValue = player.clause_value_num ? (player.clause_value_num / 1000000).toFixed(2) : 'N/A';
            const trend = player.metrics?.trend_future ? (player.metrics.trend_future * 100).toFixed(2) : '0.00';

            let text = `═══════════════════════════════════════
📊 INFORME DE JUGADOR - FANTASY TRACKER
═══════════════════════════════════════

👤 INFORMACIÓN BÁSICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nombre: ${player.player_name}
Equipo: ${player.team_name}
Posición: ${player.position}
${player.days_since_buy >= 0 ? `Días desde compra: ${player.days_since_buy}\n` : ''}
💰 ANÁLISIS FINANCIERO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Precio de compra: ${buyPrice}M€
Valor de mercado: ${marketValue}M€
Cláusula: ${clauseValue}M€
ROI: ${roiPct}% ${roi > 0 ? '✅' : roi < 0 ? '⚠️' : '➖'}
Tendencia: ${trend}% ${player.metrics?.trend_future > 0.005 ? '📈' : player.metrics?.trend_future < -0.005 ? '📉' : '➡️'}

📈 ESTADO DE MERCADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nivel: ${player.market_state_level} - ${player.market_state_status}
Consejo: ${player.market_state_advice}
`;

            if (player.exit_timing) {
                text += `
⏱️ TIMING DE VENTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Urgencia: ${player.exit_timing.urgency}
Ventana: ${player.exit_timing.window}
Acción: ${player.exit_timing.action}
Razonamiento: ${player.exit_timing.reasoning}
`;
            }

            if (player.liquidity && player.sell_strategy) {
                text += `
💧 LIQUIDEZ Y ESTRATEGIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nivel de liquidez: ${player.liquidity.level}
Score: ${(player.liquidity.score * 100).toFixed(0)}%
Razonamiento: ${player.liquidity.reasoning}
`;
                
                if (player.sell_strategy.suggested_price > 0) {
                    text += `Precio sugerido: ${(player.sell_strategy.suggested_price / 1000000).toFixed(2)}M€\n`;
                    if (player.sell_strategy.discount_pct !== 0) {
                        text += `Descuento: ${player.sell_strategy.discount_pct > 0 ? '-' : '+'}${Math.abs(player.sell_strategy.discount_pct)}%\n`;
                    }
                }
            }

            if (player.xi_recommendation) {
                text += `
⭐ RECOMENDACIÓN XI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
En XI: ${player.xi_recommendation.should_be_in_xi ? 'SÍ ✅' : 'NO ❌'}
Calidad: ${player.xi_recommendation.xi_quality || 'N/A'}
Razonamiento: ${player.xi_recommendation.xi_reasoning}
`;
            }

            text += `
🔧 ESTRATEGIA DE CLÁUSULA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${player.clause_strategy_advice}

═══════════════════════════════════════
Exportado: ${new Date().toLocaleString('es-ES')}
═══════════════════════════════════════`;

            return text;
        };

        const handleCopy = () => {
            const text = generateExportText();
            navigator.clipboard.writeText(text).then(() => {
                toast({
                    title: 'Copiado',
                    description: 'Información del jugador copiada al portapapeles',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            });
        };

        return (
            <>
                <IconButton
                    icon={<Text>📄</Text>}
                    size="xs"
                    variant="ghost"
                    onClick={onOpen}
                    aria-label="Exportar a TXT"
                    title="Exportar información"
                />

                <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Exportar información - {player.player_name}</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <Textarea
                                value={generateExportText()}
                                readOnly
                                fontFamily="monospace"
                                fontSize="sm"
                                rows={25}
                                resize="none"
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button colorScheme="blue" onClick={handleCopy} mr={3}>
                                📋 Copiar al portapapeles
                            </Button>
                            <Button variant="ghost" onClick={onClose}>
                                Cerrar
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </>
        );
    };

    return (
        <Box 
            borderWidth={isInXI ? "2px" : "1px"} 
            borderRadius="lg" 
            bg={bgColor} 
            borderColor={isInXI ? "green.400" : borderColor} 
            overflow="hidden"
            position="relative"
        >
            {/* Badge de XI con calidad integrada y botón de exportar */}
            <HStack 
                position="absolute" 
                top={2} 
                right={2} 
                spacing={1}
                zIndex={1}
            >
                {isInXI && (
                    <>
                        <Tooltip label={`En el XI ideal - Prioridad: ${player.xi_recommendation?.xi_priority}/11`} fontSize="xs">
                            <Badge 
                                colorScheme="green" 
                                fontSize={{ base: "2xs", sm: "xs" }}
                            >
                                ⭐ XI
                            </Badge>
                        </Tooltip>
                        {/* Badge de calidad SOLO para jugadores del XI */}
                        {player.xi_recommendation?.xi_quality_tier && (
                            <Tooltip 
                                label={
                                    player.xi_recommendation.xi_quality_tier === 'GOOD' ? 'Calidad BUENA (≥8/10)' :
                                    player.xi_recommendation.xi_quality_tier === 'ACCEPTABLE' ? 'Calidad ACEPTABLE (5-8/10)' :
                                    'Calidad DÉBIL (<5/10)'
                                } 
                                fontSize="xs"
                            >
                                <Badge 
                                    colorScheme={
                                        player.xi_recommendation.xi_quality_tier === 'GOOD' ? 'green' :
                                        player.xi_recommendation.xi_quality_tier === 'ACCEPTABLE' ? 'orange' :
                                        'red'
                                    }
                                    fontSize={{ base: "2xs", sm: "xs" }}
                                >
                                    {player.xi_recommendation.xi_quality_tier === 'GOOD' ? '✅' :
                                     player.xi_recommendation.xi_quality_tier === 'ACCEPTABLE' ? '⚠️' :
                                     '🔶'}
                                </Badge>
                            </Tooltip>
                        )}
                    </>
                )}
                <ExportModal player={player} />
            </HStack>
            <Box borderTop="4px solid" borderColor={`${accentColor}.400`} p={{ base: 3, md: 4 }}>
                <VStack spacing={3} align="stretch">
                    {/* Header con nombre y vendómetro */}
                    <HStack justify="space-between" align="start">
                        <Box flex="1" pr={{ base: isInXI ? 12 : 0, sm: isInXI ? 16 : 0 }}>
                            <Heading size={{ base: "sm", md: "md" }}>
                                <Link as={RouterLink} to={`/players/${player.player_id}`} color="blue.500">{player.player_name}</Link>
                            </Heading>
                            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500">{player.team_name} ({player.position})</Text>
                            {isInXI && (
                                <Text fontSize="xs" color="green.600" _dark={{ color: 'green.300' }} mt={1} display={{ base: 'none', sm: 'block' }}>
                                    {player.xi_recommendation.xi_reasoning}
                                </Text>
                            )}
                        </Box>
                        <Box display={{ base: 'none', sm: 'block' }} mt={3}>
                            <Vendometer level={player.market_state_level} status={player.market_state_status} color={player.market_state_color} />
                        </Box>
                    </HStack>
                    
                    {/* Vendómetro móvil */}
                    <Box display={{ base: 'flex', sm: 'none' }} justifyContent="center">
                        <Vendometer level={player.market_state_level} status={player.market_state_status} color={player.market_state_color} />
                    </Box>
                    
                    {/* Badge XI móvil */}
                    {isInXI && (
                        <Text fontSize="xs" color="green.600" _dark={{ color: 'green.300' }} display={{ base: 'block', sm: 'none' }}>
                            {player.xi_recommendation.xi_reasoning}
                        </Text>
                    )}
                    
                </VStack>
                
                {/* KPIs Grid y Accordion */}
                <Accordion allowToggle>
                    <AccordionItem border="none">
                        <AccordionButton px={0} mt={2} _hover={{ bg: 'transparent' }}>
                            <Grid templateColumns={{ base: 'repeat(3, 1fr)', sm: 'repeat(5, 1fr)' }} gap={{ base: 2, md: 2 }} flex="1" textAlign="center" alignItems="center">
                                <Kpi 
                                    label="Compra" 
                                    value={`${(player.buy_price / 1000000).toFixed(2)}M€`} 
                                    tooltip={`Precio pagado: ${(player.buy_price / 1000000).toFixed(2)}M€`}
                                    fontSize={{ base: 'xs', md: 'sm' }} 
                                />
                                <Kpi 
                                    label="Valor" 
                                    value={`${(player.market_value_num / 1000000).toFixed(2)}M€`} 
                                    tooltip={`Valor actual de mercado: ${(player.market_value_num / 1000000).toFixed(2)}M€`}
                                    fontSize={{ base: 'xs', md: 'sm' }} 
                                />
                                <Kpi 
                                    label="ROI" 
                                    value={`${(player.roi * 100).toFixed(0)}%`} 
                                    tooltip={`Retorno de inversión: ${player.roi >= 0 ? '+' : ''}${(player.roi * 100).toFixed(1)}%`}
                                    color={player.roi >= 0 ? 'green.500' : 'red.500'} 
                                    fontSize={{ base: 'md', md: 'xl' }} 
                                />
                                <GridItem display={{ base: 'none', sm: 'block' }}>
                                    {/* Cláusula con color según protección */}
                                    {(() => {
                                        const clauseValue = player.clause_value_num;
                                        const marketValue = player.market_value_num;
                                        const ratio = clauseValue / marketValue;
                                        const isRecentInvestment = player.market_state_level === 0; // Inversión reciente
                                        
                                        let color, icon, tooltipText;
                                        
                                        // REGLA 1: Si es inversión reciente, no importa tanto la cláusula
                                        if (isRecentInvestment) {
                                            color = 'gray.500'; // Neutro
                                            icon = null;
                                            tooltipText = null;
                                        }
                                        // REGLA 2: Cláusula exageradamente ALTA (> 3x)
                                        else if (ratio > 3) {
                                            color = 'red.500';
                                            icon = '🔴';
                                            tooltipText = '🔴 Cláusula exagerada - Bajar urgente';
                                        }
                                        // REGLA 3: Cláusula muy alta pero manejable (2.5x - 3x)
                                        else if (ratio > 2.5) {
                                            color = 'orange.500';
                                            icon = '📊';
                                            tooltipText = '📊 Cláusula alta - Considerar ajuste';
                                        }
                                        // REGLA 4: Cláusula IDEAL (1.5x - 2.5x) - Bien protegido
                                        else if (ratio >= 1.5) {
                                            color = 'green.500';
                                            icon = null;
                                            tooltipText = null;
                                        }
                                        // REGLA 5: Cláusula cercana pero aceptable (1.3x - 1.5x)
                                        else if (ratio >= 1.3) {
                                            color = 'orange.500';
                                            icon = '⚡';
                                            tooltipText = '⚡ Mejorar protección';
                                        }
                                        // REGLA 6: Cláusula AL NIVEL del valor (1.0x - 1.3x) - AMARILLO
                                        else if (ratio >= 1.0) {
                                            color = 'orange.500';
                                            icon = '⚠️';
                                            tooltipText = '⚠️ Cláusula al nivel del valor - Subir';
                                        }
                                        // REGLA 7: Cláusula INFERIOR al valor (< 1.0x) - ROJO crítico
                                        else {
                                            color = 'red.500';
                                            icon = '�';
                                            tooltipText = '� Cláusula inferior al valor - Crítico';
                                        }
                                        
                                        return (
                                            <Box textAlign="center">
                                                <Text fontSize={{ base: '2xs', md: 'xs' }} color="gray.500" noOfLines={1}>Cláusula</Text>
                                                <HStack spacing={1} justify="center">
                                                    <Text 
                                                        fontWeight="bold" 
                                                        fontSize={{ base: 'xs', md: 'sm' }}
                                                        color={color}
                                                    >
                                                        {`${(clauseValue / 1000000).toFixed(1)}M€`}
                                                    </Text>
                                                    {icon && (
                                                        <Tooltip label={tooltipText} fontSize="xs">
                                                            <span style={{ fontSize: '12px' }}>{icon}</span>
                                                        </Tooltip>
                                                    )}
                                                </HStack>
                                            </Box>
                                        );
                                    })()}
                                </GridItem>
                                <GridItem display={{ base: 'none', sm: 'block' }}>
                                    <TrendKpi 
                                        trend={player.metrics.trend_future} 
                                        marketHistory={player.market_history}
                                        currentValue={player.market_value_num}
                                    />
                                </GridItem>
                            </Grid>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4} px={0}>
                            <RoiChart buyPrice={player.buy_price} marketValue={player.market_value_num} marketHistory={player.market_history} />
                            <VStack align="stretch" spacing={{ base: 2, md: 3 }} mt={4}>
                                <Box>
                                    <HStack spacing={2} flexWrap="wrap" align="center">
                                        <Heading size="xs" color={`${accentColor}.500`} fontSize={{ base: 'xs', md: 'sm' }}>
                                            ESTADO DE MERCADO
                                        </Heading>
                                        <Tooltip label={`Nivel de vendibilidad: ${player.market_state_level}`} fontSize="xs">
                                            <Badge 
                                                colorScheme={accentColor} 
                                                fontSize={{ base: '2xs', md: 'xs' }}
                                                px={2}
                                                py={1}
                                            >
                                                {player.market_state_level}
                                            </Badge>
                                        </Tooltip>
                                    </HStack>
                                    <Text fontSize={{ base: 'xs', md: 'sm' }} mt={1}>{player.market_state_advice}</Text>
                                    
                                    {/* Estimación de recuperación de inversión */}
                                    {(() => {
                                        const roi = player.roi || 0;
                                        const trend = player.metrics?.trend_future || 0;
                                        const marketValue = player.market_value_num || 0;
                                        const buyPrice = player.buy_price || 0;
                                        const deficit = buyPrice - marketValue; // Cuánto falta para recuperar
                                        
                                        // Solo mostrar si hay pérdidas y tendencia positiva
                                        if (roi < 0 && trend > 0 && deficit > 0 && marketValue > 0) {
                                            // Calcular cuántos días tardaría en recuperar
                                            // trend_future es el cambio porcentual semanal
                                            const weeklyChange = marketValue * trend; // Cambio en euros por semana
                                            
                                            if (weeklyChange > 0) {
                                                const weeksToRecover = deficit / weeklyChange;
                                                const daysToRecover = Math.ceil(weeksToRecover * 7);
                                                
                                                const recoveryDate = new Date();
                                                recoveryDate.setDate(recoveryDate.getDate() + daysToRecover);
                                                
                                                let message = '';
                                                let colorScheme = 'green';
                                                
                                                if (daysToRecover <= 14) {
                                                    message = `🚀 Recuperación estimada en ${daysToRecover} días (${recoveryDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`;
                                                    colorScheme = 'green';
                                                } else if (daysToRecover <= 30) {
                                                    message = `⏳ Recuperación estimada en ${daysToRecover} días (${recoveryDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`;
                                                    colorScheme = 'cyan';
                                                } else if (daysToRecover <= 60) {
                                                    message = `⌛ Recuperación estimada en ${Math.round(daysToRecover / 7)} semanas (${recoveryDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`;
                                                    colorScheme = 'orange';
                                                } else {
                                                    message = `⏰ Recuperación lejana: ${Math.round(daysToRecover / 30)} meses`;
                                                    colorScheme = 'red';
                                                }
                                                
                                                return (
                                                    <Tag mt={2} size="sm" colorScheme={colorScheme}>
                                                        {message}
                                                    </Tag>
                                                );
                                            }
                                        }
                                        
                                        // Si ya está en beneficios y tendencia positiva
                                        if (roi > 0 && trend > 0.01) {
                                            return (
                                                <Tag mt={2} size="sm" colorScheme="green">
                                                    💰 En beneficios y creciendo (+{(trend * 100).toFixed(1)}%/semana)
                                                </Tag>
                                            );
                                        }
                                        
                                        return null;
                                    })()}
                                    
                                    {player.days_since_buy <= 10 && player.days_since_buy >= 0 && (
                                        <Tooltip label="Inversión reciente, necesita tiempo para madurar" fontSize="xs">
                                            <Tag mt={2} size="sm" colorScheme="cyan">Fichado hace {player.days_since_buy} días</Tag>
                                        </Tooltip>
                                    )}
                                </Box>
                                <Divider />
                                
                                {/* v2.0: Exit Timing */}
                                {player.exit_timing && (
                                    <>
                                        <Box>
                                            <HStack justify="space-between" mb={2} flexWrap="wrap" gap={1}>
                                                <Heading size="xs" color="purple.500" fontSize={{ base: 'xs', md: 'sm' }}>TIMING DE VENTA</Heading>
                                                <ExitTimingBadge exitTiming={player.exit_timing} />
                                            </HStack>
                                            <Text fontSize={{ base: 'xs', md: 'sm' }} mb={1}><strong>Acción:</strong> {player.exit_timing.action}</Text>
                                            <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" _dark={{ color: 'gray.400' }}>{player.exit_timing.reasoning}</Text>
                                        </Box>
                                        <Divider />
                                    </>
                                )}
                                
                                {/* v2.0: Liquidity & Sell Price */}
                                {player.liquidity && player.sell_strategy && (
                                    <>
                                        <Box>
                                            <HStack justify="space-between" mb={2} flexWrap="wrap" gap={1}>
                                                <Heading size="xs" color="blue.500" fontSize={{ base: 'xs', md: 'sm' }}>ESTRATEGIA DE VENTA</Heading>
                                                <LiquidityBadge liquidity={player.liquidity} />
                                            </HStack>
                                            {player.sell_strategy.suggested_price !== null && player.sell_strategy.suggested_price > 0 ? (
                                                <>
                                                    <HStack justify="space-between" mb={1} flexWrap="wrap">
                                                        <Text fontSize={{ base: 'xs', md: 'sm' }}><strong>Precio sugerido:</strong></Text>
                                                        <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold" color="green.500">
                                                            {(player.sell_strategy.suggested_price / 1000000).toFixed(2)}M€
                                                        </Text>
                                                    </HStack>
                                                    {player.sell_strategy.discount_pct !== 0 && (
                                                        <Text fontSize="2xs" color="gray.600" _dark={{ color: 'gray.400' }}>
                                                            ({player.sell_strategy.discount_pct > 0 ? '-' : '+'}{Math.abs(player.sell_strategy.discount_pct)}% vs mercado)
                                                        </Text>
                                                    )}
                                                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" _dark={{ color: 'gray.400' }} mt={1}>
                                                        {player.sell_strategy.reasoning}
                                                    </Text>
                                                </>
                                            ) : (
                                                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" _dark={{ color: 'gray.400' }}>
                                                    {player.sell_strategy.reasoning || 'No aplicable en este momento'}
                                                </Text>
                                            )}
                                        </Box>
                                        <Divider />
                                    </>
                                )}
                                
                                {/* Recomendación de XI */}
                                {player.xi_recommendation && (
                                    <>
                                        <Divider />
                                        <Box>
                                            <HStack justify="space-between" mb={2} flexWrap="wrap" gap={1}>
                                                <Heading size="xs" color={player.xi_recommendation.should_be_in_xi ? "green.500" : "gray.500"} fontSize={{ base: 'xs', md: 'sm' }}>
                                                    RECOMENDACIÓN XI
                                                </Heading>
                                                {player.xi_recommendation.should_be_in_xi && (
                                                    <Tooltip label="Orden de importancia en el XI ideal" fontSize="xs">
                                                        <Badge colorScheme="green" fontSize={{ base: '2xs', md: 'xs' }}>
                                                            Prioridad: {player.xi_recommendation.xi_priority}/11
                                                        </Badge>
                                                    </Tooltip>
                                                )}
                                            </HStack>
                                            <Text fontSize={{ base: 'xs', md: 'sm' }}>{player.xi_recommendation.xi_reasoning}</Text>
                                            {!player.xi_recommendation.should_be_in_xi && (
                                                <Text fontSize="2xs" color="gray.500" mt={1}>
                                                    💡 Considerar para rotaciones o según evolución de alineaciones
                                                </Text>
                                            )}
                                        </Box>
                                    </>
                                )}
                                
                                <Divider />
                                <Box>
                                    <Heading size="xs" color={player.clause_strategy_should_invest ? "orange.500" : "gray.500"} fontSize={{ base: 'xs', md: 'sm' }}>
                                        ESTRATEGIA DE CLÁUSULA
                                    </Heading>
                                    <Text fontSize={{ base: 'xs', md: 'sm' }} mt={1}>{player.clause_strategy_advice}</Text>
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
    const [sortKey, setSortKey] = useState('POSITION'); // CAMBIADO: Por defecto ordenar por posición
    const [showOnlyXI, setShowOnlyXI] = useState(false);

    const normalizedQ = q.trim().toLowerCase();
    
    // Calcular jugadores del XI recomendado y obtener metadata
    const { xiPlayers, xiMetadata } = useMemo(() => {
        const xiplayers = items.filter(p => p.xi_recommendation?.should_be_in_xi);
        const metadata = items[0]?.xi_metadata || null;
        return { xiPlayers: xiplayers, xiMetadata: metadata };
    }, [items]);
    
    const sortedItems = useMemo(() => {
        let arr = [...items];
        
        // Filtrar por búsqueda
        if (normalizedQ) {
            arr = arr.filter(p =>
                (p.player_name || '').toLowerCase().includes(normalizedQ) ||
                (p.team_name || '').toLowerCase().includes(normalizedQ)
            );
        }
        
        // Filtrar por XI si está activado
        if (showOnlyXI) {
            arr = arr.filter(p => p.xi_recommendation?.should_be_in_xi);
        }
        
        arr.sort((a, b) => {
            switch (sortKey) {
                case 'POSITION':
                    // Orden: POR -> DEF -> CEN -> DEL
                    const positionOrder = { 'Portero': 1, 'Defensa': 2, 'Centrocampista': 3, 'Delantero': 4 };
                    const posA = positionOrder[a.position] || 999;
                    const posB = positionOrder[b.position] || 999;
                    if (posA !== posB) return posA - posB;
                    // Si misma posición, ordenar por prioridad XI (mayor primero)
                    const xiPriorityA = a.xi_recommendation?.xi_priority || 0;
                    const xiPriorityB = b.xi_recommendation?.xi_priority || 0;
                    return xiPriorityB - xiPriorityA;
                case 'XI_PRIORITY':
                    const xiA = a.xi_recommendation?.xi_priority || 0;
                    const xiB = b.xi_recommendation?.xi_priority || 0;
                    return xiB - xiA;
                case 'ROI':
                    return (b.roi || 0) - (a.roi || 0);
                case 'VALUE':
                    return (b.market_value_num || 0) - (a.market_value_num || 0);
                case 'CLAUSE_URGENCY':
                    const urgencyA = a.clause_strategy_urgency === 'ALTA' ? 2 : a.clause_strategy_urgency === 'MEDIA' ? 1 : 0;
                    const urgencyB = b.clause_strategy_urgency === 'ALTA' ? 2 : b.clause_strategy_urgency === 'MEDIA' ? 1 : 0;
                    return urgencyB - urgencyA;
                case 'VENDIBILITY_LEVEL':
                    const levelA = a.market_state_level <= 1 ? -1 : a.market_state_level;
                    const levelB = b.market_state_level <= 1 ? -1 : b.market_state_level;
                    return levelB - levelA;
                default:
                    return 0;
            }
        });
        return arr;
    }, [items, normalizedQ, sortKey, showOnlyXI]);

    return (
        <Box p={{ base: 3, sm: 4, md: 6 }} maxW={{ base: '100%', lg: '1600px' }} mx="auto">
            <PageHeader title='Gestor de Activos' subtitle='Tu dashboard estratégico para la gestión de plantilla' icon={<span>🧠</span>} />
            
            {/* Nuevo: Resumen del XI Ideal con Análisis de Calidad */}
            {!loading && xiPlayers.length > 0 && xiMetadata && (
                <Box 
                    borderWidth="2px" 
                    borderRadius="lg" 
                    p={{ base: 3, md: 4 }} 
                    mb={4} 
                    bg={useColorModeValue(
                        xiMetadata.global_quality_level === 'CRITICAL' ? 'red.50' :
                        xiMetadata.global_quality_level === 'WARNING' ? 'orange.50' :
                        xiMetadata.global_quality_level === 'EXCELLENT' ? 'purple.50' : 'green.50',
                        xiMetadata.global_quality_level === 'CRITICAL' ? 'red.900' :
                        xiMetadata.global_quality_level === 'WARNING' ? 'orange.900' :
                        xiMetadata.global_quality_level === 'EXCELLENT' ? 'purple.900' : 'green.900'
                    )}
                    borderColor={
                        xiMetadata.global_quality_level === 'INCOMPLETE' ? 'red.500' :
                        xiMetadata.global_quality_level === 'CRITICAL' ? 'red.500' :
                        xiMetadata.global_quality_level === 'WARNING' ? 'orange.500' :
                        xiMetadata.global_quality_level === 'EXCELLENT' ? 'purple.500' : 'green.500'
                    }
                >
                    <VStack spacing={3} align="stretch">
                        <HStack justify="space-between" align="start" flexWrap="wrap" gap={2}>
                            <VStack align="start" spacing={1} flex="1" minW={{ base: 'full', sm: 'auto' }}>
                                <HStack flexWrap="wrap">
                                    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold">
                                        {xiMetadata.global_quality_level === 'INCOMPLETE' ? '⚠️ XI Incompleto' :
                                         xiMetadata.global_quality_level === 'EXCELLENT' ? '⭐⭐⭐ XI Élite' :
                                         xiMetadata.global_quality_level === 'GREAT' ? '⭐⭐ XI Sólido' :
                                         xiMetadata.global_quality_level === 'CRITICAL' ? '🚨 XI Crítico' :
                                         xiMetadata.global_quality_level === 'WARNING' ? '⚠️ XI Mejorable' :
                                         '⭐ XI Ideal'}
                                    </Text>
                                    <Badge 
                                        colorScheme={
                                            xiMetadata.global_quality_level === 'INCOMPLETE' ? 'red' :
                                            xiMetadata.global_quality_level === 'CRITICAL' ? 'red' :
                                            xiMetadata.global_quality_level === 'WARNING' ? 'orange' :
                                            xiMetadata.global_quality_level === 'EXCELLENT' ? 'purple' : 'green'
                                        }
                                        fontSize={{ base: 'sm', md: 'md' }}
                                    >
                                        {xiPlayers.length}/11
                                    </Badge>
                                    {xiMetadata.avg_xi_note && xiPlayers.length > 0 && (
                                        <Badge 
                                            colorScheme={
                                                xiMetadata.avg_xi_note >= 8 ? 'green' :
                                                xiMetadata.avg_xi_note >= 5 ? 'orange' : 'red'
                                            }
                                            fontSize={{ base: 'sm', md: 'md' }}
                                        >
                                            📊 Nota: {xiMetadata.avg_xi_note}/10
                                        </Badge>
                                    )}
                                </HStack>
                                <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.700" _dark={{ color: 'gray.200' }}>
                                    {xiMetadata.global_quality_message}
                                </Text>
                                {xiMetadata.quality_breakdown && (
                                    <HStack spacing={2} flexWrap="wrap" mt={1}>
                                        {xiMetadata.quality_breakdown.GOOD > 0 && (
                                            <Badge colorScheme="green" fontSize="xs">✅ {xiMetadata.quality_breakdown.GOOD} BUENOS (≥8/10)</Badge>
                                        )}
                                        {xiMetadata.quality_breakdown.ACCEPTABLE > 0 && (
                                            <Badge colorScheme="orange" fontSize="xs">⚠️ {xiMetadata.quality_breakdown.ACCEPTABLE} ACEPTABLES (5-8/10)</Badge>
                                        )}
                                        {xiMetadata.quality_breakdown.WEAK > 0 && (
                                            <Badge colorScheme="red" fontSize="xs">🔶 {xiMetadata.quality_breakdown.WEAK} DÉBILES (&lt;5/10)</Badge>
                                        )}
                                    </HStack>
                                )}
                            </VStack>
                            <Tooltip label={showOnlyXI ? 'Ver todos los jugadores' : 'Filtrar solo jugadores del XI ideal'} fontSize="xs">
                                <Button 
                                    size={{ base: 'xs', md: 'sm' }}
                                    colorScheme={showOnlyXI ? 'green' : 'gray'} 
                                    onClick={() => setShowOnlyXI(!showOnlyXI)}
                                    minW={{ base: 'full', sm: 'auto' }}
                                >
                                    {showOnlyXI ? '✓ Mostrando XI' : 'Ver solo XI'}
                                </Button>
                            </Tooltip>
                        </HStack>
                    </VStack>
                </Box>
            )}
            
            <Box borderWidth="1px" borderRadius="lg" p={{ base: 3, md: 4 }} mb={6} bg={useColorModeValue('gray.50', 'gray.900')}>
                <VStack spacing={3} align="stretch">
                    <HStack spacing={{ base: 2, md: 4 }} flexWrap="wrap">
                        <Input 
                            size={{ base: 'sm', md: 'sm' }} 
                            placeholder='Buscar...' 
                            value={q} 
                            onChange={e => setQ(e.target.value)} 
                            flex={{ base: '1 1 100%', sm: '1 1 200px' }}
                            maxW={{ base: '100%', sm: '300px' }}
                        />
                        <Select 
                            size={{ base: 'sm', md: 'sm' }} 
                            value={sortKey} 
                            onChange={e => setSortKey(e.target.value)} 
                            flex={{ base: '1 1 100%', sm: '1 1 200px' }}
                            maxW={{ base: '100%', sm: '250px' }}
                        >
                            <option value='POSITION'>Por Posición (POR→DEL)</option>
                            <option value='XI_PRIORITY'>Prioridad XI</option>
                            <option value='VENDIBILITY_LEVEL'>Urgencia Venta</option>
                            <option value='ROI'>Mayor ROI</option>
                            <option value='VALUE'>Mayor Valor</option>
                            <option value='CLAUSE_URGENCY'>Urgencia Cláusula</option>
                        </Select>
                        <Tooltip label="Actualizar datos del portfolio" fontSize="xs">
                            <Button 
                                size={{ base: 'sm', md: 'sm' }} 
                                onClick={refresh} 
                                isLoading={loading}
                                flex={{ base: '1 1 100%', sm: '0 0 auto' }}
                            >
                                Refrescar
                            </Button>
                        </Tooltip>
                    </HStack>
                </VStack>
            </Box>

            {loading && <Text>Cargando tu cartera de activos...</Text>}
            {error && <Text color="red.500">Error al cargar los datos: {error}</Text>}

            {!loading && !error && (
                <SimpleGrid columns={{ base: 1, sm: 1, md: 2, lg: 2, xl: 3 }} gap={{ base: 4, md: 6 }}>
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