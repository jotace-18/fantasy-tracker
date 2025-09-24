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
import TransferLog from "../components/TransferLog";

export default function MarketPage() {
  const [players, setPlayers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);       // Modal editar mercado
  const [isTransferOpen, setIsTransferOpen] = useState(false); // Modal añadir traspaso
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Para refrescar el log

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
        <TransferLog refreshKey={refreshKey} />
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
        onTransferAdded={() => setRefreshKey(prev => prev + 1)}
      />
    </Box>
  );
}
