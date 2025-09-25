// components/AddTransferModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter,
  Button, FormControl, FormLabel, Select, Input, useToast, Text
} from "@chakra-ui/react";

export default function AddTransferModal({ isOpen, onClose, onTransferAdded }) {
  const toast = useToast();

  const [fromParticipant, setFromParticipant] = useState("");
  const [toParticipant, setToParticipant] = useState("");
  const [action, setAction] = useState("buy");
  const [player, setPlayer] = useState(null);
  const [amount, setAmount] = useState("");
  const [participants, setParticipants] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // ⚡ IDs propios
  const myParticipantId = "8"; // tu participante (JC)
  const myUserTeamId = "1"; // tu user_team

  // Set default date/time on open
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const hh = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime(`${hh}:${min}`);
    }
  }, [isOpen]);

  // Participantes
  useEffect(() => {
    fetch("/api/participants")
      .then((res) => res.json())
      .then((data) => setParticipants(data))
      .catch(() => setParticipants([]));
  }, []);

  // Jugadores disponibles
  useEffect(() => {
    let fetchUrl = null;

    if (action === "buy" || action === "clause") {
      if (toParticipant === "") {
        fetchUrl = "/api/market";
      } else if (!toParticipant) {
        return setAvailablePlayers([]);
      } else {
        fetchUrl =
          toParticipant === myParticipantId
            ? `/api/user-players/${myUserTeamId}`
            : `/api/participant-players/${toParticipant}/team`;
      }
    } else if (action === "sell") {
      if (!fromParticipant) return setAvailablePlayers([]);
      fetchUrl =
        fromParticipant === myParticipantId
          ? `/api/user-players/${myUserTeamId}`
          : `/api/participant-players/${fromParticipant}/team`;
    }

    if (fetchUrl) {
      console.log("📡 Fetch jugadores de:", fetchUrl);
      fetch(fetchUrl)
        .then((res) => res.json())
        .then((data) => {
          let players = Array.isArray(data) ? data : [];

          // ⚡ Solo mostrar clausulables si el tipo es "clause"
          if (action === "clause") {
            players = players.filter((p) => p.is_clausulable === 1);
          }

          console.log("✅ Jugadores recibidos:", players);
          setAvailablePlayers(players);
        })
        .catch((err) => {
          console.error("❌ Error cargando jugadores:", err);
          setAvailablePlayers([]);
        });
    }
  }, [action, fromParticipant, toParticipant]);

  // Autocompletar precio
  const handleSelectPlayer = (p) => {
    setPlayer(p);
    if (p.market_value_num) {
      setAmount(p.market_value_num);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setFromParticipant("");
    setToParticipant("");
    setAction("buy");
    setPlayer(null);
    setAmount("");
    const now = new Date();
    setDate(now.toISOString().split("T")[0]);
    setTime(
      `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}`
    );
  };

  // Guardar
  const handleSave = async () => {
    if (!player || !amount || !action) {
      toast({
        title: "Error",
        description: "Debes rellenar todos los campos",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (player.market_value_num && Number(amount) < player.market_value_num) {
      toast({
        title: "Error",
        description: "El precio no puede ser menor al valor de mercado",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    // 📌 Determinar vendedor y comprador
    let sellerId = null;
    let buyerId = null;

    if (action === "buy") {
      sellerId = toParticipant || null;
      buyerId = fromParticipant;
    } else if (action === "sell") {
      sellerId = fromParticipant;
      buyerId = toParticipant || null;
    } else if (action === "clause") {
      sellerId = toParticipant;
      buyerId = fromParticipant;
    }

    const payload = {
      player_id: player.player_id || player.id,
      from_participant_id: sellerId,
      to_participant_id: buyerId,
      type: action,
      amount: Number(amount),
    };

    const involvesMarket = !fromParticipant || !toParticipant;
    if (!involvesMarket && date && time) {
      payload.date = date;
      payload.time = time;
    }

    console.log("📤 Enviando payload:", payload);

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error guardando traspaso");
      }

      toast({
        title: "Traspaso añadido",
        description: `${player.name} registrado en ${action}`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      if (onTransferAdded) onTransferAdded();

      resetForm();

      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // ⚡ Deshabilitar fecha/hora si interviene el mercado
  const isDateTimeDisabled = !fromParticipant || !toParticipant;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Añadir traspaso</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* Origen */}
          <FormControl mb={3}>
            <FormLabel>Participante origen</FormLabel>
            <Select
              placeholder="Selecciona"
              value={fromParticipant}
              onChange={(e) => setFromParticipant(e.target.value)}
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Acción */}
          <FormControl mb={3}>
            <FormLabel>Acción</FormLabel>
            <Select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPlayer(null);
                setAmount("");
              }}
            >
              <option value="buy">Compra</option>
              <option value="sell">Venta</option>
              <option value="clause">Cláusula</option>
            </Select>
          </FormControl>

          {/* Participante destino */}
          <FormControl mb={3}>
            <FormLabel>Participante destino</FormLabel>
            <Select
              placeholder="Mercado"
              value={toParticipant}
              onChange={(e) => setToParticipant(e.target.value)}
            >
              {participants
                .filter((p) => String(p.id) !== String(fromParticipant))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </FormControl>

          {/* Jugador */}
          <FormControl mb={3}>
            <FormLabel>Jugador</FormLabel>
            <Select
              placeholder="Selecciona jugador"
              value={player?.player_id || ""}
              onChange={(e) => {
                const selected = availablePlayers.find(
                  (p) =>
                    String(p.player_id) === e.target.value ||
                    String(p.id) === e.target.value
                );
                if (selected) handleSelectPlayer(selected);
              }}
            >
              {availablePlayers.map((p) => (
                <option key={p.player_id || p.id} value={p.player_id || p.id}>
                  {p.name} ({p.team_name || p.team}) - €
                  {p.market_value_num?.toLocaleString("es-ES")}
                </option>
              ))}
            </Select>
            {player && (
              <Text mt={1} fontSize="sm" color="gray.600">
                Valor de mercado: €
                {player.market_value_num?.toLocaleString("es-ES")}
              </Text>
            )}
          </FormControl>

          {/* Precio */}
          <FormControl mb={3}>
            <FormLabel>Precio (€)</FormLabel>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={player?.market_value_num || 0}
            />
          </FormControl>

          {/* Fecha */}
          <FormControl mb={3}>
            <FormLabel>Fecha</FormLabel>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              isDisabled={isDateTimeDisabled}
            />
          </FormControl>

          {/* Hora */}
          <FormControl mb={3}>
            <FormLabel>Hora</FormLabel>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              isDisabled={isDateTimeDisabled}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={() => {
              resetForm();
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSave}
          >
            Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
