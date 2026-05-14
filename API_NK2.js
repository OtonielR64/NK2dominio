const BASE_INGRESOS = 3637452.26;

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  const action = e.parameter.action;
  let result;
  try {
    if      (action === 'getHabitantes')   result = getHabitantes();
    else if (action === 'getPersonal')     result = getPersonal();
    else if (action === 'saveIngreso')     result = saveIngreso(e.parameter);
    else if (action === 'saveSalida')      result = saveSalida(e.parameter);
    else if (action === 'getNextRecibo')   result = getNextRecibo();
    else if (action === 'getNextRegistro') result = getNextRegistro();
    else if (action === 'getTotales')          result = getTotales();
    else if (action === 'getIngresos')         result = getIngresos();
    else if (action === 'getSalidas')          result = getSalidas();
    else if (action === 'updateIngreso')       result = updateIngreso(e.parameter);
    else if (action === 'updateSalida')        result = updateSalida(e.parameter);
    else if (action === 'deleteRow')           result = deleteRow(e.parameter);
    else if (action === 'regularizarMonedas')  result = regularizarMonedas();
    else if (action === 'getAbonos')           result = getAbonos(e.parameter);
    else if (action === 'saveAbono')           result = saveAbono(e.parameter);
    else result = { error: 'Acción no reconocida' };
  } catch(err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getHabitantes() {
  const data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('HABITANTES').getDataRange().getValues();
  return data.slice(1).map(r => ({ int: String(r[0]), nombre: r[1] }));
}

function getPersonal() {
  const data = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('PERSONAL').getDataRange().getValues();
  return data.slice(1).filter(r => r[0]).map(r => ({ id: r[0], nombre: r[1], cargo: r[2] }));
}

function getNextRecibo() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BD_INGRESOS');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { next: 10815 };
  const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const nums = vals.map(r => parseInt(r[0])).filter(n => !isNaN(n));
  return { next: nums.length ? Math.max(...nums) + 1 : 10815 };
}

function getNextRegistro() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BD_SALIDAS');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { next: 'NK-38' };
  const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const nums = vals
    .map(r => parseInt(String(r[0]).replace('NK-', '')))
    .filter(n => !isNaN(n));
  return { next: nums.length ? 'NK-' + (Math.max(...nums) + 1) : 'NK-38' };
}

function getTotales() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const ing = ss.getSheetByName('BD_INGRESOS');
  const lastIng = ing.getLastRow();
  let totalIngresos = 0;
  if (lastIng > 1) {
    const totCol = ing.getRange(2, 13, lastIng - 1, 1).getValues();
    totCol.forEach(r => { totalIngresos += parseFloat(r[0]) || 0; });
  }

  const sal = ss.getSheetByName('BD_SALIDAS');
  const lastSal = sal.getLastRow();
  let totalSalidas = 0;
  if (lastSal > 1) {
    const totCol = sal.getRange(2, 7, lastSal - 1, 1).getValues();
    totCol.forEach(r => { totalSalidas += parseFloat(r[0]) || 0; });
  }

  const saldo = BASE_INGRESOS + totalIngresos - totalSalidas;
  return { base: BASE_INGRESOS, totalIngresos, totalSalidas, saldo };
}

function saveIngreso(p) {
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('BD_INGRESOS').appendRow([
      p.factura, p.fecha, p.interior, p.nombre,
      p.cod_admin, p.administrador, p.cod_concepto, p.concepto,
      parseFloat(p.vlr_admon)||0, parseFloat(p.vlr_vehiculo)||0,
      p.mes_pago, parseInt(p.cantidad)||1,
      parseFloat(p.total)||0, p.observacion
    ]);
  return { ok: true, mensaje: 'Ingreso guardado correctamente' };
}

function saveSalida(p) {
  const total = parseFloat(p.vlr_total)||0;
  const abono = parseFloat(p.abono)||0;
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('BD_SALIDAS').appendRow([
      p.cod_registro, p.fecha, p.cod_admin, p.administrador,
      p.cod_concepto, p.concepto,
      total, abono, total - abono, p.observacion
    ]);
  return { ok: true, mensaje: 'Salida guardada correctamente' };
}

