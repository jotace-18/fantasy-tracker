import { Box, Text } from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function CumulativePointsChart({ history }) {
  if (!Array.isArray(history) || history.length === 0) {
    return <Text color="gray.400">Sin historial de puntos.</Text>;
  }

  return (
    <Box w="100%" h="260px" bg="white" borderRadius="md" boxShadow="sm" p={4}>
      <Text fontWeight="bold" mb={2} fontSize="md">Progreso de puntos acumulados por jornada</Text>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={history} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="jornada" tick={{ fontSize: 12 }} label={{ value: "Jornada", position: "insideBottom", offset: -4 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: "Puntos", angle: -90, position: "insideLeft", offset: 0 }} />
          <Tooltip formatter={(v, n) => n === 'totalPoints' ? `${v} pts` : v} labelFormatter={j => `Jornada ${j}`} />
          <Legend verticalAlign="top" height={36}/>
          <Line type="monotone" dataKey="totalPoints" name="Tus puntos acumulados" stroke="#3182ce" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
