// Shared utility functions for MyTeam components
export function msToHMS(ms){
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  let str = '';
  if (d > 0) str += `${d}d `;
  str += [h, m, s].map(v => v.toString().padStart(2,'0')).join(':');
  return str;
}

export function getShortName(name=''){
  if(!name) return '';
  const parts = name.split(' ');
  if(parts.length === 1) return parts[0];
  if(parts[0].length <= 4) return parts[0] + ' ' + parts[1][0] + '.';
  return parts[0][0] + '. ' + parts[1];
}

export function getRoleColor(role){
  return `role.${role}`;
}
