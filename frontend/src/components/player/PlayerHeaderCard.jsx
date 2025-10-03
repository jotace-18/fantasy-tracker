import { Badge, Box, Card, CardHeader, CircularProgress, CircularProgressLabel, HStack, Progress, Text, Tooltip as CTooltip, Link } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';

const MotionCard = motion(Card);

const mapRisk = (r) => {
  if (r == null) return { label: 'Sin dato', color: 'gray', percent: 0 };
  if (r <= 1) return { label: 'Riesgo muy bajo', color: 'green', percent: 15 };
  if (r === 2) return { label: 'Riesgo bajo', color: 'green', percent: 30 };
  if (r === 3) return { label: 'Riesgo moderado', color: 'yellow', percent: 55 };
  if (r === 4) return { label: 'Riesgo alto', color: 'orange', percent: 75 };
  return { label: 'Riesgo muy alto', color: 'red', percent: 90 };
};

export function PlayerHeaderCard({ player }) {
  const riskInfo = mapRisk(player.risk_level);
  const titularPct = player.titular_next_jor != null ? Math.round(player.titular_next_jor * 100) : null;
  const lesionBadge = player.lesionado ? { text: 'Lesionado', color: 'red' } : { text: 'Disponible', color: 'green' };
  // Clause & ownership derived fields (tolerant if backend not yet extended)
  // Ownership/clause info extraído a card separada

  return (
    <MotionCard
      mb={6}
      p={6}
      borderRadius="3xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .5 }}
      bgGradient="linear(to-r, teal.500, purple.500)"
      color="white"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""', position: 'absolute', inset: 0,
        bg: 'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.25), transparent 60%)'
      }}
    >
      <CardHeader pb={2} zIndex={1} position="relative">
        <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" letterSpacing="wide">
          {player.name}
        </Text>
        <Text fontSize="lg" opacity={0.9}>
          <Link as={RouterLink} to={`/teams/${player.team_slug || player.team_id || player.team_name?.toLowerCase().replace(/\s+/g,'-')}`} textDecoration='underline' _hover={{color:'yellow.200'}}>
            {player.team_name}
          </Link> • {player.position}
        </Text>
        <HStack mt={4} spacing={3} wrap="wrap" alignItems="center">
          <CTooltip label={`Índice: ${player.risk_level ?? '-'} / Categoría derivada.`} hasArrow>
            <Badge bg="whiteAlpha.800" color="gray.800" px={3} py={1} borderRadius="lg" fontWeight="semibold">
              {riskInfo.label}
            </Badge>
          </CTooltip>
          <Badge bg={player.lesionado ? 'red.400' : 'green.400'} color="white" px={3} py={1} borderRadius="lg" fontWeight="bold">
            {lesionBadge.text}
          </Badge>
          {titularPct != null && (
            <HStack spacing={2}>
              <CircularProgress size='60px' value={titularPct} color={titularPct >= 80 ? 'green.300' : titularPct >= 50 ? 'yellow.300' : 'red.300'} thickness='10px'>
                <CircularProgressLabel fontSize='sm' fontWeight='bold'>{titularPct}%</CircularProgressLabel>
              </CircularProgress>
              <Badge bg='whiteAlpha.700' color='gray.800' px={3} py={1} borderRadius='lg'>Titular próxima</Badge>
            </HStack>
          )}
        </HStack>
        <Box mt={4} maxW="420px">
          <Text fontSize="sm" mb={1} opacity={0.85}>Riesgo de lesión</Text>
          <Progress
            value={riskInfo.percent}
            size="sm"
            colorScheme={riskInfo.color}
            borderRadius="md"
            hasStripe
            isAnimated
            bg='whiteAlpha.300'
          />
        </Box>
      </CardHeader>
    </MotionCard>
  );
}
