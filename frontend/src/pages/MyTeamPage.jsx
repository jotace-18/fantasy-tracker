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
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import PlayerSearch from "../components/PlayerSearch";

// Todas las formaciones soportadas
const FORMATIONS = [
  "5-4-1",
  "5-3-2",
  "5-2-3",
  "4-5-1",
  "4-4-2",
  "4-3-3",
  "4-2-4",
  "3-6-1",
  "3-5-2",
  "3-4-3",
  "3-3-4",
];

// 📌 Mapa de formaciones con coordenadas (x%, y%)
const FORMATION_MAP = {
  "4-3-3": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 25, y: 22 },
    { role: "DEF", x: 40, y: 22 },
    { role: "DEF", x: 60, y: 22 },
    { role: "DEF", x: 75, y: 22 },
    { role: "MID", x: 35, y: 46 },
    { role: "MID", x: 50, y: 46 },
    { role: "MID", x: 65, y: 46 },
    { role: "FWD", x: 30, y: 66 },
    { role: "FWD", x: 50, y: 70 },
    { role: "FWD", x: 70, y: 66 },
  ],
  "4-4-2": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 25, y: 22 },
    { role: "DEF", x: 40, y: 22 },
    { role: "DEF", x: 60, y: 22 },
    { role: "DEF", x: 75, y: 22 },
    { role: "MID", x: 30, y: 46 },
    { role: "MID", x: 45, y: 46 },
    { role: "MID", x: 55, y: 46 },
    { role: "MID", x: 70, y: 46 },
    { role: "FWD", x: 40, y: 66 },
    { role: "FWD", x: 60, y: 66 },
  ],
  "4-5-1": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 25, y: 22 },
    { role: "DEF", x: 40, y: 22 },
    { role: "DEF", x: 60, y: 22 },
    { role: "DEF", x: 75, y: 22 },
    { role: "MID", x: 25, y: 46 },
    { role: "MID", x: 40, y: 46 },
    { role: "MID", x: 50, y: 50 },
    { role: "MID", x: 60, y: 46 },
    { role: "MID", x: 75, y: 46 },
    { role: "FWD", x: 50, y: 70 },
  ],
  "4-2-4": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 25, y: 22 },
    { role: "DEF", x: 40, y: 22 },
    { role: "DEF", x: 60, y: 22 },
    { role: "DEF", x: 75, y: 22 },
    { role: "MID", x: 40, y: 46 },
    { role: "MID", x: 60, y: 46 },
    { role: "FWD", x: 25, y: 66 },
    { role: "FWD", x: 40, y: 66 },
    { role: "FWD", x: 60, y: 66 },
    { role: "FWD", x: 75, y: 66 },
  ],
  "5-4-1": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 20, y: 22 },
    { role: "DEF", x: 35, y: 22 },
    { role: "DEF", x: 50, y: 22 },
    { role: "DEF", x: 65, y: 22 },
    { role: "DEF", x: 80, y: 22 },
    { role: "MID", x: 30, y: 46 },
    { role: "MID", x: 45, y: 46 },
    { role: "MID", x: 55, y: 46 },
    { role: "MID", x: 70, y: 46 },
    { role: "FWD", x: 50, y: 70 },
  ],
  "5-3-2": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 20, y: 22 },
    { role: "DEF", x: 35, y: 22 },
    { role: "DEF", x: 50, y: 22 },
    { role: "DEF", x: 65, y: 22 },
    { role: "DEF", x: 80, y: 22 },
    { role: "MID", x: 35, y: 46 },
    { role: "MID", x: 50, y: 46 },
    { role: "MID", x: 65, y: 46 },
    { role: "FWD", x: 40, y: 70 },
    { role: "FWD", x: 60, y: 70 },
  ],
  "5-2-3": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 20, y: 22 },
    { role: "DEF", x: 35, y: 22 },
    { role: "DEF", x: 50, y: 22 },
    { role: "DEF", x: 65, y: 22 },
    { role: "DEF", x: 80, y: 22 },
    { role: "MID", x: 45, y: 46 },
    { role: "MID", x: 55, y: 46 },
    { role: "FWD", x: 30, y: 70 },
    { role: "FWD", x: 50, y: 75 },
    { role: "FWD", x: 70, y: 70 },
  ],
  "3-6-1": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 35, y: 22 },
    { role: "DEF", x: 50, y: 22 },
    { role: "DEF", x: 65, y: 22 },
    { role: "MID", x: 20, y: 46 },
    { role: "MID", x: 35, y: 46 },
    { role: "MID", x: 45, y: 50 },
    { role: "MID", x: 55, y: 50 },
    { role: "MID", x: 65, y: 46 },
    { role: "MID", x: 80, y: 46 },
    { role: "FWD", x: 50, y: 75 },
  ],
  "3-5-2": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 35, y: 22 },
    { role: "DEF", x: 50, y: 22 },
    { role: "DEF", x: 65, y: 22 },
    { role: "MID", x: 30, y: 46 },
    { role: "MID", x: 45, y: 46 },
    { role: "MID", x: 55, y: 46 },
    { role: "MID", x: 70, y: 46 },
    { role: "FWD", x: 40, y: 70 },
    { role: "FWD", x: 60, y: 70 },
  ],
  "3-4-3": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 35, y: 22 },
    { role: "DEF", x: 50, y: 22 },
    { role: "DEF", x: 65, y: 22 },
    { role: "MID", x: 35, y: 46 },
    { role: "MID", x: 50, y: 46 },
    { role: "MID", x: 65, y: 46 },
    { role: "FWD", x: 30, y: 70 },
    { role: "FWD", x: 50, y: 75 },
    { role: "FWD", x: 70, y: 70 },
  ],
  "3-3-4": [
    { role: "GK", x: 50, y: 8 },
    { role: "DEF", x: 35, y: 22 },
    { role: "DEF", x: 50, y: 22 },
    { role: "DEF", x: 65, y: 22 },
    { role: "MID", x: 40, y: 46 },
    { role: "MID", x: 60, y: 46 },
    { role: "MID", x: 50, y: 50 },
    { role: "FWD", x: 25, y: 66 },
    { role: "FWD", x: 40, y: 70 },
    { role: "FWD", x: 60, y: 70 },
    { role: "FWD", x: 75, y: 66 },
  ],
};

