import React from 'react';
import { Box, HStack, Text, Badge, Input, Thead, Tbody, Tr, Th, Td, Tooltip, IconButton, Switch, FormControl, FormLabel, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverHeader, PopoverBody, Select } from '@chakra-ui/react';
import { PageHeader } from '../components/ui/PageHeader';
import { DataTableShell } from '../components/ui/DataTableShell';
import useRecommendationsData from '../hooks/useRecommendationsData';
import { InfoOutlineIcon } from '@chakra-ui/icons';

const euro = (n) => (typeof n === 'number' ? n.toLocaleString('es-ES') : n ?? '-');

export default function RecommendationsPage(){
  const {
    data, loading, error,
    query, setQuery,
  // risk, setRisk,
    sort, toggleSort,
    metrics,
    riskUnder3, setRiskUnder3,
    onlyProbableXI, setOnlyProbableXI,
    mode, setMode,
  } = useRecommendationsData();

  const riskBadge = (r) => {
    if (r == null) return <Badge colorScheme='gray'>NA</Badge>;
    const scheme = r <= 1 ? 'green' : r <= 3 ? 'yellow' : 'red';
    return <Badge colorScheme={scheme}>{r}</Badge>;
  };

  const scoreColor = (s) => (typeof s === 'number' ? (s > 0.7 ? 'green' : s > 0.5 ? 'yellow' : 'red') : 'gray');

  return (
    <Box p={6} maxW='1400px' mx='auto'>
      <PageHeader
        title='Recomendaciones de jugadores'
        subtitle='Sugerencias basadas en estado de lesión y riesgo bajo (se ampliará con más señales)'
        icon={<span>🧠</span>}
        meta={metrics ? [
          `${metrics.count} jugadores`,
          `Valor medio €${euro(metrics.avgValue)}`,
          metrics.avgRisk != null ? `Riesgo medio ${metrics.avgRisk.toFixed(2)}` : 'Riesgo medio —'
        ] : ['—']}
      />
      <Box
        mt={2}
        mb={6}
        p={3}
        bg='gray.50'
        _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
        borderRadius='lg'
        border='1px solid'
        borderColor='gray.200'
        fontSize='sm'
        >
        <Text fontWeight='bold' mb={1}>🔢 Fórmula de puntuación actual:</Text>
        <Text>
            <b>Score</b> = (0.30 × Titularidad) + (0.25 × Momentum) + (0.20 × (1 - Riesgo/5)) + (0.15 × Valor normalizado) − (1.00 × Lesión)
        </Text>
        <Text mt={2} color='gray.600' _dark={{ color: 'gray.400' }}>
            Momentum = (Media últimas 3J / 10) + (Tendencia × Media/10)
        </Text>
        </Box>

      {/* Toolbar filtros */}
      <HStack spacing={4} mb={4} flexWrap='wrap' align='center'>
        <Input
            value={query}
            onChange={e=> setQuery(e.target.value)}
            placeholder='Buscar por nombre o equipo…'
            size='sm'
            bg='white'
            _dark={{ bg:'gray.700' }}
            maxW='300px'
        />

        {/* 🔹 Nuevo selector de modo */}
        <FormControl display='flex' alignItems='center' w='auto'>
            <FormLabel htmlFor='mode-select' mb='0' fontSize='sm'>Modo</FormLabel>
            <Select
            id='mode-select'
            size='sm'
            value={mode}
            onChange={e => setMode(e.target.value)}
            bg='white'
            _dark={{ bg:'gray.700' }}
            maxW='200px'
            >
            <option value='overall'>🔹 General</option>
            <option value='performance'>⚽ Rendimiento</option>
            <option value='market'>💰 Mercado</option>
            </Select>
        </FormControl>

        <FormControl display='flex' alignItems='center' w='auto'>
            <FormLabel htmlFor='risk-under3' mb='0' fontSize='sm'>Riesgo {'<'} 3</FormLabel>
            <Switch id='risk-under3' isChecked={riskUnder3} onChange={e=> setRiskUnder3(e.target.checked)} size='sm' colorScheme='teal' />
        </FormControl>

        <FormControl display='flex' alignItems='center' w='auto'>
            <FormLabel htmlFor='only-probable' mb='0' fontSize='sm'>Solo titulares probables</FormLabel>
            <Switch id='only-probable' isChecked={onlyProbableXI} onChange={e=> setOnlyProbableXI(e.target.checked)} size='sm' colorScheme='purple' />
        </FormControl>

        <Tooltip label='Filtra según el tipo de análisis: general, rendimiento o mercado'>
            <IconButton aria-label='info' size='sm' icon={<InfoOutlineIcon />} variant='ghost' />
        </Tooltip>

        <Text ml='auto' fontSize='xs' color='gray.500' _dark={{ color:'gray.400' }}>
            Mostrando {data.length} resultados
        </Text>
        </HStack>

      {/* Tabla resultados */}
      <DataTableShell maxH='70vh' stickyHeader hoverHighlight>
        <Thead>
            <Tr>
                <Th onClick={() => toggleSort('name')} cursor='pointer'>
                Jugador {sort.field === 'name' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </Th>
                <Th onClick={() => toggleSort('team_name')} cursor='pointer'>
                Equipo {sort.field === 'team_name' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </Th>
                <Th textAlign='center' onClick={() => toggleSort('titular_next_jor')} cursor='pointer' w='130px'>
                Titular {sort.field === 'titular_next_jor' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </Th>
                <Th isNumeric onClick={() => toggleSort('market_value')} cursor='pointer' w='140px'>
                Valor {sort.field === 'market_value' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </Th>
                <Th textAlign='center' onClick={() => toggleSort('momentum')} cursor='pointer' w='130px'>
                Tendencia {sort.field === 'momentum' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </Th>
                <Th textAlign='center' onClick={() => toggleSort('score')} cursor='pointer' w='110px'>    
                Score {sort.field === 'score' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </Th>
                <Th textAlign='center' onClick={() => toggleSort('risk_level')} cursor='pointer' w='100px'>
                Riesgo {sort.field === 'risk_level' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </Th>
            </Tr>
            </Thead>

        <Tbody>
            {loading && (
                <Tr>
                <Td colSpan={7} py={12} textAlign='center'>
                    Cargando…
                </Td>
                </Tr>
            )}

            {!loading && error && (
                <Tr>
                <Td colSpan={7} py={12} textAlign='center' color='red.500'>
                    Error: {error}
                </Td>
                </Tr>
            )}

            {!loading && !error && data.length === 0 && (
                <Tr>
                <Td colSpan={7} py={12} textAlign='center' color='gray.500'>
                    Sin recomendaciones
                </Td>
                </Tr>
            )}

            {!loading && !error && data.map((p) => (
                <Tr key={p.id}>
                <Td>
                    <a
                    href={p.id ? `/players/${p.id}` : '#'}
                    style={{ color: 'var(--chakra-colors-teal-600)', fontWeight: 500 }}
                    >
                    {p.name}
                    </a>
                </Td>
                <Td>
                    <a
                    href={p.team_id ? `/teams/${p.team_id}` : '#'}
                    style={{ color: 'var(--chakra-colors-teal-600)', fontWeight: 500 }}
                    >
                    {p.team_name}
                    </a>
                </Td>

                <Td textAlign='center'>
                    {typeof p.titular_next_jor === 'number' ? (
                    <Badge
                        colorScheme={
                        p.titular_next_jor >= 0.75
                            ? 'green'
                            : p.titular_next_jor >= 0.5
                            ? 'yellow'
                            : 'red'
                        }
                    >
                        {Math.round(p.titular_next_jor * 100)}%
                    </Badge>
                    ) : (
                    '-'
                    )}
                </Td>

                <Td isNumeric fontVariantNumeric='tabular-nums'>
                    €{euro(p.market_value_num)}
                </Td>
                
                <Td textAlign='center'>
                    {typeof p.momentum === 'number' ? (
                        <Badge
                        colorScheme={
                            p.momentum >= 0.7 ? 'green' : p.momentum >= 0.4 ? 'yellow' : 'red'
                        }
                        >
                        {p.momentum >= 0.7 ? '📈 Buena' : p.momentum >= 0.4 ? '➡️ Normal' : '📉 Mala'}
                        </Badge>
                    ) : (
                        '-'
                    )}
                    </Td>


                <Td textAlign='center'>
                    {typeof p.score === 'number' ? (
                    <Badge colorScheme={scoreColor(p.score)}>
                        {p.score.toFixed(2)}
                    </Badge>
                    ) : (
                    '-'
                    )}
                </Td>

                <Td textAlign='center'>{riskBadge(p.risk_level_num)}</Td>
                </Tr>
            ))}
            </Tbody>

      </DataTableShell>
    </Box>
  );
}
