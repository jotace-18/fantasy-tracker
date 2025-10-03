import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, Spinner, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function SurroundingClassification({ teams, surroundingTeams, currentIdentifier, isNumericId, loading, slugify }) {
  if (loading) return <Spinner size='lg'/>;
  const isCurrent = (team) => isNumericId ? String(team.id) === String(currentIdentifier) : (team.slug === currentIdentifier || slugify(team.name) === currentIdentifier);
  const getBadgeColor = (pos) => {
    if (!pos) return 'gray';
    if (pos >= 1 && pos <= 4) return 'green';
    if (pos === 5 || pos === 6) return 'yellow';
    if (pos >= teams.length - 2) return 'red';
    return 'blue';
  };
  return (
    <TableContainer>
      <Table size='sm' variant='simple'>
        <Thead>
          <Tr><Th>Pos</Th><Th>Equipo</Th><Th isNumeric>Puntos</Th></Tr>
        </Thead>
        <Tbody>
          {surroundingTeams.map(team => (
            <Tr key={team.id} bg={isCurrent(team) ? 'yellow.100' : 'transparent'}>
              <Td><Badge colorScheme={getBadgeColor(team.position)}>{team.position ?? '-'}</Badge></Td>
              <Td><Link as={RouterLink} to={`/teams/${team.slug || slugify(team.name) || team.id}`}>{team.name}</Link></Td>
              <Td isNumeric>{team.points ?? '-'}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
