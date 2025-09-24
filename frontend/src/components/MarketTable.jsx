// MarketTable.jsx (limpio)
import React from "react";
import { Box, Table, Thead, Tbody, Tr, Th, Td, Badge, Link as ChakraLink, Text } from "@chakra-ui/react";
import { ArrowUpIcon, ArrowDownIcon } from "@chakra-ui/icons";
import { Link } from "react-router-dom";

const MarketTable = ({ players = [] }) => (
  <Box bg="white" borderRadius="lg" boxShadow="md" p={6}>
    <Text fontSize="xl" fontWeight="bold" mb={4}>Mercado Diario</Text>
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>Nombre</Th>
          <Th>Equipo</Th>
          <Th isNumeric>Puntos totales</Th>
          <Th isNumeric>Valor de mercado</Th>
          <Th>Tendencia</Th>
        </Tr>
      </Thead>
      <Tbody>
        {players.map((player) => (
          <Tr key={player.player_id}>
            <Td>
              {player.player_id ? (
                <ChakraLink
                  as={Link}
                  to={`/players/${player.player_id}`}
                  color="teal.600"
                  fontWeight="medium"
                  _hover={{ textDecoration: "underline", color: "teal.800" }}
                >
                  {player.name || "-"}
                </ChakraLink>
              ) : (
                player.name || "-"
              )}
            </Td>
            <Td>
              {player.team_id ? (
                <ChakraLink
                  as={Link}
                  to={`/teams/${player.team_id}`}
                  color="teal.600"
                  fontWeight="medium"
                  _hover={{ textDecoration: "underline", color: "teal.800" }}
                >
                  {player.team_name || "-"}
                </ChakraLink>
              ) : (
                player.team_name || "-"
              )}
            </Td>
            <Td isNumeric>{player.total_points ?? "-"}</Td>
            <Td isNumeric>
              {typeof player.market_value_num === "number"
                ? player.market_value_num.toLocaleString("es-ES") + " €"
                : "-"}
            </Td>
            <Td>
              {(() => {
                const delta = player.market_delta;
                if (delta > 0) return <Badge colorScheme="green">Sube</Badge>;
                if (delta < 0) return <Badge colorScheme="red">Baja</Badge>;
                return <Badge colorScheme="gray">-</Badge>;
              })()}
            </Td>
          </Tr>
        ))}
      </Tbody>

    </Table>
  </Box>
);

export default MarketTable;
