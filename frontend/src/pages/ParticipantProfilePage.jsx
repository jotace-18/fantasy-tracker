import { Box, Heading, Text, Flex, Badge, Spinner, Divider, Button, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Input, VStack } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import { useParams } from "react-router-dom";
import PlayerSearch from "../components/PlayerSearch";
import EditablePlayerRow from "./EditablePlayerRow";
import { useEffect, useState } from "react";
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
  // Modal editar dinero
  const [moneyEdit, setMoneyEdit] = useState({ open: false, value: "" });

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
      }
    } catch {
      // Error handling intentionally left blank
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
  const getSortedSquad = () => {
    if (!participant?.squad) return [];
    const sorted = [...participant.squad];
    const positionOrder = [
      "portero",
      "defensa",
      "centrocampista",
      "mediocampista",
      "delantero"
    ];
    sorted.sort((a, b) => {
      let vA = a[sortBy], vB = b[sortBy];
      if (sortBy === "position") {
        // Orden personalizado para posición
        const idxA = positionOrder.indexOf((vA || "").toLowerCase());
        const idxB = positionOrder.indexOf((vB || "").toLowerCase());
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return order === "ASC" ? 1 : -1;
        if (idxB === -1) return order === "ASC" ? -1 : 1;
        return order === "ASC" ? idxA - idxB : idxB - idxA;
      } else if (["market_value_num", "total_points", "clause_value"].includes(sortBy)) {
        vA = Number(vA) || 0;
        vB = Number(vB) || 0;
        if (vA < vB) return order === "ASC" ? -1 : 1;
        if (vA > vB) return order === "ASC" ? 1 : -1;
        return 0;
      } else {
        vA = (vA || "").toString().toLowerCase();
        vB = (vB || "").toString().toLowerCase();
        if (vA < vB) return order === "ASC" ? -1 : 1;
        if (vA > vB) return order === "ASC" ? 1 : -1;
        return 0;
      }
    });
    return sorted;
  };

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

  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
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
        <Box flex={3} minW={0} bg="white" borderRadius="lg" boxShadow="md" p={{ base: 4, md: 10 }}>
          <Heading size="lg" mb={2} textAlign="center">{participant.name}</Heading>
          <Flex gap={6} mb={6} align="center" justify="center" wrap="wrap">
            <Badge colorScheme="blue" fontSize="2xl" px={5} py={2} borderRadius="lg" boxShadow="md">
              {participant.total_points} pts
            </Badge>
            <Flex align="center" gap={2}>
              <Badge colorScheme="green" fontSize="2xl" px={5} py={2} borderRadius="lg" boxShadow="md">
                €{Number(participant.money).toLocaleString("es-ES")}
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => setMoneyEdit({ open: true, value: participant.money })}>
                <EditIcon color="green.700" boxSize={6} />
              </Button>
            </Flex>
            <Badge colorScheme="gray" fontSize="2xl" px={5} py={2} borderRadius="lg" boxShadow="md">
              {loadingPosition
                ? "Cargando posición..."
                : position !== null && position !== undefined
                  ? `Posición: ${position}`
                  : "Sin ranking"}
            </Badge>
            <Badge colorScheme="purple" fontSize="2xl" px={5} py={2} borderRadius="lg" boxShadow="md">
              Valor plantilla: {plantillaValue.toLocaleString("es-ES")} €
            </Badge>
          </Flex>
      {/* Modal editar dinero */}
      <Modal isOpen={moneyEdit.open} onClose={() => setMoneyEdit({ open: false, value: '' })} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar dinero</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">Nuevo dinero (€):</Text>
              <Input
                type="number"
                min={0}
                value={moneyEdit.value}
                onChange={e => setMoneyEdit(edit => ({ ...edit, value: e.target.value }))}
                style={{ width: 180, fontSize: 18, padding: 4, border: '1px solid #CBD5E1', borderRadius: 6 }}
              />
              <Button colorScheme="green" onClick={handleSaveMoney}>
                Guardar
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
          <Divider my={4} />
          <Box mb={8}>
            <Flex direction={{ base: "column", md: "row" }} gap={6}>
              <Box flex={1} minW={0}>
                {loadingCumulative ? (
                  <Flex justify="center" align="center" h="120px"><Spinner /></Flex>
                ) : (
                  <CumulativePointsChart history={cumulativeHistory} />
                )}
              </Box>
              <Box flex={1} minW={0}>
                {loadingCumulativeRank ? (
                  <Flex justify="center" align="center" h="120px"><Spinner /></Flex>
                ) : (
                  <CumulativeRankChart history={cumulativeRankHistory} />
                )}
              </Box>
            </Flex>
          </Box>
          <Divider my={4} />
          <Box mt={2}>
            <Flex align="center" justify="space-between" mb={2}>
              <Heading size="md">Plantilla completa</Heading>
              <Button colorScheme="teal" size="sm" onClick={onOpen}>Añadir jugador</Button>
            </Flex>
            {(() => { console.log('DEBUG squad:', participant.squad); return null; })()}
            {participant.squad && participant.squad.length > 0 ? (
              <Box overflowX="auto">
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: "#e2e8f0", position: "sticky", top: 0, zIndex: 1 }}>
                      <th style={{ fontWeight: 700, padding: '10px 8px', borderBottom: '2px solid #cbd5e1', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('name', 'ASC')}>Nombre{renderArrow('name')}</th>
                      <th style={{ fontWeight: 700, padding: '10px 8px', borderBottom: '2px solid #cbd5e1', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('position', 'ASC')}>Posición{renderArrow('position')}</th>
                      <th style={{ fontWeight: 700, padding: '10px 8px', borderBottom: '2px solid #cbd5e1', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('team', 'ASC')}>Equipo{renderArrow('team')}</th>
                      <th style={{ fontWeight: 700, padding: '10px 8px', borderBottom: '2px solid #cbd5e1', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('market_value_num', 'DESC')}>Valor Mercado{renderArrow('market_value_num')}</th>
                      <th style={{ fontWeight: 700, padding: '10px 8px', borderBottom: '2px solid #cbd5e1', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('clause_value', 'DESC')}>Cláusula{renderArrow('clause_value')}</th>
                      <th style={{ fontWeight: 700, padding: '10px 8px', borderBottom: '2px solid #cbd5e1', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('is_clausulable', 'DESC')}>Clausulable{renderArrow('is_clausulable')}</th>
                      <th style={{ fontWeight: 700, padding: '10px 8px', borderBottom: '2px solid #cbd5e1', textAlign: 'right', cursor: 'pointer' }} onClick={() => handleSort('total_points', 'DESC')}>Puntos{renderArrow('total_points')}</th>
                      <th style={{ fontWeight: 700, padding: '10px 8px', borderBottom: '2px solid #cbd5e1', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedSquad().map((player, idx) => (
                      <EditablePlayerRow key={player.player_id || player.id}
                        player={player}
                        participantId={id}
                        onChange={fetchParticipant}
                        rowStyle={{ background: idx % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}
                        // showClauseValue is not needed; let EditablePlayerRow always render 'Sí' only if is_clausulable is true
                      />
                    ))}
                  </tbody>
                </table>
              </Box>
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
    </Box>
  );
}
