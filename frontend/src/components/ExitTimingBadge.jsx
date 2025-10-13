import React from 'react';
import { Badge, Tooltip, HStack, Icon } from '@chakra-ui/react';
import { FiAlertTriangle, FiClock, FiTarget, FiCheck } from 'react-icons/fi';

/**
 * ExitTimingBadge - Muestra el timing óptimo de venta
 * @param {Object} exitTiming - { urgency: 'URGENT'|'SOON'|'OPPORTUNITY'|'HOLD', window, action, reasoning }
 */
const ExitTimingBadge = ({ exitTiming }) => {
  if (!exitTiming) return null;

  const getConfig = (urgency) => {
    switch (urgency) {
      case 'URGENT':
        return {
          colorScheme: 'red',
          label: 'Urgente',
          icon: FiAlertTriangle,
        };
      case 'SOON':
        return {
          colorScheme: 'orange',
          label: 'Próximamente',
          icon: FiClock,
        };
      case 'OPPORTUNITY':
        return {
          colorScheme: 'yellow',
          label: 'Oportunidad',
          icon: FiTarget,
        };
      case 'HOLD':
        return {
          colorScheme: 'green',
          label: 'Mantener',
          icon: FiCheck,
        };
      default:
        return {
          colorScheme: 'gray',
          label: 'N/A',
          icon: FiClock,
        };
    }
  };

  const config = getConfig(exitTiming.urgency);

  return (
    <Tooltip
      label={
        <div style={{ fontSize: '12px' }}>
          <strong>{exitTiming.action}</strong>
          <div style={{ marginTop: '4px' }}>Ventana: {exitTiming.window}</div>
          <div style={{ marginTop: '4px', opacity: 0.9 }}>{exitTiming.reasoning}</div>
        </div>
      }
      placement="top"
      hasArrow
    >
      <Badge
        colorScheme={config.colorScheme}
        display="inline-flex"
        alignItems="center"
        gap={1}
        px={2}
        py={1}
        borderRadius="md"
        fontSize="xs"
        cursor="help"
      >
        <Icon as={config.icon} boxSize={3} />
        {config.label}
      </Badge>
    </Tooltip>
  );
};

export default ExitTimingBadge;
