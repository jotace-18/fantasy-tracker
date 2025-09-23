import { Box, Text } from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function CumulativeRankChart({ history }) {
  if (!Array.isArray(history) || history.length === 0) {
    return <Text color="gray.400">Sin historial de posiciones.</Text>;
  }

  return (
    <Box w="100%" h="260px" bg="white" borderRadius="md" boxShadow="sm" p={4}>
      <Text fontWeight="bold" mb={2} fontSize="md">Progreso de posición acumulada por jornada</Text>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={history} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="jornada" tick={{ fontSize: 12 }} label={{ value: "Jornada", position: "insideBottom", offset: -4 }} />
          <YAxis reversed allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: "Posición", angle: -90, position: "insideLeft", offset: 0 }} />
          <Tooltip formatter={(v) => `Posición: ${v}`} labelFormatter={j => `Jornada ${j}`} />
          <Line type="monotone" dataKey="rank" stroke="#38A169" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