export default function MyTeamPage() {
  const [formation, setFormation] = useState("4-3-3");
  const [myPlayers, setMyPlayers] = useState([]); // ⚡ plantilla cargada desde DB
  const [selectedSlot, setSelectedSlot] = useState(null); // guarda { role, index }

  // Modal buscar jugadores (pool global)
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Modal asignar jugador a slot del campo
  const {
    isOpen: isLineupOpen,
    onOpen: onLineupOpen,
    onClose: onLineupClose,
  } = useDisclosure();

  // 📌 Cargar jugadores de la DB al montar el componente
  useEffect(() => {
    const fetchMyPlayers = async () => {
      try {
        const teamId = 1; // ⚡ por ahora hardcodeado
        const res = await fetch(`http://localhost:4000/api/user-players/${teamId}`);
        if (!res.ok) {
          console.warn("⚠️ No se encontraron jugadores:", res.status);
          setMyPlayers([]);
          return;
        }
        const data = await res.json();
        setMyPlayers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error cargando plantilla:", err);
        setMyPlayers([]);
      }
    };
    fetchMyPlayers();
  }, []);

  // Jugadores ordenados
  const orderedPlayers = [...myPlayers].sort((a, b) => {
    const posOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    if (posOrder[a.role] !== posOrder[b.role]) {
      return posOrder[a.role] - posOrder[b.role];
    }
    return (b.total_points || 0) - (a.total_points || 0);
  });

  const positions = FORMATION_MAP[formation];

  // Handler cuando seleccionas un jugador en PlayerSearch
  const handleAddPlayer = async (player) => {
    try {
      const teamId = 1;
      const res = await fetch(`http://localhost:4000/api/user-players/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: player.id,
          buy_price: player.market_value_num || 0,
        }),
      });
      if (!res.ok) throw new Error("Error al añadir jugador");

      const newPlayer = await res.json();
      setMyPlayers((prev) => [...prev, { ...player, ...newPlayer, status: "R" }]);
      onClose();
    } catch (err) {
      console.error("❌ Error añadiendo jugador:", err);
    }
  };

  // Handler para asignar jugador al XI
  const handleSetXI = async (player) => {
    try {
      const teamId = 1;
      await fetch(
        `http://localhost:4000/api/user-players/${teamId}/${player.player_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "XI" }),
        }
      );

      setMyPlayers((prev) =>
        prev.map((pl) =>
          pl.player_id === player.player_id ? { ...pl, status: "XI" } : pl
        )
      );

      onLineupClose();
    } catch (err) {
      console.error("❌ Error actualizando status:", err);
    }
  };

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        ⚽ Mi Equipo Fantasy
      </Text>

      {/* Selector de formación */}
      <Flex mb={6} align="center" gap={3}>
        <Text fontWeight="semibold">Formación:</Text>
        <Select
          value={formation}
          onChange={(e) => setFormation(e.target.value)}
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
        {/* Campo + banquillo */}
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
            {positions.map((p, i) => (
              <PlayerSlot
                key={i}
                role={p.role}
                x={p.x}
                y={p.y}
                index={i + 1}
                player={orderedPlayers.find(
                  (pl) => pl.status === "XI" && pl.role === p.role
                )}
                onSelectSlot={() => {
                  setSelectedSlot(p);
                  onLineupOpen();
                }}
              />
            ))}
          </Box>

          {/* Banquillo debajo del campo */}
          <VStack mt={6} spacing={4}>
            <HStack justify="center" spacing={4}>
              {Array.from({ length: 4 }).map((_, i) => (
                <PlayerSlot key={i} role="B" index={i + 1} isBench />
              ))}
            </HStack>
            <HStack justify="center">
              <PlayerSlot role="Coach" isBench />
            </HStack>
          </VStack>
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
              {orderedPlayers.map((pl) => (
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
                    <Text color="blue.600">
                      €{(pl.market_value_num || 0).toLocaleString("es-ES")}
                    </Text>
                    <Text color={pl.total_points < 0 ? "red.500" : "green.600"}>
                      {pl.total_points} pts
                    </Text>
                  </HStack>
                </HStack>
              ))}
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
                  (pl) =>
                    pl.role === selectedSlot?.role && pl.status === "R"
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
function PlayerSlot({ role, index, x, y, player, isBench, onSelectSlot }) {
  return (
    <Center
      w="70px"
      h="70px"
      bg={isBench ? "gray.200" : "gray.100"}
      borderRadius="full"
      fontSize="sm"
      fontWeight="bold"
      color="gray.700"
      position={isBench ? "static" : "absolute"}
      left={isBench ? undefined : `${x}%`}
      top={isBench ? undefined : `${y}%`}
      transform={isBench ? undefined : "translate(-50%, -50%)"}
      cursor="pointer"
      _hover={{ bg: "gray.300" }}
      boxShadow={isBench ? undefined : "0 0 0 3px #3182ce55"}
      onClick={onSelectSlot}
    >
      {player ? player.name : `${role}${index || ""}`}
    </Center>
  );
}



