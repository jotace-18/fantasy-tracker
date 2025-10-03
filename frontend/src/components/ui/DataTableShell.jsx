import { Box, Table, TableContainer } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export function DataTableShell({ children, maxH, animated=true, stickyHeader=true, hoverHighlight=true }) {
  return (
    <MotionBox
    borderRadius='2xl'
    shadow='md'
    bg='gray.50'
      overflow='hidden'
      position='relative'
    border='1px solid'
    borderColor='gray.200'
    _dark={{ bg:'gray.900', borderColor:'gray.700' }}
      initial={animated ? { opacity: 0, y: 16 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: .45 }}
      sx={hoverHighlight ? {
        'tbody tr': {
          transition: 'background .15s, transform .15s',
        },
        'tbody tr:hover': {
          bg: 'blackAlpha.50',
          _dark: { bg: 'whiteAlpha.100' },
        },
        'tbody tr:nth-of-type(even)': {
          bg: 'white',
          _dark: { bg: 'gray.700' }
        }
      }: undefined}
    >
      <TableContainer maxH={maxH} overflowY={maxH ? 'auto' : 'visible'}>
        <Table variant='striped' size='sm' colorScheme='teal'
          sx={stickyHeader ? {
            thead: {
              position: 'sticky',
              top: 0,
              zIndex: 2,
              bg: 'teal.600',
              _dark: { bg: 'teal.700' },
              color: 'white',
              'th': { color: 'white', fontWeight: 'semibold', fontSize: 'sm', letterSpacing: 'wide' }
            }
          }: undefined}
        >
          {children}
        </Table>
      </TableContainer>
    </MotionBox>
  );
}
