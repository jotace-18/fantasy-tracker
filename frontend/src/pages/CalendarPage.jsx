

import React, { useEffect, useState } from "react";
import { IconButton } from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import EditJornadaModal from "../components/EditJornadaModal";
import {
  Box,
  Heading,
  HStack,
  Text,
  Badge,
  Spinner,
  SimpleGrid,
  VStack,
  Divider,
  useColorModeValue,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

export default function CalendarPage() {
  // Ref para cada jornada
  const jornadaRefs = [];

  const [jornadas, setJornadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [teamById, setTeamById] = useState({});
  const [editJornada, setEditJornada] = useState(null);

  const fetchJornadas = () => {
    setLoading(true);
    Promise.all([
      fetch("http://localhost:4000/api/teams").then(res => res.json()),
      fetch("http://localhost:4000/api/calendar/next?limit=38").then(res => res.json())
    ]).then(([teamsData, data]) => {
      setTeams(teamsData);
      const byId = {};
      teamsData.forEach(t => { byId[t.id] = t; });
      setTeamById(byId);
      setJornadas(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchJornadas();
  }, []);

  // Scroll automático a la jornada actual cuando se cargan jornadas
  useEffect(() => {
    if (actualIdx !== -1 && jornadaRefs[actualIdx] && jornadaRefs[actualIdx].scrollIntoView) {
      jornadaRefs[actualIdx].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line
  }, [loading, jornadas.length]);

  // Colores para tarjetas y equipos
  const cardBorder = useColorModeValue("blue.200", "blue.700");
  const equipoColor = useColorModeValue("teal.700", "teal.200");
  const equipoHover = useColorModeValue("teal.500", "teal.300");

  // Devuelve el nombre o alias del equipo por id
  const getTeamName = (id) => {
    const t = teamById[id];
    if (!t) return id;
    return t.alias || t.name || id;
  };

  // Determinar la jornada "actual": la primera que aún no ha cerrado (fecha_cierre > ahora)
  let actualIdx = -1;
  const now = new Date();
  if (jornadas.length > 0) {
    for (let i = 0; i < jornadas.length; i++) {
      const cierre = jornadas[i].fecha_cierre ? new Date(jornadas[i].fecha_cierre) : null;
      if (cierre && cierre > now) {
        actualIdx = i;
        break;
      }
    }
    if (actualIdx === -1 && jornadas[jornadas.length - 1]?.fecha_cierre) {
      // Si todas están cerradas, marcar la última
      actualIdx = jornadas.length - 1;
    }
  }

  return (
    <Box maxW="1200px" mx="auto" mt={8} p={6} bg="white" borderRadius="lg" boxShadow="2xl">
      <Heading size="lg" mb={6} color="blue.700" textAlign="center">Calendario de la Liga</Heading>
      {loading ? (
        <Spinner size="xl" color="blue.500" />
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={8}>
          {jornadas.map((jornada, idx) => {
            // Asignar ref a cada jornada
            jornadaRefs[idx] = jornadaRefs[idx] || React.createRef();
            // Color para la jornada actual
            const isActual = idx === actualIdx;
            const bgGradient = isActual
              ? "linear(to-br, green.100, green.50)"
              : "linear(to-br, blue.100, blue.50)";
            const badgeColor = isActual ? "green" : "blue";
            return (
              <Box
                key={jornada.id}
                ref={el => (jornadaRefs[idx] = el)}
                p={5}
                borderRadius="xl"
                bgGradient={bgGradient}
                borderWidth={2}
                borderColor={cardBorder}
                boxShadow="lg"
                _hover={{ boxShadow: "2xl", transform: "scale(1.025)" }}
                transition="all 0.2s"
              >
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <HStack>
                      <Text fontWeight="bold" fontSize="xl" color={isActual ? "green.800" : "blue.800"} letterSpacing={1}>
                        Jornada {jornada.numero}
                      </Text>
                      <IconButton
                        aria-label="Editar jornada"
                        icon={<EditIcon boxSize={5} />}
                        size="md"
                        colorScheme={badgeColor}
                        variant="solid"
                        ml={2}
                        title="Editar jornada y resultados"
                        _hover={{ bg: isActual ? "green.400" : "blue.400", color: "white" }}
                        onClick={() => setEditJornada(jornada)}
                      />
                    </HStack>
                    {jornada.fecha_cierre ? (
                      <Badge colorScheme={badgeColor} fontSize="sm" px={3} py={1} borderRadius="md">
                        Cierra: {new Date(jornada.fecha_cierre).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                      </Badge>
                    ) : (
                      <Badge colorScheme="yellow" fontSize="sm" px={3} py={1} borderRadius="md">Cierre desconocido</Badge>
                    )}
                  </HStack>
      {/* Modal de edición de jornada */}
      <EditJornadaModal
        isOpen={!!editJornada}
        onClose={() => setEditJornada(null)}
        jornada={editJornada}
        onSaved={fetchJornadas}
        teams={teams}
      />
                  <Divider borderColor={cardBorder} />
                  {jornada.enfrentamientos && jornada.enfrentamientos.length > 0 ? (
                    jornada.enfrentamientos.map((e, idx) => {
                      // Determinar ganador (o empate)
                      let localHighlight = false, visitanteHighlight = false;
                      if (
                        e.goles_local !== null && e.goles_local !== undefined &&
                        e.goles_visitante !== null && e.goles_visitante !== undefined
                      ) {
                        if (e.goles_local > e.goles_visitante) localHighlight = true;
                        else if (e.goles_local < e.goles_visitante) visitanteHighlight = true;
                      }
                      return (
                        <HStack key={e.id || idx} justify="space-between" px={2}>
                          <ChakraLink
                            as={Link}
                            to={teamById[e.equipo_local_id] ? `/teams/${e.equipo_local_id}` : '#'}
                            color={localHighlight ? "green.700" : equipoColor}
                            fontWeight={localHighlight ? "extrabold" : "bold"}
                            bg={localHighlight ? "green.50" : undefined}
                            px={localHighlight ? 2 : 0}
                            py={localHighlight ? 1 : 0}
                            borderRadius={localHighlight ? "md" : undefined}
                            _hover={{ color: equipoHover, textDecoration: "underline" }}
                            transition="color 0.15s, background 0.15s"
                            pointerEvents={teamById[e.equipo_local_id] ? 'auto' : 'none'}
                            opacity={teamById[e.equipo_local_id] ? 1 : 0.5}
                          >
                            {getTeamName(e.equipo_local_id)}
                          </ChakraLink>
                          <Text color="gray.700" fontWeight="bold" fontSize="lg" minW="48px" textAlign="center">
                            {(e.goles_local !== null && e.goles_local !== undefined && e.goles_visitante !== null && e.goles_visitante !== undefined)
                              ? `${e.goles_local} - ${e.goles_visitante}`
                              : 'VS'}
                          </Text>
                          <ChakraLink
                            as={Link}
                            to={teamById[e.equipo_visitante_id] ? `/teams/${e.equipo_visitante_id}` : '#'}
                            color={visitanteHighlight ? "green.700" : equipoColor}
                            fontWeight={visitanteHighlight ? "extrabold" : "bold"}
                            bg={visitanteHighlight ? "green.50" : undefined}
                            px={visitanteHighlight ? 2 : 0}
                            py={visitanteHighlight ? 1 : 0}
                            borderRadius={visitanteHighlight ? "md" : undefined}
                            _hover={{ color: equipoHover, textDecoration: "underline" }}
                            transition="color 0.15s, background 0.15s"
                            pointerEvents={teamById[e.equipo_visitante_id] ? 'auto' : 'none'}
                            opacity={teamById[e.equipo_visitante_id] ? 1 : 0.5}
                          >
                            {getTeamName(e.equipo_visitante_id)}
                          </ChakraLink>
                        </HStack>
                      );
                    })
                  ) : (
                    <Text color="gray.400">Sin enfrentamientos</Text>
                  )}
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
