import { VStack, Box, Text, HStack, Badge, Flex, useColorModeValue, Tooltip, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

/**
 * UpcomingMatches
 * Muestra las próximas jornadas (limit 3 pasado desde la página) y para cada una
 * localiza el enfrentamiento del equipo actual usando preferentemente su ID.
 * Si no se dispone de teamId (caso edge), utiliza una comparación por nombre normalizado.
 *
 * Estructura esperada de cada enfrentamiento proveniente del backend (calendarModel.getEnfrentamientosByJornada):
 *  - equipo_local_id, equipo_local_alias, equipo_local_nombre
 *  - equipo_visitante_id, equipo_visitante_alias, equipo_visitante_nombre
 *  - fecha_partido, estado, goles_local, goles_visitante
 */
export default function UpcomingMatches({ calendar, teamId, teamName, normalizeFn }) {
  const cardBg = useColorModeValue('gray.50','gray.700');
  const badgeHome = useColorModeValue('green','green');
  const badgeAway = useColorModeValue('purple','purple');

  if (!teamName) return <Text color='gray.500'>Equipo desconocido.</Text>;
  const normEquipo = normalizeFn(teamName);
  let rendered = 0;

  const resolveNombre = (alias, nombre) => alias || nombre || 'Desconocido';
  const slugify = (str)=> String(str||'')
    .normalize('NFD').replace(/[^\p{Letter}\p{Number}\s-]/gu,'')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().trim().replace(/\s+/g,'-').replace(/-+/g,'-');

  return (
    <VStack align='stretch' spacing={4}>
      {calendar.map(jornada => {
        const enfrentamientos = jornada.enfrentamientos || [];
        // Encontrar match por ID si es posible, si no por nombre normalizado
        let match = null;
        for(const e of enfrentamientos){
          if(teamId){
            if(e.equipo_local_id === teamId || e.equipo_visitante_id === teamId){ match = e; break; }
          } else {
            const localNorm = normalizeFn(e.equipo_local_nombre || e.equipo_local_alias);
            const visitNorm = normalizeFn(e.equipo_visitante_nombre || e.equipo_visitante_alias);
            if([localNorm,visitNorm].some(x => x === normEquipo)) { match = e; break; }
          }
        }
        if(!match) return null;
        rendered++;

        const esLocal = teamId
          ? match.equipo_local_id === teamId
          : normalizeFn(match.equipo_local_nombre || match.equipo_local_alias) === normEquipo;

        const rivalNombre = esLocal
          ? resolveNombre(match.equipo_visitante_alias, match.equipo_visitante_nombre)
          : resolveNombre(match.equipo_local_alias, match.equipo_local_nombre);
        const rivalId = esLocal ? match.equipo_visitante_id : match.equipo_local_id;
        const rivalSlug = slugify(rivalNombre);

        const fechaTxt = match.fecha_partido ? new Date(match.fecha_partido).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : null;
        const marcadorDisponible = match.goles_local != null && match.goles_visitante != null;
        const marcador = marcadorDisponible ? `${match.goles_local} - ${match.goles_visitante}` : null;

        return (
          <Box key={jornada.id + ':' + match.id} p={3} borderRadius='lg' bg={cardBg} _dark={{bg:'gray.600'}}>
            <Flex align='center' justify='space-between' mb={1}>
              <Text fontWeight='bold'>Jornada {jornada.numero}</Text>
              <HStack spacing={2}>
                {marcador && <Badge colorScheme='orange' variant='subtle' fontSize='0.7rem'>{marcador}</Badge>}
                <Badge colorScheme={esLocal ? badgeHome : badgeAway} variant='solid'>
                  {esLocal ? 'LOCAL' : 'VISITANTE'}
                </Badge>
              </HStack>
            </Flex>
            <HStack spacing={3} px={1} align='center'>
              <Text fontSize='sm' fontWeight='semibold' color='gray.600' _dark={{color:'gray.300'}}>vs</Text>
              <Tooltip label={rivalNombre} hasArrow>
                <Link as={RouterLink} to={`/teams/${rivalSlug || rivalId}`} fontWeight='semibold' fontSize='lg' noOfLines={1} _hover={{textDecoration:'underline'}}>
                  {rivalNombre}
                </Link>
              </Tooltip>
            </HStack>
            {(fechaTxt || match.estado) && (
              <HStack spacing={2} mt={2} flexWrap='wrap'>
                {fechaTxt && <Badge variant='outline' colorScheme='gray' fontSize='0.65rem'>{fechaTxt}</Badge>}
                {match.estado && <Badge variant='outline' colorScheme='blue' fontSize='0.65rem'>{match.estado}</Badge>}
              </HStack>
            )}
          </Box>
        );
      })}
      {rendered === 0 && <Text color='gray.500' px={2}>No hay próximos partidos para este equipo.</Text>}
    </VStack>
  );
}
