// MarketPage.jsx
// PLAN DE REFACTOR (fase 1 ya aplicada parcialmente):
// 1. (Hecho) Reemplazar cabecera por PageHeader + KPIs básicos.
// 2. (Pendiente) Toolbar con búsqueda + filtro tendencia + toggle vista tabla/cards.
// 3. (Pendiente) Migrar MarketTable a DataTableShell y añadir ordenación.
// 4. (Pendiente) Vista tarjetas responsive.
// 5. (Pendiente) Unificar esquema de color en TransferLog usando tokens (eliminar hex).
// 6. (Pendiente) Extraer hook useMarketData y memo derivadas.
// 7. (Pendiente) Animaciones KPI y skeleton loading.
// 8. (Pendiente) Accesibilidad & dark-mode audit completa.

import React, { useState } from "react";
import { Box, Flex, Button, Text, HStack, Badge, useDisclosure, Input, Select, SimpleGrid, Spinner, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import { PageHeader } from "../components/ui/PageHeader";
// MarketTable legacy eliminado en favor de DataTableShell inline
import MarketAdminForm from "../components/MarketAdminForm";
import AddTransferModal from "../components/AddTransferModal";
import TransferLog from "../components/TransferLog";
import useMarketData from "../hooks/useMarketData";
import { DataTableShell } from "../components/ui/DataTableShell";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter
} from "@chakra-ui/react";