// ══════════ CONSULTAS ══════════
function getIngresos() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BD_INGRESOS');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  return sheet.getRange(2, 1, lastRow - 1, 15).getValues()
    .filter(r => r[0] !== '')
    .map(r => {
      // 1. Convertir fechas a cadena ISO
      r = r.map(c => c instanceof Date ? Utilities.formatDate(c, 'America/Bogota', 'yyyy-MM-dd') : c);

      // 2. Detectar formato de 15 cols (col B = clave_compuesta como "10678-17"):
      //    En ese caso r[1] NO es una fecha ISO → eliminarlo para normalizar a 14 cols.
      const esFecha = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
      if (!esFecha(r[1])) {
        r.splice(1, 1);
      }

      // 3. Detectar registros viejos sin cod_admin/administrador:
      //    Nuevo: r[4]=cod_admin, r[5]=admin, r[6]=cod_concepto(11-20), r[7]=concepto
      //    Viejo: r[4]=cod_concepto(11-20), r[5]=concepto, r[6]=vlr_admon(monto grande)
      //    Distinción: en registros nuevos r[6] ES un código 11-20 (entero exacto).
      //    En registros viejos r[6] es el monto de vlr_admon (número mayor a 20).
      const codPos4 = parseInt(r[4]);
      const codPos6 = parseInt(r[6]);
      const r6esCodigoConcepto = codPos6 >= 11 && codPos6 <= 20
        && String(r[6]).trim() === String(codPos6);
      if (codPos4 >= 11 && codPos4 <= 20 && !r6esCodigoConcepto) {
        r.splice(4, 0, '', '');
      }

      return r.slice(0, 14);
    });
}

function getSalidas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BD_SALIDAS');
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  return sheet.getRange(2, 1, lastRow - 1, 10).getValues()
    .filter(r => r[0] !== '')
    .map(r => r.map(c => c instanceof Date ? Utilities.formatDate(c, 'America/Bogota', 'yyyy-MM-dd') : c));
}

function updateIngreso(p) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BD_INGRESOS');
  const row = parseInt(p.rowIndex);
  const values = [
    p.factura, p.fecha, p.interior, p.nombre,
    p.cod_admin||'', p.administrador||'', p.cod_concepto, p.concepto,
    parseFloat(p.vlr_admon)||0, parseFloat(p.vlr_vehiculo)||0,
    p.mes_pago, parseInt(p.cantidad)||1,
    parseFloat(p.total)||0, p.observacion
  ];
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
  return { ok: true, mensaje: 'Ingreso actualizado correctamente' };
}

function updateSalida(p) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('BD_SALIDAS');
  const row = parseInt(p.rowIndex);
  const total = parseFloat(p.vlr_total)||0;
  const abono = parseFloat(p.abono)||0;
  const values = [
    p.cod_registro, p.fecha, p.cod_admin||'', p.administrador,
    p.cod_concepto, p.concepto,
    total, abono, total - abono, p.observacion
  ];
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
  return { ok: true, mensaje: 'Salida actualizada correctamente' };
}

function deleteRow(p) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(p.sheet);
  sheet.deleteRow(parseInt(p.rowIndex));
  return { ok: true, mensaje: 'Registro eliminado correctamente' };
}

// ══════════════════════════════════════════════════════════════
//  REGULARIZACIÓN DE CAMPOS MONEDA
//  Convierte todos los valores monetarios a número puro y
//  aplica formato #,##0 para que las entradas futuras sean
//  consistentes.
//
//  BD_INGRESOS → columnas I (9), J (10), M (13)  [1-based]
//  BD_SALIDAS  → columnas G (7), H (8),  I (9)   [1-based]
//
//  Puedes ejecutar esta función directamente desde el editor
//  de Apps Script (botón ▶ Run) o llamarla vía API con
//  action=regularizarMonedas
// ══════════════════════════════════════════════════════════════

function toNum_(v) {
  if (typeof v === 'number') return v;
  var s = String(v).replace(/[\s$]/g, '').trim();
  if (!s) return 0;
  // Formato colombiano: "95.000" o "95.000,50"
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))
    return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
  // Punto como decimal o número plano
  return parseFloat(s.replace(',', '.')) || 0;
}

