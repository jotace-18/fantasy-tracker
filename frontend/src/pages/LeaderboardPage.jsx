import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Spinner,
  Badge,
  Flex,
  Text,
} from "@chakra-ui/react";

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJornada, setSelectedJornada] = useState("total");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(
          "http://localhost:4000/api/participants/leaderboard"
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("❌ Error cargando leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // 🔢 Calcular jornadas disponibles dinámicamente
  const allJornadas = Array.from(
    new Set(data.flatMap((p) => p.history.map((h) => h.jornada)))
  ).sort((a, b) => a - b);

  // 🔄 Obtener puntos por jornada o total
  const getPoints = (participant) => {
    if (selectedJornada === "total") return participant.total_points;
    const jornadaPoints = participant.history.find(
      (h) => h.jornada === Number(selectedJornada)
    );
    return jornadaPoints ? jornadaPoints.points : 0;
  };

  // 🎨 Escala armónica de colores (más rango que un semáforo)
  const getColor = (points) => {
    if (points >= 90) return "green.600";
    if (points >= 75) return "teal.500";
    if (points >= 60) return "blue.500";
    if (points >= 45) return "cyan.400";
    if (points >= 30) return "yellow.500";
    if (points >= 20) return "orange.400";
    if (points >= 10) return "red.400";
    return "purple.500";
  };

  // 📊 Ordenar ranking
  const sorted = [...data].sort((a, b) => getPoints(b) - getPoints(a));

  return (
    <Box p={8}>
      {/* Título + selector en la misma línea */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Heading size="lg" display="flex" alignItems="center" gap={2}>
          🏆 Leaderboard Fantasy
        </Heading>

        <Select
          maxW="220px"
          value={selectedJornada}
          onChange={(e) => setSelectedJornada(e.target.value)}
          boxShadow="sm"
          borderColor="gray.300"
        >
          <option value="total">🌍 Total</option>
          {allJornadas.map((j) => (
            <option key={j} value={j}>
              Jornada {j}
            </option>
          ))}
        </Select>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" h="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : (
        <Table variant="simple" size="md">
          <Thead bg="gray.50">
            <Tr>
              <Th>#</Th>
              <Th>Participante</Th>
              <Th isNumeric>Puntos</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sorted.map((p, i) => {
              const points = getPoints(p);
              let badge;
              if (i === 0) badge = <Badge colorScheme="yellow">🥇</Badge>;
              else if (i === 1) badge = <Badge colorScheme="gray">🥈</Badge>;
              else if (i === 2) badge = <Badge colorScheme="orange">🥉</Badge>;

              // 🎨 Fila con un toque sutil para top 3
              const bgRow =
                i === 0
                  ? "yellow.50"
                  : i === 1
                  ? "gray.50"
                  : i === 2
                  ? "orange.50"
                  : "white";

              return (
                <Tr
                  key={p.id}
                  bg={bgRow}
                  _hover={{ bg: "gray.100" }}
                  transition="all 0.2s ease"
                >
                  <Td fontWeight="bold">
                    {i + 1} {badge}
                  </Td>
                  <Td>
                    {p.name === "Jc" ? (
                      <Text
                        as={"a"}
                        href="/my-team"
                        fontWeight={i < 3 ? "semibold" : "medium"}
                        color="blue.600"
                        _hover={{ textDecoration: "underline", color: "blue.800" }}
                      >
                        {p.name}
                      </Text>
                    ) : (
                      <Text
                        as={"a"}
                        href={`/participants/${p.id}`}
                        fontWeight={i < 3 ? "semibold" : "medium"}
                        color="blue.600"
                        _hover={{ textDecoration: "underline", color: "blue.800" }}
                      >
                        {p.name}
                      </Text>
                    )}
                  </Td>
                  <Td isNumeric>
                    <Badge
                      color="white"
                      bg={getColor(points)}
                      px={4}
                      py={2}
                      borderRadius="full"
                      fontSize="md"
                      fontWeight="bold"
                      boxShadow="sm"
                    >
                      {points}
                    </Badge>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </Box>
  );
}
