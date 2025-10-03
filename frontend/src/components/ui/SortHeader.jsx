import { Th, HStack, Text, Icon } from '@chakra-ui/react';
import { TriangleUpIcon, TriangleDownIcon } from '@chakra-ui/icons';

export function SortHeader({ field, currentField, order, onSort, children, numeric, defaultOrder='ASC' }) {
  const active = currentField === field;
  return (
    <Th
      isNumeric={numeric}
      cursor='pointer'
      userSelect='none'
      onClick={() => onSort(field, defaultOrder)}
      aria-sort={active ? (order === 'ASC' ? 'ascending' : 'descending') : 'none'}
      _hover={{ bg: 'blackAlpha.50' }}
      transition='background .15s'
    >
      <HStack spacing={1} justify={numeric ? 'flex-end' : 'flex-start'}>
        {numeric ? null : <Text as='span'>{children}</Text>}
        {numeric ? <Text as='span'>{children}</Text> : null}
        <Icon
          as={!active ? TriangleUpIcon : (order === 'ASC' ? TriangleUpIcon : TriangleDownIcon)}
          boxSize={3}
          opacity={active ? 0.9 : 0.25}
          transform={active && order === 'DESC' ? 'rotate(180deg)' : 'none'}
          transition='all .2s'
        />
      </HStack>
    </Th>
  );
}
