
import { Flex, Button, Avatar } from "@chakra-ui/react";
import InternalClock from "../InternalClock";

export default function Topbar({ onScrape }) {
  return (
    <Flex justify="space-between" align="center" p={4} bg="white" boxShadow="md">
      <Button colorScheme="blue" onClick={onScrape}>
        🔄 Actualizar datos
      </Button>
      <InternalClock />
      <Avatar size="sm" name="Usuario" />
    </Flex>
  );
}
