import { HStack, VStack, Text, Center } from '@chakra-ui/react';
import PlayerSlot from './PlayerSlot';

export default function BenchArea({ players, onSelectBench }){
  return (
    <HStack mt={6} spacing={12} align='flex-start' justify='center'>
      <VStack spacing={2} minW='340px'>
        <Text fontWeight='bold' fontSize='md' color='orange.500' mb={1} letterSpacing='wide'>Banquillo</Text>
        <HStack justify='flex-start' spacing={4}>
          {Array.from({ length:4 }).map((_,i)=> {
            const playerForBench = players.find(pl=> pl.status==='B' && pl.slot_index === i+1) || null;
            return (
              <PlayerSlot
                key={i}
                role='B'
                index={i+1}
                isBench
                player={playerForBench}
                onSelectSlot={()=> onSelectBench({ role:'B', index: i+1, isBench:true })}
              />
            );
          })}
        </HStack>
      </VStack>
      <VStack spacing={2} minW='100px'>
        <Text fontWeight='bold' fontSize='md' color='purple.500' mb={1} letterSpacing='wide'>Coach</Text>
        <Center><PlayerSlot role='Coach' isBench /></Center>
      </VStack>
    </HStack>
  );
}