function regularizarMonedas() {
  var ss   = SpreadsheetApp.getActiveSpreadsheet();
  var fmt  = '#,##0';
  var filas, rng, vals, i;

  // ── BD_INGRESOS ──────────────────────────────────────────────
  var shI = ss.getSheetByName('BD_INGRESOS');
  if (shI && shI.getLastRow() > 1) {
    filas = shI.getLastRow() - 1;
    [9, 10, 13].forEach(function(col) {           // I, J, M
      rng  = shI.getRange(2, col, filas, 1);
      vals = rng.getValues();
      for (i = 0; i < vals.length; i++) vals[i][0] = toNum_(vals[i][0]);
      rng.setValues(vals);
      rng.setNumberFormat(fmt);
    });
  }

  // ── BD_SALIDAS ───────────────────────────────────────────────
  var shS = ss.getSheetByName('BD_SALIDAS');
  if (shS && shS.getLastRow() > 1) {
    filas = shS.getLastRow() - 1;
    [7, 8, 9].forEach(function(col) {             // G, H, I
      rng  = shS.getRange(2, col, filas, 1);
      vals = rng.getValues();
      for (i = 0; i < vals.length; i++) vals[i][0] = toNum_(vals[i][0]);
      rng.setValues(vals);
      rng.setNumberFormat(fmt);
    });
  }

  return { ok: true, mensaje: 'Monedas regularizadas: BD_INGRESOS (I, J, M) y BD_SALIDAS (G, H, I).' };
}

// ══════════════════════════════════════════════════════════════
//  ABONOS
//  Hoja requerida: BD_ABONOS
//  Columnas: A=cod_registro | B=fecha | C=administrador |
//            D=concepto | E=vlr_total_obra | F=vlr_abono |
//            G=saldo | H=observacion
// ══════════════════════════════════════════════════════════════

function getAbonos(p) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('BD_ABONOS');
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  var cod  = p && p.cod_registro ? String(p.cod_registro).trim().toLowerCase() : '';
  return data
    .filter(function(r) {
      if (!cod) return r[0] !== '';  // sin filtro → todos los registros
      return String(r[0]).trim().toLowerCase() === cod;
    })
    .map(function(r) {
      return r.map(function(c) {
        return c instanceof Date
          ? Utilities.formatDate(c, 'America/Bogota', 'yyyy-MM-dd')
          : c;
      });
    });
}

function saveAbono(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Buscar la fila en BD_SALIDAS que corresponde al cod_registro
  var shSal   = ss.getSheetByName('BD_SALIDAS');
  var lastSal = shSal.getLastRow();
  var rowSal  = -1;

  if (lastSal > 1) {
    var codCol = shSal.getRange(2, 1, lastSal - 1, 1).getValues();
    for (var i = 0; i < codCol.length; i++) {
      if (String(codCol[i][0]).trim().toLowerCase() === String(p.cod_registro).trim().toLowerCase()) {
        rowSal = i + 2; // fila real en la hoja (1-indexed + encabezado)
        break;
      }
    }
  }

  if (rowSal === -1) {
    return { error: 'No se encontró el registro "' + p.cod_registro + '" en BD_SALIDAS.' };
  }

  // 2. Leer total y abono acumulado actual de BD_SALIDAS (cols G=7, H=8, I=9)
  var vlrTotal      = parseFloat(shSal.getRange(rowSal, 7).getValue()) || 0;
  var abonadoActual = parseFloat(shSal.getRange(rowSal, 8).getValue()) || 0;
  var nuevoAbono    = parseFloat(p.vlr_abono) || 0;

  var nuevoAbonadoTotal = abonadoActual + nuevoAbono;
  var nuevoSaldo        = Math.max(0, vlrTotal - nuevoAbonadoTotal);

  // 3. Actualizar BD_SALIDAS: cols H (abono acum.) e I (saldo)
  shSal.getRange(rowSal, 8).setValue(nuevoAbonadoTotal);
  shSal.getRange(rowSal, 9).setValue(nuevoSaldo);

  // 4. Registrar en BD_ABONOS (crear hoja si no existe)
  var shAb = ss.getSheetByName('BD_ABONOS');
  if (!shAb) {
    shAb = ss.insertSheet('BD_ABONOS');
    shAb.appendRow(['cod_registro','fecha','administrador','concepto',
                    'vlr_total_obra','vlr_abono','saldo','observacion']);
  }

  shAb.appendRow([
    p.cod_registro,
    p.fecha,
    p.administrador,
    p.concepto,
    vlrTotal,
    nuevoAbono,
    nuevoSaldo,
    p.observacion
  ]);

  return {
    ok:     true,
    mensaje: 'Abono de ' + nuevoAbono.toLocaleString() + ' registrado. Saldo pendiente: ' + nuevoSaldo.toLocaleString() + '.'
  };
}
