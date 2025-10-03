import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function CumulativeRankChartComponent({ history }) {
  const bg = useColorModeValue('white','gray.800');
  const titleColor = useColorModeValue('gray.700','gray.100');
  const gridStroke = useColorModeValue('#e2e8f0','#2d3748');
  const lineColor = useColorModeValue('#2f855a','#68d391');
  const areaFrom = useColorModeValue('#38a16922','#38a16933');
  const areaTo = useColorModeValue('#38a16900','#38a16900');
  const tooltipBorder = useColorModeValue('gray.200','gray.600');

  const CustomTooltip = ({ active, payload, label }) => {
    if(active && payload && payload.length){
      return (
        <Box bg={bg} borderRadius='md' boxShadow='lg' p={2} fontSize='xs' border='1px solid' borderColor={tooltipBorder}>
          <Text fontWeight='bold'>Jornada {label}</Text>
          <Text color='green.500'>Posición: {payload[0].value}</Text>
        </Box>
      );
    }
    return null;
  };

  const data = useMemo(()=> history, [history]);

  if (!Array.isArray(history) || history.length === 0) {
    return <Text color="gray.400">Sin historial de posiciones.</Text>;
  }
  return (
    <Box w="100%" h="260px" bg={bg} borderRadius="md" boxShadow="sm" p={4} position='relative'>
      <Text fontWeight="bold" mb={2} fontSize="md" color={titleColor}>Progreso de posición</Text>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
          <defs>
            <linearGradient id='rankArea' x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor={areaFrom} />
              <stop offset='100%' stopColor={areaTo} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="jornada" tick={{ fontSize: 11, fill: titleColor }} tickLine={false} axisLine={{ stroke: gridStroke }} />
            <YAxis reversed allowDecimals={false} tick={{ fontSize: 11, fill: titleColor }} tickLine={false} axisLine={{ stroke: gridStroke }} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="rank" stroke={lineColor} strokeWidth={2} dot={{ r: 3, strokeWidth:1, stroke:'#22543d', fill:lineColor }} activeDot={{ r: 5, strokeWidth:2, stroke:'#22543d', fill:lineColor }} fillOpacity={1} fill='url(#rankArea)' />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

const CumulativeRankChart = React.memo(CumulativeRankChartComponent);
export default CumulativeRankChart;
