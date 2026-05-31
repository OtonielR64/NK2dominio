// Genera migrate_data.sql a partir del Excel
// Uso: node migrate.js
// Requiere: npm install xlsx (ya instalado en nk2app)

const XLSX = require('../nk2app/node_modules/xlsx');
const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'RECAUDOS NK2_PpalClaude.xlsx');
const OUT  = path.join(__dirname, 'migrate_data.sql');

const wb = XLSX.readFile(FILE);
const lines = ["SET NAMES utf8mb4;", "SET time_zone = '-05:00';", ""];

// Excel serial date → YYYY-MM-DD
function excelDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return d.toISOString().slice(0, 10);
}

function esc(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  const s = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${s}'`;
}

function num(v) {
  if (v === null || v === undefined || v === '') return '0';
  const s = String(v).replace(/[\$\s]/g, '').replace(',', '.');
  // formato colombiano: 95.000 -> 95000
  if (/^\d{1,3}(\.\d{3})+(\.\d+)?$/.test(s)) {
    return parseFloat(s.replace(/\./g, '')) || 0;
  }
  return parseFloat(s) || 0;
}

// ── PERSONAL ──────────────────────────────────────────────────────────────
const personal = XLSX.utils.sheet_to_json(wb.Sheets['PERSONAL'], { header: 1 }).slice(1)
  .filter(r => r[0]);
lines.push('-- PERSONAL');
personal.forEach(r => {
  lines.push(`INSERT IGNORE INTO personal (id, nombre, cargo) VALUES (${parseInt(r[0])}, ${esc(r[1])}, ${esc(r[2])});`);
});
lines.push('');

// ── HABITANTES ────────────────────────────────────────────────────────────
const habitantes = XLSX.utils.sheet_to_json(wb.Sheets['HABITANTES'], { header: 1 }).slice(1)
  .filter(r => r[0] !== undefined && r[0] !== '');
lines.push('-- HABITANTES (' + habitantes.length + ' registros)');
habitantes.forEach(r => {
  const interior = String(r[0]).trim();
  const pin      = r[2] ? String(r[2]).trim() : null;
  // PIN se migra en texto plano temporalmente; se hashea desde la app al primer login
  lines.push(`INSERT IGNORE INTO habitantes (interior, nombre, pin) VALUES (${esc(interior)}, ${esc(r[1])}, ${pin ? esc(pin) : 'NULL'});`);
});
lines.push('');

// ── BD_INGRESOS ───────────────────────────────────────────────────────────
const ingresos = XLSX.utils.sheet_to_json(wb.Sheets['BD_INGRESOS'], { header: 1 }).slice(1)
  .filter(r => r[0] !== undefined && r[0] !== '');
lines.push('-- BD_INGRESOS (' + ingresos.length + ' registros)');
ingresos.forEach(r => {
  const factura     = parseInt(r[0]) || 0;
  const fecha       = excelDate(r[1]);
  const interior    = String(r[2] || '').trim();
  const nombre      = String(r[3] || '').trim();
  const cod_admin   = parseInt(r[4]) || null;
  const admin       = String(r[5] || '').trim();
  const cod_con     = parseInt(r[6]) || 0;
  const concepto    = String(r[7] || '').trim();
  const vlr_admon   = num(r[8]);
  const vlr_veh     = num(r[9]);
  const mes_pago    = excelDate(r[10]);
  const cantidad    = parseInt(r[11]) || 1;
  const total       = num(r[12]);
  const obs         = String(r[13] || '').trim();

  if (!fecha || !mes_pago) return;
  lines.push(
    `INSERT INTO bd_ingresos (factura,fecha,interior,nombre,cod_admin,administrador,cod_concepto,concepto,vlr_admon,vlr_vehiculo,mes_pago,cantidad,total,observacion) VALUES ` +
    `(${factura},${esc(fecha)},${esc(interior)},${esc(nombre)},${cod_admin ?? 'NULL'},${esc(admin)},${cod_con},${esc(concepto)},${vlr_admon},${vlr_veh},${esc(mes_pago)},${cantidad},${total},${esc(obs)});`
  );
});
lines.push('');

// ── BD_SALIDAS ────────────────────────────────────────────────────────────
const salidas = XLSX.utils.sheet_to_json(wb.Sheets['BD_SALIDAS'], { header: 1 }).slice(1)
  .filter(r => r[0] !== undefined && String(r[0]).trim() !== '');
lines.push('-- BD_SALIDAS (' + salidas.length + ' registros)');
salidas.forEach(r => {
  const cod  = String(r[0]).trim();
  const fecha = excelDate(r[1]);
  const cod_admin = parseInt(r[2]) || null;
  const admin = String(r[3] || '').trim();
  const cod_con = parseInt(r[4]) || 0;
  const concepto = String(r[5] || '').trim();
  const vlr_total = num(r[6]);
  const abono = num(r[7]);
  const saldo = num(r[8]);
  const obs = String(r[9] || '').trim();

  if (!fecha) return;
  lines.push(
    `INSERT IGNORE INTO bd_salidas (cod_registro,fecha,cod_admin,administrador,cod_concepto,concepto,vlr_total,abono,saldo,observacion) VALUES ` +
    `(${esc(cod)},${esc(fecha)},${cod_admin ?? 'NULL'},${esc(admin)},${cod_con},${esc(concepto)},${vlr_total},${abono},${saldo},${esc(obs)});`
  );
});
lines.push('');

// ── USUARIOS iniciales (contraseñas en texto plano — cambiar después) ─────
lines.push('-- USUARIOS INICIALES (cambiar contraseñas desde la app)');
lines.push(`INSERT IGNORE INTO usuarios (username, password, rol) VALUES ('admin', 'CAMBIAR_ESTA_PASSWORD', 'admin');`);
lines.push(`INSERT IGNORE INTO usuarios (username, password, rol) VALUES ('visor', 'CAMBIAR_ESTA_PASSWORD', 'visor');`);

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log('Generado: backend/migrate_data.sql');
console.log('  personal:   ' + personal.length);
console.log('  habitantes: ' + habitantes.length);
console.log('  ingresos:   ' + ingresos.length);
console.log('  salidas:    ' + salidas.length);
