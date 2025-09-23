import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Select,
  Text,
  VStack,
  HStack,
  Center,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
} from "@chakra-ui/react";
import { FORMATIONS, FORMATION_MAP } from "../utils/formations";
import { Link } from "react-router-dom";
import InternalClock from "../components/InternalClock";
import PlayerSearch from "../components/PlayerSearch";
import { WarningTwoIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import useCumulativePointsHistory from "../hooks/useCumulativePointsHistory";
import useCumulativeRankHistory from "../hooks/useCumulativeRankHistory";
import CumulativePointsChart from "../components/CumulativePointsChart";
import CumulativeRankChart from "../components/CumulativeRankChart";


export default function MyTeamPage() {
  const [formation, setFormation] = useState("4-3-3");
  const [myPlayers, setMyPlayers] = useState([]); // plantilla cargada desde DB
  const [selectedSlot, setSelectedSlot] = useState(null); // guarda { role, index }
  const [lineup, setLineup] = useState({}); // NUEVO: { slotIndex: player }

  // Modal buscar jugadores (pool global)
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Modal asignar jugador a slot del campo
  const {
    isOpen: isLineupOpen,
    onOpen: onLineupOpen,
    onClose: onLineupClose,
  } = useDisclosure();
  // Id del usuario actual (Jc)
  const myParticipantId = 8; // Hardcodeado para demo, ideal: obtener del contexto de usuario
  const { history: cumulativeHistory, loading: loadingCumulative } = useCumulativePointsHistory(myParticipantId);
  const { history: cumulativeRankHistory, loading: loadingCumulativeRank } = useCumulativeRankHistory(myParticipantId);

  // 📌 Cargar jugadores y formación persistente al montar el componente
  useEffect(() => {
    fetchTeamAndPlayers();
  }, []);

  // Cargar formación y jugadores
  const fetchTeamAndPlayers = async () => {
    try {
      const teamId = 1; // ⚡ por ahora hardcodeado
      // Obtener detalle del equipo (incluye formación)
      const teamRes = await fetch(`http://localhost:4000/api/user-teams/${teamId}`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.formation) setFormation(teamData.formation);
      }
      // Obtener jugadores del usuario
      const res = await fetch(`http://localhost:4000/api/user-players/${teamId}`);
      if (!res.ok) {
        console.warn("⚠️ No se encontraron jugadores:", res.status);
        setMyPlayers([]);
        setLineup({});
        return;
      }
      const data = await res.json();
      setMyPlayers(Array.isArray(data) ? data : []);
      // Reconstruir lineup persistente
      const lineupFromDB = {};
      (Array.isArray(data) ? data : []).forEach((pl) => {
        if (pl.status === "XI" && pl.slot_index) {
          lineupFromDB[pl.slot_index] = pl;
        }
      });
      setLineup(lineupFromDB);
    } catch (err) {
      console.error("❌ Error cargando plantilla o formación:", err);
      setMyPlayers([]);
      setLineup({});
    }
  };

  // Jugadores ordenados
  const orderedPlayers = [...myPlayers].sort((a, b) => {
    const posOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    if (posOrder[a.role] !== posOrder[b.role]) {
      return posOrder[a.role] - posOrder[b.role];
    }
    return (b.total_points || 0) - (a.total_points || 0);
  });

  const positions = FORMATION_MAP[formation];

  const lineupByRole = {};
  orderedPlayers.forEach((pl) => {
    if (pl.status === "XI") {
      if (!lineupByRole[pl.role]) lineupByRole[pl.role] = [];
      lineupByRole[pl.role].push(pl);
    }
  });


  // Añadir jugador desde búsqueda global
  const handleAddPlayer = async (player) => {
    try {
      const teamId = 1;
      // prevenir duplicados en frontend
      if (myPlayers.some((pl) => pl.player_id === player.id)) {
        console.warn("⚠️ El jugador ya está en tu plantilla");
        return;
      }

      const res = await fetch(`http://localhost:4000/api/user-players/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: player.id,
          buy_price: player.market_value_num || 0,
        }),
      });
      if (!res.ok) throw new Error("Error al añadir jugador");

      // En vez de actualizar solo el estado local, recarga toda la plantilla
  await fetchTeamAndPlayers();
      onClose();
    } catch (err) {
      console.error("❌ Error añadiendo jugador:", err);
    }
  };

  // Asignar jugador al XI y al slot concreto
  // Asignar jugador al XI y slot concreto (persistente)
  // Intercambiar jugador de reserva con el que está en el slot (swap)
  const handleSetXI = async (player) => {
    try {
      const teamId = 1;
      if (!selectedSlot) return;
      // Buscar si ya hay un jugador en ese slot
      const prevPlayer = Object.values(lineup).find(
        (pl) => pl.slot_index === selectedSlot.index && pl.status === "XI"
      );

      // 1. Si hay jugador en el slot, pásalo a reserva (status: "R", slot_index: null)
      if (prevPlayer) {
        await fetch(
          `http://localhost:4000/api/user-players/${teamId}/${prevPlayer.player_id}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "R", slot_index: null }),
          }
        );
      }

      // 2. Poner el nuevo jugador en el slot (status: XI, slot_index)
      await fetch(
        `http://localhost:4000/api/user-players/${teamId}/${player.player_id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "XI", slot_index: selectedSlot.index }),
        }
      );

      // 3. Recargar plantilla y lineup
  await fetchTeamAndPlayers();
      onLineupClose();
    } catch (err) {
      console.error("❌ Error actualizando status:", err);
    }
  };

  // Eliminar jugador de la plantilla
  const handleRemovePlayer = async (playerId) => {
    try {
      const teamId = 1;
      const res = await fetch(
        `http://localhost:4000/api/user-players/${teamId}/${playerId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Error al eliminar jugador");

      setMyPlayers((prev) => prev.filter((pl) => pl.player_id !== playerId));
    } catch (err) {
      console.error("❌ Error eliminando jugador:", err);
    }
  };

  // Maneja el cambio de formación, reasigna XI y pasa sobrantes a reserva respetando roles
  const handleFormationChange = async (e) => {
    const newFormation = e.target.value;
    setFormation(newFormation);
    // Persistir en backend
    try {
      const teamId = 1;
      await fetch(`http://localhost:4000/api/user-teams/${teamId}/formation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation: newFormation }),
      });
    } catch (err) {
      // Error al actualizar formación, se ignora para UX fluida
      console.warn("No se pudo actualizar la formación en el backend:", err);
    }

    // 1. Calcular los slots de la nueva formación agrupados por rol
    const newPositions = FORMATION_MAP[newFormation];
    const slotsByRole = {};
    newPositions.forEach((p, i) => {
      if (!slotsByRole[p.role]) slotsByRole[p.role] = [];
      slotsByRole[p.role].push(i + 1); // slot_index empieza en 1
    });

    // 2. Obtener todos los XI actuales agrupados por rol
    const xiByRole = {};
    myPlayers.filter((pl) => pl.status === "XI").forEach((pl) => {
      if (!xiByRole[pl.role]) xiByRole[pl.role] = [];
      xiByRole[pl.role].push(pl);
    });

    // 3. Para cada rol, asignar slots a los primeros N jugadores, el resto a reserva
    const updates = [];
    Object.entries(slotsByRole).forEach(([role, slotIndexes]) => {
      const players = xiByRole[role] || [];
      // Ordenar por slot_index ascendente (o user_player_id)
      const sorted = [...players].sort((a, b) => (a.slot_index || 0) - (b.slot_index || 0));
      for (let i = 0; i < sorted.length; i++) {
        const pl = sorted[i];
        if (i < slotIndexes.length) {
          // Asignar slot_index correspondiente y status XI
          updates.push(
            fetch(`http://localhost:4000/api/user-players/1/${pl.player_id}/status`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "XI", slot_index: slotIndexes[i] }),
            })
          );
        } else {
          // Pasar a reserva
          updates.push(
            fetch(`http://localhost:4000/api/user-players/1/${pl.player_id}/status`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "R", slot_index: null }),
            })
          );
        }
      }
    });
    // Los XI de roles que no existen en la nueva formación también van a reserva
    Object.keys(xiByRole).forEach((role) => {
      if (!slotsByRole[role]) {
        xiByRole[role].forEach((pl) => {
          updates.push(
            fetch(`http://localhost:4000/api/user-players/1/${pl.player_id}/status`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "R", slot_index: null }),
            })
          );
        });
      }
    });
    await Promise.all(updates);
    // Refrescar plantilla y lineup
    await fetchTeamAndPlayers();
  };

  // Calcular valor de mercado total del XI
  const totalMarketValueXI = myPlayers
    .filter((pl) => pl.status === "XI")
    .reduce((sum, pl) => sum + (pl.market_value_num || 0), 0);

  return (
    <Box p={6}>
      <Flex align="center" mb={4} gap={6}>
        <InternalClock />
        <Flex align="center" gap={2}>
          <Box as="span" fontSize="2xl" color="blue.400">
            <span role="img" aria-label="fútbol">⚽</span>
          </Box>
          <Text fontSize="2xl" fontWeight="bold">
            Mi Equipo Fantasy
          </Text>
        </Flex>
        <Box bg="blue.50" px={4} py={1} borderRadius="md" boxShadow="sm" display="flex" alignItems="center" gap={2}>
          <InfoOutlineIcon color="blue.400" />
          <Text fontSize="md" color="blue.800" fontWeight="semibold">
            Valor XI:
          </Text>
          <Text fontSize="lg" color="blue.700" fontWeight="bold">
            €{totalMarketValueXI.toLocaleString("es-ES")}
          </Text>
        </Box>
      </Flex>

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
      {/* Selector de formación */}
      <Flex mb={6} align="center" gap={3}>
        <Text fontWeight="semibold">Formación:</Text>
        <Select
          value={formation}
          onChange={handleFormationChange}
          maxW="200px"
        >
          {FORMATIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </Select>
      </Flex>


      <Flex gap={8}>
        {/* Campo + banquillo y coach */}
        <Box flex="1">
          {/* Campo */}
          <Box
            bg="green.700"
            borderRadius="lg"
            p={2}
            h="600px"
            position="relative"
            boxShadow="md"
          >
            {positions.map((p, i) => {
              // Mostrar el jugador asignado al slot si existe en lineup
              const playerForSlot = lineup[i + 1] || null;
              return (
                <PlayerSlot
                  key={i}
                  role={p.role}
                  x={p.x}
                  y={p.y}
                  index={i + 1}
                  player={playerForSlot}
                  onSelectSlot={() => {
                    setSelectedSlot({ ...p, index: i + 1 });
                    onLineupOpen();
                  }}
                />
              );
            })}
          </Box>

          {/* Banquillo y coach alineados horizontalmente debajo del campo */}
          <HStack mt={6} spacing={12} align="flex-start" justify="center">
            {/* Banquillo a la izquierda */}
            <VStack spacing={2} minW="340px">
              <Text fontWeight="bold" fontSize="md" color="orange.600" mb={1} alignSelf="flex-start">Banquillo</Text>
              <HStack justify="flex-start" spacing={4}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const benchPlayers = orderedPlayers.filter((pl) => pl.status === "B");
                  const playerForBench = benchPlayers[i] || null;
                  return (
                    <PlayerSlot
                      key={i}
                      role="B"
                      index={i + 1}
                      isBench
                      player={playerForBench}
                      onSelectSlot={() => {
                        setSelectedSlot({ role: "B", index: i + 1, isBench: true });
                        onLineupOpen();
                      }}
                    />
                  );
                })}
              </HStack>
            </VStack>
            {/* Coach a la derecha, separado */}
            <VStack spacing={2} minW="100px">
              <Text fontWeight="bold" fontSize="md" color="purple.600" mb={1} alignSelf="flex-start">Coach</Text>
              <Center>
                <PlayerSlot role="Coach" isBench />
              </Center>
            </VStack>
          </HStack>
        </Box>

        {/* Lista de jugadores */}
        <Box flex="1" p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="bold">📋 Mi plantilla</Text>
            <Button colorScheme="blue" size="sm" onClick={onOpen}>
              + Añadir jugador
            </Button>
          </Flex>

          {orderedPlayers.length === 0 ? (
            <Text color="gray.500">No tienes jugadores todavía</Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {orderedPlayers.map((pl) => {
                let statusLabel = "Reserva";
                let statusColor = "gray.500";
                if (pl.status === "XI") {
                  statusLabel = "XI";
                  statusColor = "green.600";
                } else if (pl.status === "B") {
                  statusLabel = "Banquillo";
                  statusColor = "orange.500";
                }
                return (
                  <HStack
                    key={pl.user_player_id}
                    justify="space-between"
                    p={2}
                    borderRadius="md"
                    bg="white"
                    boxShadow="xs"
                  >
                    <Box>
                      <Link
                        to={`/players/${pl.player_id}`}
                        style={{ color: "teal", fontWeight: "bold" }}
                      >
                        {pl.name}
                      </Link>
                      <Text fontSize="sm" color="gray.600">
                        {pl.team_name} · {pl.position}
                      </Text>
                    </Box>
                    <HStack>
                      <Text color={statusColor} fontWeight="bold" fontSize="sm" borderWidth="1px" borderColor={statusColor} borderRadius="md" px={2} py={0.5}>
                        {statusLabel}
                      </Text>
                      <Text color="blue.600">
                        €{(pl.market_value_num || 0).toLocaleString("es-ES")}
                      </Text>
                      <Text color={pl.total_points < 0 ? "red.500" : "green.600"}>
                        {pl.total_points} pts
                      </Text>
                      <Button
                        colorScheme="red"
                        size="xs"
                        onClick={() => handleRemovePlayer(pl.player_id)}
                      >
                        Eliminar
                      </Button>
                      <Button
                        colorScheme="yellow"
                        size="xs"
                        variant="outline"
                        onClick={async () => {
                          const teamId = 1;
                          await fetch(`http://localhost:4000/api/user-players/${teamId}/${pl.player_id}/status`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "R", slot_index: null }),
                          });
                          await fetchTeamAndPlayers();
                        }}
                        isDisabled={pl.status === "R"}
                      >
                        Mandar a reserva
                      </Button>
                    </HStack>
                  </HStack>
                );
              })}
            </VStack>
          )}
        </Box>
      </Flex>

      {/* Modal búsqueda de jugadores */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🔍 Buscar jugador</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <PlayerSearch onSelect={handleAddPlayer} />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal elegir jugador para un slot del campo */}
      <Modal isOpen={isLineupOpen} onClose={onLineupClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Elige jugador para {selectedSlot?.role}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={2} align="stretch">
              {myPlayers
                .filter(
                  (pl) => pl.role === selectedSlot?.role && pl.status === "R"
                )
                .map((pl) => (
                  <HStack
                    key={pl.user_player_id}
                    justify="space-between"
                    p={2}
                    borderRadius="md"
                    bg="gray.100"
                    _hover={{ bg: "gray.200", cursor: "pointer" }}
                    onClick={() => handleSetXI(pl)}
                  >
                    <Text>
                      {pl.name} ({pl.team_name})
                    </Text>
                    <Text color="blue.600">
                      €{(pl.market_value_num || 0).toLocaleString("es-ES")}
                    </Text>
                  </HStack>
                ))}
              {myPlayers.filter(
                (pl) => pl.role === selectedSlot?.role && pl.status === "R"
              ).length === 0 && (
                <Text color="gray.500">
                  No tienes reservas para esta posición
                </Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// Slot individual
import { Tooltip } from "@chakra-ui/react";

function getShortName(name = "") {
  // Devuelve primer nombre + primer apellido, o inicial + apellido si es largo
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0];
  if (parts[0].length <= 4) return parts[0] + " " + parts[1][0] + ".";
  return parts[0][0] + ". " + parts[1];
}

function getRoleColor(role) {
  switch (role) {
    case "GK": return "#3182ce"; // azul portero
    case "DEF": return "#38a169"; // verde defensa
    case "MID": return "#d69e2e"; // amarillo medio
    case "FWD": return "#e53e3e"; // rojo delantero
    default: return "gray.400";
  }
}

function PlayerSlot({ role, index, x, y, player, isBench, onSelectSlot }) {
  const bg = isBench ? "gray.200" : player ? "white" : "yellow.100";
  const borderColor = isBench ? "gray.300" : player ? getRoleColor(role) : "yellow.400";
  const fontSize = player ? "sm" : "xs";
  const fontWeight = player ? "semibold" : "bold";
  const shadow = isBench ? undefined : "0 2px 8px 0 #0002";
  const shortName = player ? getShortName(player.name) : `${role}${index || ""}`;
  const tooltipLabel = player
    ? `${player.name}${player.team_name ? "\n" + player.team_name : ""}`
    : `¡Plaza vacía! Pulsa para asignar un ${role}`;

  return (
    <Tooltip label={tooltipLabel} hasArrow placement="top" fontSize="sm">
      <Center
        w="70px"
        h="70px"
        bg={bg}
        borderRadius="full"
        borderWidth="2px"
        borderColor={borderColor}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color="gray.800"
        position={isBench ? "static" : "absolute"}
        left={isBench ? undefined : `${x}%`}
        top={isBench ? undefined : `${y}%`}
        transform={isBench ? undefined : "translate(-50%, -50%)"}
        cursor="pointer"
        _hover={{ bg: player ? "gray.100" : "yellow.200", boxShadow: "0 0 0 4px #ecc94b55" }}
        boxShadow={shadow}
        transition="all 0.15s"
        onClick={onSelectSlot}
        textAlign="center"
        px={1}
        lineHeight={1.1}
        whiteSpace="pre-line"
      >
        {player ? (
          shortName
        ) : (
          <VStack spacing={0}>
            <WarningTwoIcon color="yellow.500" boxSize={6} />
            <Text fontSize="xs" color="yellow.700" fontWeight="bold">
              Vacío
            </Text>
          </VStack>
        )}
      </Center>
    </Tooltip>
  );
}

// SUGERENCIA: Puedes añadir un resumen de puntos totales del XI, o un aviso si hay menos de 11 titulares, o un botón para autocompletar el XI con reservas disponibles.

