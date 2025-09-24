// components/TransferLog.jsx
import { useState, useEffect } from "react";
import { Box, Text, Flex, Spinner } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";

export default function TransferLog({ refreshKey, participantId }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const myParticipantId = 8; // Hardcodeado para demo, ideal: obtener del contexto de usuario
  const navigate = useNavigate();

  const fetchTransfers = () => {
    setLoading(true);
    fetch("/api/transfers")
      .then(res => res.json())
      .then(data => {
        let filtered = Array.isArray(data) ? data : [];
        if (participantId) {
          filtered = filtered.filter(t =>
            String(t.from_participant_id) === String(participantId) ||
            String(t.to_participant_id) === String(participantId)
          );
        }
        setTransfers(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransfers();
  }, [refreshKey, participantId]);

  const getColor = (type, fromName, toName, fromId, toId) => {
    // Si interviene el mercado (id null)
    if (fromId == null || toId == null) {
      return { bg: "#ffb347", border: "4px solid #b45309", text: "white" };
    }
    switch (type) {
      case "buy": return { bg: "yellow.50", border: "4px solid #eab308", text: "yellow.700" };
      case "sell": return { bg: "purple.50", border: "4px solid #a259e6", text: "purple.700" };
      case "clause": return { bg: "red.50", border: "4px solid #dc2626", text: "red.700" };
      default: return { bg: "blue.50", border: "4px solid #0284c7", text: "blue.700" };
    }
  };

  const participantLink = (id, name) => {
    if (id == null) return <b>{name || "Mercado"}</b>;
    if (String(id) === String(myParticipantId)) {
      return <b style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/my-team")}>{name}</b>;
    }
    return (
      <Link to={`/participants/${id}`} style={{ fontWeight: "bold", textDecoration: "underline" }}>{name}</Link>
    );
  };

  return (
    <Box
      flex={1}
      minW="420px"
      maxW="520px"
      maxH="520px"
      overflowY="auto"
      bg="white"
      borderRadius="md"
      boxShadow="md"
      p={4}
      border="1px solid #e2e8f0"
    >
      <Text fontWeight="bold" mb={2} textAlign="center">
        Log de traspasos
      </Text>

      {loading ? (
        <Flex justify="center" align="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      ) : transfers.length === 0 ? (
        <Text textAlign="center" color="gray.400">No hay traspasos aún</Text>
      ) : (
        transfers.map((t) => {
          const { bg, border, text } = getColor(t.type, t.from_name, t.to_name, t.from_participant_id, t.to_participant_id);
          return (
            <Box key={t.id} mb={3} bg={bg} borderLeft={border} borderRadius="md" p={3}>
              <Flex justify="space-between" mb={1}>
                <Text fontWeight="bold" color={text}>
                  {participantLink(t.from_participant_id, t.from_name)} → {participantLink(t.to_participant_id, t.to_name)}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(t.transfer_date).toLocaleDateString("es-ES")}
                </Text>
              </Flex>
              <Flex justify="space-between">
                <Text color="gray.800">{t.player_name}</Text>
                <Text fontWeight="bold">
                  {t.amount.toLocaleString("es-ES")} €
                </Text>
              </Flex>
            </Box>
          );
        })
      )}
    </Box>
  );
}
