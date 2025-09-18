import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box, Spinner, Text,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer
} from "@chakra-ui/react";

function TeamDetailPage() {
  const { id } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("total_points");
  const [order, setOrder] = useState("DESC");

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:4000/api/teams/${id}/players?sortBy=${sortBy}&order=${order}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPlayers(data);
        } else {
          setPlayers([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error al cargar jugadores del equipo:", err);
        setPlayers([]);
        setLoading(false);
      });
  }, [id, sortBy, order]);

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
        Jugadores del equipo #{id}
      </Text>
      <TableContainer>
        <Table variant="striped" colorScheme="teal" size="sm">
          <Thead>
            <Tr>
              <Th cursor="pointer" onClick={() => handleSort("name", "ASC")}>
                Nombre{renderArrow("name")}
              </Th>
              <Th cursor="pointer" onClick={() => handleSort("position", "ASC")}>
                Posición{renderArrow("position")}
              </Th>
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
                Puntos Totales{renderArrow("total_points")}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {players.map((player) => (
              <Tr key={player.id}>
                <Td>
                  <Link to={`/players/${player.id}`} style={{ color: "teal", fontWeight: "bold" }}>
                    {player.name}
                  </Link>
                </Td>
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
    </Box>
  );
}

export default TeamDetailPage;
