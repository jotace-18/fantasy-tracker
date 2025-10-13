import React from 'react';
import { Badge, Tooltip, Icon } from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

/**
 * BubbleBadge - Alerta de burbuja (sobrevaloración)
 * @param {Object} bubble - { is_bubble: boolean, severity: 'low'|'medium'|'high', penalty: number, reasoning: string }
 */
const BubbleBadge = ({ bubble }) => {
  if (!bubble || !bubble.is_bubble) return null;

  const getConfig = (severity) => {
    switch (severity) {
      case 'high':
        return {
          colorScheme: 'red',
          label: '⚠️ Burbuja crítica',
          variant: 'solid',
        };
      case 'medium':
        return {
          colorScheme: 'orange',
          label: '⚠️ Burbuja moderada',
          variant: 'solid',
        };
      case 'low':
        return {
          colorScheme: 'yellow',
          label: '⚠️ Posible burbuja',
          variant: 'subtle',
        };
      default:
        return {
          colorScheme: 'yellow',
          label: '⚠️ Alerta',
          variant: 'subtle',
        };
    }
  };

  const config = getConfig(bubble.severity);
  const penaltyPercent = Math.abs(Math.round(bubble.penalty * 100));

  return (
    <Tooltip
      label={
        <div style={{ fontSize: '12px' }}>
          <strong>⚠️ ALERTA DE BURBUJA: -{penaltyPercent}%</strong>
          <div style={{ marginTop: '4px', opacity: 0.9 }}>{bubble.reasoning}</div>
          <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#ffcc00' }}>
            Precaución: comprar ahora podría ser perseguir el tren
          </div>
        </div>
      }
      placement="top"
      hasArrow
    >
      <Badge
        colorScheme={config.colorScheme}
        variant={config.variant}
        display="inline-flex"
        alignItems="center"
        gap={1}
        px={2}
        py={1}
        borderRadius="md"
        fontSize="xs"
        cursor="help"
      >
        <Icon as={FiAlertTriangle} boxSize={3} />
        {config.label}
      </Badge>
    </Tooltip>
  );
};

export default BubbleBadge;
