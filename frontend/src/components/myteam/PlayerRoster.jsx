import { VStack, HStack, Box, Text, Button, useColorModeValue, Badge, Tooltip } from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { msToHMS } from './utils';

// Clean rewritten roster component with highlight animation
export default function PlayerRoster({ players, onRemove, onSetReserve, onEditClause, clauseHighlightId, autoScroll=true }) {
  const rowBg = useColorModeValue('white','gray.700');
  const rowAltBg = useColorModeValue('gray.50','gray.650');
  const hoverBg = useColorModeValue('blue.50','blue.900');
  const clauseBg = useColorModeValue('purple.50','purple.900');
  const clauseActiveBg = useColorModeValue('purple.100','purple.800');
  const bottomSpacerRef = useRef(null);

  // Scroll automático al final cuando cambia la longitud (ej. añades jugador nuevo)
  useEffect(() => {
    if (autoScroll && players && players.length > 0) {
      const t = setTimeout(() => {
        bottomSpacerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 120);
      return () => clearTimeout(t);
    }
  }, [players, autoScroll]);

  if (!players || players.length === 0) {
    return <Text color='gray.500'>No tienes jugadores todavía</Text>;
  }

  return (
    <VStack align='stretch' spacing={2} pb={6}>
      <AnimatePresence initial={false}>
        {players.map((pl, idx) => {
          const statusLabel = pl.status === 'XI' ? 'XI' : pl.status === 'B' ? 'Banquillo' : 'Reserva';
          let lockMs = 0;
          if (pl.clause_lock_until && !pl.is_clausulable) {
            lockMs = Math.max(0, new Date(pl.clause_lock_until).getTime() - Date.now());
          }
          const lockStr = lockMs > 0 ? msToHMS(lockMs) : null;
          const minClause = pl.market_value_num || 0;
          const highlighted = clauseHighlightId === pl.player_id;
          return (
            <HStack
              as={motion.div}
              layout
              key={pl.player_id}
              initial={{ opacity: 0, y: 6 }}
              animate={highlighted ? {
                opacity: 1,
                y: 0,
                boxShadow: [
                  '0 0 0 0 rgba(128,90,213,0.0)',
                  '0 0 0 6px rgba(128,90,213,0.45)',
                  '0 0 0 0 rgba(128,90,213,0.0)'
                ]
              } : { opacity:1, y:0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: highlighted ? 0.9 : 0.25, ease: 'easeOut' }}
              justify='space-between'
              p={3}
              borderRadius='lg'
              bg={idx % 2 === 0 ? rowBg : rowAltBg}
              boxShadow='sm'
              _hover={{ bg: hoverBg, transform: 'translateY(-1px)', boxShadow: 'md' }}
              position='relative'
            >
              <Box>
                <Link to={`/players/${pl.player_id}`} style={{ fontWeight: '600', color: 'teal' }}>
                  {pl.name}
                </Link>
                <Text fontSize='xs' color='gray.500'>{pl.team_name} · {pl.position}</Text>
                <Badge mt={1} colorScheme={pl.total_points < 0 ? 'red' : 'green'} variant='subtle'>{pl.total_points} pts</Badge>
              </Box>
              <HStack spacing={3} align='center'>
                <Badge colorScheme={pl.status === 'XI' ? 'green' : pl.status === 'B' ? 'orange' : 'gray'} variant='solid' fontSize='0.7rem' px={2}>{statusLabel}</Badge>
                <Tooltip label='Valor mercado' hasArrow>
                  <Text color='blue.600' fontWeight='medium'>€{(pl.market_value_num || 0).toLocaleString('es-ES')}</Text>
                </Tooltip>
                <HStack spacing={1}>
                  <Tooltip label={lockStr ? 'Tiempo restante bloqueo cláusula' : 'Cláusula actual'} hasArrow>
                    <Box
                      px={3}
                      py={1}
                      borderRadius='full'
                      bg={lockStr ? clauseActiveBg : clauseBg}
                      borderWidth='1px'
                      borderColor={lockStr ? 'purple.400' : 'purple.200'}
                      display='flex'
                      alignItems='center'
                      minW='82px'
                      justifyContent='center'
                    >
                      {lockStr ? (
                        <Text color='purple.600' fontWeight='bold' fontSize='xs'>{lockStr}</Text>
                      ) : (
                        <Text color='purple.700' fontWeight='bold' fontSize='xs'>€{(pl.clause_value || minClause).toLocaleString('es-ES')}</Text>
                      )}
                    </Box>
                  </Tooltip>
                  <Button
                    size='xs'
                    variant='ghost'
                    ml={0}
                    onClick={() => onEditClause(pl, { clause_value: pl.clause_value || minClause, is_clausulable: !!pl.is_clausulable, lock_days: 0, lock_hours: 0 })}
                    aria-label='Editar cláusula'
                  >
                    <span role='img' aria-label='Editar'>✏️</span>
                  </Button>
                </HStack>
                <Button colorScheme='yellow' size='xs' variant='outline' onClick={() => onSetReserve(pl.player_id)} isDisabled={pl.status === 'R'}>Reserva</Button>
                <Button colorScheme='red' size='xs' onClick={() => onRemove(pl.player_id)} aria-label='Eliminar jugador'>✕</Button>
              </HStack>
            </HStack>
          );
        })}
        {/* Spacer para asegurar que el último elemento nunca queda oculto tras el borde inferior */}
        <Box ref={bottomSpacerRef} h='1px' />
      </AnimatePresence>
    </VStack>
  );
}
