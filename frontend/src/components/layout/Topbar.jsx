import { Flex, Button, Avatar } from "@chakra-ui/react";

export default function Topbar({ onScrape }) {
  return (
    <Flex justify="space-between" align="center" p={4} bg="white" boxShadow="md">
      <Button colorScheme="blue" onClick={onScrape}>
        🔄 Actualizar datos
      </Button>
      <Avatar size="sm" name="Usuario" />
    </Flex>
  );
}
