import React from 'react';
import { Badge, Tooltip, Icon } from '@chakra-ui/react';
import { FiTrendingUp, FiActivity, FiAlertCircle, FiXCircle } from 'react-icons/fi';

/**
 * LiquidityBadge - Muestra el nivel de liquidez del activo
 * @param {Object} liquidity - { score: 0-1, level: 'muy_liquido'|'liquido'|'poco_liquido'|'iliquido', reasoning }
 */
const LiquidityBadge = ({ liquidity }) => {
  if (!liquidity) return null;

  const getConfig = (level) => {
    switch (level) {
      case 'muy_liquido':
        return {
          colorScheme: 'green',
          label: 'Muy líquido',
          icon: FiTrendingUp,
        };
      case 'liquido':
        return {
          colorScheme: 'blue',
          label: 'Líquido',
          icon: FiActivity,
        };
      case 'poco_liquido':
        return {
          colorScheme: 'orange',
          label: 'Poco líquido',
          icon: FiAlertCircle,
        };
      case 'iliquido':
        return {
          colorScheme: 'red',
          label: 'Ilíquido',
          icon: FiXCircle,
        };
      default:
        return {
          colorScheme: 'gray',
          label: 'N/A',
          icon: FiActivity,
        };
    }
  };

  const config = getConfig(liquidity.level);
  const scorePercent = Math.round(liquidity.score * 100);

  return (
    <Tooltip
      label={
        <div style={{ fontSize: '12px' }}>
          <strong>Score de liquidez: {scorePercent}%</strong>
          <div style={{ marginTop: '4px', opacity: 0.9 }}>{liquidity.reasoning}</div>
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

export default LiquidityBadge;
