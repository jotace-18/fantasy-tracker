import { Box, Text, Heading, Flex } from "@chakra-ui/react";

export default function TransferLogDummy() {
  return (
    <Box
      flex={1}
      minW="500px"
      maxW="100%"
      maxH="520px"
      overflowY="auto"
      bg="white"
      borderRadius="md"
      boxShadow="md"
      p={4}
      border="1px solid #e2e8f0"
    >
      <Heading size="sm" mb={3} color="gray.700" textAlign="center">
        Log de traspasos
      </Heading>

      {/* Ejemplo 1 */}
      <Box
        mb={3}
        bg="purple.50"
        borderLeft="4px solid #a259e6"
        borderRadius="md"
        p={3}
      >
        <Flex justify="space-between" mb={1}>
          <Text fontWeight="bold" color="purple.700">
            ParticipanteX → Mercado
          </Text>
          <Text fontSize="sm" color="gray.500">
            12/09/2025
          </Text>
        </Flex>
        <Flex justify="space-between">
          <Text color="gray.800">JugadorX</Text>
          <Text fontWeight="bold">1.200.000 €</Text>
        </Flex>
      </Box>

      {/* Ejemplo 2 */}
      <Box
        mb={3}
        bg="blue.50"
        borderLeft="4px solid #0284c7"
        borderRadius="md"
        p={3}
      >
        <Flex justify="space-between" mb={1}>
          <Text fontWeight="bold" color="blue.700">
            ParticipanteY → ParticipanteZ
          </Text>
          <Text fontSize="sm" color="gray.500">
            10/09/2025
          </Text>
        </Flex>
        <Flex justify="space-between">
          <Text color="gray.800">JugadorY</Text>
          <Text fontWeight="bold">2.000.000 €</Text>
        </Flex>
      </Box>

      {/* Ejemplo 3 */}
      <Box
        mb={3}
        bg="red.50"
        borderLeft="4px solid #dc2626"
        borderRadius="md"
        p={3}
      >
        <Flex justify="space-between" mb={1}>
          <Text fontWeight="bold" color="red.700">
            ParticipanteA → ParticipanteB
          </Text>
          <Text fontSize="sm" color="gray.500">
            08/09/2025
          </Text>
        </Flex>
        <Flex justify="space-between">
          <Text color="gray.800">JugadorA</Text>
          <Text fontWeight="bold">3.500.000 €</Text>
        </Flex>
      </Box>

      {/* Ejemplo 4 */}
      <Box
        mb={3}
        bg="green.50"
        borderLeft="4px solid #059669"
        borderRadius="md"
        p={3}
      >
        <Flex justify="space-between" mb={1}>
          <Text fontWeight="bold" color="green.700">
            ParticipanteB → ParticipanteA
          </Text>
          <Text fontSize="sm" color="gray.500">
            05/09/2025
          </Text>
        </Flex>
        <Flex justify="space-between">
          <Text color="gray.800">JugadorB</Text>
          <Text fontWeight="bold">3.500.000 €</Text>
        </Flex>
      </Box>

      {/* Ejemplo 5 */}
      <Box
        mb={3}
        bg="yellow.50"
        borderLeft="4px solid #eab308"
        borderRadius="md"
        p={3}
      >
        <Flex justify="space-between" mb={1}>
          <Text fontWeight="bold" color="yellow.700">
            Mercado → ParticipanteX
          </Text>
          <Text fontSize="sm" color="gray.500">
            01/09/2025
          </Text>
        </Flex>
        <Flex justify="space-between">
          <Text color="gray.800">JugadorX</Text>
          <Text fontWeight="bold">1.200.000 €</Text>
        </Flex>
      </Box>

      <Text mt={2} color="gray.400" fontSize="xs" textAlign="center">
        (Próximamente funcional)
      </Text>
    </Box>
  );
}
