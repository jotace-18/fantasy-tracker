// components/AddPointsModal.jsx
import { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter,
  Button, FormControl, FormLabel, Input, Select, HStack, VStack, Text, useToast
} from "@chakra-ui/react";


export default function AddPointsModal({ isOpen, onClose, participants, onSaved }) {
  const toast = useToast();
  const [jornada, setJornada] = useState("");
  const [pointsData, setPointsData] = useState({}); // { participantId: points }
  const [jugadoresXIData, setJugadoresXIData] = useState({}); // { participantId: jugadoresXI }

  // Reset al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setJornada("");
      setPointsData({});
      setJugadoresXIData({});
    }
  }, [isOpen]);

  const handlePointsChange = (id, value) => {
    setPointsData(prev => ({
      ...prev,
      [id]: Number(value)
    }));
  };

  const handleJugadoresXIChange = (id, value) => {
    setJugadoresXIData(prev => ({
      ...prev,
      [id]: Number(value)
    }));
  };

  const handleSave = async () => {
    if (!jornada) {
      toast({
        title: "Error",
        description: "Debes seleccionar la jornada",
        status: "error",
        duration: 2000,
        isClosable: true
      });
      return;
    }

    try {
      for (const participant of participants) {
        const points = pointsData[participant.id];
  const jugadoresXI = jugadoresXIData[participant.id] || 0;
  const moneyXI = jugadoresXI * 1000000;
        if (points != null && !isNaN(points)) {
          // Guardar puntos
          await fetch("http://localhost:4000/api/participant-points", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participant_id: participant.id,
              jornada: Number(jornada),
              points
            })
          });
          // Calcular dinero total a ingresar
          const moneyToAdd = points * 100000 + moneyXI;
          if (moneyToAdd > 0) {
            await fetch(`http://localhost:4000/api/participants/${participant.id}/add-money`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: moneyToAdd })
            });
          }
        }
      }

      toast({
        title: "Guardado",
        description: `Puntos y dinero de jornada ${jornada} guardados correctamente`,
        status: "success",
        duration: 2000,
        isClosable: true
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("❌ Error guardando puntos:", err);
      toast({
        title: "Error",
        description: "No se pudieron guardar los puntos/dinero",
        status: "error",
        duration: 2000,
        isClosable: true
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Asignar puntos por jornada</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Jornada</FormLabel>
            <Select value={jornada} onChange={(e) => setJornada(e.target.value)}>
              <option value="">Selecciona jornada</option>
              {Array.from({ length: 38 }).map((_, i) => (
                <option key={i+1} value={i+1}>Jornada {i+1}</option>
              ))}
            </Select>
          </FormControl>

          <VStack align="stretch" spacing={3}>
            {participants.map((p) => {
              const points = pointsData[p.id] ?? 0;
              const jugadoresXI = jugadoresXIData[p.id] ?? 0;
              const moneyXI = jugadoresXI * 1000000;
              const totalMoney = points * 100000 + moneyXI;
              return (
                <HStack key={p.id} justify="space-between" align="center">
                  <Text minW="120px">{p.name}</Text>
                  <Input
                    type="number"
                    placeholder="Puntos"
                    value={pointsData[p.id] ?? ""}
                    onChange={(e) => handlePointsChange(p.id, e.target.value)}
                    maxW="90px"
                  />
                  <Input
                    type="number"
                    placeholder="Jugadores XI"
                    value={jugadoresXIData[p.id] ?? ""}
                    onChange={(e) => handleJugadoresXIChange(p.id, e.target.value)}
                    maxW="110px"
                  />
                  <Text fontSize="sm" color="green.700" minW="120px" textAlign="right">
                    +{(totalMoney).toLocaleString("es-ES")} €
                  </Text>
                </HStack>
              );
            })}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
          <Button colorScheme="teal" onClick={handleSave}>Guardar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
