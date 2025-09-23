import { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";

// Hook para obtener y actualizar el reloj interno
export default function InternalClock() {
  const [currentTime, setCurrentTime] = useState(null);

  useEffect(() => {
    let interval;
    const fetchTime = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/clock");
        const data = await res.json();
        setCurrentTime(data.currentTime);
      } catch {
        setCurrentTime(null);
      }
    };
    fetchTime();
    interval = setInterval(fetchTime, 1000); // Actualiza cada segundo
    return () => clearInterval(interval);
  }, []);

  if (!currentTime) return <Text color="gray.400">Sin conexión al reloj</Text>;

  const date = new Date(currentTime);
  const formatted = date.toLocaleString("es-ES", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Box px={3} py={1} bg="gray.100" borderRadius="md" fontSize="sm" color="gray.700" fontWeight="semibold" boxShadow="sm">
      <Text>🕒 {formatted}</Text>
    </Box>
  );
}
