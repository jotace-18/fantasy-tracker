import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Link, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function TeamRosterTable({ players, handleSort, renderArrow, loadingFallback }) {
  const headerBg = useColorModeValue('gray.100','gray.700');
  const hoverBg = useColorModeValue('gray.50','gray.600');
  const zebraEven = useColorModeValue('whiteAlpha.900','gray.800');
  const zebraOdd = useColorModeValue('gray.50','gray.750');
  const moneyFormat = (n) => typeof n === 'number' && !isNaN(n) ? '€'+n.toLocaleString('es-ES') : '-';
  return (
    <TableContainer>
      <Table size='sm'>
        <Thead position='sticky' top={0} zIndex={1} bg={headerBg} boxShadow='sm'>
          <Tr>
            <Th cursor='pointer' onClick={() => handleSort('name','ASC')}>Nombre{renderArrow('name')}</Th>
            <Th cursor='pointer' onClick={() => handleSort('position','ASC')}>Posición{renderArrow('position')}</Th>
            <Th isNumeric cursor='pointer' onClick={() => handleSort('market_value','DESC')}>Valor Mercado{renderArrow('market_value')}</Th>
            <Th isNumeric cursor='pointer' onClick={() => handleSort('total_points','DESC')}>Puntos Totales{renderArrow('total_points')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loadingFallback && players.length === 0 && (
            <Tr><Td colSpan={4}><Spinner size='sm' mr={2}/> Recuperando datos…</Td></Tr>
          )}
          {players.map((p,i) => (
            <Tr key={p.id} bg={i%2===0?zebraEven:zebraOdd} _hover={{bg:hoverBg}} transition='background .15s ease'>
              <Td><Link as={RouterLink} to={`/players/${p.id}`} color='teal.600' fontWeight='semibold' _hover={{textDecoration:'underline'}}>{p.name}</Link></Td>
              <Td>{p.position}</Td>
              <Td isNumeric>{moneyFormat(p.market_value_num)}</Td>
              <Td isNumeric color={p.total_points < 0 ? 'red.500' : 'green.600'} fontWeight='medium'>{p.total_points}</Td>
            </Tr>
          ))}
          {players.length === 0 && !loadingFallback && (
            <Tr><Td colSpan={4}>Sin jugadores.</Td></Tr>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
