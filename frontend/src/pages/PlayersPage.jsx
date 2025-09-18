import { useEffect, useState } from "react";
import {
  Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Box, Spinner, Text, Button, HStack
} from "@chakra-ui/react";

function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("total_points");
  const [order, setOrder] = useState("DESC");
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetch(
      `http://localhost:4000/api/players/top?page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}`
    )
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players);
        setTotal(data.total);
        setLoading(false);
        console.log(
          `✅ Página ${page} cargada, ordenando por ${sortBy} ${order}, jugadores: ${data.players?.length}`
        );
      })
      .catch((err) => {
        console.error("❌ Error al cargar jugadores:", err);
        setLoading(false);
      });
  }, [page, sortBy, order]);

  const totalPages = Math.ceil(total / limit);

  const getRankIcon = (index) => {
    const rank = (page - 1) * limit + index + 1;
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const renderPageNumbers = () => {
    let pages = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, page + 3);

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          onClick={() => setPage(i)}
          colorScheme={page === i ? "teal" : "gray"}
        >
          {i}
        </Button>
      );
    }
    return pages;
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

  if (loading) {
    return (
      <Box textAlign="center" mt="10">
        <Spinner size="xl" />
        <Text mt="2">Cargando jugadores...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        Ranking de Jugadores
      </Text>
      <TableContainer>
        <Table variant="striped" colorScheme="teal">
          <Thead>
            <Tr>
              <Th>Posición</Th>
              <Th cursor="pointer" onClick={() => handleSort("name", "ASC")}>
                Nombre{renderArrow("name")}
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("team_name", "ASC")}>
                Equipo{renderArrow("team_name")}
              </Th>
              <Th>Posición en campo</Th>
              <Th
                isNumeric
                cursor="pointer"
                onClick={() => handleSort("market_value", "DESC")}
              >
                Valor Mercado{renderArrow("market_value")}
              </Th>
              <Th
                isNumeric
                cursor="pointer"
                onClick={() => handleSort("total_points", "DESC")}
              >
                Puntos{renderArrow("total_points")}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {players.map((player, index) => (
              <Tr key={player.id}>
                <Td>{getRankIcon(index)}</Td>
                <Td>{player.name}</Td>
                <Td>{player.team_name}</Td>
                <Td>{player.position}</Td>
                <Td isNumeric>
                  {typeof player.market_value_num === "number" && !isNaN(player.market_value_num)
                    ? player.market_value_num.toLocaleString("es-ES")
                    : "-"}
                </Td>
                <Td
                  isNumeric
                  color={player.total_points < 0 ? "red.500" : "green.600"}
                >
                  {player.total_points}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Paginador contextual */}
      <HStack justify="center" mt={6} spacing={2}>
        <Button onClick={() => setPage(1)} isDisabled={page === 1}>
          ⏮ Primero
        </Button>
        <Button onClick={() => setPage((p) => Math.max(p - 1, 1))} isDisabled={page === 1}>
          ◀ Anterior
        </Button>

        {renderPageNumbers()}

        <Button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          isDisabled={page === totalPages}
        >
          Siguiente ▶
        </Button>
        <Button onClick={() => setPage(totalPages)} isDisabled={page === totalPages}>
          Último ⏭
        </Button>
      </HStack>
    </Box>
  );
}

export default PlayersPage;
