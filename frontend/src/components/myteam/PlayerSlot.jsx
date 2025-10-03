import { Center, Tooltip, VStack, Text, Box } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { WarningTwoIcon } from '@chakra-ui/icons';
import { getShortName, getRoleColor } from './utils';

export default function PlayerSlot({ role, index, x, y, player, isBench, onSelectSlot }){
  const bg = isBench ? 'gray.200' : player ? 'whiteAlpha.900' : 'yellow.50';
  const borderColor = isBench ? 'gray.300' : player ? getRoleColor(role) : 'yellow.400';
  const fontSize = player ? 'sm' : 'xs';
  const fontWeight = player ? 'semibold' : 'bold';
  const shadow = isBench ? undefined : '0 3px 10px -2px rgba(0,0,0,0.25)';
  const shortName = player ? getShortName(player.name) : `${role}${index || ''}`;
  const tooltipLabel = player ? `${player.name}${player.team_name ? '\n' + player.team_name : ''}` : `¡Plaza vacía! Pulsa para asignar un ${role}`;

  return (
    <Tooltip label={tooltipLabel} hasArrow placement='top' fontSize='sm' openDelay={200}>
      <Center
        w='70px'
        h='70px'
        bg={bg}
        borderRadius='full'
        borderWidth='2px'
        borderColor={borderColor}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color='gray.800'
        position={isBench ? 'static' : 'absolute'}
        left={isBench ? undefined : `${x}%`}
        top={isBench ? undefined : `${y}%`}
        transform={isBench ? undefined : 'translate(-50%, -50%)'}
        cursor='pointer'
        _hover={{ bg: player ? 'gray.100' : 'yellow.100', boxShadow: '0 0 0 3px rgba(0,0,0,0.15)' }}
        _focusVisible={{ outline:'4px solid', outlineColor: borderColor, outlineOffset: '2px' }}
        boxShadow={shadow}
        transition='all 0.15s'
        onClick={onSelectSlot}
        textAlign='center'
        px={1}
        lineHeight={1.1}
        whiteSpace='pre-line'
        role='button'
        tabIndex={0}
        onKeyDown={(e)=> { if(e.key==='Enter' || e.key===' ') { e.preventDefault(); onSelectSlot(); } }}
        aria-label={tooltipLabel}
      >
        {player ? (
          <VStack
            as={motion.div}
            key={player.player_id || shortName}
            spacing={0}
            initial={{ scale:0.6, opacity:0 }}
            animate={{ scale:1, opacity:1 }}
            transition={{ type:'spring', stiffness:260, damping:18 }}
          >
            <Text>{shortName}</Text>
            <Box mt={1} fontSize='8px' letterSpacing='wide' color={borderColor} fontWeight='bold'>
              {role}
            </Box>
          </VStack>
        ) : (
          <VStack
            as={motion.div}
            spacing={0}
            initial={{ opacity:0 }}
            animate={{ opacity:1 }}
            transition={{ duration:0.3 }}
          >
            <WarningTwoIcon color='yellow.500' boxSize={6} />
            <Text fontSize='xs' color='yellow.700' fontWeight='bold'>Vacío</Text>
          </VStack>
        )}
      </Center>
    </Tooltip>
  );
}
