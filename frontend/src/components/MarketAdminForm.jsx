// MarketAdminForm.jsx
import React, { useState, useEffect } from "react";
import PlayerSearch from "./PlayerSearch";
import { Box, Button, VStack, HStack, Text, IconButton } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

export default function MarketAdminForm() {
  const [selected, setSelected] = useState([]);

  // 🔹 Cargar jugadores ya en mercado
  useEffect(() => {
    fetch("/api/market")
      .then(res => res.json())
      .then(data => setSelected(data))
      .catch(err => console.error("❌ Error cargando mercado:", err));
  }, []);

  // 🔹 Añadir jugador
  const handleAdd = async (player) => {
    if (selected.find((p) => p.id === player.id)) return;
    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: player.id }),
      });
      if (!res.ok) throw new Error("Error añadiendo jugador al mercado");
      await reloadMarket();
    } catch (err) {
      alert(err.message);
    }
  };

  // 🔹 Quitar jugador
  const handleRemove = async (id) => {
    try {
      const res = await fetch(`/api/market/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando jugador del mercado");
      await reloadMarket();
    } catch (err) {
      alert(err.message);
    }
  };

  // 🔹 Vaciar mercado
  const handleClear = async () => {
    try {
      const res = await fetch(`/api/market`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error limpiando mercado");
      await reloadMarket();
    } catch (err) {
      alert(err.message);
    }
  };

  // 🔹 Recargar mercado desde API
  const reloadMarket = async () => {
    const res = await fetch("/api/market");
    const data = await res.json();
    setSelected(data);
  };

  return (
    <Box bg="gray.50" p={4} borderRadius="md" boxShadow="sm" mb={6}>
      <Text fontWeight="bold" mb={2}>Editar mercado diario</Text>
      <PlayerSearch onSelect={handleAdd} showAddButton={false} />

      <HStack justify="flex-end" mb={2} mt={2}>
        <Button size="sm" colorScheme="red" variant="outline" onClick={handleClear} isDisabled={selected.length === 0}>
          Limpiar lista
        </Button>
      </HStack>

      <VStack align="stretch" spacing={2} mt={1} mb={3}>
        {selected.map((player) => (
          <HStack key={player.player_id} bg="white" p={2} borderRadius="md" boxShadow="xs">
            <Text flex={1}>
              {player.name} ({player.team_id || "-"})
            </Text>
            <IconButton
              size="sm"
              icon={<CloseIcon />}
              onClick={() => handleRemove(player.player_id)}
              aria-label="Quitar"
            />
          </HStack>
        ))}
        {selected.length === 0 && <Text color="gray.400">No hay jugadores seleccionados.</Text>}
      </VStack>
    </Box>
  );
}
