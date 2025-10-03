import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Flex,
  Select,
  Text,
  VStack,
  HStack,
  Button,
  useDisclosure,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Skeleton,
  SkeletonCircle,
  useColorModeValue,
  VisuallyHidden,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  Divider,
  IconButton
} from "@chakra-ui/react";
import { motion } from 'framer-motion';
import ClauseLockModal from "../components/ClauseLockModal";
import { FORMATIONS } from "../utils/formations"; // FORMATION_MAP ya no necesario aquí
import { Link } from "react-router-dom";
import PlayerSearch from "../components/PlayerSearch";
// removed InfoOutlineIcon (no longer used in new layout)
import useCumulativeRankHistory from "../hooks/useCumulativeRankHistory";
import useMyTeamData from "../hooks/useMyTeamData";
import CumulativeRankChart from "../components/CumulativeRankChart";
import PlayerTransferLog from "../components/PlayerTransferLog";
import Pitch from "../components/myteam/Pitch";
import BenchArea from "../components/myteam/BenchArea";
import PlayerRoster from "../components/myteam/PlayerRoster";
import MoneyPanel from "../components/myteam/MoneyPanel";

export default function MyTeamPage() {
  const [, setNow] = useState(Date.now());
  // Data hook
  const {
    participantId: myParticipantId,
    formation, changeFormation, setXI, setReserve,
    players: myPlayers, orderedPlayers, positions,
    money, saveMoney, totalMarketValueXI,
    addPlayer, removePlayer, updateClause,
    loadingPlayers
  } = useMyTeamData(8);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [refreshKey] = useState(0);
  const [moneyEdit, setMoneyEdit] = useState({ open: false, value: '' });
  const [clauseEdit, setClauseEdit] = useState({ open: false, player: null });
  const [clauseForm, setClauseForm] = useState({ clause_value: '', is_clausulable: false, lock_days: 0, lock_hours: 0 });
  const [lastClauseUpdated, setLastClauseUpdated] = useState(null);
  const [announceMsg, setAnnounceMsg] = useState('');
  const prevMoney = useRef(null);
  const prevValueXI = useRef(null);
  const [flashValueXI, setFlashValueXI] = useState(false);
  const lastFocusedRef = useRef(null);

  // Modals
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isLineupOpen,
    onOpen: onLineupOpen,
    onClose: onLineupClose,
  } = useDisclosure();

  const { history: cumulativeRankHistory, loading: loadingCumulativeRank } =
    useCumulativeRankHistory(myParticipantId);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveMoney = useCallback(async () => {
    const ok = await saveMoney(moneyEdit.value);
    if (ok) {
      setMoneyEdit({ open: false, value: '' });
      setAnnounceMsg(`Dinero actualizado a ${moneyEdit.value} euros`);
    }
  }, [moneyEdit.value, saveMoney]);

  const handleAddPlayer = async (player) => { await addPlayer(player); onClose(); };
  const handleSetXI = async (player) => { await setXI(player, selectedSlot); onLineupClose(); };
  const handleRemovePlayer = async (playerId) => { await removePlayer(playerId); };
  const handleFormationChange = (e) => { changeFormation(e.target.value); setAnnounceMsg(`Formación cambiada a ${e.target.value}`); };

  // value flash detection
  useEffect(()=> { prevMoney.current = money; }, [money]);
  useEffect(()=> {
    if(prevValueXI.current !== null && totalMarketValueXI !== prevValueXI.current){
      setFlashValueXI(true); setTimeout(()=> setFlashValueXI(false), 650);
    }
    prevValueXI.current = totalMarketValueXI;
  }, [totalMarketValueXI]);

  // Restore focus when closing modals
  useEffect(()=> {
    if(!moneyEdit.open && !clauseEdit.open && !isOpen && !isLineupOpen && lastFocusedRef.current){
  try { lastFocusedRef.current.focus(); } catch { /* ignore focus errors */ }
    }
  }, [moneyEdit.open, clauseEdit.open, isOpen, isLineupOpen]);

  const kpiBg = useColorModeValue('white','whiteAlpha.100');
  const kpiMuted = useColorModeValue('gray.600','gray.400');
  const skeletonRowBg = useColorModeValue('white','gray.700');

  return (
    <Box p={{ base:4, md:6 }}>
      {/* Header */}
      <Grid templateColumns={{ base:'1fr', lg:'repeat(12, 1fr)' }} gap={4} mb={4} as="header">
        <GridItem colSpan={{ base:12, lg:12 }}>
          <Flex align="center" gap={3} wrap='wrap'>
            <HStack spacing={2}>
              <Box as="span" fontSize="2xl" color="brand.400">
                <span role="img" aria-label="fútbol">⚽</span>
              </Box>
              <Text fontSize="2xl" fontWeight="bold">Mi Equipo Fantasy</Text>
            </HStack>
            <HStack spacing={3} flexWrap='wrap'>
              <Box
                as={motion.div}
                whileHover={{ y:-3, boxShadow:'0 6px 14px -4px rgba(0,0,0,0.25)' }}
                px={4} py={2} bg={kpiBg} borderRadius='lg' minW='150px'
                position='relative' overflow='hidden'
                _before={{ content:'""', position:'absolute', inset:0, bgGradient:'linear(to-br, brand.500, brand.600)', opacity:0.12 }}
                animate={flashValueXI ? { boxShadow:['0 0 0 0 rgba(234,179,8,0.0)','0 0 0 6px rgba(234,179,8,0.45)','0 0 0 0 rgba(234,179,8,0.0)'] } : {}}
                transition={{ duration:0.7 }}
              >
                <Stat>
                  <StatLabel fontSize='xs' textTransform='uppercase' color={kpiMuted} letterSpacing='widest'>Valor XI</StatLabel>
                  <StatNumber fontSize='md'>
                    {loadingPlayers ? <Skeleton height='16px' width='80px' /> : `€${totalMarketValueXI.toLocaleString('es-ES')}`}
                  </StatNumber>
                </Stat>
              </Box>
              <MoneyPanel
                variant='inline'
                sticky={false}
                money={money}
                onEdit={() => setMoneyEdit({ open:true, value: money })}
              />
              <HStack spacing={2}>
                <Text fontSize='sm' fontWeight='semibold'>Formación</Text>
                <Select size='sm' value={formation} onChange={handleFormationChange} maxW='120px'>
                  {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </Select>
              </HStack>
              <Button colorScheme='brand' size='sm' variant='solid' onClick={(e)=> { lastFocusedRef.current = e.currentTarget; setMoneyEdit({ open:true, value: money }); }}>Editar dinero</Button>
              <Button size='sm' variant='outline' onClick={() => {/* future save action placeholder */}}>Guardar cambios</Button>
              <Button size='sm' variant='ghost' onClick={(e)=> { lastFocusedRef.current = e.currentTarget; onOpen(); }}>+ Jugador</Button>
            </HStack>
          </Flex>
        </GridItem>
      </Grid>

      {/* Main Grid */}
      <Grid templateColumns={{ base:'1fr', lg:'repeat(12, 1fr)' }} gap={6} alignItems='start'>
        <GridItem colSpan={{ base:12, lg:7 }}>
          <Box mb={4}>
            <Pitch
              positions={positions}
              players={myPlayers}
              onSelectSlot={(slotInfo)=> { setSelectedSlot(slotInfo); onLineupOpen(); }}
            />
            <BenchArea
              players={myPlayers}
              onSelectBench={(slot)=> { setSelectedSlot(slot); onLineupOpen(); }}
            />
          </Box>
        </GridItem>
        <GridItem colSpan={{ base:12, lg:5 }}>
          <VStack
            as={motion.div}
            initial={{ opacity:0, x:24 }}
            animate={{ opacity:1, x:0 }}
            transition={{ duration:0.45, ease:'easeOut' }}
            spacing={4} align='stretch' p={4} borderRadius='xl' boxShadow='lg'
            bgGradient={useColorModeValue('linear(to-br, white, blue.50)','linear(to-br, gray.900, blue.900)')}
            h={{ lg:'calc(100vh - 180px)' }} overflow='hidden' position='relative'
            _before={{ content:'""', position:'absolute', inset:0, borderRadius:'inherit', pointerEvents:'none', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.08)', opacity:0.9 }}
            _after={{ content:'""', position:'absolute', inset:0, borderRadius:'inherit', pointerEvents:'none', bgGradient:'radial(at top left, rgba(30,168,255,0.18), transparent 60%)' }}
          >
            {/* MoneyPanel eliminado del panel lateral para evitar superposición sobre pestañas */}
            <Tabs variant='enclosed' colorScheme='brand' isLazy display='flex' flexDir='column' flex='1' h='100%' aria-label='Panel de datos del equipo' position='relative'>
              <TabList>
                <Tab fontSize='sm' _selected={{ bg:'brand.500', color:'white' }}>Roster</Tab>
                <Tab fontSize='sm' _selected={{ bg:'brand.500', color:'white' }}>Log</Tab>
                <Tab fontSize='sm' _selected={{ bg:'brand.500', color:'white' }}>Gráfica</Tab>
              </TabList>
              <TabPanels flex='1' overflow='hidden' position='relative'>
                <TabPanel px={0} h='100%' overflow='auto' as={motion.div} key='roster' initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.25}}>
                  {loadingPlayers ? (
                    <VStack align='stretch' spacing={3}>
                      {Array.from({ length:5 }).map((_,i)=> (
                        <HStack key={i} p={3} borderRadius='lg' bg={skeletonRowBg} boxShadow='xs'>
                          <SkeletonCircle size='8' />
                          <VStack flex={1} spacing={2} align='stretch'>
                            <Skeleton height='14px' />
                            <Skeleton height='10px' width='60%' />
                          </VStack>
                          <Skeleton height='24px' width='70px' />
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <PlayerRoster
                      players={orderedPlayers}
                      onRemove={handleRemovePlayer}
                      onSetReserve={setReserve}
                      onEditClause={(pl, baseForm)=> {
                        let lock_days=0, lock_hours=0;
                        if(pl.clause_lock_until && !pl.is_clausulable){
                          const now = Date.now();
                          const until = new Date(pl.clause_lock_until).getTime();
                          const diffMs = Math.max(0, until-now);
                          lock_days = Math.floor(diffMs / (1000*60*60*24));
                          lock_hours = Math.floor((diffMs % (1000*60*60*24)) / (1000*60*60));
                        }
                        setClauseEdit({ open:true, player: pl });
                        setClauseForm({ ...baseForm, lock_days, lock_hours });
                      }}
                      clauseHighlightId={lastClauseUpdated}
                    />
                  )}
                  <Button mt={4} size='sm' colorScheme='brand' onClick={onOpen}>+ Añadir jugador</Button>
                </TabPanel>
                <TabPanel px={0} h='100%' overflow='auto' as={motion.div} key='log' initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.25}}>
                  <PlayerTransferLog refreshKey={refreshKey} participantId={myParticipantId} />
                </TabPanel>
                <TabPanel px={0} h='100%' overflow='auto' as={motion.div} key='chart' initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.25}}>
                  {loadingCumulativeRank ? (
                    <Flex justify='center' py={6}><Spinner /></Flex>
                  ) : (
                    <CumulativeRankChart history={cumulativeRankHistory} compact />
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </GridItem>
      </Grid>

      {/* Modals */}
      <Modal isOpen={moneyEdit.open} onClose={() => setMoneyEdit({ open: false, value: '' })} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar dinero</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">Nuevo dinero (€):</Text>
              <input
                type="number"
                min={0}
                value={moneyEdit.value}
                onChange={e => setMoneyEdit(edit => ({ ...edit, value: e.target.value }))}
                style={{ width: 180, fontSize: 18, padding: 4, border: '1px solid #CBD5E1', borderRadius: 6 }}
              />
              <Button colorScheme="yellow" onClick={handleSaveMoney}>
                Guardar
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🔍 Buscar jugador</ModalHeader>
          <ModalCloseButton />
          <ModalBody><PlayerSearch onSelect={handleAddPlayer} /></ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isLineupOpen} onClose={onLineupClose} size="lg" initialFocusRef={undefined}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Elige jugador para {selectedSlot?.role}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={2} align="stretch">
              {selectedSlot &&
                myPlayers
                  .filter((pl) => pl.status === "R")
                  .map((pl) => (
                    <HStack
                      key={pl.player_id}
                      justify="space-between"
                      p={2}
                      borderRadius="md"
                      bg="gray.100"
                      _hover={{ bg: "gray.200", cursor: "pointer" }}
                      onClick={() => handleSetXI(pl)}
                    >
                      <Text>{pl.name} ({pl.team_name || pl.team})</Text>
                      <Text color="blue.600">
                        €{(pl.market_value_num || 0).toLocaleString("es-ES")}
                      </Text>
                    </HStack>
                  ))}
              {selectedSlot &&
                myPlayers.filter((pl) => pl.status === "R").length === 0 && (
                  <Text color="gray.500">No tienes reservas disponibles</Text>
                )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <ClauseLockModal
        isOpen={clauseEdit.open}
        onClose={() => setClauseEdit({ open: false, player: null })}
        player={clauseEdit.player}
        clauseForm={clauseForm}
        setClauseForm={setClauseForm}
        onSave={async () => {
          const { clause_value, is_clausulable, lock_days, lock_hours } = clauseForm;
          const playerId = clauseEdit.player.player_id;
          await updateClause({ playerId, clause_value, is_clausulable, lock_days, lock_hours, minClause: clauseEdit.player.market_value_num || 0 });
          setClauseEdit({ open:false, player:null });
          setLastClauseUpdated(playerId);
          setAnnounceMsg(`Cláusula actualizada para ${clauseEdit.player.name}`);
          setTimeout(()=> setLastClauseUpdated(null), 1500);
        }}
      />
      <VisuallyHidden aria-live='polite'>{announceMsg}</VisuallyHidden>
    </Box>
  );
}

// Helpers & PlayerSlot moved to components/myteam


