import { useState } from "react";
import {
  Box,
  Flex,
  Select,
  Text,
  VStack,
  HStack,
  Center,
} from "@chakra-ui/react";

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

  // ⚡ De momento sin datos reales → array vacío
  const myPlayers = [];

  // Jugadores ordenados
  const orderedPlayers = [...myPlayers].sort((a, b) => {
    const posOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    if (posOrder[a.position] !== posOrder[b.position]) {
      return posOrder[a.position] - posOrder[b.position];
    }
    return b.points - a.points;
  });

  const positions = FORMATION_MAP[formation];

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
                  (pl) => pl.status === "XI" && pl.position === p.role
                )}
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
          <Text fontWeight="bold" mb={3}>
            📋 Mi plantilla
          </Text>
          {orderedPlayers.length === 0 ? (
            <Text color="gray.500">No tienes jugadores todavía</Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {orderedPlayers.map((pl) => (
                <HStack
                  key={pl.id}
                  justify="space-between"
                  p={2}
                  borderRadius="md"
                  bg="white"
                  boxShadow="xs"
                >
                  <Text>
                    {pl.name} ({pl.position})
                  </Text>
                  <HStack>
                    <Text color="gray.600">{pl.points} pts</Text>
                    {pl.status === "XI" && (
                      <Box as="span" fontWeight="bold" color="green.500">
                        U
                      </Box>
                    )}
                    {pl.status === "B" && (
                      <Box as="span" fontWeight="bold" color="orange.400">
                        B
                      </Box>
                    )}
                  </HStack>
                </HStack>
              ))}
            </VStack>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

// Slot individual
function PlayerSlot({ role, index, x, y, player, isBench }) {
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
    >
      {player ? player.name : `${role}${index || ""}`}
    </Center>
  );
}
