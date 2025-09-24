
import React, { useEffect, useState } from "react";
import MarketTable from "../components/MarketTable";
import MarketAdminForm from "../components/MarketAdminForm";
import { Box, useToast, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from "@chakra-ui/react";


const MarketPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Cargar jugadores del mercado diario
  const fetchMarket = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/market");
      const data = await res.json();
      if (Array.isArray(data.players)) {
        setPlayers(data.players);
      } else {
        setPlayers([]);
      }
    } catch {
      toast({ title: "Error cargando mercado", status: "error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  // Guardar mercado diario
  const handleSave = async (selectedPlayers) => {
    const ids = selectedPlayers.map((p) => p.id);
    try {
      const res = await fetch("http://localhost:4000/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: ids }),
      });
      if (!res.ok) throw new Error("Error guardando mercado");
      toast({ title: "Mercado actualizado", status: "success" });
      fetchMarket();
    } catch {
      toast({ title: "Error guardando mercado", status: "error" });
    }
  };

  return (
    <Box p={{ base: 2, md: 8 }} maxW="1100px" mx="auto">
      <Button colorScheme="teal" mb={6} onClick={onOpen}>
        Actualizar mercado
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Actualizar mercado diario</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <MarketAdminForm onSave={async (sel) => { await handleSave(sel); onClose(); }} initialPlayers={players} />
          </ModalBody>
        </ModalContent>
      </Modal>
      <MarketTable players={players} loading={loading} />
    </Box>
  );
};

export default MarketPage;
