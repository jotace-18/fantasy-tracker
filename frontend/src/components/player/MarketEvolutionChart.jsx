import { Card, CardBody, CardHeader, Divider, HStack, Text, Button, ButtonGroup } from '@chakra-ui/react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Line, ReferenceDot } from 'recharts';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const euro = (n) => (typeof n === 'number' ? n.toLocaleString('es-ES') : n ?? '-');
const fmtDate = (ts) => new Date(ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });

export function MarketEvolutionChart({ history, range, onRangeChange, maxItem, minItem }) {
  if (!history.length) return null;
  return (
    <MotionCard shadow="md" borderRadius="2xl" mb={6}
      initial={{ opacity: 0, scale: .97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: .5 }}
    >
      <CardHeader>
        <Text fontSize="xl" fontWeight="bold">Evolución del Valor de Mercado</Text>
        <HStack mt={3} justify="flex-end">
          <ButtonGroup size='sm' isAttached variant='outline'>
            {['7','14','all'].map(r => (
              <Button
                key={r}
                onClick={() => onRangeChange(r)}
                colorScheme={range===r? 'blue': 'gray'}
                variant={range===r? 'solid':'outline'}
              >
                {r === 'all' ? 'Todos' : `Ult ${r}`}
              </Button>
            ))}
          </ButtonGroup>
        </HStack>
      </CardHeader>
      <Divider />
      <CardBody>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={history} key={range}>
            <CartesianGrid strokeDasharray="3 3" />
            <defs>
              <linearGradient id="valorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3182CE" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3182CE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="ts" type="number" domain={["dataMin", "dataMax"]} tickFormatter={fmtDate} />
            <YAxis domain={["dataMin - 2000000", "dataMax + 2000000"]} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
            <Tooltip labelFormatter={(ts) => `Fecha: ${fmtDate(ts)}`} formatter={(v) => [`${euro(v)} €`, 'Valor']} />
            <Area dataKey='value' stroke='transparent' fill='url(#valorArea)' />
            <Line type="monotone" dataKey="value" stroke="#3182CE" strokeWidth={2} dot={false} />
            {range==='all' && maxItem && (
              <ReferenceDot x={maxItem.ts} y={maxItem.value} r={6} fill="green" stroke="black" label={{ value: 'Máx', position: 'top', fill: 'green' }} />
            )}
            {range==='all' && minItem && (
              <ReferenceDot x={minItem.ts} y={minItem.value} r={6} fill="red" stroke="black" label={{ value: 'Mín', position: 'bottom', fill: 'red' }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </MotionCard>
  );
}
