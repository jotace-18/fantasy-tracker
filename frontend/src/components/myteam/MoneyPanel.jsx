import { Box, Flex, Text, Button, Spinner, useColorModeValue, HStack } from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';

export default function MoneyPanel({ money, onEdit, sticky = true, variant='panel' }){
  const bg = useColorModeValue('yellow.100','yellow.300');
  const titleColor = useColorModeValue('yellow.800','yellow.900');
  const valueColor = useColorModeValue('yellow.700','yellow.800');
  const borderColor = useColorModeValue('yellow.300','yellow.500');
  const overlayBg = useColorModeValue('rgba(255,255,255,0.75)','rgba(26,32,44,0.65)');
  if (variant === 'inline') {
    return (
      <HStack
        spacing={3}
        px={4}
        py={2}
        borderRadius='lg'
        bg={bg}
        borderWidth='1px'
        borderColor={borderColor}
      >
        <Text fontSize='sm' fontWeight='bold' color={titleColor}>Dinero:</Text>
        <Text fontSize='lg' fontWeight='extrabold' color={valueColor} minW='110px' textAlign='right'>
          {money === null ? <Spinner size='sm' /> : `€${Number(money).toLocaleString('es-ES')}`}
        </Text>
        <Button size='xs' variant='ghost' onClick={onEdit} aria-label='Editar dinero'>
          <EditIcon color={valueColor} />
        </Button>
      </HStack>
    );
  }

  return (
    <Flex justify='center' mt={4} position={sticky ? 'sticky' : 'static'} top={sticky ? 0 : undefined} zIndex={sticky ? 5 : undefined} pt={sticky ? 2 : undefined}
      _before={sticky ? { content:'""', position:'absolute', inset:0, backdropFilter:'blur(4px)', bg: overlayBg, borderTopLeftRadius:'inherit', borderTopRightRadius:'inherit', zIndex:0 } : undefined}
    >
      <Box
        bg={bg}
        px={{ base:6, md:10 }}
        py={4}
        borderRadius='2xl'
        boxShadow='lg'
        display='flex'
        alignItems='center'
        gap={6}
        minW='340px'
        maxW='560px'
        justifyContent='center'
        borderWidth='1px'
        borderColor={borderColor}
        position='relative'
        zIndex={1}
        _after={{ content:'""', position:'absolute', inset:0, borderRadius:'2xl', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.3)', pointerEvents:'none' }}
      >
        <Text fontSize='xl' color={titleColor} fontWeight='extrabold' letterSpacing='wide'>Dinero</Text>
        <Flex align='center' gap={2}>
          <Text fontSize='3xl' color={valueColor} fontWeight='black' ml={2} minW='140px' textAlign='right'>
            {money === null ? <Spinner size='md' /> : `€${Number(money).toLocaleString('es-ES')}`}
          </Text>
          {money !== null && (
            <Button size='xs' variant='ghost' onClick={onEdit} aria-label='Editar dinero'>
              <EditIcon color={valueColor} />
            </Button>
          )}
        </Flex>
      </Box>
    </Flex>
  );
}
