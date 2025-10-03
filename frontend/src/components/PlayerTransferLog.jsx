// components/TransferLog.jsx
import { useState, useEffect, useCallback } from 'react';
import { Box, Text, Flex, Spinner, Badge, useColorModeValue, HStack } from '@chakra-ui/react';
import { FaGavel, FaStore, FaHandshake } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

export default function PlayerTransferLog({ refreshKey, participantId }) {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const myParticipantId = 8; // Hardcodeado para demo, ideal: obtener del contexto de usuario
  const navigate = useNavigate();

  const fetchTransfers = useCallback(() => {
    setLoading(true);
    fetch("/api/transfers")
      .then(res => res.json())
      .then(data => {
        let filtered = Array.isArray(data) ? data : [];
        if (participantId) {
          filtered = filtered.filter(t =>
            String(t.from_participant_id) === String(participantId) ||
            String(t.to_participant_id) === String(participantId)
          );
        }
        setTransfers(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [participantId]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers, refreshKey]);

  // Estilos inspirados en TransferLog principal
  const fallbackBg = useColorModeValue('gray.50','gray.700');
  const fallbackBorder = useColorModeValue('gray.200','gray.600');
  const playerColor = useColorModeValue('gray.800','gray.100');
  const computeVisual = (t) => {
    const { type, from_participant_id: fromId, to_participant_id: toId } = t;
    const mineFrom = String(fromId) === String(myParticipantId);
    const mineTo = String(toId) === String(myParticipantId);
    const amount = t.amount || 0;
    const tier = amount >= 10000000 ? 'high' : amount >= 3000000 ? 'mid' : 'low';
    const tierAlpha = tier==='high'? 0.25 : tier==='mid'? 0.18 : 0.12;
    const gradient = (base)=> `linear-gradient(90deg, ${base}${Math.round(tierAlpha*255).toString(16).padStart(2,'0')} 0%, ${base}00 85%)`;
    if(type === 'clause'){
      if(mineTo)   return { base:'#7c3aed', left:'#4c1d95', text:'white', weight:'bold', badge:'Clausulazo', icon:FaGavel, grad:gradient('#7c3aed')};
      if(mineFrom) return { base:'#ffebee', left:'#c62828', text:'#b71c1c', weight:'bold', badge:'Clausulazo', icon:FaGavel, grad:gradient('#c62828')};
      return { base:'#ede9fe', left:'#7c3aed', text:'#4c1d95', weight:'bold', badge:'Clausulazo', icon:FaGavel, grad:gradient('#7c3aed') };
    }
    const isMarket = (fromId == null && toId != null) || (toId == null && fromId != null);
    if(isMarket){
      return { base:fallbackBg, left:fallbackBorder, text:playerColor, badge:'Mercado', icon:FaStore, grad:gradient('#a0aec0'), weight:'normal' };
    }
    if(fromId != null && toId != null){
      if(mineTo)   return { base:'#c6f6d5', left:'#2f855a', text:'#22543d', weight:'bold', badge:'Entrada', icon:FaHandshake, grad:gradient('#2f855a')};
      if(mineFrom) return { base:'#fffde7', left:'#fbc02d', text:'#f57c00', weight:'bold', badge:'Salida', icon:FaHandshake, grad:gradient('#fbc02d')};
      return { base:'#e0e7ff', left:'#2563eb', text:'#1e3a8a', badge:'Acuerdo', icon:FaHandshake, grad:gradient('#2563eb') };
    }
    return { base:fallbackBg, left:fallbackBorder, text:playerColor, badge:'Transf.', icon:FaStore, grad:gradient('#718096') };
  };

  const participantLink = (id, name) => {
    if (id == null) return <b>{name || "Mercado"}</b>;
    if (String(id) === String(myParticipantId)) {
      return <b style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/my-team")}>{name}</b>;
    }
    return (
      <Link to={`/participants/${id}`} style={{ fontWeight: "bold", textDecoration: "underline" }}>{name}</Link>
    );
  };

  return (
    <Box
      flex={1}
      minW="420px"
      maxW="520px"
      maxH="520px"
      overflowY="auto"
      bg="white"
      borderRadius="md"
      boxShadow="md"
      p={4}
      border="1px solid #e2e8f0"
    >
      <Text fontWeight="bold" mb={2} textAlign="center">
        Log de traspasos
      </Text>

      {loading ? (
        <Flex justify='center' align='center' py={10}><Spinner size='lg' /></Flex>
      ) : transfers.length === 0 ? (
        <Text textAlign='center' color='gray.400'>No hay traspasos aún</Text>
      ) : (
        transfers.map(t=> {
          const style = computeVisual(t);
            const Icon = style.icon;
            const amount = t.amount || 0;
            return (
              <Box key={t.id} mb={3} p={3} borderRadius='md' position='relative' boxShadow='sm' bg={style.base} style={{ borderLeft:`4px solid ${style.left}` }} overflow='hidden'>
                <Box position='absolute' inset={0} pointerEvents='none' opacity={0.9} style={{ background: style.grad }} />
                <Flex position='relative' justify='space-between' mb={1} align='center'>
                  <HStack spacing={2} align='center'>
                    <Box w='10px' h='10px' borderRadius='full' bg={style.left} boxShadow='0 0 0 2px rgba(0,0,0,0.15)' />
                    {Icon && <Icon size={14} color={style.left} />}
                    <Text fontWeight={style.weight || 'semibold'} color={style.text}>
                      {participantLink(t.from_participant_id, t.from_name)} → {participantLink(t.to_participant_id, t.to_name)}
                    </Text>
                  </HStack>
                  <Badge size='sm' variant='solid' bg={style.left} color='white' boxShadow='0 0 0 1px rgba(0,0,0,0.12)'>
                    {style.badge}
                  </Badge>
                </Flex>
                <Flex position='relative' justify='space-between' fontSize='xs' mb={1} color={style.text} opacity={0.9} fontFamily='mono'>
                  <Text>{new Date(t.transfer_date).toLocaleDateString('es-ES')}</Text>
                  <Text fontWeight='bold'>€{amount.toLocaleString('es-ES')}</Text>
                </Flex>
                <Text position='relative' fontSize='sm' fontWeight='bold' color={style.text}>{t.player_name}</Text>
              </Box>
            );
        })
      )}
    </Box>
  );
}
