import { Flex, Button, Avatar, Text, Tooltip } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import InternalClock from "../InternalClock";

export default function Topbar({ onScrape }) {
  const [lastScraped, setLastScraped] = useState(null);
  const [isValidToday, setIsValidToday] = useState(false);

  useEffect(() => {
    fetch("http://localhost:4000/api/scraper-metadata/last")
      .then((res) => res.json())
      .then((data) => {
        if (data.lastScraped) {
          setLastScraped(new Date(data.lastScraped));
        }
      })
      .catch(() => setLastScraped(null));
  }, []);

  useEffect(() => {
    if (!lastScraped) {
      setIsValidToday(false);
      return;
    }

    const now = new Date();
    const reset = new Date(now);
    reset.setHours(16, 0, 0, 0);

    // Si ahora es antes de las 16h, usamos el reset de ayer
    if (now < reset) {
      reset.setDate(reset.getDate() - 1);
    }

    setIsValidToday(lastScraped >= reset);
  }, [lastScraped]);

  // Formatear fecha para tooltip
  const formattedDate = lastScraped
    ? lastScraped.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Nunca";

  return (
    <Flex justify="space-between" align="center" p={4} bg="white" boxShadow="md">
      <Flex align="center" gap={3}>
        <Button colorScheme="blue" onClick={onScrape}>
          🔄 Actualizar datos
        </Button>
        <Tooltip
          label={`Último scrapeo: ${formattedDate}`}
          aria-label="Fecha último scrapeo"
          placement="right"
          hasArrow
        >
          <Text fontSize="lg" cursor="default">
            {lastScraped ? (isValidToday ? "✅" : "❌") : "❌"}
          </Text>
        </Tooltip>
      </Flex>
      <InternalClock />
      <Avatar size="sm" name="Usuario" />
    </Flex>
  );
}
