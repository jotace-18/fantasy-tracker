import { Box, Text, Heading } from "@chakra-ui/react";

export default function TransferLogDummy() {
  return (
    <Box
      flex={1.2}
      minW="300px"
      maxW="360px"
      maxH="520px"
      overflowY="auto"
      bg="white"
      borderRadius="md"
      boxShadow="md"
      p={3}
      border="1px solid #e2e8f0"
    >
      <Heading size="sm" mb={2} color="gray.700" textAlign="center">Log de traspasos</Heading>
      <Box as="ul" pl={0} fontSize="sm" color="gray.700">
        <li style={{marginBottom: 8, background: '#f3e8ff', borderLeft: '4px solid #a259e6', padding: '6px 10px', borderRadius: 6}}>
          <b style={{color:'#a259e6'}}>JugadorX</b> → <b>Mercado</b> <span style={{float:'right', color:'#888'}}>12/09/2025</span><br/>
          <span style={{color:'#a259e6'}}>Venta a mercado</span> <b style={{float:'right'}}>1.200.000 €</b>
        </li>
        <li style={{marginBottom: 8, background: '#e0f2fe', borderLeft: '4px solid #0284c7', padding: '6px 10px', borderRadius: 6}}>
          <b style={{color:'#0284c7'}}>JugadorY</b> → <b>JugadorZ</b> <span style={{float: 'right', color:'#888'}}>10/09/2025</span><br/>
          <span style={{color:'#0284c7'}}>Venta a jugador</span> <b style={{float:'right'}}>2.000.000 €</b>
        </li>
        <li style={{marginBottom: 8, background: '#fee2e2', borderLeft: '4px solid #dc2626', padding: '6px 10px', borderRadius: 6}}>
          <b style={{color:'#dc2626'}}>JugadorA</b> ← <b>JugadorB</b> <span style={{float: 'right', color:'#888'}}>08/09/2025</span><br/>
          <span style={{color:'#dc2626'}}>Clausulazo recibido</span> <b style={{float:'right'}}>3.500.000 €</b>
        </li>
        <li style={{marginBottom: 8, background: '#d1fae5', borderLeft: '4px solid #059669', padding: '6px 10px', borderRadius: 6}}>
          <b style={{color:'#059669'}}>JugadorB</b> → <b>JugadorA</b> <span style={{float: 'right', color:'#888'}}>05/09/2025</span><br/>
          <span style={{color:'#059669'}}>Clausulazo hecho</span> <b style={{float:'right'}}>3.500.000 €</b>
        </li>
        <li style={{marginBottom: 8, background: '#fef9c3', borderLeft: '4px solid #eab308', padding: '6px 10px', borderRadius: 6}}>
          <b style={{color:'#eab308'}}>Mercado</b> → <b>JugadorX</b> <span style={{float: 'right', color:'#888'}}>01/09/2025</span><br/>
          <span style={{color:'#eab308'}}>Compra a mercado</span> <b style={{float:'right'}}>1.200.000 €</b>
        </li>
      </Box>
      <Text mt={2} color="gray.400" fontSize="xs" textAlign="center">
        (Próximamente funcional)
      </Text>
    </Box>
  );
}
