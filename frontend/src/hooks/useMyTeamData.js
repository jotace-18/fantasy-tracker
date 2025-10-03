// useMyTeamData.js
// Encapsula la lógica de datos de MyTeamPage: carga de plantilla, formación, dinero y acciones.
import { useState, useEffect, useCallback, useMemo } from 'react';
import { FORMATIONS, FORMATION_MAP } from '../utils/formations';

export function useMyTeamData(participantId = 8){
  const [formation, setFormation] = useState('4-3-3');
  const [players, setPlayers] = useState([]); // participant_players
  const [money, setMoney] = useState(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingMoney, setLoadingMoney] = useState(false);

  const loadTeamAndPlayers = useCallback(async ()=> {
    setLoadingPlayers(true);
    try {
      // Formación
      const teamRes = await fetch(`/api/participants/${participantId}`);
      if(teamRes.ok){
        const teamData = await teamRes.json();
        if(teamData?.formation) setFormation(teamData.formation);
      }
      // Plantilla
      const res = await fetch(`/api/participant-players/${participantId}/team`);
      if(res.ok){
        const data = await res.json();
        setPlayers(Array.isArray(data)? data: []);
      } else {
        setPlayers([]);
      }
    } catch(err){
      console.error('❌ Error loadTeamAndPlayers:', err);
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  }, [participantId]);

  const loadMoney = useCallback(async ()=> {
    setLoadingMoney(true);
    try {
      const res = await fetch(`/api/participants/${participantId}/money`);
      if(res.ok){
        const data = await res.json();
        setMoney(data.money);
      } else setMoney(null);
    } catch { setMoney(null); }
    finally { setLoadingMoney(false); }
  }, [participantId]);

  useEffect(()=> { loadTeamAndPlayers(); loadMoney(); }, [loadTeamAndPlayers, loadMoney]);

  // Ordenado memoizado
  const orderedPlayers = useMemo(()=> {
    const posOrder = { GK:1, DEF:2, MID:3, FWD:4 };
    return [...players].sort((a,b)=> {
      if(posOrder[a.role] !== posOrder[b.role]) return posOrder[a.role]-posOrder[b.role];
      return (b.total_points||0) - (a.total_points||0);
    });
  }, [players]);

  const positions = useMemo(()=> FORMATION_MAP[formation], [formation]);

  const totalMarketValueXI = useMemo(()=> players.filter(p=> p.status==='XI')
    .reduce((s,p)=> s + (p.market_value_num||0),0), [players]);

  // Actions
  const addPlayer = useCallback(async (player)=> {
    try {
      if(players.some(pl=> pl.player_id === player.id)) return;
      const res = await fetch(`/api/participant-players/${participantId}/team`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          player_id: player.id,
            buy_price: player.market_value_num || 0,
            status: 'R', slot_index: null
        })
      });
      if(!res.ok) throw new Error('Error al añadir');
      await loadTeamAndPlayers();
    } catch(err){ console.error('❌ addPlayer:', err);} 
  }, [participantId, players, loadTeamAndPlayers]);

  const removePlayer = useCallback(async (playerId)=> {
    try {
      const res = await fetch(`/api/participant-players/${participantId}/team/${playerId}`, { method:'DELETE' });
      if(!res.ok) throw new Error('Error al eliminar');
      await loadTeamAndPlayers();
    } catch(err){ console.error('❌ removePlayer:', err);} 
  }, [participantId, loadTeamAndPlayers]);

  const setReserve = useCallback(async (playerId)=> {
    try {
      await fetch(`/api/participant-players/${participantId}/team/${playerId}`, {
        method:'PUT', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ status:'R', slot_index:null })
      });
      await loadTeamAndPlayers();
    } catch(err){ console.error('❌ setReserve:', err);} 
  }, [participantId, loadTeamAndPlayers]);

  const setXI = useCallback(async (player, selectedSlot, currentPlayers)=> {
    if(!selectedSlot) return;
    const roster = currentPlayers || players;
    const teamId = participantId;
    try {
      const prevPlayer = roster.find(pl => pl.slot_index === selectedSlot.index && pl.status === (selectedSlot.isBench ? 'B':'XI'));
      if(prevPlayer){
        await fetch(`/api/participant-players/${teamId}/team/${prevPlayer.player_id}`, {
          method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ status:'R', slot_index:null })
        });
      }
      await fetch(`/api/participant-players/${teamId}/team/${player.player_id}`, {
        method:'PUT', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ status: selectedSlot.isBench? 'B':'XI', slot_index: selectedSlot.index })
      });
      await loadTeamAndPlayers();
    } catch(err){ console.error('❌ setXI:', err); }
  }, [participantId, players, loadTeamAndPlayers]);

  const changeFormation = useCallback(async (newFormation)=> {
    setFormation(newFormation);
    try {
      await fetch(`/api/participants/${participantId}/formation`, {
        method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ formation: newFormation })
      });
    } catch(err){ console.warn('No se pudo actualizar formación', err); }
    // Reajustar XI a slots disponibles
    const newPositions = FORMATION_MAP[newFormation];
    const slotsByRole = {};
    newPositions.forEach((p,i)=> { (slotsByRole[p.role] ||= []).push(i+1); });
    const xiByRole = {};
    players.filter(pl=> pl.status==='XI').forEach(pl=> { (xiByRole[pl.role] ||= []).push(pl); });
    const updates = [];
    Object.entries(slotsByRole).forEach(([role, slotIndexes])=> {
      const list = xiByRole[role] || [];
      const sorted = [...list].sort((a,b)=> (a.slot_index||0)-(b.slot_index||0));
      sorted.forEach((pl,i)=> {
        if(i < slotIndexes.length){
          updates.push(fetch(`/api/participant-players/${participantId}/team/${pl.player_id}`, {
            method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ status:'XI', slot_index: slotIndexes[i] })
          }));
        } else {
          updates.push(fetch(`/api/participant-players/${participantId}/team/${pl.player_id}`, {
            method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ status:'R', slot_index:null })
          }));
        }
      });
    });
    Object.keys(xiByRole).forEach(role=> {
      if(!slotsByRole[role]){
        xiByRole[role].forEach(pl=> {
          updates.push(fetch(`/api/participant-players/${participantId}/team/${pl.player_id}`, {
            method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ status:'R', slot_index:null })
          }));
        });
      }
    });
    if(updates.length) await Promise.all(updates);
    await loadTeamAndPlayers();
  }, [participantId, players, loadTeamAndPlayers]);

  const saveMoney = useCallback(async (newMoney)=> {
    if(isNaN(Number(newMoney))) return false;
    try {
      const res = await fetch(`/api/participants/${participantId}/money`, {
        method:'PUT', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ money: Number(newMoney) })
      });
      if(res.ok){ setMoney(Number(newMoney)); return true; }
  } catch (err){ console.warn('No se pudo guardar dinero', err); }
    return false;
  }, [participantId]);

  const updateClause = useCallback(async ({ playerId, clause_value, is_clausulable, lock_days=0, lock_hours=0, minClause=0 })=> {
    try {
      await fetch(`/api/participant-players/${participantId}/team/${playerId}/clause`, {
        method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ clause_value: Math.max(Number(clause_value), minClause) })
      });
      await fetch(`/api/participant-players/${participantId}/team/${playerId}/clausulable`, {
        method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ is_clausulable: is_clausulable ? 1 : 0 })
      });
      if(!is_clausulable){
        await fetch(`/api/participant-players/${participantId}/team/${playerId}/clause-lock`, {
          method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ days:Number(lock_days)||0, hours:Number(lock_hours)||0 })
        });
      }
      await loadTeamAndPlayers();
    } catch(err){ console.error('❌ updateClause:', err); }
  }, [participantId, loadTeamAndPlayers]);

  const refresh = useCallback(async ()=> { await Promise.all([loadTeamAndPlayers(), loadMoney()]); }, [loadTeamAndPlayers, loadMoney]);

  return {
    participantId,
    formation, setFormation, changeFormation,
    players, orderedPlayers, positions,
    money, saveMoney,
    loadingPlayers, loadingMoney,
    totalMarketValueXI,
    addPlayer, removePlayer, setReserve, setXI, updateClause,
    refresh
  };
}

export default useMyTeamData;
