import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, Text, Input, Button } from '@chakra-ui/react';

export default function MoneyModal({ isOpen, onClose, value, setValue, onSave, isSaving }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" motionPreset='scale' closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent role='dialog' aria-modal='true' aria-labelledby='editar-dinero-title'>
        <ModalHeader id='editar-dinero-title'>Editar dinero</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text fontWeight="bold" as='label' htmlFor='money-input'>Nuevo dinero (€):</Text>
            <Input
              id='money-input'
              type="number"
              min={0}
              value={value}
              onChange={e => setValue(e.target.value)}
              style={{ width: 180, fontSize: 18, padding: 4, border: '1px solid #CBD5E1', borderRadius: 6 }}
              aria-describedby='money-help'
              onKeyDown={e => { if(e.key==='Enter') onSave(); }}
            />
            <Text id='money-help' fontSize='xs' color='gray.500'>Introduce la cantidad total disponible para el participante.</Text>
            <Button colorScheme="green" onClick={onSave} isLoading={isSaving} loadingText='Guardando...'>
              Guardar
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
