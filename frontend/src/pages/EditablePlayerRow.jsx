import { useState, useMemo } from "react";
import {
  Input, Switch, HStack, IconButton, Text, Tooltip
} from "@chakra-ui/react";
import { DeleteIcon, EditIcon, CheckIcon, CloseIcon, TimeIcon } from "@chakra-ui/icons";

export default function EditablePlayerRow({ player, participantId, onChange, rowStyle }) {
  const [edit, setEdit] = useState(false);
  const [clause, setClause] = useState(
    player.clause_value ?? player.market_value ?? 0
  );
  const [clausulable, setClausulable] = useState(
    player.is_clausulable ? true : false
  );
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  // estado editable para días/horas
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);

  // ⏳ calcular tiempo restante de cláusula
  const clauseTimeLeft = useMemo(() => {
    if (!player.clause_lock_until) return { days: 0, hours: 0 };

    const now = Date.now(); // timestamp en ms (UTC)
    const lockUntil = Date.parse(player.clause_lock_until); // convierte ISO a timestamp UTC
    const diffMs = lockUntil - now;

    if (diffMs <= 0) return { days: 0, hours: 0 };

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days: diffDays, hours: diffHours };
  }, [player.clause_lock_until]);

  // DEBUG LOGS
  console.log('DEBUG player:', player.name, {
    hours_remaining: player.hours_remaining,
    clause_lock_until: player.clause_lock_until,
    clauseTimeLeft
  });


  // inicializar inputs al entrar en modo edición
  const handleEdit = () => {
    setDays(clauseTimeLeft.days);
    setHours(clauseTimeLeft.hours);
    setEdit(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // PATCH cláusula
      await fetch(
        `/api/participant-players/${participantId}/team/${player.player_id}/clause`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clause_value: Number(clause) }),
        }
      );

      // PATCH clausulable
      await fetch(
        `/api/participant-players/${participantId}/team/${player.player_id}/clausulable`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_clausulable: clausulable ? 1 : 0 }),
        }
      );

      // PATCH tiempo de cláusula
      await fetch(
        `/api/participant-players/${participantId}/team/${player.player_id}/clause-lock`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days: Number(days), hours: Number(hours) }),
        }
      );

      // ✅ actualizar localmente sin esperar refetch
      const totalMs = (Number(days) * 24 + Number(hours)) * 60 * 60 * 1000;
      player.clause_lock_until = new Date(Date.now() + totalMs).toISOString();

      setEdit(false);
      onChange && onChange(); // refresca padre si lo necesita
    } catch (e) {
      alert("Error guardando cambios: " + e.message);
    } finally {
      setSaving(false);
    }
  };

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
      <td>{player.team}</td>

      {/* Valor mercado */}
      <td style={{ textAlign: "right" }}>
        {player.market_value_num?.toLocaleString("es-ES") || 0}
      </td>

      {/* Cláusula */}
      <td style={{ textAlign: "right" }}>
        {edit ? (
          <Input
            size="sm"
            type="number"
            min={player.market_value || 0}
            value={clause}
            onChange={(e) => setClause(Number(e.target.value))}
            width="90px"
          />
        ) : player.clause_value ? (
          Number(player.clause_value).toLocaleString("es-ES")
        ) : (
          "-"
        )}
      </td>

      {/* Clausulable */}
      <td style={{ textAlign: "center" }}>
        {edit ? (
          <Switch
            isChecked={clausulable}
            onChange={(e) => setClausulable(e.target.checked)}
          />
        ) : clausulable ? (
          <b>Sí</b>
        ) : (
          <span style={{ color: "#718096" }}>No</span>
        )}
      </td>

      {/* Tiempo de cláusula */}
      <td style={{ textAlign: "center" }}>
        {edit ? (
          <HStack spacing={2} justify="center">
            <Input
              size="sm"
              type="number"
              value={days}
              min={0}
              onChange={(e) => setDays(Number(e.target.value))}
              width="60px"
              placeholder="Días"
            />
            <Input
              size="sm"
              type="number"
              value={hours}
              min={0}
              max={23}
              onChange={(e) => setHours(Number(e.target.value))}
              width="60px"
              placeholder="Horas"
            />
          </HStack>
        ) : (
          <Tooltip label="Tiempo restante de cláusula" hasArrow>
            <HStack spacing={1} justify="center">
              <TimeIcon color="gray.600" />
              <Text fontSize="sm" color="gray.700">
                {(() => {
                  // DEBUG LOG
                  console.log('RENDER TIME:', player.name, {
                    hours_remaining: player.hours_remaining,
                    clause_lock_until: player.clause_lock_until,
                    clauseTimeLeft
                  });
                  // Si el backend manda hours_remaining, úsalo
                  if (typeof player.hours_remaining === 'number' && player.hours_remaining > 0) {
                    const d = Math.floor(player.hours_remaining / 24);
                    const h = player.hours_remaining % 24;
                    return `${d}d ${h}h`;
                  }
                  // Si no, usa el cálculo local
                  return `${clauseTimeLeft.days}d ${clauseTimeLeft.hours}h`;
                })()}
              </Text>
            </HStack>
          </Tooltip>
        )}
      </td>

      {/* Puntos */}
      <td style={{ textAlign: "right", fontWeight: 500 }}>
        {Number(player.total_points) || 0}
      </td>

      {/* Acciones */}
      <td style={{ textAlign: "center" }}>
        <HStack spacing={1} justify="center">
          {edit ? (
            <>
              <IconButton
                size="sm"
                colorScheme="green"
                icon={<CheckIcon />}
                onClick={handleSave}
                isLoading={saving}
                aria-label="Guardar"
              />
              <IconButton
                size="sm"
                colorScheme="gray"
                icon={<CloseIcon />}
                onClick={() => setEdit(false)}
                aria-label="Cancelar"
              />
            </>
          ) : (
            <IconButton
              size="sm"
              colorScheme="blue"
              icon={<EditIcon />}
              onClick={handleEdit}
              aria-label="Editar"
            />
          )}
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
  );
}
