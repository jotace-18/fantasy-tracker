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
  Tooltip,
} from "@chakra-ui/react";
import { FORMATIONS, FORMATION_MAP } from "../utils/formations";
import { Link } from "react-router-dom";
import PlayerSearch from "../components/PlayerSearch";
import { WarningTwoIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import useCumulativeRankHistory from "../hooks/useCumulativeRankHistory";
import CumulativeRankChart from "../components/CumulativeRankChart";
import PlayerTransferLog from "../components/PlayerTransferLog";

export default function MyTeamPage() {
  const [formation, setFormation] = useState("4-3-3");
  const [myPlayers, setMyPlayers] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [money, setMoney] = useState(null);
  const [refreshKey] = useState(0);

  // Modales
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isLineupOpen,
    onOpen: onLineupOpen,
    onClose: onLineupClose,
  } = useDisclosure();

  // Id del usuario actual (hardcode por ahora)
  const myParticipantId = 8;
  const { history: cumulativeRankHistory, loading: loadingCumulativeRank } =
    useCumulativeRankHistory(myParticipantId);

  // 📌 Cargar jugadores y formación persistente
  useEffect(() => {
    fetchTeamAndPlayers();
  }, []);

  const fetchTeamAndPlayers = async () => {
    try {
      const teamId = myParticipantId;

      // Obtener formación
      const teamRes = await fetch(`http://localhost:4000/api/participants/${teamId}`);
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (teamData.formation) setFormation(teamData.formation);
      }

      // Obtener plantilla (participant_players)
      const res = await fetch(`/api/participant-players/${teamId}/team`);
      if (!res.ok) {
        console.warn("⚠️ No se encontraron jugadores:", res.status);
        setMyPlayers([]);
        return;
      }
      const data = await res.json();
      setMyPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando plantilla o formación:", err);
      setMyPlayers([]);
    }
  };

  // Cargar dinero del usuario
  useEffect(() => {
    async function fetchMoney() {
      try {
        const res = await fetch(
          `http://localhost:4000/api/participants/${myParticipantId}/money`
        );
        if (res.ok) {
          const data = await res.json();
          setMoney(data.money);
        } else {
          setMoney(null);
        }
      } catch {
        setMoney(null);
      }
    }
    fetchMoney();
  }, [myParticipantId]);

  // Ordenar jugadores
  const orderedPlayers = [...myPlayers].sort((a, b) => {
    const posOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    if (posOrder[a.role] !== posOrder[b.role]) {
      return posOrder[a.role] - posOrder[b.role];
    }
    return (b.total_points || 0) - (a.total_points || 0);
  });

  const positions = FORMATION_MAP[formation];

  // ➕ Añadir jugador
  const handleAddPlayer = async (player) => {
    try {
      const teamId = myParticipantId;
      if (myPlayers.some((pl) => pl.player_id === player.id)) {
        console.warn("⚠️ El jugador ya está en tu plantilla");
        return;
      }

      const res = await fetch(`/api/participant-players/${teamId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: player.id,
          buy_price: player.market_value_num || 0,
          status: "R",
          slot_index: null,
        }),
      });
      if (!res.ok) throw new Error("Error al añadir jugador");

      await fetchTeamAndPlayers();
      onClose();
    } catch (err) {
      console.error("❌ Error añadiendo jugador:", err);
    }
  };

  // ⚽ Asignar jugador al XI
  const handleSetXI = async (player) => {
    try {
      const teamId = myParticipantId;
      if (!selectedSlot) return;

      // Si había jugador en el slot → mandarlo a reserva
      const prevPlayer = myPlayers.find(
        (pl) => pl.slot_index === selectedSlot.index && pl.status === (selectedSlot.isBench ? "B" : "XI")
      );
      if (prevPlayer) {
        await fetch(`/api/participant-players/${teamId}/team/${prevPlayer.player_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "R", slot_index: null }),
        });
      }

      // Nuevo jugador al XI o banquillo en slot
      await fetch(`/api/participant-players/${teamId}/team/${player.player_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedSlot.isBench ? "B" : "XI", slot_index: selectedSlot.index }),
      });

      await fetchTeamAndPlayers();
      onLineupClose();
    } catch (err) {
      console.error("❌ Error actualizando status:", err);
    }
  };

  // ❌ Eliminar jugador
  const handleRemovePlayer = async (playerId) => {
    try {
      const teamId = myParticipantId;
      const res = await fetch(`/api/participant-players/${teamId}/team/${playerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar jugador");
      await fetchTeamAndPlayers();
    } catch (err) {
      console.error("❌ Error eliminando jugador:", err);
    }
  };

  // 🔄 Cambiar formación
  const handleFormationChange = async (e) => {
    const newFormation = e.target.value;
    setFormation(newFormation);
    try {
      await fetch(
        `http://localhost:4000/api/participants/${myParticipantId}/formation`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formation: newFormation }),
        }
      );
    } catch (err) {
      console.warn("No se pudo actualizar la formación:", err);
    }

    // Ajustar XI y reservas
    const newPositions = FORMATION_MAP[newFormation];
    const slotsByRole = {};
    newPositions.forEach((p, i) => {
      if (!slotsByRole[p.role]) slotsByRole[p.role] = [];
      slotsByRole[p.role].push(i + 1);
    });

    const xiByRole = {};
    myPlayers.filter((pl) => pl.status === "XI").forEach((pl) => {
      if (!xiByRole[pl.role]) xiByRole[pl.role] = [];
      xiByRole[pl.role].push(pl);
    });

    const updates = [];
    Object.entries(slotsByRole).forEach(([role, slotIndexes]) => {
      const players = xiByRole[role] || [];
      const sorted = [...players].sort((a, b) => (a.slot_index || 0) - (b.slot_index || 0));
      for (let i = 0; i < sorted.length; i++) {
        const pl = sorted[i];
        if (i < slotIndexes.length) {
          updates.push(
            fetch(`/api/participant-players/${myParticipantId}/team/${pl.player_id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "XI", slot_index: slotIndexes[i] }),
            })
          );
        } else {
          updates.push(
            fetch(`/api/participant-players/${myParticipantId}/team/${pl.player_id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "R", slot_index: null }),
            })
          );
        }
      }
    });

    Object.keys(xiByRole).forEach((role) => {
      if (!slotsByRole[role]) {
        xiByRole[role].forEach((pl) => {
          updates.push(
            fetch(`/api/participant-players/${myParticipantId}/team/${pl.player_id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "R", slot_index: null }),
            })
          );
        });
      }
    });

    await Promise.all(updates);
    await fetchTeamAndPlayers();
  };

    // Calcular valor de mercado XI
  const totalMarketValueXI = myPlayers
    .filter((pl) => pl.status === "XI")
    .reduce((sum, pl) => sum + (pl.market_value_num || 0), 0);

  return (
    <Box p={6}>
      <Flex align="center" mb={4} gap={6}>
        <Flex align="center" gap={2}>
          <Box as="span" fontSize="2xl" color="blue.400">
            <span role="img" aria-label="fútbol">⚽</span>
          </Box>
          <Text fontSize="2xl" fontWeight="bold">Mi Equipo Fantasy</Text>
        </Flex>
        <Box
          bg="blue.50"
          px={4}
          py={1}
          borderRadius="md"
          boxShadow="sm"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <InfoOutlineIcon color="blue.400" />
          <Text fontSize="md" color="blue.800" fontWeight="semibold">Valor XI:</Text>
          <Text fontSize="lg" color="blue.700" fontWeight="bold">
            €{totalMarketValueXI.toLocaleString("es-ES")}
          </Text>
        </Box>
      </Flex>

      {/* Gráfica + dinero + log */}
      <Flex direction={{ base: "column", md: "row" }} gap={6} mb={8} align="stretch">
        <Box flex={2.5} minW={0}>
          {loadingCumulativeRank ? (
            <Flex justify="center" align="center" h="120px">
              <Spinner />
            </Flex>
          ) : (
            <>
              <CumulativeRankChart history={cumulativeRankHistory} />
              <Flex justify="center" mt={4}>
                <Box
                  bg="yellow.200"
                  px={12}
                  py={3}
                  borderRadius="xl"
                  boxShadow="lg"
                  display="flex"
                  alignItems="center"
                  gap={6}
                  minW="360px"
                  maxW="500px"
                  justifyContent="center"
                >
                  <Text fontSize="2xl" color="yellow.900" fontWeight="extrabold">
                    Dinero actual
                  </Text>
                  <Text fontSize="4xl" color="yellow.700" fontWeight="black" ml={4}>
                    {money === null
                      ? <Spinner size="md" />
                      : `€${Number(money).toLocaleString("es-ES")}`}
                  </Text>
                </Box>
              </Flex>
            </>
          )}
        </Box>

        <Box flex={1} minW="420px" maxW="520px">
          <PlayerTransferLog refreshKey={refreshKey} />
        </Box>
      </Flex>

      {/* Selector de formación */}
      <Flex mb={6} align="center" gap={3}>
        <Text fontWeight="semibold">Formación:</Text>
        <Select value={formation} onChange={handleFormationChange} maxW="200px">
          {FORMATIONS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </Select>
      </Flex>

      <Flex gap={8}>
        {/* Campo */}
        <Box flex="1">
          <Box
            bg="green.700"
            borderRadius="lg"
            p={2}
            h="600px"
            position="relative"
            boxShadow="md"
          >
            {positions.map((p, i) => {
              const playerForSlot = myPlayers.find(
                (pl) => pl.status === "XI" && pl.slot_index === i + 1
              );
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

          {/* Banquillo + Coach */}
          <HStack mt={6} spacing={12} align="flex-start" justify="center">
            <VStack spacing={2} minW="340px">
              <Text fontWeight="bold" fontSize="md" color="orange.600" mb={1}>Banquillo</Text>
              <HStack justify="flex-start" spacing={4}>
                {Array.from({ length: 4 }).map((_, i) => {
                  const benchPlayers = myPlayers.filter((pl) => pl.status === "B");
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
            <VStack spacing={2} minW="100px">
              <Text fontWeight="bold" fontSize="md" color="purple.600" mb={1}>Coach</Text>
              <Center><PlayerSlot role="Coach" isBench /></Center>
            </VStack>
          </HStack>
        </Box>

        {/* Lista de jugadores */}
        <Box flex="1" p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontWeight="bold">📋 Mi plantilla</Text>
            <Button colorScheme="blue" size="sm" onClick={onOpen}>+ Añadir jugador</Button>
          </Flex>

          {orderedPlayers.length === 0 ? (
            <Text color="gray.500">No tienes jugadores todavía</Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {orderedPlayers.map((pl) => {
                let statusLabel = "Reserva";
                let statusColor = "gray.500";
                if (pl.status === "XI") { statusLabel = "XI"; statusColor = "green.600"; }
                else if (pl.status === "B") { statusLabel = "Banquillo"; statusColor = "orange.500"; }
                else if (pl.status === "R") { statusLabel = "Reserva"; statusColor = "gray.500"; }

                return (
                  <HStack
                    key={pl.player_id}
                    justify="space-between"
                    p={2}
                    borderRadius="md"
                    bg="white"
                    boxShadow="xs"
                  >
                    <Box>
                      <Link to={`/players/${pl.player_id}`} style={{ color: "teal", fontWeight: "bold" }}>
                        {pl.name}
                      </Link>
                      <Text fontSize="sm" color="gray.600">
                        {pl.team_name} · {pl.position}
                      </Text>
                    </Box>
                    <HStack>
                      <Text
                        color={statusColor}
                        fontWeight="bold"
                        fontSize="sm"
                        borderWidth="1px"
                        borderColor={statusColor}
                        borderRadius="md"
                        px={2}
                        py={0.5}
                      >
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
                          const teamId = 8;
                          await fetch(`/api/participant-players/${teamId}/team/${pl.player_id}`, {
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

      {/* Modal búsqueda */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>🔍 Buscar jugador</ModalHeader>
          <ModalCloseButton />
          <ModalBody><PlayerSearch onSelect={handleAddPlayer} /></ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal asignar jugador a slot */}
      <Modal isOpen={isLineupOpen} onClose={onLineupClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Elige jugador para {selectedSlot?.role}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={2} align="stretch">
              {selectedSlot &&
                myPlayers
                  .filter((pl) => {
                    if (pl.status !== "R") return false;
                    if (selectedSlot.isBench) return true;
                    // Filtrar por posición para slots de campo
                    const posMap = {
                      GK: ["POR", "GK", "Portero"],
                      DEF: ["DEF", "Defensa"],
                      MID: ["MID", "Mediocampista", "Centrocampista"],
                      FWD: ["FWD", "Delantero"],
                    };
                    const slotRole = selectedSlot.role;
                    const playerPos = (pl.position || "").toUpperCase();
                    // Permitir si la posición del jugador coincide con el slot
                    return posMap[slotRole]?.some((p) => playerPos.includes(p.toUpperCase()));
                  })
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
                myPlayers.filter((pl) => {
                  if (pl.status !== "R") return false;
                  if (selectedSlot.isBench) return true;
                  const posMap = {
                    GK: ["POR", "GK", "Portero"],
                    DEF: ["DEF", "Defensa"],
                    MID: ["MID", "Mediocampista", "Centrocampista"],
                    FWD: ["FWD", "Delantero"],
                  };
                  const slotRole = selectedSlot.role;
                  const playerPos = (pl.position || "").toUpperCase();
                  return posMap[slotRole]?.some((p) => playerPos.includes(p.toUpperCase()));
                }).length === 0 && (
                  <Text color="gray.500">No tienes reservas disponibles para esta posición</Text>
                )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

// Helpers
function getShortName(name = "") {
  if (!name) return "";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0];
  if (parts[0].length <= 4) return parts[0] + " " + parts[1][0] + ".";
  return parts[0][0] + ". " + parts[1];
}

function getRoleColor(role) {
  switch (role) {
    case "GK": return "#3182ce";
    case "DEF": return "#38a169";
    case "MID": return "#d69e2e";
    case "FWD": return "#e53e3e";
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
        _hover={{
          bg: player ? "gray.100" : "yellow.200",
          boxShadow: "0 0 0 4px #ecc94b55",
        }}
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
            <Text fontSize="xs" color="yellow.700" fontWeight="bold">Vacío</Text>
          </VStack>
        )}
      </Center>
    </Tooltip>
  );
}


