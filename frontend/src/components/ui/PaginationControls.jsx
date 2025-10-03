import { HStack, Button, IconButton, Text } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons';

export function PaginationControls({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const go = (p) => onChange(Math.min(Math.max(1, p), totalPages));

  // Rango compacto dinámico
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <HStack justify='center' spacing={1} mt={6} flexWrap='wrap'>
      <IconButton aria-label='Primera página' size='sm' icon={<ArrowLeftIcon />} onClick={() => go(1)} isDisabled={page === 1} />
      <IconButton aria-label='Anterior' size='sm' icon={<ChevronLeftIcon />} onClick={() => go(page - 1)} isDisabled={page === 1} />
      {start > 1 && <Button size='sm' variant='ghost' onClick={() => go(1)}>1</Button>}
      {start > 2 && <Text px={1}>…</Text>}
      {pages.map(p => (
        <Button
          key={p}
          size='sm'
            onClick={() => go(p)}
            colorScheme={p === page ? 'blue' : 'gray'}
            variant={p === page ? 'solid' : 'outline'}
        >
          {p}
        </Button>
      ))}
      {end < totalPages - 1 && <Text px={1}>…</Text>}
      {end < totalPages && <Button size='sm' variant='ghost' onClick={() => go(totalPages)}>{totalPages}</Button>}
      <IconButton aria-label='Siguiente' size='sm' icon={<ChevronRightIcon />} onClick={() => go(page + 1)} isDisabled={page === totalPages} />
      <IconButton aria-label='Última página' size='sm' icon={<ArrowRightIcon />} onClick={() => go(totalPages)} isDisabled={page === totalPages} />
    </HStack>
  );
}
