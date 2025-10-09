import { VStack, Box, Text, Link as ChakraLink } from "@chakra-ui/react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/players", label: "Players" },
    { to: "/teams", label: "Teams" },
    { to: "/analysis", label: "Analysis" },
    { to: "/my-team", label: "My Team" },
    { to: "/leaderboard", label: "Leaderboard" },
    { to: "/calendar", label: "Calendario" },
    { to: "/market", label: "Mercado Diario" },
    { to: "/recommendations", label: "Recomendaciones" },
  { to: "/portfolio/players", label: "Jugadores (insights)" },
  ];

  return (
    <Box
      w="220px"
      bg="gray.800"
      color="white"
      minH="100vh"
      p={4}
      boxShadow="lg"
    >
      <Text fontSize="xl" fontWeight="bold" mb={6}>
        Fantasy Tracker
      </Text>
      <VStack align="stretch" spacing={3}>
        {links.map((link) => (
          <ChakraLink
            as={Link}
            key={link.to}
            to={link.to}
            px={3}
            py={2}
            borderRadius="md"
            bg={location.pathname === link.to ? "blue.500" : "transparent"}
            _hover={{ bg: "blue.600" }}
          >
            {link.label}
          </ChakraLink>
        ))}
      </VStack>
    </Box>
  );
}
