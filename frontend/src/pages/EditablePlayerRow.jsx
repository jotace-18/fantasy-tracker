import { useState } from "react";
import { Td, Tr, Button, Input, Switch, HStack, IconButton } from "@chakra-ui/react";
import { DeleteIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";

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

  const handleSave = async () => {
    setSaving(true);
    try {
      // PATCH cláusula
      await fetch(
        `/api/participant-players/${participantId}/team/${player.player_id}/clause`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clause_value: Number(clause) }), // 🔥 aseguramos número
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

      setEdit(false);
      onChange && onChange();
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
      <td style={{ fontWeight: 500 }}>{player.name}</td>
      <td>{player.position}</td>
      <td>{player.team}</td>
      <td style={{ textAlign: "right" }}>
        {typeof player.market_value_num === "number" &&
        !isNaN(player.market_value_num)
          ? player.market_value_num.toLocaleString("es-ES")
          : player.market_value && !isNaN(Number(player.market_value))
          ? Number(player.market_value).toLocaleString("es-ES")
          : 0}
      </td>
      <td style={{ textAlign: "right" }}>
        {edit ? (
          <Input
            size="sm"
            type="number"
            min={player.market_value || 0}
            value={clause}
            onChange={(e) => setClause(Number(e.target.value))} // 🔥 convierte string → número
            width="90px"
          />
        ) : player.clause_value ? (
          Number(player.clause_value).toLocaleString("es-ES")
        ) : (
          "-"
        )}
      </td>
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
      <td style={{ textAlign: "right", fontWeight: 500 }}>
        {typeof player.total_points === "number" &&
        !isNaN(player.total_points)
          ? player.total_points
          : player.total_points && !isNaN(Number(player.total_points))
          ? Number(player.total_points)
          : 0}
      </td>
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
              onClick={() => setEdit(true)}
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
