// src/pages/PlayerDetailPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Spinner, Text, Badge, Table, Thead, Tbody, Tr, Th, Td,
  TableContainer, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText,
  Card, CardHeader, CardBody, Divider, Progress, HStack, Tooltip as CTooltip
} from "@chakra-ui/react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot
} from "recharts";

// helpers
const toInt = (v) => {
  if (typeof v === "number") return v;
  if (v == null) return null;
  const n = Number(String(v).replace(/\./g, "").replace(/,/g, "").replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const parseDateTs = (s) => {
  if (!s) return null;
  // soporta dd/mm/yyyy o yyyy-mm-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/").map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : null;
};
const euro = (n) => (typeof n === "number" ? n.toLocaleString("es-ES") : n ?? "-");
const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "2-digit" });

function PlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:4000/api/players/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPlayer(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error al cargar detalle del jugador:", err);
        setLoading(false);
      });
  }, [id]);

  const { historySorted, maxItem, minItem } = useMemo(() => {
    const raw = player?.market?.history || [];
    const mapped = raw
      .map((h) => ({
        ts: parseDateTs(h.date),
        dateLabel: h.date,
        value: toInt(h.value),
      }))
      .filter((x) => x.ts && x.value != null)
      .sort((a, b) => a.ts - b.ts);

    let maxItem = null;
    let minItem = null;
    for (const it of mapped) {
      if (!maxItem || it.value > maxItem.value) maxItem = it;
      if (!minItem || it.value < minItem.value) minItem = it;
    }
    return { historySorted: mapped, maxItem, minItem };
  }, [player]);

  if (loading) {
    return (
      <Box textAlign="center" mt="10">
        <Spinner size="xl" />
        <Text mt="2">Cargando detalle del jugador...</Text>
      </Box>
    );
  }

  if (!player) {
    return (
      <Box textAlign="center" mt="10">
        <Text color="red.500" fontWeight="bold" fontSize="xl">
          Jugador no encontrado
        </Text>
      </Box>
    );
  }

  const mvCurrent = toInt(player.market.current);
  const mvMax = toInt(player.market.max);
  const mvMin = toInt(player.market.min);

  // Mapear riesgo
  const mapRisk = (r) => {
    if (r == null) return { label: "Sin dato", color: "gray", percent: 0 };
    if (r <= 1) return { label: "Riesgo muy bajo", color: "green", percent: 15 };
    if (r === 2) return { label: "Riesgo bajo", color: "green", percent: 30 };
    if (r === 3) return { label: "Riesgo moderado", color: "yellow", percent: 55 };
    if (r === 4) return { label: "Riesgo alto", color: "orange", percent: 75 };
    return { label: "Riesgo muy alto", color: "red", percent: 90 };
  };
  const riskInfo = mapRisk(player.risk_level);

  const titularPct = player.titular_next_jor != null ? Math.round(player.titular_next_jor * 100) : null;

  const lesionBadge = player.lesionado ? {
    text: "Lesionado",
    color: "red"
  } : {
    text: "Disponible",
    color: "green"
  };

  return (
    <Box p={6}>
      {/* Cabecera */}
      <Card mb={6} shadow="lg" borderRadius="2xl" p={4}>
        <CardHeader pb={2}>
          <Text fontSize="3xl" fontWeight="bold" color="teal.600">
            {player.name}
          </Text>
          <Text fontSize="lg" color="gray.600">
            {player.team_name} • {player.position}
          </Text>
          <HStack mt={3} spacing={3} wrap="wrap" alignItems="center">
            <CTooltip label={`Índice: ${player.risk_level ?? '-'} / Categoría derivada.`} hasArrow>
              <Badge colorScheme={riskInfo.color} px={3} py={1} borderRadius="lg" fontWeight="semibold">
                {riskInfo.label}
              </Badge>
            </CTooltip>
            <Badge colorScheme={lesionBadge.color} px={3} py={1} borderRadius="lg" fontWeight="bold">
              {lesionBadge.text}
            </Badge>
            {titularPct != null && (
              <Badge
                colorScheme={titularPct >= 80 ? "green" : titularPct >= 50 ? "yellow" : "red"}
                px={3}
                py={1}
                borderRadius="lg"
                fontWeight="bold"
              >
                Titular J próxima: {titularPct}%
              </Badge>
            )}
          </HStack>
          <Box mt={4} maxW="380px">
            <Text fontSize="sm" mb={1} color="gray.600">Riesgo de lesión</Text>
            <Progress
              value={riskInfo.percent}
              size="sm"
              colorScheme={riskInfo.color}
              borderRadius="md"
              hasStripe
              isAnimated
            />
          </Box>
        </CardHeader>
      </Card>

      {/* Stats */}
      <SimpleGrid columns={[1, 2, 4]} spacing={6} mb={6}>
        <Stat p={4} shadow="md" borderRadius="xl" bg="gray.50">
          <StatLabel>Valor Actual</StatLabel>
          <StatNumber color="teal.600">{euro(mvCurrent)} €</StatNumber>
          <StatHelpText>Δ {player.market.delta ?? "-"}</StatHelpText>
        </Stat>
        <Stat p={4} shadow="md" borderRadius="xl" bg="gray.50">
          <StatLabel>Valor Máximo</StatLabel>
          <StatNumber color="green.500">{euro(mvMax)} €</StatNumber>
        </Stat>
        <Stat p={4} shadow="md" borderRadius="xl" bg="gray.50">
          <StatLabel>Valor Mínimo</StatLabel>
          <StatNumber color="red.500">{euro(mvMin)} €</StatNumber>
        </Stat>
        <Stat p={4} shadow="md" borderRadius="xl" bg="gray.50">
          <StatLabel>Puntos Totales</StatLabel>
          <StatNumber color="purple.600">{player.points.total}</StatNumber>
          <StatHelpText>Media: {player.points.avg}</StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Gráfico de evolución de mercado */}
      {historySorted.length > 0 && (
        <Card shadow="md" borderRadius="2xl" mb={6}>
          <CardHeader>
            <Text fontSize="xl" fontWeight="bold">
              Evolución del Valor de Mercado
            </Text>
          </CardHeader>
          <Divider />
          <CardBody>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={historySorted}>
                <CartesianGrid strokeDasharray="3 3" />
                {/* Eje X temporal */}
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={fmtDate}
                />
                {/* Eje Y dinámico */}
                <YAxis
                  domain={["dataMin - 2000000", "dataMax + 2000000"]}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip
                  labelFormatter={(ts) => `Fecha: ${fmtDate(ts)}`}
                  formatter={(v) => [`${euro(v)} €`, "Valor"]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3182CE"
                  strokeWidth={2}
                  dot={false}
                />
                {/* Marca Máximo */}
                {maxItem && (
                  <ReferenceDot
                    x={maxItem.ts}
                    y={maxItem.value}
                    r={6}
                    fill="green"
                    stroke="black"
                    label={{ value: "Máx", position: "top", fill: "green" }}
                  />
                )}
                {/* Marca Mínimo */}
                {minItem && (
                  <ReferenceDot
                    x={minItem.ts}
                    y={minItem.value}
                    r={6}
                    fill="red"
                    stroke="black"
                    label={{ value: "Mín", position: "bottom", fill: "red" }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Historial de puntos */}
      <Card shadow="md" borderRadius="2xl">
        <CardHeader>
          <Text fontSize="xl" fontWeight="bold">
            Historial de Puntos Fantasy
          </Text>
        </CardHeader>
        <Divider />
        <CardBody>
          <TableContainer>
            <Table variant="striped" colorScheme="teal" size="sm">
              <Thead>
                <Tr>
                  <Th>Jornada</Th>
                  <Th isNumeric>Puntos</Th>
                </Tr>
              </Thead>
              <Tbody>
                {player.points.history.map((p, idx) => (
                  <Tr key={idx}>
                    <Td fontWeight="medium">{p.jornada}</Td>
                    <Td
                      isNumeric
                      color={p.points < 0 ? "red.500" : "green.600"}
                      fontWeight="semibold"
                    >
                      {p.points}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    </Box>
  );
}

export default PlayerDetailPage;
