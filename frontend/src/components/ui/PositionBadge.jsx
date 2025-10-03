import { Badge } from '@chakra-ui/react';

const COLOR_MAP = { GK: 'orange', DEF: 'cyan', MID: 'purple', FWD: 'pink' };

export function PositionBadge({ position }) {
  const scheme = COLOR_MAP[position] || 'gray';
  return <Badge colorScheme={scheme} variant='solid' fontSize='0.65rem' px={2}>{position}</Badge>;
}