export default function MarketPage(){
  const marketModal = useDisclosure(); // editar mercado
  const transferModal = useDisclosure(); // añadir traspaso
  const [saving, setSaving] = useState(false);

  const {
    players, loading,
    query, setQuery,
    trend, setTrend,
    sort, toggleSort,
    cardView, toggleView,
    metrics, filteredPlayers,
    refreshKey, refresh
  } = useMarketData();

  const handleConfirm = async ()=> {
    setSaving(true);
    await refresh(); // refresca mercado y log
    setSaving(false);
    marketModal.onClose();
  };

  const CardGrid = ({ data }) => (
    <SimpleGrid columns={{ base: 2, sm: 2, md: 3, lg: 4 }} spacing={4} mt={2}>
      {data.map(p=> {
        const delta = p.market_delta || 0;
        return (
          <Box key={p.player_id} p={4} bg='white' _dark={{ bg:'gray.700', borderColor:'gray.600' }} borderRadius='md' boxShadow='sm' border='1px solid' borderColor='gray.200'>
            <Text fontWeight='semibold' fontSize='sm' noOfLines={1}>{p.name}</Text>
            <Text fontSize='xs' color='gray.500' _dark={{ color:'gray.400' }} noOfLines={1}>{p.team_name}</Text>
            <HStack justify='space-between' mt={2} fontSize='xs'>
              <Badge colorScheme={delta>0? 'green': delta<0? 'red':'gray'}>{delta>0? '+'+delta: delta}</Badge>
              <Text fontWeight='bold'>€{(p.market_value_num||0).toLocaleString('es-ES')}</Text>
            </HStack>
          </Box>
        );
      })}
    </SimpleGrid>
  );

  return (
    <Box p={6} maxW='1400px' mx='auto'>
      <PageHeader
        title='Mercado'
        subtitle='Listado diario de jugadores disponibles'
        icon={<span>🛒</span>}
        meta={metrics ? [
          `${metrics.count} jugadores`,
          `Media valor €${metrics.avgValue.toLocaleString('es-ES')}`
        ] : ['—']}
        actions={[
          <Button key='upd' size='sm' colorScheme='teal' onClick={marketModal.onOpen}>🔄 Actualizar</Button>,
          <Button key='add' size='sm' colorScheme='blue' onClick={transferModal.onOpen}>➕ Traspaso</Button>
        ]}
      />

      {/* KPI extra bar */}
      {metrics && (
        <HStack spacing={4} mt={4} mb={4} wrap='wrap'>
          <Box px={4} py={2} bg='gray.50' _dark={{ bg:'gray.700' }} borderRadius='md' boxShadow='sm'>
            <Text fontSize='xs' textTransform='uppercase' letterSpacing='.7px' color='gray.500' _dark={{ color:'gray.400' }} fontWeight='semibold'>Suben</Text>
            <Text fontWeight='bold'>{metrics.rising}</Text>
          </Box>
          <Box px={4} py={2} bg='gray.50' _dark={{ bg:'gray.700' }} borderRadius='md' boxShadow='sm'>
            <Text fontSize='xs' textTransform='uppercase' letterSpacing='.7px' color='gray.500' _dark={{ color:'gray.400' }} fontWeight='semibold'>Bajan</Text>
            <Text fontWeight='bold'>{metrics.falling}</Text>
          </Box>
          <Box px={4} py={2} bg='gray.50' _dark={{ bg:'gray.700' }} borderRadius='md' boxShadow='sm'>
            <Text fontSize='xs' textTransform='uppercase' letterSpacing='.7px' color='gray.500' _dark={{ color:'gray.400' }} fontWeight='semibold'>Estables</Text>
            <Text fontWeight='bold'>{metrics.stable}</Text>
          </Box>
          <Box px={4} py={2} bg='gray.50' _dark={{ bg:'gray.700' }} borderRadius='md' boxShadow='sm'>
            <Text fontSize='xs' textTransform='uppercase' letterSpacing='.7px' color='gray.500' _dark={{ color:'gray.400' }} fontWeight='semibold'>Δ medio</Text>
            <Text fontWeight='bold'>{metrics.avgDelta > 0? '+'+Math.round(metrics.avgDelta): Math.round(metrics.avgDelta)}</Text>
          </Box>
        </HStack>
      )}

      {/* Toolbar */}
      <Flex gap={3} align='center' mb={4} flexWrap='wrap'>
        <Input value={query} onChange={e=> setQuery(e.target.value)} placeholder='Buscar jugador o equipo...' maxW='260px' size='sm' bg='white' _dark={{ bg:'gray.700' }} />
        <Select value={trend} onChange={e=> setTrend(e.target.value)} size='sm' maxW='150px' bg='white' _dark={{ bg:'gray.700' }}>
          <option value='all'>Tendencia: Todas</option>
          <option value='up'>Suben</option>
          <option value='down'>Bajan</option>
          <option value='flat'>Estables</option>
        </Select>
        <Button size='sm' variant='outline' onClick={toggleView} leftIcon={cardView? null: undefined}>{cardView? 'Tabla' : 'Cards'}</Button>
        <Text fontSize='xs' color='gray.500' _dark={{ color:'gray.400' }} ml='auto'>Mostrando {filteredPlayers.length} / {players.length}</Text>
      </Flex>

      <Flex direction={{ base:'column', md:'row' }} align='flex-start' gap={6}>
        <Box flex={2.8} minW={0}>
          {cardView ? <CardGrid data={filteredPlayers} /> : (
            <DataTableShell maxH='70vh' stickyHeader hoverHighlight>
              <Thead>
                <Tr>
                  <Th onClick={()=> toggleSort('name')} cursor='pointer'>
                    Nombre {sort.field==='name' ? (sort.dir==='asc'?'▲':'▼'):''}
                  </Th>
                  <Th onClick={()=> toggleSort('team_name')} cursor='pointer'>
                    Equipo {sort.field==='team_name' ? (sort.dir==='asc'?'▲':'▼'):''}
                  </Th>
                  <Th isNumeric onClick={()=> toggleSort('total_points')} cursor='pointer' w='110px'>
                    Pts {sort.field==='total_points' ? (sort.dir==='asc'?'▲':'▼'):''}
                  </Th>
                  <Th isNumeric onClick={()=> toggleSort('market_value_num')} cursor='pointer' w='150px'>
                    Valor {sort.field==='market_value_num' ? (sort.dir==='asc'?'▲':'▼'):''}
                  </Th>
                  <Th textAlign='center' onClick={()=> toggleSort('market_delta')} cursor='pointer' w='90px'>
                    Δ {sort.field==='market_delta' ? (sort.dir==='asc'?'▲':'▼'):''}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading && (
                  <Tr>
                    <Td colSpan={5} py={16} textAlign='center'>
                      <Spinner size='lg' />
                    </Td>
                  </Tr>
                )}
                {!loading && filteredPlayers.map(p=> {
                  const delta = p.market_delta || 0;
                  return (
                    <Tr key={p.player_id}>
                      <Td>
                        <a href={p.player_id ? `/players/${p.player_id}`:'#'} style={{ color:'var(--chakra-colors-teal-600)', fontWeight:500 }}>
                          {p.name || '-'}
                        </a>
                      </Td>
                      <Td>
                        <a href={p.team_id ? `/teams/${p.team_id}`:'#'} style={{ color:'var(--chakra-colors-teal-600)', fontWeight:500 }}>
                          {p.team_name || '-'}
                        </a>
                      </Td>
                      <Td isNumeric fontVariantNumeric='tabular-nums'>{p.total_points ?? '-'}</Td>
                      <Td isNumeric fontVariantNumeric='tabular-nums'>{typeof p.market_value_num==='number'? p.market_value_num.toLocaleString('es-ES')+' €':'-'}</Td>
                      <Td textAlign='center'>
                        <Badge colorScheme={delta>0? 'green': delta<0? 'red':'gray'}>{delta>0? '+'+delta: delta}</Badge>
                      </Td>
                    </Tr>
                  );
                })}
                {!loading && filteredPlayers.length===0 && (
                  <Tr>
                    <Td colSpan={5} py={12} textAlign='center' color='gray.500'>Sin jugadores</Td>
                  </Tr>
                )}
              </Tbody>
            </DataTableShell>
          )}
        </Box>
        <TransferLog refreshKey={refreshKey} />
      </Flex>

      {/* Modal actualizar mercado */}
      <Modal isOpen={marketModal.isOpen} onClose={marketModal.onClose} size='4xl'>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar mercado diario</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <MarketAdminForm />
          </ModalBody>
          <ModalFooter>
            <Button variant='ghost' mr={3} onClick={marketModal.onClose}>Cancelar</Button>
            <Button colorScheme='teal' onClick={handleConfirm} isLoading={saving} loadingText='Actualizando...'>Confirmar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal añadir traspaso */}
      <AddTransferModal
        isOpen={transferModal.isOpen}
        onClose={transferModal.onClose}
        onTransferAdded={()=> { refresh(); }}
      />
    </Box>
  );
}
