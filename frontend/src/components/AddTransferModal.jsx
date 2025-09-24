// components/AddTransferModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter,
  Button, FormControl, FormLabel, Select, Input, useToast
} from "@chakra-ui/react";
import PlayerSearch from "./PlayerSearch"; // ya lo tienes hecho para buscar jugadores

export default function AddTransferModal({ isOpen, onClose, onTransferAdded }) {
  const toast = useToast();

  // Estado del formulario
  const [player, setPlayer] = useState(null);
  const [fromParticipant, setFromParticipant] = useState("");
  const [toParticipant, setToParticipant] = useState("");
  const [type, setType] = useState("buy");
  const [amount, setAmount] = useState("");
  const [participants, setParticipants] = useState([]);

  // 🔹 Cargar participantes (puedes tener ya un endpoint /api/participants)
  useEffect(() => {
    fetch("/api/participants")
      .then(res => res.json())
      .then(data => setParticipants(data))
      .catch(() => setParticipants([]));
  }, []);

  const handleSave = async () => {
    if (!player || !amount || !type) {
      toast({
        title: "Error",
        description: "Debes rellenar jugador, tipo y cantidad",
        status: "error",
        duration: 2000,
        isClosable: true
      });
      return;
    }

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: player.id,
          from_participant_id: fromParticipant || null,
          to_participant_id: toParticipant || null,
          type,
          amount: Number(amount)
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error guardando traspaso");
      }

      toast({
        title: "Traspaso añadido",
        description: `${player.name} registrado en ${type}`,
        status: "success",
        duration: 2000,
        isClosable: true
      });

      if (onTransferAdded) onTransferAdded(); // refresca lista/log
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Añadir traspaso</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* Selección de jugador */}
          <FormControl mb={3}>
            <FormLabel>Jugador</FormLabel>
            <PlayerSearch onSelect={setPlayer} showAddButton={false} />
            {player && <p style={{ marginTop: "5px", fontSize: "0.9em" }}>
              Seleccionado: <b>{player.name}</b>
            </p>}
          </FormControl>

          {/* Tipo de traspaso */}
          <FormControl mb={3}>
            <FormLabel>Tipo</FormLabel>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="buy">Compra</option>
              <option value="sell">Venta</option>
              <option value="clause">Cláusula</option>
            </Select>
          </FormControl>

          {/* Participantes */}
          <FormControl mb={3}>
            <FormLabel>De (from)</FormLabel>
            <Select placeholder="Mercado" value={fromParticipant} onChange={(e) => setFromParticipant(e.target.value)}>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl mb={3}>
            <FormLabel>A (to)</FormLabel>
            <Select placeholder="Mercado" value={toParticipant} onChange={(e) => setToParticipant(e.target.value)}>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormControl>

          {/* Cantidad */}
          <FormControl>
            <FormLabel>Cantidad (€)</FormLabel>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="teal" onClick={handleSave}>Guardar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
