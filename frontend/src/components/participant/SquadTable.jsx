import { Box, Text, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue } from '@chakra-ui/react';
import EditablePlayerRow from '../../pages/EditablePlayerRow';

export default function SquadTable({ squad, sortedSquad, handleSort, renderArrow, participantId, fetchParticipant }) {
  const headerBg = useColorModeValue('gray.100','gray.700');
  const zebraEven = useColorModeValue('gray.50','gray.800');
  const zebraOdd = useColorModeValue('white','gray.750');
  const borderColor = useColorModeValue('gray.200','gray.600');
  if (!squad || squad.length === 0) return <Text color="gray.500">No hay jugadores en la plantilla.</Text>;
  return (
    <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
      <Box overflowX="auto">
        <Table size="sm" variant="simple">
          <Thead position="sticky" top={0} zIndex={1} bg={headerBg}>
            <Tr>
              <SortableTh onClick={() => handleSort('name','ASC')} textAlign="left">Nombre{renderArrow('name')}</SortableTh>
              <SortableTh onClick={() => handleSort('position','ASC')} textAlign="left">Posición{renderArrow('position')}</SortableTh>
              <SortableTh onClick={() => handleSort('team','ASC')} textAlign="left">Equipo{renderArrow('team')}</SortableTh>
              <SortableTh onClick={() => handleSort('market_value_num','DESC')} textAlign="right">Valor Mercado{renderArrow('market_value_num')}</SortableTh>
              <SortableTh onClick={() => handleSort('clause_value','DESC')} textAlign="center">Cláusula{renderArrow('clause_value')}</SortableTh>
              <SortableTh onClick={() => handleSort('is_clausulable','DESC')} textAlign="center">Clausulable{renderArrow('is_clausulable')}</SortableTh>
              <SortableTh onClick={() => handleSort('total_points','DESC')} textAlign="right">Puntos{renderArrow('total_points')}</SortableTh>
              <Th textAlign="center" fontWeight={700} fontSize="sm">Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {sortedSquad.map((player, idx) => (
              <EditablePlayerRow
                key={player.player_id || player.id}
                player={player}
                participantId={participantId}
                onChange={fetchParticipant}
                rowStyle={{ background: idx % 2 === 0 ? zebraEven : zebraOdd }}
              />
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}

function SortableTh({ children, onClick, textAlign='left' }) {
  return (
    <Th
      onClick={onClick}
      cursor="pointer"
      userSelect="none"
      textAlign={textAlign}
      fontWeight={700}
      fontSize="sm"
      position="relative"
      _hover={{ bg: 'gray.200', _dark: { bg: 'gray.600' } }}
    >
      {children}
    </Th>
  );
}
