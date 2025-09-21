import { Heading, Box, Button, VStack } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

export default function Dashboard() {
  return (
    <Box p={6}>
      <Heading mb={6}>📊 Dashboard</Heading>

      <VStack spacing={4} align="flex-start">
        <Button
          as={RouterLink}
          to="/my-team"
          colorScheme="green"
          variant="solid"
          size="lg"
        >
          ⚽ Ir a mi equipo
        </Button>
      </VStack>
    </Box>
  );
}
