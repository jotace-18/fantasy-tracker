// src/pages/TeamsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Box, Spinner, Text, Badge
} from "@chakra-ui/react";

function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:4000/api/teams")
      .then((res) => res.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          if (a.position == null) return 1;
          if (b.position == null) return -1;
          return a.position - b.position;
        });
        setTeams(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error al cargar equipos:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" mt="10">
        <Spinner size="xl" />
        <Text mt="2">Cargando clasificación de equipos...</Text>
      </Box>
    );
  }

  const getBadgeColor = (pos) => {
    if (!pos) return "gray";
    if (pos >= 1 && pos <= 4) return "green";
    if (pos === 5 || pos === 6) return "yellow";
    if (pos >= teams.length - 2) return "red";
    return "blue";
  };

  return (
    <Box p={4}>
      <Text fontSize="xl" fontWeight="bold" mb={4}>
        Clasificación de LaLiga
      </Text>
      <TableContainer>
        <Table variant="striped" colorScheme="teal" size="sm">
          <Thead>
            <Tr>
              <Th>Pos</Th>
              <Th>Equipo</Th>
              <Th isNumeric>Puntos</Th>
              <Th isNumeric>PJ</Th>
              <Th isNumeric>G</Th>
              <Th isNumeric>E</Th>
              <Th isNumeric>P</Th>
              <Th isNumeric>GF</Th>
              <Th isNumeric>GC</Th>
              <Th isNumeric>DG</Th>
            </Tr>
          </Thead>
          <Tbody>
            {teams.map((team) => (
              <Tr key={team.id}>
                <Td>
                  <Badge
                    colorScheme={getBadgeColor(team.position)}
                    fontSize="sm"
                  >
                    {team.position ?? "-"}
                  </Badge>
                </Td>
                <Td fontWeight="medium">
                  <Link to={`/teams/${team.id}`}>{team.name}</Link>
                </Td>
                <Td isNumeric>{team.points ?? "-"}</Td>
                <Td isNumeric>{team.played ?? "-"}</Td>
                <Td isNumeric color="green.600">{team.won ?? "-"}</Td>
                <Td isNumeric color="yellow.600">{team.drawn ?? "-"}</Td>
                <Td isNumeric color="red.600">{team.lost ?? "-"}</Td>
                <Td isNumeric>{team.gf ?? "-"}</Td>
                <Td isNumeric>{team.ga ?? "-"}</Td>
                <Td
                  isNumeric
                  color={
                    team.gd > 0
                      ? "green.600"
                      : team.gd < 0
                      ? "red.600"
                      : "gray.600"
                  }
                >
                  {team.gd ?? "-"}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default TeamsPage;
