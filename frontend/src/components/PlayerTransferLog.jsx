// components/TransferLog.jsx
import { useState, useEffect } from "react";
import { Box, Text, Flex, Spinner } from "@chakra-ui/react";
import { FaGavel, FaStore, FaHandshake } from "react-icons/fa";
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
    // 1. Mercado (compra/venta) - colores suaves
    if (fromId == null && toId != null) {
      // Compra al mercado
      return { bg: "#f5e9da", border: "4px solid #e0cfc2", text: "#7c4700" };
    }
    if (toId == null && fromId != null) {
      // Venta al mercado
      return { bg: "#e3eaf7", border: "4px solid #c2d1e0", text: "#1a3a5c" };
    }
    // 2. Entre jugadores (compra/venta) - colores suaves
    if (fromId != null && toId != null && type !== "clause") {
      // Compra/venta entre jugadores
      return { bg: "#f3f4f6", border: "4px solid #d1d5db", text: "#374151" };
    }
    // 3. Clausulazo
    if (type === "clause") {
      if (String(toId) === String(participantId)) {
        // Clausulazo ejercido por el participante (positivo, llamativo)
        return { bg: "#d1fae5", border: "4px solid #059669", text: "#065f46", fontWeight: "bold" };
      } else if (String(fromId) === String(participantId)) {
        // Clausulazo recibido (negativo, llamativo)
        return { bg: "#fee2e2", border: "4px solid #dc2626", text: "#991b1b", fontWeight: "bold" };
      } else {
        // Clausulazo entre otros (neutral llamativo)
        return { bg: "#ede9fe", border: "4px solid #7c3aed", text: "#4c1d95", fontWeight: "bold" };
      }
    }
    // Default
    return { bg: "#f3f4f6", border: "4px solid #6b7280", text: "#111827" };
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
                  {(() => {
                    // Clausulazo
                    if (t.type === "clause") {
                      return (
                        <span title="Clausulazo" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FaGavel style={{ color: (String(t.to_participant_id) === String(participantId)) ? '#059669' : (String(t.from_participant_id) === String(participantId)) ? '#dc2626' : '#7c3aed', fontSize: 18, marginRight: 4, verticalAlign: 'middle' }} />
                          <b>Clausulazo</b>
                          <span style={{ marginLeft: 8, fontWeight: 400 }}>
                            {new Date(t.transfer_date).toLocaleDateString("es-ES")}
                          </span>
                        </span>
                      );
                    }
                    // Mercado
                    if ((t.from_participant_id == null && t.to_participant_id != null) || (t.to_participant_id == null && t.from_participant_id != null)) {
                      return (
                        <span title="Mercado" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FaStore style={{ color: '#b45309', fontSize: 18, marginRight: 4, verticalAlign: 'middle' }} />
                          <b>Mercado</b>
                          <span style={{ marginLeft: 8, fontWeight: 400 }}>
                            {new Date(t.transfer_date).toLocaleDateString("es-ES")}
                          </span>
                        </span>
                      );
                    }
                    // Acuerdo entre jugadores (no clausulazo)
                    if (t.from_participant_id != null && t.to_participant_id != null && t.type !== "clause") {
                      return (
                        <span title="Acuerdo" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FaHandshake style={{ color: '#2563eb', fontSize: 18, marginRight: 4, verticalAlign: 'middle' }} />
                          <b>Acuerdo</b>
                          <span style={{ marginLeft: 8, fontWeight: 400 }}>
                            {new Date(t.transfer_date).toLocaleDateString("es-ES")}
                          </span>
                        </span>
                      );
                    }
                    // Default solo fecha
                    return new Date(t.transfer_date).toLocaleDateString("es-ES");
                  })()}
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
