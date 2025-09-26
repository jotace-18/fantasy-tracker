import { useState, useMemo } from "react";
import ClauseLockModal from "../components/ClauseLockModal";
import {
  Input, HStack, IconButton, Text, Tooltip, Badge, Box
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon, TimeIcon } from "@chakra-ui/icons";

// Nueva cabecera sugerida para la tabla:
// | Nombre | Posición | Equipo | Valor mercado | Cláusula | Puntos | Acciones |
export function EditablePlayerRowHeader() {
  return (
    <tr>
      <th style={{ fontWeight: 700, textAlign: "left" }}>Nombre</th>
      <th style={{ fontWeight: 700, textAlign: "left" }}>Posición</th>
      <th style={{ fontWeight: 700, textAlign: "left" }}>Equipo</th>
      <th style={{ fontWeight: 700, textAlign: "right" }}>Valor Mercado</th>
      <th style={{ fontWeight: 700, textAlign: "center" }}>Cláusula</th>
      <th style={{ fontWeight: 700, textAlign: "center" }}>Clausulable</th>
      <th style={{ fontWeight: 700, textAlign: "right" }}>Puntos</th>
      <th style={{ fontWeight: 700, textAlign: "center" }}>Acciones</th>
    </tr>
  );
}

// Componente principal EditablePlayerRow
export default function EditablePlayerRow({ player, participantId, onChange, rowStyle = {} }) {
  const [clauseModalOpen, setClauseModalOpen] = useState(false);
  const [clauseForm, setClauseForm] = useState({
    clause_value: player.clause_value ?? player.market_value ?? 0,
    is_clausulable: !!player.is_clausulable,
    lock_days: 0,
    lock_hours: 0
  });
  // Eliminados edit y setClause (no usados)
  const [removing, setRemoving] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);

  // ⏳ calcular tiempo restante de cláusula
  const clauseTimeLeft = useMemo(() => {
    if (!player.clause_lock_until) return { days: 0, hours: 0 };
    const now = Date.now();
    const lockUntil = Date.parse(player.clause_lock_until);
    const diffMs = lockUntil - now;
    if (diffMs <= 0) return { days: 0, hours: 0 };
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days: diffDays, hours: diffHours };
  }, [player.clause_lock_until]);

  // DEBUG LOGS
  // console.log('DEBUG player:', player.name, {
  //   hours_remaining: player.hours_remaining,
  //   clause_lock_until: player.clause_lock_until,
  //   clauseTimeLeft
  // });

  // inicializar inputs al entrar en modo edición
  const handleEdit = () => {
    setDays(clauseTimeLeft.days);
    setHours(clauseTimeLeft.hours);
    setClauseForm({
      clause_value: player.clause_value ?? player.market_value ?? 0,
      is_clausulable: !!player.is_clausulable,
      lock_days: clauseTimeLeft.days,
      lock_hours: clauseTimeLeft.hours
    });
    setClauseModalOpen(true);
  };

  // Eliminada función handleSave y referencias a setSaving y clausulable

  const handleRemove = async () => {
    if (!window.confirm("¿Eliminar jugador de la plantilla?")) return;
    setRemoving(true);
    try {
      await fetch(
        `/api/participant-players/${participantId}/team/${player.player_id}`,
        { method: "DELETE" }
      );
      onChange && onChange();
    } catch (e) {
      alert("Error eliminando jugador: " + e.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <tr style={rowStyle}>
        {/* Nombre */}
        <td style={{ fontWeight: 500 }}>
          <a
            href={player.player_id ? `/players/${player.player_id}` : undefined}
            style={{ color: "#2563eb", textDecoration: "none", fontWeight: 500 }}
            target="_blank"
            rel="noopener noreferrer"
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            {player.name}
          </a>
        </td>

        <td>{player.position}</td>
        <td>
          {(player.team_slug || player.team_id) ? (
            <a
              href={player.team_slug ? `/teams/${player.team_slug}` : `/teams/${player.team_id}`}
              style={{ color: "#059669", textDecoration: "none", fontWeight: 500, cursor: "pointer" }}
              target="_blank"
              rel="noopener noreferrer"
              onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
            >
              {player.team}
            </a>
          ) : (
            player.team
          )}
        </td>

        {/* Valor mercado */}
        <td style={{ textAlign: "right" }}>
          {player.market_value_num?.toLocaleString("es-ES") || 0}
        </td>

        {/* Cláusula */}
        <td style={{ textAlign: "center" }}>
          {player.is_clausulable ? (
            <Badge colorScheme="purple" fontSize="md" px={3} py={1} borderRadius="md">
              {`€${Number(player.clause_value || player.market_value_num || 0).toLocaleString("es-ES")}`}
            </Badge>
          ) : (
            <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="md">
              {(() => {
                let d = 0, h = 0;
                if (typeof player.hours_remaining === 'number' && player.hours_remaining > 0) {
                  d = Math.floor(player.hours_remaining / 24);
                  h = player.hours_remaining % 24;
                } else {
                  d = clauseTimeLeft.days;
                  h = clauseTimeLeft.hours;
                }
                return `${d}D ${h}H`;
              })()}
            </Badge>
          )}
        </td>

        {/* Clausulable */}
        <td style={{ textAlign: "center" }}>
          {player.is_clausulable ? (
            <Badge colorScheme="green" px={2} py={1} borderRadius="md">CLAUSULABLE</Badge>
          ) : (
            <Badge colorScheme="red" px={2} py={1} borderRadius="md" display="flex" alignItems="center">
              NO CLAUSULABLE <TimeIcon ml={1} color="purple.600" />
            </Badge>
          )}
        </td>

        {/* Puntos */}
        <td style={{ textAlign: "right", fontWeight: 500 }}>
          {Number(player.total_points) || 0}
        </td>

        {/* Acciones */}
        <td style={{ textAlign: "center" }}>
          <HStack spacing={1} justify="center">
            <IconButton
              size="sm"
              colorScheme="blue"
              icon={<EditIcon />}
              onClick={handleEdit}
              aria-label="Editar"
            />
            <IconButton
              size="sm"
              colorScheme="red"
              icon={<DeleteIcon />}
              onClick={handleRemove}
              isLoading={removing}
              aria-label="Eliminar"
            />
          </HStack>
        </td>
      </tr>
      <ClauseLockModal
        isOpen={clauseModalOpen}
        onClose={() => setClauseModalOpen(false)}
        player={player}
        clauseForm={clauseForm}
        setClauseForm={setClauseForm}
        onSave={async () => {
          try {
            // PATCH cláusula
            await fetch(
              `/api/participant-players/${participantId}/team/${player.player_id}/clause`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clause_value: Number(clauseForm.clause_value) }),
              }
            );
            // PATCH clausulable
            await fetch(
              `/api/participant-players/${participantId}/team/${player.player_id}/clausulable`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_clausulable: clauseForm.is_clausulable ? 1 : 0 }),
              }
            );
            // PATCH tiempo de cláusula
            await fetch(
              `/api/participant-players/${participantId}/team/${player.player_id}/clause-lock`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ days: Number(clauseForm.lock_days), hours: Number(clauseForm.lock_hours) }),
              }
            );
            setClauseModalOpen(false);
            onChange && onChange();
          } catch (e) {
            alert("Error guardando cambios: " + e.message);
          }
        }}
      />
    </>
  );
}
