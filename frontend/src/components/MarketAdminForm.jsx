import React, { useState } from "react";
import PlayerSearch from "./PlayerSearch";
import { Box, Button, VStack, HStack, Text, IconButton } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

export default function MarketAdminForm({ onSave, initialPlayers = [] }) {
  const [selected, setSelected] = useState(initialPlayers);
  const [saving, setSaving] = useState(false);

  const handleAdd = (player) => {
    if (!selected.find((p) => p.id === player.id)) {
      setSelected([...selected, player]);
    }
  };

  const handleRemove = (id) => {
    setSelected(selected.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(selected);
    setSaving(false);
  };

  return (
    <Box bg="gray.50" p={4} borderRadius="md" boxShadow="sm" mb={6}>
      <Text fontWeight="bold" mb={2}>Editar mercado diario</Text>
      <PlayerSearch onSelect={handleAdd} showAddButton={false} />
      <HStack justify="flex-end" mb={2} mt={2}>
        <Button size="sm" colorScheme="red" variant="outline" onClick={() => setSelected([])} isDisabled={selected.length === 0}>
          Limpiar lista
        </Button>
      </HStack>
      <VStack align="stretch" spacing={2} mt={1} mb={3}>
        {selected.map((player) => (
          <HStack key={player.id} bg="white" p={2} borderRadius="md" boxShadow="xs">
            <Text flex={1}>{player.name} ({player.team_name || player.team})</Text>
            <IconButton size="sm" icon={<CloseIcon />} onClick={() => handleRemove(player.id)} aria-label="Quitar" />
          </HStack>
        ))}
        {selected.length === 0 && <Text color="gray.400">No hay jugadores seleccionados.</Text>}
      </VStack>
      <Button colorScheme="teal" onClick={handleSave} isLoading={saving}>
        Guardar mercado diario
      </Button>
    </Box>
  );
}
