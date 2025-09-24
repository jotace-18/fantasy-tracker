// Normaliza un string: quita tildes, pasa a minúsculas y recorta espacios
function normalizaNombre(nombre) {
  return nombre
    ? nombre.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()
    : "";
}
import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box, Spinner, Text, Heading, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Badge, Divider, SimpleGrid, VStack, HStack, Flex, Card, CardHeader, CardBody
} from "@chakra-ui/react";

function TeamDetailPage() {
  const { id } = useParams();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("total_points");
  const [order, setOrder] = useState("DESC");

  const [teams, setTeams] = useState([]);
  const [equipoActualNombre, setEquipoActualNombre] = useState("");
  const [calendar, setCalendar] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  // --- Fetch plantilla ---
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:4000/api/teams/${id}/players?sortBy=${sortBy}&order=${order}`)
      .then((res) => res.json())
      .then((data) => {
        setPlayers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error al cargar jugadores del equipo:", err);
        setPlayers([]);
        setLoading(false);
      });
  }, [id, sortBy, order]);

  // --- Fetch clasificación + calendario + reloj ---
  useEffect(() => {
    setLoadingExtra(true);
    Promise.all([
      fetch("http://localhost:4000/api/teams").then((res) => res.json()),
      fetch("http://localhost:4000/api/calendar/next?limit=38").then((res) => res.json()),
      fetch("http://localhost:4000/api/clock").then((res) => res.json())
    ])
      .then(([teamsData, calendarData, clockData]) => {
        const sorted = [...teamsData].sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
        setTeams(sorted);

        // Guardar el nombre del equipo actual
        const equipo = sorted.find(t => String(t.id) === String(id));
        setEquipoActualNombre(equipo ? equipo.name : "");

        const now = new Date(clockData.currentTime);

        // Mostrar desde la primera jornada con fecha_cierre futura (o dentro de tolerancia), y las dos siguientes aunque tengan fecha_cierre null
        const TOLERANCIA_MS = 3 * 24 * 60 * 60 * 1000;
        let idxActual = 0;
        for (let i = 0; i < calendarData.length; i++) {
          const j = calendarData[i];
          if (j.fecha_cierre) {
            const cierre = new Date(j.fecha_cierre);
            if (cierre.getTime() + TOLERANCIA_MS > now.getTime()) {
              idxActual = i;
              break;
            }
          }
        }
        // Si el reloj está después de todas las fechas de cierre + tolerancia, mostrar las últimas 3
        if (idxActual > calendarData.length - 3) idxActual = Math.max(0, calendarData.length - 3);
        const proximas = calendarData.slice(idxActual, idxActual + 3);
        setCalendar(proximas);

        setLoadingExtra(false);
      })
      .catch((err) => {
        console.error("❌ Error al cargar extra:", err);
        setLoadingExtra(false);
      });
  }, [id]);



  // --- Clasificación reducida (2 arriba y 2 abajo del actual) ---
  const surroundingTeams = useMemo(() => {
    if (!teams.length) return [];
    const idx = teams.findIndex((t) => String(t.id) === String(id));
    if (idx === -1) return [];
    return teams.slice(Math.max(0, idx - 2), idx + 3);
  }, [teams, id]);

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

  const getBadgeColor = (pos) => {
    if (!pos) return "gray";
    if (pos >= 1 && pos <= 4) return "green";
    if (pos === 5 || pos === 6) return "yellow";
    if (pos >= teams.length - 2) return "red";
    return "blue";
  };

  if (loading) {
    return (
      <Box textAlign="center" mt="10">
        <Spinner size="xl" />
        <Text mt="2">Cargando equipo...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="1400px" mx="auto">
      {/* Header */}
      <Heading size="lg" mb={6} textAlign="center">
        {equipoActualNombre ? `Detalles del ${equipoActualNombre}` : `Detalle del Equipo #${id}`}
      </Heading>

      {/* Layout en 2 columnas */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {/* --- Plantilla --- */}
        <Card>
          <CardHeader>
            <Heading size="md">Plantilla</Heading>
          </CardHeader>
          <CardBody>
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
                    <Th isNumeric cursor="pointer" onClick={() => handleSort("market_value", "DESC")}>
                      Valor Mercado{renderArrow("market_value")}
                    </Th>
                    <Th isNumeric cursor="pointer" onClick={() => handleSort("total_points", "DESC")}>
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
                      <Td isNumeric color={player.total_points < 0 ? "red.500" : "green.600"}>
                        {player.total_points}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

        {/* --- Clasificación + calendario --- */}
        <VStack spacing={6} align="stretch">
          {/* Clasificación */}
          <Card>
            <CardHeader>
              <Heading size="md">Clasificación alrededor</Heading>
            </CardHeader>
            <CardBody>
              {loadingExtra ? (
                <Spinner size="lg" />
              ) : (
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Pos</Th>
                        <Th>Equipo</Th>
                        <Th isNumeric>Puntos</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {surroundingTeams.map((team) => (
                        <Tr key={team.id} bg={String(team.id) === String(id) ? "yellow.100" : "transparent"}>
                          <Td>
                            <Badge colorScheme={getBadgeColor(team.position)}>
                              {team.position ?? "-"}
                            </Badge>
                          </Td>
                          <Td>
                            <Link to={`/teams/${team.id}`}>{team.name}</Link>
                          </Td>
                          <Td isNumeric>{team.points ?? "-"}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>

          {/* Calendario */}
          <Card>
            <CardHeader>
              <Heading size="md">Próximas jornadas</Heading>
            </CardHeader>
            <CardBody>
              {loadingExtra ? (
                <Spinner size="lg" />
              ) : (
                <VStack align="stretch" spacing={4}>
                  {equipoActualNombre && (() => {
                    const normEquipo = normalizaNombre(equipoActualNombre);
                    // Log para depuración
                    if (calendar.length > 0) {
                      console.log('Equipo actual:', equipoActualNombre, '| Normalizado:', normEquipo);
                      calendar.forEach((jornada) => {
                        if (jornada.enfrentamientos) {
                          jornada.enfrentamientos.forEach((e, i) => {
                            console.log(`J${jornada.numero} Enfrentamiento ${i}:`,
                              'local:', e.equipo_local, '| norm:', normalizaNombre(e.equipo_local),
                              'visitante:', e.equipo_visitante, '| norm:', normalizaNombre(e.equipo_visitante)
                            );
                          });
                        }
                      });
                    }
                    let hayPartidos = false;
                    const jornadasRender = calendar.map((jornada) => {
                      const enf = jornada.enfrentamientos?.find(e => {
                        const localNorm = normalizaNombre(e.equipo_local);
                        const visitanteNorm = normalizaNombre(e.equipo_visitante);
                        // Coincidencia exacta o parcial (uno contiene al otro)
                        return (
                          localNorm === normEquipo || visitanteNorm === normEquipo ||
                          normEquipo.includes(localNorm) || localNorm.includes(normEquipo) ||
                          normEquipo.includes(visitanteNorm) || visitanteNorm.includes(normEquipo)
                        );
                      });
                      if (!enf) return null;
                      hayPartidos = true;
                      const localNorm = normalizaNombre(enf.equipo_local);
                      const esLocal =
                        localNorm === normEquipo ||
                        normEquipo.includes(localNorm) || localNorm.includes(normEquipo);
                      const rival = esLocal ? enf.equipo_visitante : enf.equipo_local;
                      const icono = esLocal ? '🏠' : '✈️';
                      return (
                        <Box key={jornada.id}>
                          <Text fontWeight="bold" mb={2}>Jornada {jornada.numero}</Text>
                          <HStack justify="flex-start" px={2}>
                            <Text fontSize="xl">{icono}</Text>
                            <Text fontWeight="semibold" fontSize="lg">{rival}</Text>
                          </HStack>
                          <Divider mt={2} />
                        </Box>
                      );
                    });
                    if (!hayPartidos) {
                      return <Text color="gray.500" px={2}>No hay próximos partidos para este equipo.</Text>;
                    }
                    return jornadasRender;
                  })()}
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>
    </Box>
  );
}

export default TeamDetailPage;
