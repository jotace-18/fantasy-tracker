import { Card, SimpleGrid, Stat, StatHelpText, StatLabel } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';

const MotionCard = motion(Card);

export function PlayerStatsGrid({ stats }) {
  return (
    <SimpleGrid columns={[1, 2, 4]} spacing={6} mb={6}>
      {stats.map((s, i) => (
        <MotionCard key={s.label} p={4} borderRadius='xl' shadow='md' bg='gray.50'
          initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: .4 }}
        >
          <Stat>
            <StatLabel>{s.label}</StatLabel>
            <AnimatedNumber value={s.value} color={s.color} isMoney={s.isMoney} />
            {s.delta !== undefined && <StatHelpText>Δ {s.delta ?? '-'}</StatHelpText>}
            {s.help && <StatHelpText>{s.help}</StatHelpText>}
          </Stat>
        </MotionCard>
      ))}
    </SimpleGrid>
  );
}
