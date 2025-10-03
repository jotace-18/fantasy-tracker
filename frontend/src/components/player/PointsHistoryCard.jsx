import { Card, CardBody, CardHeader, Divider, HStack, Table, TableContainer, Tbody, Td, Th, Thead, Tr, Button, Text, Box, Tooltip as CTooltip } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

export function PointsHistoryCard({ history, showHeatmap, onToggle }) {
  return (
    <MotionCard shadow="md" borderRadius="2xl"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: .5 }}
    >
      <CardHeader>
        <HStack justify='space-between'>
          <Text fontSize="xl" fontWeight="bold">Historial de Puntos Fantasy</Text>
          <Button size='sm' variant='outline' onClick={onToggle}>
            {showHeatmap ? 'Ver tabla' : 'Ver heatmap'}
          </Button>
        </HStack>
      </CardHeader>
      <Divider />
      <CardBody>
        {showHeatmap ? <PointsHeatmap data={history} /> : (
          <TableContainer>
            <Table variant="striped" colorScheme="teal" size="sm">
              <Thead>
                <Tr>
                  <Th>Jornada</Th>
                  <Th isNumeric>Puntos</Th>
                </Tr>
              </Thead>
              <Tbody>
                {history.map((p, idx) => (
                  <Tr key={idx}>
                    <Td fontWeight="medium">{p.jornada}</Td>
                    <Td isNumeric color={p.points < 0 ? 'red.500' : 'green.600'} fontWeight="semibold">{p.points}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </CardBody>
    </MotionCard>
  );
}

function PointsHeatmap({ data }) {
  if (!data || !data.length) return <Text fontSize='sm' color='gray.500'>Sin datos</Text>;
  const values = data.map(d => d.points);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  function colorFor(val) {
    const n = (val - min) / range;
    if (val < 0) return 'red.500';
    if (n < 0.2) return 'green.200';
    if (n < 0.4) return 'green.300';
    if (n < 0.6) return 'green.400';
    if (n < 0.8) return 'green.500';
    return 'green.600';
  }
  return (
    <Box>
      <HStack wrap='wrap' spacing={1} alignItems='flex-end'>
        {data.map(d => (
          <CTooltip key={d.jornada} label={`J${d.jornada}: ${d.points} pts`} hasArrow>
            <Box w='32px' h='32px' display='flex' alignItems='center' justifyContent='center' fontSize='xs' fontWeight='bold' borderRadius='md' bg={colorFor(d.points)} color={d.points < 0 ? 'white' : 'gray.800'} transition='all .2s' _hover={{ transform: 'scale(1.1)', boxShadow: 'md' }}>
              {d.points}
            </Box>
          </CTooltip>
        ))}
      </HStack>
      <Text mt={3} fontSize='xs' color='gray.500'>Heatmap: intensidad basada en distribución relativa (verde más intenso = mejor rendimiento).</Text>
    </Box>
  );
}
