import { Box, Heading, Text, Flex, Badge, Spinner, Divider, Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Input, VStack, useColorModeValue, Skeleton, SkeletonText, useToast } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { useParams } from "react-router-dom";
import PlayerSearch from "../components/PlayerSearch";
// Inline row component moved remains imported indirectly by SquadTable
import ParticipantKpis from '../components/participant/ParticipantKpis';
import MoneyModal from '../components/participant/MoneyModal';
import ChartsPanel from '../components/participant/ChartsPanel';
import SquadSearchBar from '../components/participant/SquadSearchBar';
import SquadTable from '../components/participant/SquadTable';
import { useEffect, useState, useMemo } from "react";
import useLeaderboardPosition from "../hooks/useLeaderboardPosition";
import PositionProgressChart from "../components/PositionProgressChart";
import useCumulativePointsHistory from "../hooks/useCumulativePointsHistory";
import CumulativePointsChart from "../components/CumulativePointsChart";
import useCumulativeRankHistory from "../hooks/useCumulativeRankHistory";
import CumulativeRankChart from "../components/CumulativeRankChart";
import PlayerTransferLog from "../components/PlayerTransferLog";

export default function ParticipantProfilePage() {
  const { id } = useParams();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [adding, setAdding] = useState(false);
  // Ordenación
  const [sortBy, setSortBy] = useState("total_points");
  const [order, setOrder] = useState("DESC");
  const [query, setQuery] = useState("");
  // Modal editar dinero
  const [moneyEdit, setMoneyEdit] = useState({ open: false, value: "" });
  const [liveMessage, setLiveMessage] = useState("");
  const toast = useToast();

  const cardBg = useColorModeValue('white','gray.800');
  const sectionBg = useColorModeValue('gray.50','gray.700');
  const kpiShadow = useColorModeValue('md','sm');
  const tableBorderColor = useColorModeValue('gray.200','gray.600');
  const zebraSkeletonBorder = tableBorderColor;

  const fetchParticipant = async () => {
    setLoading(true);
    try {
      // Fetch participant base data
      const res = await fetch(`/api/participants/${id}`);
      if (!res.ok) throw new Error("No se pudo cargar el participante");
      const data = await res.json();
      // Fetch extended squad data
      const squadRes = await fetch(`/api/participant-players/${id}/team`);
      if (!squadRes.ok) throw new Error("No se pudo cargar la plantilla extendida");
      const squad = await squadRes.json();
      setParticipant({ ...data, squad });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Guardar dinero editado
  const handleSaveMoney = async () => {
    const newMoney = Number(moneyEdit.value);
    if (isNaN(newMoney)) return;
    try {
      const res = await fetch(`/api/participants/${id}/money`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ money: newMoney })
      });
      if (res.ok) {
        setParticipant((prev) => ({ ...prev, money: newMoney }));
        setMoneyEdit({ open: false, value: "" });
        const msg = `Dinero actualizado a €${newMoney.toLocaleString('es-ES')}`;
        setLiveMessage(msg);
        toast({ status:'success', description: msg, duration: 3000, position:'top-right' });
      } else {
        toast({ status:'error', description:'No se pudo actualizar el dinero', duration:3000 });
      }
    } catch {
      toast({ status:'error', description:'Error de red al guardar dinero', duration:3000 });
    }
  };
  useEffect(() => {
    fetchParticipant();
    // eslint-disable-next-line
  }, [id]);

  const handleAddPlayer = async (player) => {
    setAdding(true);
    try {
      // Igualar body al de MyTeamPage
      const body = {
        player_id: player.id,
        buy_price: player.market_value_num || 0,
        status: "R",
        slot_index: null
      };
      const res = await fetch(`/api/participant-players/${id}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("No se pudo añadir el jugador");
      fetchParticipant();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setAdding(false);
    }
  };

  const { position, loading: loadingPosition } = useLeaderboardPosition(id);
  // (debug eliminado)

  // Ordenar plantilla localmente
  const POSITION_ORDER = useMemo(() => [
    'portero','defensa','centrocampista','mediocampista','delantero'
  ], []);
  const filteredSquad = useMemo(() => {
    if (!participant?.squad) return [];
    if (!query.trim()) return participant.squad;
    const q = query.toLowerCase();
    return participant.squad.filter(p => (
      (p.name||'').toLowerCase().includes(q) ||
      (p.team||'').toLowerCase().includes(q) ||
      (p.position||'').toLowerCase().includes(q)
    ));
  }, [participant?.squad, query]);

  const sortedSquad = useMemo(() => {
    if (!filteredSquad) return [];
    const arr = [...filteredSquad];
    arr.sort((a,b) => {
      let vA = a[sortBy];
      let vB = b[sortBy];
      if (sortBy === 'position') {
        const idxA = POSITION_ORDER.indexOf((vA||'').toLowerCase());
        const idxB = POSITION_ORDER.indexOf((vB||'').toLowerCase());
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return order === 'ASC' ? 1 : -1;
        if (idxB === -1) return order === 'ASC' ? -1 : 1;
        return order === 'ASC' ? idxA - idxB : idxB - idxA;
      }
      if (['market_value_num','total_points','clause_value'].includes(sortBy)) {
        vA = Number(vA)||0; vB = Number(vB)||0;
        if (vA < vB) return order === 'ASC' ? -1 : 1;
        if (vA > vB) return order === 'ASC' ? 1 : -1;
        return 0;
      }
      vA = (vA||'').toString().toLowerCase();
      vB = (vB||'').toString().toLowerCase();
      if (vA < vB) return order === 'ASC' ? -1 : 1;
      if (vA > vB) return order === 'ASC' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredSquad, sortBy, order, POSITION_ORDER]);

  const handleSort = (field, defaultOrder = "ASC") => {
    if (sortBy === field) {
      setOrder(order === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setOrder(defaultOrder);
    }
  };

  const renderArrow = (field) => {
    if (sortBy !== field) return "";
    return order === "ASC" ? " ▲" : " ▼";
  };
  // const { history: positionHistory } = usePositionHistory(id);
  const { history: cumulativeHistory, loading: loadingCumulative } = useCumulativePointsHistory(id);
  const { history: cumulativeRankHistory, loading: loadingCumulativeRank } = useCumulativeRankHistory(id);

  // Mientras loading mostramos layout esqueletos en lugar de spinner centrado
  if (loading) {
    return (
      <Box p={{ base: 2, md: 4 }} maxW="98vw" mx="auto">
        <Flex direction={{ base: 'column', md: 'row' }} gap={6} align="flex-start">
          <Box flex={3} minW={0} bg={cardBg} borderRadius="xl" boxShadow="lg" p={{ base:4, md:10 }}>
            <Skeleton height="32px" mb={6} borderRadius="md" />
            <Flex gap={6} mb={6} wrap="wrap" justify="center">
              <Skeleton height="64px" width="150px" borderRadius="lg" />
              <Skeleton height="64px" width="180px" borderRadius="lg" />
              <Skeleton height="64px" width="170px" borderRadius="lg" />
              <Skeleton height="64px" width="260px" borderRadius="lg" />
            </Flex>
            <Box mb={8} p={4} borderRadius="lg" bg={sectionBg} _dark={{ bg:'gray.700' }}>
              <Flex direction={{ base:'column', md:'row' }} gap={6}>
                <Skeleton height="120px" flex={1} borderRadius="md" />
                <Skeleton height="120px" flex={1} borderRadius="md" />
              </Flex>
            </Box>
            <Divider my={4} />
            <Flex align="center" justify="space-between" mb={2}>
              <Skeleton height="28px" width="180px" />
              <Skeleton height="32px" width="120px" borderRadius="md" />
            </Flex>
            <Box>
              <Box border="1px" borderColor={tableBorderColor} borderRadius="md" overflow="hidden">
                {Array.from({ length: 8 }).map((_,i) => (
                  <Flex key={i} px={4} py={3} gap={4} _notLast={{ borderBottom:'1px solid', borderColor: zebraSkeletonBorder }}>
                    <Skeleton height="16px" flex={2} />
                    <Skeleton height="16px" flex={1} />
                    <Skeleton height="16px" flex={1} />
                    <Skeleton height="16px" flex={1} />
                    <Skeleton height="16px" flex={1} />
                    <Skeleton height="16px" flex={1} />
                  </Flex>
                ))}
              </Box>
            </Box>
          </Box>
          <Box flex={1} minW={0}>
            <Skeleton height="400px" borderRadius="xl" />
          </Box>
        </Flex>
      </Box>
    );
  }
  if (error) {
    return (
      <Box p={8}>
        <Heading size="md" color="red.500">Error</Heading>
        <Text>{error}</Text>
      </Box>
    );
  }
  if (!participant) return null;

  // Calcular valor total de la plantilla
  const plantillaValue = participant?.squad?.reduce((acc, p) => acc + (Number(p.market_value_num) || 0), 0);

  return (
    <Box p={{ base: 2, md: 4 }} maxW="98vw" mx="auto">
      <Flex direction={{ base: "column", md: "row" }} gap={6} align="flex-start">
        {/* Main participant card (left column) */}
        <Box flex={3} minW={0} bg={cardBg} borderRadius="xl" boxShadow="lg" p={{ base: 4, md: 10 }} transition="background .25s ease" _dark={{ borderColor: 'gray.600' }} borderWidth={{ base: '0', md: '1px' }}>
          <Heading size="lg" mb={2} textAlign="center">{participant.name}</Heading>
          <ParticipantKpis
            participant={participant}
            plantillaValue={plantillaValue}
            loadingPosition={loadingPosition}
            position={position}
            sectionBg={sectionBg}
            kpiShadow={kpiShadow}
            onEditMoney={() => setMoneyEdit({ open: true, value: participant.money })}
          />
          {/* Modal editar dinero */}
          <MoneyModal
            isOpen={moneyEdit.open}
            onClose={() => setMoneyEdit({ open:false, value:'' })}
            value={moneyEdit.value}
            setValue={val => setMoneyEdit(m => ({ ...m, value: val }))}
            onSave={handleSaveMoney}
            isSaving={false}
          />
          <Divider my={4} />
          {/* Reemplazar contenedor charts usando sectionBg */}
          <ChartsPanel
            sectionBg={sectionBg}
            loadingCumulative={loadingCumulative}
            cumulativeHistory={cumulativeHistory}
            loadingCumulativeRank={loadingCumulativeRank}
            cumulativeRankHistory={cumulativeRankHistory}
          />
          <Divider my={4} />
          <Box mt={2}>
             <Flex align="center" justify="space-between" mb={2} gap={4} wrap="wrap">
               <Heading size="md">Plantilla completa</Heading>
               <SquadSearchBar query={query} setQuery={setQuery} onOpen={onOpen} sectionBg={sectionBg} />
             </Flex>
            {(() => { console.log('DEBUG squad:', participant.squad); return null; })()}
            {participant.squad && participant.squad.length > 0 ? (
              <SquadTable
                squad={participant.squad}
                sortedSquad={sortedSquad}
                handleSort={handleSort}
                renderArrow={renderArrow}
                participantId={id}
                fetchParticipant={fetchParticipant}
              />
            ) : (
              <Text color="gray.500">No hay jugadores en la plantilla.</Text>
            )}
            <Modal isOpen={isOpen} onClose={onClose} size="4xl">
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Buscar y añadir jugador</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <PlayerSearch onSelect={handleAddPlayer} showAddButton={!adding} />
                </ModalBody>
              </ModalContent>
            </Modal>
          </Box>
        </Box>
        {/* Transfer log card (right column) */}
        <PlayerTransferLog participantId={id} />
      </Flex>
      {/* aria-live region for dynamic announcements */}
      <Box position='absolute' width='1px' height='1px' overflow='hidden' clip='rect(0 0 0 0)' aria-live='polite'>
        {liveMessage}
      </Box>
    </Box>
  );
}
