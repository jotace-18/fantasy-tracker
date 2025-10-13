// Script para verificar y corregir los team_ids en enfrentamientos
const db = require('../src/db/db');

const teamNameToId = {
  // Nombres oficiales
  'Athletic Club': 1,
  'Atlético de Madrid': 2,
  'CA Osasuna': 3,
  'Deportivo Alavés': 4,
  'Elche CF': 5,
  'FC Barcelona': 6,
  'Getafe CF': 7,
  'Girona FC': 8,
  'Levante UD': 9,
  'RCD Mallorca': 12,
  'Rayo Vallecano': 13,
  'Real Betis': 14,
  'Real Madrid': 15,
  'Real Oviedo': 16,
  'Real Sociedad': 17,
  'Sevilla FC': 18,
  'Valencia CF': 19,
  'Villarreal CF': 20,
  'RCD Espanyol de Barcelona': 23,
  'Celta': 34,
  // Alias y variantes del CSV
  'Athletic Bilbao': 1,
  'Espanyol': 23,
  'Osasuna': 3,
  'Alavés': 4,
  'Elche': 5,
  'Barcelona': 6,
  'Getafe': 7,
  'Girona': 8,
  'Levante': 9,
  'Mallorca': 12,
  'Betis': 14,
  'Oviedo': 16,
  'Sevilla': 18,
  'Villarreal': 20,
  'Celta de Vigo': 34,
  'Valencia': 19
};

async function checkAndFix() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT id, equipo_local, equipo_visitante, equipo_local_id, equipo_visitante_id FROM enfrentamientos`, [], (err, rows) => {
      if (err) return reject(err);
      
      console.log(`\n📋 Verificando ${rows.length} enfrentamientos...\n`);
      
      let needsFix = 0;
      let fixed = 0;
      let notFound = [];
      
      rows.forEach(row => {
        const localId = teamNameToId[row.equipo_local];
        const visitanteId = teamNameToId[row.equipo_visitante];
        
        if (!localId || !visitanteId) {
          console.log(`❌ ID ${row.id}: "${row.equipo_local}" vs "${row.equipo_visitante}" - NO ENCONTRADO EN MAPA`);
          notFound.push({ id: row.id, local: row.equipo_local, visitante: row.equipo_visitante });
          needsFix++;
        } else if (row.equipo_local_id !== localId || row.equipo_visitante_id !== visitanteId) {
          console.log(`⚠️  ID ${row.id}: "${row.equipo_local}" (${row.equipo_local_id || 'NULL'} → ${localId}) vs "${row.equipo_visitante}" (${row.equipo_visitante_id || 'NULL'} → ${visitanteId})`);
          needsFix++;
          
          db.run(`UPDATE enfrentamientos SET equipo_local_id = ?, equipo_visitante_id = ? WHERE id = ?`, 
            [localId, visitanteId, row.id], 
            (err2) => {
              if (err2) {
                console.error(`   ❌ Error actualizando ID ${row.id}:`, err2.message);
              } else {
                console.log(`   ✅ Actualizado correctamente`);
                fixed++;
              }
              
              if (fixed + notFound.length === needsFix) {
                console.log(`\n📊 Resumen:`);
                console.log(`   - Total verificados: ${rows.length}`);
                console.log(`   - Necesitaban corrección: ${needsFix}`);
                console.log(`   - Corregidos: ${fixed}`);
                console.log(`   - No encontrados: ${notFound.length}`);
                
                if (notFound.length > 0) {
                  console.log(`\n⚠️  Equipos no encontrados en el mapa:`);
                  notFound.forEach(item => {
                    console.log(`   - "${item.local}" vs "${item.visitante}"`);
                  });
                }
                
                resolve();
              }
            }
          );
        }
      });
      
      if (needsFix === 0) {
        console.log('✅ Todos los enfrentamientos tienen IDs correctos');
        resolve();
      }
    });
  });
}

checkAndFix()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
