import { Box, Flex, Spinner, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export function AsyncState({ loading, error, empty, children, minH= '140px', emptyMessage='Sin datos', errorMessage='Error cargando datos' }) {
  if (loading) {
    return (
      <Flex align='center' justify='center' minH={minH} direction='column' gap={3}>
        <Spinner size='lg' />
        <Text fontSize='sm' opacity={0.7}>Cargando…</Text>
      </Flex>
    );
  }
  if (error) {
    return (
      <Flex align='center' justify='center' minH={minH} direction='column' gap={2}>
        <Text color='red.500' fontWeight='bold'>⚠ {errorMessage}</Text>
        {typeof error === 'string' && <Text fontSize='xs' opacity={0.6}>{error}</Text>}
      </Flex>
    );
  }
  if (empty) {
    return (
      <MotionBox
        initial={{ opacity: 0, scale: .96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: .4 }}
        textAlign='center'
        py={8}
        color='gray.500'
        fontSize='sm'
      >
        {emptyMessage}
      </MotionBox>
    );
  }
  return <>{children}</>;
}
