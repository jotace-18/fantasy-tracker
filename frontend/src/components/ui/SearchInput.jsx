import { InputGroup, InputLeftElement, Input, useColorModeValue } from '@chakra-ui/react';
import { Search2Icon } from '@chakra-ui/icons';
import { useRef, useEffect } from 'react';

export function SearchInput({ value, onChange, placeholder='Buscar...', size='sm', debounce=250 }) {
  const timeoutRef = useRef();
  const bg = useColorModeValue('gray.50', 'gray.600');
  const hoverBg = useColorModeValue('white', 'gray.500');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  useEffect(()=>() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const handle = (e) => {
    const v = e.target.value;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(v), debounce);
  };
  return (
    <InputGroup size={size} width={{ base: '100%', md: '260px' }}>
      <InputLeftElement pointerEvents='none'>
        <Search2Icon color='gray.400' />
      </InputLeftElement>
      <Input
        value={value}
        onChange={handle}
        placeholder={placeholder}
        variant='filled'
        bg={bg}
        _hover={{ bg: hoverBg }}
        _focus={{ bg: 'white', _dark:{ bg:'gray.500' } }}
        color={textColor}
        _placeholder={{ color: useColorModeValue('gray.500','gray.300') }}
      />
    </InputGroup>
  );
}
