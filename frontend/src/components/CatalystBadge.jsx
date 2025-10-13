import React from 'react';
import { Badge, Tooltip, Icon } from '@chakra-ui/react';
import { FiZap, FiStar, FiArrowUp } from 'react-icons/fi';

/**
 * CatalystBadge - Muestra catalizadores de crecimiento
 * @param {Object} catalyst - { has_catalyst: boolean, type: string, bonus: number, reasoning: string }
 */
const CatalystBadge = ({ catalyst }) => {
  if (!catalyst || !catalyst.has_catalyst) return null;

  const getConfig = (type) => {
    switch (type) {
      case 'easy_fixtures':
        return {
          colorScheme: 'green',
          label: '⚽ Partidos fáciles',
          icon: FiZap,
        };
      case 'breakout':
        return {
          colorScheme: 'purple',
          label: '🚀 Breakout',
          icon: FiArrowUp,
        };
      case 'new_starter':
        return {
          colorScheme: 'cyan',
          label: '⭐ Nuevo titular',
          icon: FiStar,
        };
      default:
        return {
          colorScheme: 'blue',
          label: '💡 Oportunidad',
          icon: FiZap,
        };
    }
  };

  const config = getConfig(catalyst.type);
  const bonusPercent = Math.round(catalyst.bonus * 100);

  return (
    <Tooltip
      label={
        <div style={{ fontSize: '12px' }}>
          <strong>Catalizador detectado: +{bonusPercent}%</strong>
          <div style={{ marginTop: '4px', opacity: 0.9 }}>{catalyst.reasoning}</div>
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
        variant="solid"
      >
        <Icon as={config.icon} boxSize={3} />
        {config.label}
      </Badge>
    </Tooltip>
  );
};

export default CatalystBadge;
