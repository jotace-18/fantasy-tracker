import { Flex, Input, Button } from '@chakra-ui/react';

export default function SquadSearchBar({ query, setQuery, onOpen, sectionBg }) {
  return (
    <Flex gap={3} align="center">
      <Input
        size="sm"
        placeholder="Buscar nombre / equipo / posición"
        value={query}
        onChange={e=> setQuery(e.target.value)}
        width={{ base: '100%', sm: '260px' }}
        bg={sectionBg}
        _dark={{ bg: 'gray.600' }}
      />
      <Button colorScheme="teal" size="sm" onClick={onOpen}>Añadir jugador</Button>
    </Flex>
  );
}
