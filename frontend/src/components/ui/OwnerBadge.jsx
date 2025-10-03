import { Badge } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

export function OwnerBadge({ owner_type, participant_id, participant_name }) {
  if (owner_type === 'user') {
    return <Badge as={Link} to='/my-team' colorScheme='teal' variant='subtle'>Tú</Badge>;
  }
  if (owner_type === 'participant' && participant_name) {
    return <Badge as={Link} to={`/participants/${participant_id}`} colorScheme='blue' variant='subtle'>{participant_name}</Badge>;
  }
  return <Badge colorScheme='gray' variant='outline'>Banco</Badge>;
}
