import { Box, Flex, Heading, Text, HStack, Stack } from '@chakra-ui/react';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

export function PageHeader({ title, subtitle, meta, actions, icon, gradient }) {
  return (
    <MotionBox
      mb={6}
      p={6}
      borderRadius="3xl"
      position="relative"
      overflow="hidden"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .55 }}
      bgGradient={gradient || 'linear(to-r, teal.500, purple.500)'}
      color="white"
      _before={{
        content: '""', position: 'absolute', inset: 0,
        bg: 'radial-gradient(circle at 25% 30%, rgba(255,255,255,0.25), transparent 60%)'
      }}
    >
      <Flex direction={{ base: 'column', md: 'row' }} justify='space-between' gap={6} position='relative' zIndex={1}>
        <Stack spacing={2}>
          <Heading size={{ base: 'lg', md: 'xl' }} display='flex' alignItems='center' gap={3}>
            {icon && <Box fontSize='2xl'>{icon}</Box>}
            {title}
          </Heading>
          {subtitle && <Text fontSize='md' opacity={0.85}>{subtitle}</Text>}
          {meta && (
            <HStack spacing={4} pt={1} flexWrap='wrap'>
              {Array.isArray(meta) ? meta.map((m, i) => (
                <Text key={i} fontSize='sm' opacity={0.9}>{m}</Text>
              )) : <Text fontSize='sm' opacity={0.9}>{meta}</Text>}
            </HStack>
          )}
        </Stack>
        {actions && (
          <HStack spacing={3} align='flex-start' flexWrap='wrap'>
            {Array.isArray(actions) ? actions : [actions]}
          </HStack>
        )}
      </Flex>
    </MotionBox>
  );
}
