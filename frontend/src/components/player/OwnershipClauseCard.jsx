import { Card, HStack, Badge, Tooltip, Flex, Heading, Link, Box, Divider, Icon } from '@chakra-ui/react';
import { FiUser, FiLock, FiTag } from 'react-icons/fi';
import { Link as RouterLink } from 'react-router-dom';

export default function OwnershipClauseCard({ player }) {
  if (!player) return null;
  const ownerName = player.owner_name || player.participant_name || null;
  const ownerId = player.owner_id || player.participant_id || null;
  const isOnMarket = !!player.on_market;
  const isClausulable = player.is_clausulable !== 0 && player.is_clausulable !== false;
  const clauseValue = player.clause_value != null ? player.clause_value : null;
  const lockUntil = player.clause_lock_until ? new Date(player.clause_lock_until) : null;
  const now = new Date();
  let lockCountdown = null;
  if (lockUntil && lockUntil.getTime() > now.getTime()) {
    const diffMs = lockUntil.getTime() - now.getTime();
    const d = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const h = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const m = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    lockCountdown = `${d > 0 ? d + 'd ' : ''}${h}h ${m}m`;
  }

  return (
    <Card
      mb={6}
      px={5}
      py={4}
      borderRadius='2xl'
      bgGradient='linear(to-r, gray.50, gray.100)'
      _dark={{ bgGradient: 'linear(to-r, gray.700, gray.600)', borderColor: 'gray.600' }}
      shadow='sm'
      position='relative'
      overflow='hidden'
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        bg: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
        opacity: 0.25,
        pointerEvents: 'none'
      }}
    >
      <Flex direction={['column','row']} align={['flex-start','center']} gap={4} flexWrap='wrap'>
        <Heading size='sm' display='flex' alignItems='center' gap={2} whiteSpace='nowrap'>
          <Icon as={FiUser} /> Propiedad / Cláusula
        </Heading>
        <HStack spacing={2} flexWrap='wrap' divider={<Divider orientation='vertical' h='18px' borderColor='gray.300' _dark={{ borderColor: 'gray.500' }} />}>        
          {ownerName ? (
            <Tooltip label='Participante dueño del jugador' hasArrow>
              <Badge colorScheme='blue' display='flex' alignItems='center' gap={1} px={3} py={1} borderRadius='md'>
                <Icon as={FiUser} /> {ownerId ? (
                  <Link as={RouterLink} to={`/participants/${ownerId}`} fontWeight='semibold' _hover={{ textDecoration: 'underline' }}>
                    {ownerName}
                  </Link>
                ) : ownerName}
              </Badge>
            </Tooltip>
          ) : (
            <Badge colorScheme='gray' px={3} py={1} borderRadius='md'>Sin dueño</Badge>
          )}
          {isOnMarket && (
            <Tooltip label='Jugador listado actualmente en el mercado' hasArrow>
              <Badge colorScheme='orange' px={3} py={1} borderRadius='md'>En mercado</Badge>
            </Tooltip>
          )}
          {!isOnMarket && isClausulable && clauseValue != null && (
            <Tooltip label='Precio actual de la cláusula' hasArrow>
              <Badge colorScheme='purple' display='flex' alignItems='center' gap={1} px={3} py={1} borderRadius='md'>
                <Icon as={FiTag} /> {clauseValue.toLocaleString('es-ES')} €
              </Badge>
            </Tooltip>
          )}
          {!isOnMarket && !isClausulable && lockCountdown && (
            <Tooltip label={lockUntil ? 'Se desbloquea: ' + lockUntil.toLocaleString('es-ES') : 'Bloqueada'} hasArrow>
              <Badge colorScheme='gray' display='flex' alignItems='center' gap={1} px={3} py={1} borderRadius='md'>
                <Icon as={FiLock} /> {lockCountdown}
              </Badge>
            </Tooltip>
          )}
          {!isOnMarket && !isClausulable && !lockCountdown && (
            <Badge colorScheme='gray' px={3} py={1} borderRadius='md'>Bloqueo expirado</Badge>
          )}
        </HStack>
      </Flex>
    </Card>
  );
}
