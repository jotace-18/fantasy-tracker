import { Flex, Button, Avatar, Text, Tooltip, Spinner, useToast, IconButton, useColorMode } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { CheckIcon, WarningTwoIcon, RepeatIcon } from '@chakra-ui/icons';
import InternalClock from "../InternalClock";

export default function Topbar({ onScrape }) {
  const [lastScraped, setLastScraped] = useState(null);
  const [isValidToday, setIsValidToday] = useState(false);
  const [scrapeState, setScrapeState] = useState('idle'); // idle|loading|success|error
  const toast = useToast();
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    fetch("http://localhost:4000/api/scraper-metadata/last")
      .then((res) => res.json())
      .then((data) => {
        if (data.lastScraped) {
          setLastScraped(new Date(data.lastScraped));
        }
      })
      .catch(() => setLastScraped(null));
  }, []);

  useEffect(() => {
    if (!lastScraped) {
      setIsValidToday(false);
      return;
    }

    const now = new Date();
    const reset = new Date(now);
    reset.setHours(16, 0, 0, 0);

    // Si ahora es antes de las 16h, usamos el reset de ayer
    if (now < reset) {
      reset.setDate(reset.getDate() - 1);
    }

    setIsValidToday(lastScraped >= reset);
  }, [lastScraped]);

  // Formatear fecha para tooltip
  const formattedDate = lastScraped
    ? lastScraped.toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "Nunca";

  const handleScrapeClick = async () => {
    if (scrapeState === 'loading') return;
    try {
      setScrapeState('loading');
      await onScrape(); // se asume que onScrape devuelve promesa si la adaptamos, si no hacemos fetch aquí
      setScrapeState('success');
      toast({
        title: 'Scraper lanzado',
        description: 'Los datos se irán actualizando en breve.',
        status: 'success',
        duration: 2500,
        isClosable: true,
        position: 'top-right'
      });
      setTimeout(()=> setScrapeState('idle'), 1600);
  } catch {
      setScrapeState('error');
      toast({ title: 'Error lanzando scraper', status: 'error', duration: 3000, isClosable: true, position: 'top-right' });
      setTimeout(()=> setScrapeState('idle'), 2500);
    }
  };

  const renderButtonIcon = () => {
    if (scrapeState === 'loading') return <Spinner size='sm' />;
    if (scrapeState === 'success') return <CheckIcon />;
    if (scrapeState === 'error') return <WarningTwoIcon />;
    return <RepeatIcon />;
  };

  const buttonLabel = {
    idle: 'Actualizar datos',
    loading: 'Actualizando...',
    success: '¡Listo!',
    error: 'Error'
  }[scrapeState];

  return (
    <Flex justify="space-between" align="center" p={4} bg={colorMode==='light'? 'white':'gray.800'} boxShadow="md" position="sticky" top={0} zIndex={50} backdropFilter="blur(4px)">
      <Flex align="center" gap={3}>
        <Button
          variant={scrapeState==='idle' ? 'pulse' : 'solid'}
          colorScheme={scrapeState === 'error' ? 'red' : 'blue'}
          onClick={handleScrapeClick}
          leftIcon={renderButtonIcon()}
          isDisabled={scrapeState === 'loading'}
          transition="all .25s"
        >
          {buttonLabel}
        </Button>
        <Tooltip
          label={`Último scrapeo: ${formattedDate}`}
          aria-label="Fecha último scrapeo"
          placement="right"
          hasArrow
        >
          <Text fontSize="lg" cursor="default">
            {lastScraped ? (isValidToday ? "✅" : "❌") : "❌"}
          </Text>
        </Tooltip>
      </Flex>
      <Flex align="center" gap={4}>
        <InternalClock />
        <IconButton
          aria-label="Alternar modo de color"
          onClick={toggleColorMode}
          icon={colorMode==='light'? <MoonIcon /> : <SunIcon />}
          variant='ghost'
          size='md'
        />
        <Avatar size="sm" name="Usuario" />
      </Flex>
    </Flex>
  );
}
