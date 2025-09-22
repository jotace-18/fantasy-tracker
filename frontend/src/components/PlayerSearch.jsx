import { useEffect, useState } from "react";
import {
  Box,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Button,
  HStack,
  Text,
  TableContainer,
  useColorModeValue,
} from "@chakra-ui/react";

// Debounce helper
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function PlayerSearch({ onSelect, showAddButton = true, limit = 20 }) {
  const [name, setName] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("ASC");

  const debouncedName = useDebounce(name, 400);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!debouncedName.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({
          name: debouncedName,
          sort: sortBy,
          order,
          limit,
        });
        const res = await fetch(`http://localhost:4000/api/players/search?${params}`);
        const data = await res.json();
        setResults(data.data || data); // compatibilidad service viejo/nuevo
      } catch (err) {
        console.error("❌ Error buscando jugadores:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [debouncedName, sortBy, order, limit]);

  const handleSort = (field, defaultOrder = "ASC") => {
    if (sortBy === field) {
      setOrder(order === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setOrder(defaultOrder);
    }
  };

  const renderArrow = (field) => {
    if (sortBy !== field) return "";
    return order === "ASC" ? " ▲" : " ▼";
  };

  // Colores dinámicos según modo claro/oscuro
  const headerBg = useColorModeValue("gray.100", "gray.700");
  const rowHoverBg = useColorModeValue("gray.50", "gray.600");

  return (
    <Box
      maxW="1000px"
      mx="auto"
      p={4}
      bg={useColorModeValue("white", "gray.800")}
      borderRadius="md"
      boxShadow="xl"
    >
      {/* Filtros */}
      <HStack spacing={3} mb={4}>
        <Input
          placeholder="Buscar por nombre..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxW="300px"
          focusBorderColor="teal.400"
        />
      </HStack>

      {/* Resultados */}
      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={2}>Buscando jugadores...</Text>
        </Box>
      ) : results.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={6}>
          No se encontraron jugadores
        </Text>
      ) : (
        <TableContainer maxH="500px" overflowY="auto">
          <Table variant="striped" colorScheme="gray" size="sm">
            <Thead bg={headerBg} position="sticky" top={0} zIndex={1}>
              <Tr>
                <Th cursor="pointer" onClick={() => handleSort("name", "ASC")}>
                  Nombre{renderArrow("name")}
                </Th>
                <Th cursor="pointer" onClick={() => handleSort("team_name", "ASC")}>
                  Equipo{renderArrow("team_name")}
                </Th>
                <Th cursor="pointer" onClick={() => handleSort("position", "ASC")}>
                  Posición{renderArrow("position")}
                </Th>
                <Th
                  isNumeric
                  cursor="pointer"
                  onClick={() => handleSort("market_value_num", "DESC")}
                >
                  Valor (€){renderArrow("market_value_num")}
                </Th>
                {showAddButton && <Th />}
              </Tr>
            </Thead>
            <Tbody>
              {results.map((p) => (
                <Tr
                  key={p.id}
                  _hover={{ bg: rowHoverBg, cursor: "pointer" }}
                >
                  <Td>{p.name}</Td>
                  <Td>{p.team_name}</Td>
                  <Td>{p.position}</Td>
                  <Td isNumeric>
                    {typeof p.market_value_num === "number" && !isNaN(p.market_value_num)
                      ? p.market_value_num.toLocaleString("es-ES")
                      : "-"}
                  </Td>
                  {showAddButton && (
                    <Td>
                      <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={() => onSelect && onSelect(p)}
                      >
                        ➕ Añadir
                      </Button>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
