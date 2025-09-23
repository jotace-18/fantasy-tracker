
import { useEffect, useState } from "react";
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
  const [jornadas, setJornadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamMap, setTeamMap] = useState({});

  // Normalizador de nombres de equipo
  const normalize = (str) => str
    .toLowerCase()
    .replace(/\bfc |cf |ud |cd |rcd |ca |deportivo |real |athletic |club |\bthe |\bof |\bde |\bla |\bce |\bcd |\bsa |\bsv |\bsc |\bafc |\bcalcio |\bclub |\bfoot ?ball|\bteam|\buni[oó]n|[\s-]+/g, "")
    .replace(/[^a-záéíóúüñ]/g, "");

  // Alias manuales para casos especiales
  const TEAM_ALIASES = {
    "athletic club": "Athletic Club",
    "athletic": "Athletic Club",
    "athletic bilbao": "Athletic Club",
    "celta": "Celta",
    "celta de vigo": "Celta",
    "rc celta": "Celta",
    "rcd espanyol": "RCD Espanyol de Barcelona",
    "espanyol": "RCD Espanyol de Barcelona",
  };

  useEffect(() => {
    // Fetch equipos y jornadas en paralelo
    Promise.all([
      fetch("http://localhost:4000/api/teams").then(res => res.json()),
      fetch("http://localhost:4000/api/calendar/next?limit=38").then(res => res.json())
    ]).then(([teams, data]) => {
      // Mapeo flexible: nombre, short_name, slug, y normalización básica
      const map = {};
      teams.forEach(t => {
        map[t.name] = t.id;
        if (t.short_name) map[t.short_name] = t.id;
        if (t.slug) map[t.slug] = t.id;
        map[normalize(t.name)] = t.id;
        if (t.name.includes("CF ")) map[t.name.replace("CF ", "")] = t.id;
        if (t.name.includes("FC ")) map[t.name.replace("FC ", "")] = t.id;
        if (t.name.includes("UD ")) map[t.name.replace("UD ", "")] = t.id;
      });
      // Alias manuales
      Object.entries(TEAM_ALIASES).forEach(([alias, realName]) => {
        if (map[realName]) map[alias] = map[realName];
      });
      setTeamMap(map);
      // Filtrar jornadas que ya han pasado (fecha_cierre < ahora, si tiene fecha)
      const now = new Date();
      const futuras = data.filter(j => {
        if (!j.fecha_cierre) return true;
        return new Date(j.fecha_cierre) > now;
      });
      setJornadas(futuras);
      setLoading(false);
    });
  }, []);

  // Colores para tarjetas y equipos
  const cardBorder = useColorModeValue("blue.200", "blue.700");
  const equipoColor = useColorModeValue("teal.700", "teal.200");
  const equipoHover = useColorModeValue("teal.500", "teal.300");

  return (
    <Box maxW="1200px" mx="auto" mt={8} p={6} bg="white" borderRadius="lg" boxShadow="2xl">
      <Heading size="lg" mb={6} color="blue.700" textAlign="center">Calendario de la Liga</Heading>
      {loading ? (
        <Spinner size="xl" color="blue.500" />
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={8}>
          {jornadas.map((jornada) => (
            <Box
              key={jornada.id}
              p={5}
              borderRadius="xl"
              bgGradient="linear(to-br, blue.100, blue.50)"
              borderWidth={2}
              borderColor={cardBorder}
              boxShadow="lg"
              _hover={{ boxShadow: "2xl", transform: "scale(1.025)" }}
              transition="all 0.2s"
            >
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="xl" color="blue.800" letterSpacing={1}>
                    Jornada {jornada.numero}
                  </Text>
                  {jornada.fecha_cierre ? (
                    <Badge colorScheme="blue" fontSize="sm" px={3} py={1} borderRadius="md">
                      Cierra: {new Date(jornada.fecha_cierre).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                    </Badge>
                  ) : (
                    <Badge colorScheme="yellow" fontSize="sm" px={3} py={1} borderRadius="md">Cierre desconocido</Badge>
                  )}
                </HStack>
                <Divider borderColor={cardBorder} />
                {jornada.enfrentamientos && jornada.enfrentamientos.length > 0 ? (
                  jornada.enfrentamientos.map((e, idx) => (
                    <HStack key={e.id || idx} justify="space-between" px={2}>
                      <ChakraLink
                        as={Link}
                        to={(() => {
                          const n = e.equipo_local;
                          const alias = TEAM_ALIASES[n.toLowerCase()?.trim()];
                          return teamMap[n] || teamMap[n.trim()] || teamMap[n.replace(' de ', ' ')] || teamMap[n.replace('CF ', '')] || teamMap[n.replace('FC ', '')] || teamMap[n.replace('UD ', '')] || teamMap[n.replace('CD ', '')] || teamMap[n.replace('RC ', '')] || teamMap[n.replace('RCD ', '')] || teamMap[n.replace('CA ', '')] || teamMap[n.replace(' ', '')] || teamMap[n.toLowerCase()] || teamMap[n.toUpperCase()] || teamMap[n.replace(/ /g, '')] || teamMap[n.replace(/\s+/, '')] || teamMap[normalize(n)] || (alias && teamMap[alias]) ? `/teams/${teamMap[n] || teamMap[n.trim()] || teamMap[n.replace(' de ', ' ')] || teamMap[n.replace('CF ', '')] || teamMap[n.replace('FC ', '')] || teamMap[n.replace('UD ', '')] || teamMap[n.replace('CD ', '')] || teamMap[n.replace('RC ', '')] || teamMap[n.replace('RCD ', '')] || teamMap[n.replace('CA ', '')] || teamMap[n.replace(' ', '')] || teamMap[n.toLowerCase()] || teamMap[n.toUpperCase()] || teamMap[n.replace(/ /g, '')] || teamMap[n.replace(/\s+/, '')] || teamMap[normalize(n)] || (alias && teamMap[alias])}` : '#';
                        })()}
                        color={equipoColor}
                        fontWeight="bold"
                        _hover={{ color: equipoHover, textDecoration: "underline" }}
                        transition="color 0.15s"
                        pointerEvents={(() => {
                          const n = e.equipo_local;
                          const alias = TEAM_ALIASES[n.toLowerCase()?.trim()];
                          return (teamMap[n] || teamMap[n.trim()] || teamMap[n.replace(' de ', ' ')] || teamMap[n.replace('CF ', '')] || teamMap[n.replace('FC ', '')] || teamMap[n.replace('UD ', '')] || teamMap[n.replace('CD ', '')] || teamMap[n.replace('RC ', '')] || teamMap[n.replace('RCD ', '')] || teamMap[n.replace('CA ', '')] || teamMap[n.replace(' ', '')] || teamMap[n.toLowerCase()] || teamMap[n.toUpperCase()] || teamMap[n.replace(/ /g, '')] || teamMap[n.replace(/\s+/, '')] || teamMap[normalize(n)] || (alias && teamMap[alias])) ? 'auto' : 'none';
                        })()}
                        opacity={(() => {
                          const n = e.equipo_local;
                          const alias = TEAM_ALIASES[n.toLowerCase()?.trim()];
                          return (teamMap[n] || teamMap[n.trim()] || teamMap[n.replace(' de ', ' ')] || teamMap[n.replace('CF ', '')] || teamMap[n.replace('FC ', '')] || teamMap[n.replace('UD ', '')] || teamMap[n.replace('CD ', '')] || teamMap[n.replace('RC ', '')] || teamMap[n.replace('RCD ', '')] || teamMap[n.replace('CA ', '')] || teamMap[n.replace(' ', '')] || teamMap[n.toLowerCase()] || teamMap[n.toUpperCase()] || teamMap[n.replace(/ /g, '')] || teamMap[n.replace(/\s+/, '')] || teamMap[normalize(n)] || (alias && teamMap[alias])) ? 1 : 0.5;
                        })()}
                      >
                        {e.equipo_local}
                      </ChakraLink>
                      <Text color="gray.500" fontWeight="bold">vs</Text>
                      <ChakraLink
                        as={Link}
                        to={(() => {
                          const n = e.equipo_visitante;
                          return teamMap[n] || teamMap[n.trim()] || teamMap[n.replace(' de ', ' ')] || teamMap[n.replace('CF ', '')] || teamMap[n.replace('FC ', '')] || teamMap[n.replace('UD ', '')] || teamMap[n.replace('CD ', '')] || teamMap[n.replace('RC ', '')] || teamMap[n.replace('RCD ', '')] || teamMap[n.replace('CA ', '')] || teamMap[n.replace(' ', '')] || teamMap[n.toLowerCase()] || teamMap[n.toUpperCase()] || teamMap[n.replace(/ /g, '')] || teamMap[n.replace(/\s+/, '')] || teamMap[normalize(n)] ? `/teams/${teamMap[n] || teamMap[n.trim()] || teamMap[n.replace(' de ', ' ')] || teamMap[n.replace('CF ', '')] || teamMap[n.replace('FC ', '')] || teamMap[n.replace('UD ', '')] || teamMap[n.replace('CD ', '')] || teamMap[n.replace('RC ', '')] || teamMap[n.replace('RCD ', '')] || teamMap[n.replace('CA ', '')] || teamMap[n.replace(' ', '')] || teamMap[n.toLowerCase()] || teamMap[n.toUpperCase()] || teamMap[n.replace(/ /g, '')] || teamMap[n.replace(/\s+/, '')] || teamMap[normalize(n)]}` : '#';
                        })()}
                        color={equipoColor}
                        fontWeight="bold"
                        _hover={{ color: equipoHover, textDecoration: "underline" }}
                        transition="color 0.15s"
                        pointerEvents={(() => {
                          const n = e.equipo_visitante;
                          return (teamMap[n] || teamMap[n.trim()] || teamMap[n.replace(' de ', ' ')] || teamMap[n.replace('CF ', '')] || teamMap[n.replace('FC ', '')] || teamMap[n.replace('UD ', '')] || teamMap[n.replace('CD ', '')] || teamMap[n.replace('RC ', '')] || teamMap[n.replace('RCD ', '')] || teamMap[n.replace('CA ', '')] || teamMap[n.replace(' ', '')] || teamMap[n.toLowerCase()] || teamMap[n.toUpperCase()] || teamMap[n.replace(/ /g, '')] || teamMap[n.replace(/\s+/, '')] || teamMap[normalize(n)]) ? 'auto' : 'none';
                        })()}
                        opacity={(() => {
                          const n = e.equipo_visitante;
                          return (teamMap[n] || teamMap[n.trim()] || teamMap[n.replace(' de ', ' ')] || teamMap[n.replace('CF ', '')] || teamMap[n.replace('FC ', '')] || teamMap[n.replace('UD ', '')] || teamMap[n.replace('CD ', '')] || teamMap[n.replace('RC ', '')] || teamMap[n.replace('RCD ', '')] || teamMap[n.replace('CA ', '')] || teamMap[n.replace(' ', '')] || teamMap[n.toLowerCase()] || teamMap[n.toUpperCase()] || teamMap[n.replace(/ /g, '')] || teamMap[n.replace(/\s+/, '')] || teamMap[normalize(n)]) ? 1 : 0.5;
                        })()}
                      >
                        {e.equipo_visitante}
                      </ChakraLink>
                    </HStack>
                  ))
                ) : (
                  <Text color="gray.400">Sin enfrentamientos</Text>
                )}
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
