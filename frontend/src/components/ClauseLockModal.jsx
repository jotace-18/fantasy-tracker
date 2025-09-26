import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  HStack,
  Input,
  Button
} from "@chakra-ui/react";

export default function ClauseLockModal({
  isOpen,
  onClose,
  player,
  clauseForm,
  setClauseForm,
  onSave
}) {
  if (!player) return null;
  const minClause = player.market_value_num || 0;
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Editar cláusula y lock</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold">{player.name}</Text>
            <HStack>
              <Text>Cláusula (€):</Text>
              <Input
                type="number"
                min={minClause}
                value={clauseForm.clause_value}
                onChange={e => setClauseForm(f => ({ ...f, clause_value: e.target.value }))}
                width="100px"
                fontSize={15}
                padding={2}
              />
            </HStack>
            <HStack>
              <Text>Clausulable:</Text>
              <input
                type="checkbox"
                checked={clauseForm.is_clausulable}
                onChange={e => setClauseForm(f => ({ ...f, is_clausulable: e.target.checked }))}
              />
            </HStack>
            <HStack>
              <Text>Días de lock:</Text>
              <Input
                type="number"
                min={0}
                value={clauseForm.lock_days}
                onChange={e => setClauseForm(f => ({ ...f, lock_days: e.target.value }))}
                width="60px"
                fontSize={15}
                padding={2}
              />
              <Text>Horas:</Text>
              <Input
                type="number"
                min={0}
                max={23}
                value={clauseForm.lock_hours}
                onChange={e => setClauseForm(f => ({ ...f, lock_hours: e.target.value }))}
                width="60px"
                fontSize={15}
                padding={2}
              />
            </HStack>
            <Button colorScheme="blue" onClick={onSave}>
              Guardar
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
