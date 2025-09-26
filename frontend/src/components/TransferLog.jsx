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
    // Mercado a jugador (compra)
    if (fromId == null && toId != null) {
      if (String(toId) === String(myParticipantId)) {
        // 3º De mercado a jugador (compra) (igual a id = 8): naranja oscuro
        return { bg: "#ff9800", border: "4px solid #b45309", text: "white" };
      } else {
        // 1º De mercado a jugador (compra) (diferente de id = 8): naranjita claro
        return { bg: "#ffe0b2", border: "4px solid #ffb347", text: "#b45309" };
      }
    }
    // Jugador a mercado (venta)
    if (toId == null && fromId != null) {
      if (String(fromId) === String(myParticipantId)) {
        // 4º De mercado a jugador (venta) (igual a id = 8): azul oscuro
        return { bg: "#1976d2", border: "4px solid #0d47a1", text: "white" };
      } else {
        // 2º De jugador a mercado (venta) (diferente de id = 8): azul claro
        return { bg: "#bbdefb", border: "4px solid #1976d2", text: "#0d47a1" };
      }
    }
    // Clausulazos
    if (type === "clause") {
      if (String(fromId) === String(myParticipantId)) {
        // 10º de jugadorA clausulazo id=8 (rojito)
        return { bg: "#ffebee", border: "4px solid #c62828", text: "#b71c1c", fontWeight: "bold" };
      } else if (String(toId) === String(myParticipantId)) {
        // 9º De id=8 clausulazo a jugadorA(morado y fuerte)
        return { bg: "#7c3aed", border: "4px solid #4c1d95", text: "white", fontWeight: "bold" };
      } else {
        // Clausulazo entre otros
        return { bg: "#ede9fe", border: "4px solid #7c3aed", text: "#4c1d95", fontWeight: "bold" };
      }
    }
    // JugadorA a jugadorB
    if (fromId != null && toId != null) {
      if (String(fromId) === String(myParticipantId)) {
        // 8º De id=8 a jugadorA(el color que quieras)
        return { bg: "#fffde7", border: "4px solid #fbc02d", text: "#f57c00", fontWeight: "bold" };
      } else if (String(toId) === String(myParticipantId)) {
        // 6º De jugadorA a id=8(el mismo color de 5º pero más fuerte)
        return { bg: "#c6f6d5", border: "4px solid #2f855a", text: "#22543d", fontWeight: "bold" };
      } else {
        // 5º De jugadorA a jugadorB(el color que quieras)
        return { bg: "#e0e7ff", border: "4px solid #2563eb", text: "#1e3a8a" };
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
                          <FaGavel style={{ color: '#7c3aed', fontSize: 18, marginRight: 4, verticalAlign: 'middle' }} />
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
