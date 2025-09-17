import { Box, VStack, Link as ChakraLink, Heading } from "@chakra-ui/react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <Box w="250px" h="100vh" bg="gray.800" color="white" p={4}>
      <Heading size="md" mb={6}>Fantasy Tracker</Heading>
      <VStack align="stretch" spacing={3}>
        <ChakraLink as={Link} to="/">🏠 Dashboard</ChakraLink>
        <ChakraLink as={Link} to="/players">👥 Jugadores</ChakraLink>
        <ChakraLink as={Link} to="/teams">⚽ Equipos</ChakraLink>
        <ChakraLink as={Link} to="/analysis">📊 Análisis</ChakraLink>
      </VStack>
    </Box>
  );
}
