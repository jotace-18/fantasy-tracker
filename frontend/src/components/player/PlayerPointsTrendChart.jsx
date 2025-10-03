import { Card, CardHeader, CardBody, Text, HStack, Badge } from '@chakra-ui/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, ReferenceDot, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

export function PlayerPointsTrendChart({ history }) {
  if(!history || !history.length) return null;
  // history: [{ jornada, points }]
  const data = history.map(h => ({ jornada: h.jornada, points: h.points }));
  const values = data.map(d => d.points);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = (values.reduce((a,b)=>a+b,0)/values.length).toFixed(2);

  return (
    <MotionCard shadow='md' borderRadius='2xl' mb={8}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: .55 }}
    >
      <CardHeader>
        <HStack justify='space-between' flexWrap='wrap' gap={3}>
          <Text fontSize='xl' fontWeight='bold'>Puntos por Jornada</Text>
          <HStack>
            <Badge colorScheme='purple'>Media {avg}</Badge>
            <Badge colorScheme='green'>Máx {max}</Badge>
            <Badge colorScheme='red'>Mín {min}</Badge>
          </HStack>
        </HStack>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width='100%' height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='jornada' tickFormatter={(v)=>'J'+v} />
            <YAxis tickFormatter={(v)=>v} domain={['dataMin - 2','dataMax + 2']} />
            <Tooltip labelFormatter={(j)=>`Jornada ${j}`} formatter={(v)=>[v+' pts','Puntos']} />
            <defs>
              <linearGradient id='ptsArea' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#805AD5' stopOpacity={0.35} />
                <stop offset='100%' stopColor='#805AD5' stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type='monotone' dataKey='points' stroke='transparent' fill='url(#ptsArea)' />
            <Line type='monotone' dataKey='points' stroke='#805AD5' strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            <ReferenceLine y={avg} stroke='#3182CE' strokeDasharray='4 4' label={{ value: 'Media', position: 'right', fill: '#3182CE', fontSize: 12 }} />
            <ReferenceDot ifOverflow='discard' x={data.find(d=>d.points===max)?.jornada} y={max} r={6} fill='green' stroke='black' label={{ value: 'Máx', position: 'top', fill: 'green', fontSize: 11 }} />
            <ReferenceDot ifOverflow='discard' x={data.find(d=>d.points===min)?.jornada} y={min} r={6} fill='red' stroke='black' label={{ value: 'Mín', position: 'bottom', fill: 'red', fontSize: 11 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </MotionCard>
  );
}
