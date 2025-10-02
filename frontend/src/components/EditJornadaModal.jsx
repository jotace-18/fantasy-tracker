import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton,
  Button, FormControl, FormLabel, Input, NumberInput, NumberInputField, HStack, VStack, Text, useToast
} from "@chakra-ui/react";
import { useState, useEffect } from "react";

// Devuelve el nombre o alias del equipo por id
function getTeamName(id, teams) {
  if (!id || !teams) return '';
  const t = teams.find(t => t.id === id);
  return t ? (t.alias || t.name || id) : id;
}

export default function EditJornadaModal({ isOpen, onClose, jornada, onSaved, teams }) {
  const [fechaCierre, setFechaCierre] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && jornada) {
      setFechaCierre(jornada.fecha_cierre ? jornada.fecha_cierre.slice(0, 16) : "");
      // Fetch resultados de la jornada
      fetch(`/api/match-results/jornada/${jornada.id}`)
        .then(res => res.json())
        .then(data => {
          // Si no hay resultados, crear array base a partir de enfrentamientos
          if (Array.isArray(data) && data.length === 0 && jornada.enfrentamientos) {
            setResultados(jornada.enfrentamientos.map(e => ({
              enfrentamiento_id: e.id,
              equipo_local_id: e.equipo_local_id,
              equipo_visitante_id: e.equipo_visitante_id,
              goles_local: "",
              goles_visitante: ""
            })));
          } else if (Array.isArray(data)) {
            setResultados(data.map(r => {
              const enf = jornada.enfrentamientos.find(e => e.id === r.enfrentamiento_id);
              return {
                ...r,
                equipo_local_id: r.equipo_local_id || enf?.equipo_local_id,
                equipo_visitante_id: r.equipo_visitante_id || enf?.equipo_visitante_id
              };
            }));

          } else {
            setResultados([]);
          }
          setLoading(false);
        });
    }
  }, [isOpen, jornada]);

  const handleChangeResultado = (idx, field, value) => {
    setResultados(rs => rs.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    // Actualizar fecha de cierre
    if (fechaCierre) {
      await fetch(`/api/calendar/${jornada.id}/fecha-cierre`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_cierre: fechaCierre })
      });
    }
    // Guardar resultados
    for (const r of resultados) {
      if (r.id) {
        // Update
        await fetch(`/api/match-results/${r.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goles_local: r.goles_local, goles_visitante: r.goles_visitante })
        });
      } else if (r.goles_local !== "" && r.goles_visitante !== "") {
        // Create
        await fetch(`/api/match-results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jornada_id: jornada.id,
            enfrentamiento_id: r.enfrentamiento_id,
            equipo_local_id: r.equipo_local_id,
            equipo_visitante_id: r.equipo_visitante_id,
            goles_local: r.goles_local,
            goles_visitante: r.goles_visitante
          })
        });
      }
    }
    toast({ title: "Jornada actualizada", status: "success", duration: 2000 });
    onSaved();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar Jornada {jornada?.numero}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Fecha de cierre</FormLabel>
            <Input
              type="datetime-local"
              value={fechaCierre}
              onChange={e => setFechaCierre(e.target.value)}
            />
          </FormControl>
          <VStack align="stretch" spacing={3}>
            {loading ? <Text>Cargando resultados...</Text> : resultados.map((r, idx) => (
              <HStack key={r.enfrentamiento_id || r.id}>
                <Text minW="120px">{getTeamName(r.equipo_local_id, teams)}</Text>
                <NumberInput min={0} max={20} value={r.goles_local} onChange={v => handleChangeResultado(idx, "goles_local", v)} size="sm" w="60px">
                  <NumberInputField />
                </NumberInput>
                <Text>-</Text>
                <NumberInput min={0} max={20} value={r.goles_visitante} onChange={v => handleChangeResultado(idx, "goles_visitante", v)} size="sm" w="60px">
                  <NumberInputField />
                </NumberInput>
                <Text minW="120px">{getTeamName(r.equipo_visitante_id, teams)}</Text>
              </HStack>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} mr={3}>Cancelar</Button>
          <Button colorScheme="teal" onClick={handleSave}>Guardar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
