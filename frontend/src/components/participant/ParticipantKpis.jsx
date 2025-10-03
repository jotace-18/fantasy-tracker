import { Flex, Badge, Button } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

export default function ParticipantKpis({ participant, plantillaValue, loadingPosition, position, sectionBg, kpiShadow, onEditMoney }) {
  const totalPointsColorScheme = participant.total_points >= 0 ? 'blue' : 'red';
  const moneyColorScheme = participant.money >= 0 ? 'green' : 'red';
  return (
    <Flex gap={6} mb={6} align="center" justify="center" wrap="wrap">
      <Badge
        as={motion.div}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: .05 }}
        whileHover={{ scale: 1.05 }}
        colorScheme={totalPointsColorScheme} fontSize="2xl" px={5} py={2} borderRadius="lg" boxShadow={kpiShadow} bg={sectionBg} _dark={{ bg: 'gray.600' }}
      >
        {participant.total_points} pts
      </Badge>
      <Flex align="center" gap={2}>
        <Badge
          as={motion.div}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: .4, delay: .1 }}
          whileHover={{ scale: 1.04 }}
          colorScheme={moneyColorScheme} fontSize="2xl" px={5} py={2} borderRadius="lg" boxShadow={kpiShadow} bg={sectionBg} _dark={{ bg: 'gray.600' }}>
          €{Number(participant.money).toLocaleString('es-ES')}
        </Badge>
        <Button size="sm" variant="ghost" onClick={onEditMoney} aria-label="Editar dinero">
          <EditIcon color="green.700" boxSize={6} />
        </Button>
      </Flex>
      <Badge
        as={motion.div}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: .45, delay: .12 }}
        colorScheme="gray" fontSize="2xl" px={5} py={2} borderRadius="lg" boxShadow={kpiShadow} bg={sectionBg} _dark={{ bg: 'gray.600' }}
      >
        {loadingPosition ? 'Cargando posición...' : (position ?? 'Sin ranking') && position !== null && position !== undefined ? `Posición: ${position}` : 'Sin ranking'}
      </Badge>
      <Badge
        as={motion.div}
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: .5, delay: .16 }}
        whileHover={{ scale: 1.04 }}
        colorScheme="purple" fontSize="2xl" px={5} py={2} borderRadius="lg" boxShadow={kpiShadow} bg={sectionBg} _dark={{ bg: 'gray.600' }}>
        Valor plantilla: {Intl.NumberFormat('es-ES',{ notation:'compact', maximumFractionDigits:1 }).format(plantillaValue)} €
      </Badge>
    </Flex>
  );
}
