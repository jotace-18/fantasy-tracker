// MarketPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Button,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter
} from "@chakra-ui/react";
import MarketTable from "../components/MarketTable";
import MarketAdminForm from "../components/MarketAdminForm";
import AddTransferModal from "../components/AddTransferModal";

export default function MarketPage() {
  const [players, setPlayers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);       // Modal editar mercado
  const [isTransferOpen, setIsTransferOpen] = useState(false); // Modal añadir traspaso
  const [saving, setSaving] = useState(false);

  // 🔹 Cargar mercado
  const fetchMarket = async () => {
    try {
      const res = await fetch("/api/market");
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Error cargando mercado:", err);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);

  // 🔹 Confirmar edición del mercado
  const handleConfirm = async () => {
    setSaving(true);
    await fetchMarket();
    setSaving(false);
    setIsOpen(false);
  };

  return (
    <Box p={{ base: 2, md: 4 }} maxW="98vw" mx="auto">
      {/* Botones superiores */}
      <Flex justify="space-between" align="center" mb={4} gap={3}>
        <Button colorScheme="teal" onClick={() => setIsOpen(true)}>
          🔄 Actualizar mercado
        </Button>
        <Button colorScheme="blue" onClick={() => setIsTransferOpen(true)}>
          ➕ Añadir traspaso
        </Button>
      </Flex>

      <Flex direction={{ base: "column", md: "row" }} gap={6} align="flex-start">
        {/* Columna izquierda: mercado */}
        <Box flex={2.8} minW={0}>
          <MarketTable players={players} />
        </Box>

        {/* Columna derecha: log */}
        <Box
          flex={1.2}
          minW="300px"
          maxW="360px"
          maxH="520px"
          overflowY="auto"
          bg="white"
          borderRadius="md"
          boxShadow="md"
          p={3}
          border="1px solid #e2e8f0"
        >
          <Text fontWeight="bold" mb={2} textAlign="center">
            Log de traspasos
          </Text>
          {/* Por ahora datos de prueba, luego lo conectamos con /api/transfers */}
          <ul style={{ fontSize: "sm", color: "#444" }}>
            <li
              style={{
                marginBottom: 8,
                background: "#f3e8ff",
                borderLeft: "4px solid #a259e6",
                padding: "6px 10px",
                borderRadius: 6,
              }}
            >
              <b style={{ color: "#a259e6" }}>JugadorX</b> → <b>Mercado</b>
              <span style={{ float: "right", color: "#888" }}>12/09/2025</span>
              <br />
              <span style={{ color: "#a259e6" }}>Venta a mercado</span>
              <b style={{ float: "right" }}>1.200.000 €</b>
            </li>
          </ul>
        </Box>
      </Flex>

      {/* Modal con MarketAdminForm */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar mercado diario</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <MarketAdminForm />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleConfirm}
              isLoading={saving}
              loadingText="Actualizando..."
            >
              Confirmar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para añadir traspaso */}
      <AddTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onTransferAdded={fetchMarket}
      />
    </Box>
  );
}
