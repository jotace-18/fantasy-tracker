// src/pages/TeamsPage.jsx
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, Box, Spinner, Text, Badge, Card, CardHeader, CardBody,
  HStack, Tooltip, Flex, Icon, useColorModeValue, Divider
} from "@chakra-ui/react";
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

function slugify(str){
  return String(str||'')
    .normalize('NFD').replace(/\p{Diacritic}/gu,'')
    .toLowerCase().replace(/[^a-z0-9\s-]/g,'')
    .trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}

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

  const zoneInfo = {
    champions: { label: 'Champions League', color: 'green', range: [1,4] },
    europa: { label: 'Europa / Conference', color: 'yellow', range: [5,6] },
    descenso: { label: 'Descenso', color: 'red', rangeDynamic: (len)=> [len-2, len] }
  };

  const totalTeams = teams.length;
  const enrichedTeams = teams.map(t => {
    let zone = null;
    if (t.position != null) {
      if (t.position >= zoneInfo.champions.range[0] && t.position <= zoneInfo.champions.range[1]) zone = 'champions';
      else if (t.position >= zoneInfo.europa.range[0] && t.position <= zoneInfo.europa.range[1]) zone = 'europa';
      else {
        const [start, end] = zoneInfo.descenso.rangeDynamic(totalTeams);
        if (t.position >= start && t.position <= end) zone = 'descenso';
      }
    }
    return { ...t, zone };
  });

  const bgGrad = useColorModeValue('linear(to-r, gray.50, white)', 'linear(to-r, gray.700, gray.800)');
  const headerBg = useColorModeValue('gray.100', 'gray.600');
  const hoverBg = useColorModeValue('blue.50','gray.700');

  if (loading) {
    return (
      <Box p={6} textAlign='center'>
        <Spinner size='xl' />
        <Text mt={2} fontSize='sm' color='gray.500'>Cargando clasificación de equipos...</Text>
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
    <Box p={{base:4, md:6}}>
      <Card borderRadius='2xl' bgGradient={bgGrad} shadow='md' overflow='hidden'>
        <CardHeader pb={2}>
          <Flex justify='space-between' align='center' wrap='wrap' gap={3}>
            <Text fontSize='2xl' fontWeight='bold'>Clasificación de LaLiga</Text>
            <HStack spacing={2} fontSize='xs' color='gray.500'>
              <HStack spacing={1}><Badge colorScheme='green'>1-4</Badge><Text>Champions</Text></HStack>
              <HStack spacing={1}><Badge colorScheme='yellow'>5-6</Badge><Text>Europa</Text></HStack>
              <HStack spacing={1}><Badge colorScheme='red'>Descenso</Badge></HStack>
            </HStack>
          </Flex>
          <Divider mt={3}/>
        </CardHeader>
        <CardBody pt={3}>
          <TableContainer>
            <Table size='sm'>
              <Thead bg={headerBg} position='sticky' top={0} zIndex={1} boxShadow='sm'>
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
                {enrichedTeams.map(team => {
                  const slug = team.slug || slugify(team.name);
                  const diffIcon = team.gd > 0 ? FiTrendingUp : team.gd < 0 ? FiTrendingDown : FiMinus;
                  return (
                    <Tr key={team.id}
                      _hover={{ bg: hoverBg, cursor: 'pointer' }}
                      transition='background .15s'
                      onClick={()=> window.location.href = `/teams/${slug}`}
                    >
                      <Td>
                        <Tooltip label={team.zone ? zoneInfo[team.zone].label : 'Posición'} hasArrow>
                          <Badge colorScheme={getBadgeColor(team.position)} fontSize='sm' borderRadius='md' px={2} py={1}>
                            {team.position ?? '-'}
                          </Badge>
                        </Tooltip>
                      </Td>
                      <Td fontWeight='medium'>
                        <Text as={RouterLink} to={`/teams/${slug}`} _hover={{ textDecoration:'underline' }}>
                          {team.name}
                        </Text>
                      </Td>
                      <Td isNumeric fontWeight='semibold'>{team.points ?? '-'}</Td>
                      <Td isNumeric>{team.played ?? '-'}</Td>
                      <Td isNumeric color='green.600' fontWeight='medium'>{team.won ?? '-'}</Td>
                      <Td isNumeric color='yellow.600' fontWeight='medium'>{team.drawn ?? '-'}</Td>
                      <Td isNumeric color='red.600' fontWeight='medium'>{team.lost ?? '-'}</Td>
                      <Td isNumeric>{team.gf ?? '-'}</Td>
                      <Td isNumeric>{team.ga ?? '-'}</Td>
                      <Td isNumeric color={team.gd>0?'green.600':team.gd<0?'red.600':'gray.600'}>
                        <HStack spacing={1} justify='flex-end'>
                          <Icon as={diffIcon} />
                          <Text>{team.gd ?? '-'}</Text>
                        </HStack>
                      </Td>
                    </Tr>
                  )})}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </Box>
  );
}

export default TeamsPage;
