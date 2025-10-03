import { Box, useToken } from '@chakra-ui/react';
import PlayerSlot from './PlayerSlot';

export default function Pitch({ positions, players, onSelectSlot }){
  const [top, bottom, line] = useToken('colors',['pitch.fieldTop','pitch.fieldBottom','pitch.line']);
  return (
    <Box
      bgGradient={`linear(to-b, ${top}, ${bottom})`}
      borderRadius='2xl'
      p={2}
      h='600px'
      position='relative'
      boxShadow='xl'
      overflow='hidden'
      _before={{
        content:'""',
        position:'absolute',
        inset:0,
        background:
          'repeating-linear-gradient(to bottom, rgba(255,255,255,0.12) 0 2px, transparent 2px 120px)',
        pointerEvents:'none'
      }}
      _after={{
        content:'""',
        position:'absolute', inset:0, pointerEvents:'none',
        border:`3px solid ${line}`, borderRadius:'2xl'
      }}
    >
      {positions.map((p,i)=> {
        const playerForSlot = players.find(pl => pl.status==='XI' && pl.slot_index === i+1);
        return (
          <PlayerSlot
            key={i}
            role={p.role}
            x={p.x}
            y={p.y}
            index={i+1}
            player={playerForSlot}
            onSelectSlot={()=> onSelectSlot({ ...p, index: i+1 })}
          />
        );
      })}
    </Box>
  );
}
