import { Modal, Button, Space } from 'antd'
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons'

const fmt = n => '$ ' + Math.round(parseFloat(n) || 0).toLocaleString('es-CO')
const fmtFecha = f => {
  if (!f) return ''
  return new Date(f + 'T12:00:00').toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

// ── Estilos del recibo ───────────────────────────────────────────────────
const s = {
  wrap:    { fontFamily: 'monospace', fontSize: 12, width: 280, margin: '0 auto', padding: '10px 8px', background: '#fff', lineHeight: 1.6 },
  center:  { textAlign: 'center' },
  bold:    { fontWeight: 700 },
  line:    { borderTop: '1px dashed #000', margin: '6px 0' },
  row:     { display: 'flex', justifyContent: 'space-between', gap: 8 },
  lbl:     { color: '#555', minWidth: 90 },
  val:     { fontWeight: 600, textAlign: 'right', flex: 1 },
  total:   { display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 4 },
  obs:     { fontSize: 11, color: '#555', marginTop: 4, wordBreak: 'break-word' },
  footer:  { textAlign: 'center', fontSize: 10, color: '#888', marginTop: 8 },
}

function Recibo({ datos }) {
  if (!datos) return null
  const { factura, fecha, interior, nombre, administrador, concepto, cod_concepto,
          vlr_admon, vlr_vehiculo, mes_pago, cantidad, total, observacion } = datos

  const fmtMes = m => {
    if (!m) return ''
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    const match = String(m).match(/^(\d{4})-(\d{2})/)
    if (match) return `${meses[parseInt(match[2]) - 1]}-${match[1]}`
    return m
  }

  return (
    <div id="recibo-print" style={s.wrap}>
      {/* ENCABEZADO */}
      <div style={{ ...s.center, ...s.bold, fontSize: 11, lineHeight: 1.4 }}>
        COMITÉ DE ORNATO Y SEGURIDAD<br />
        CONJUNTO NUEVO KENNEDY 2DO SECTOR<br />
        <span style={{ fontSize: 10, fontWeight: 400 }}>NIT / CC del comité</span>
      </div>

      <div style={s.line} />

      {/* NÚMERO Y FECHA */}
      <div style={{ ...s.center, ...s.bold, fontSize: 14 }}>
        RECIBO N° {factura}
      </div>
      <div style={{ ...s.center, fontSize: 11 }}>
        Fecha: {fmtFecha(fecha)}
      </div>

      <div style={s.line} />

      {/* RESIDENTE */}
      <div style={s.row}><span style={s.lbl}>Interior:</span>    <span style={s.val}>{interior}</span></div>
      <div style={s.row}><span style={s.lbl}>Residente:</span>   <span style={s.val}>{nombre}</span></div>
      <div style={s.row}><span style={s.lbl}>Administrador:</span><span style={s.val}>{administrador}</span></div>

      <div style={s.line} />

      {/* DETALLE */}
      <div style={s.row}><span style={s.lbl}>Concepto:</span>    <span style={s.val}>{cod_concepto} — {concepto}</span></div>
      <div style={s.row}><span style={s.lbl}>Mes de pago:</span> <span style={s.val}>{fmtMes(mes_pago)}</span></div>
      {parseInt(cantidad) > 1 && (
        <div style={s.row}><span style={s.lbl}>Cantidad:</span>  <span style={s.val}>{cantidad} mes(es)</span></div>
      )}

      <div style={s.line} />

      {/* VALORES */}
      {parseFloat(vlr_admon) > 0 && (
        <div style={s.row}><span style={s.lbl}>Vlr. Admón:</span>    <span style={s.val}>{fmt(vlr_admon)}</span></div>
      )}
      {parseFloat(vlr_vehiculo) > 0 && (
        <div style={s.row}><span style={s.lbl}>Vlr. Vehículo:</span> <span style={s.val}>{fmt(vlr_vehiculo)}</span></div>
      )}

      <div style={s.line} />

      <div style={s.total}>
        <span>TOTAL:</span>
        <span>{fmt(total)}</span>
      </div>

      <div style={s.line} />

      {/* OBSERVACIÓN */}
      {observacion && (
        <div style={s.obs}>Obs: {observacion}</div>
      )}

      {/* FIRMA */}
      <div style={{ marginTop: 24, ...s.center }}>
        <div style={{ display: 'inline-block', width: 140, borderTop: '1px solid #000', paddingTop: 4, fontSize: 10 }}>
          Firma / Sello
        </div>
      </div>

      <div style={s.line} />
      <div style={s.footer}>
        Nuevo Kennedy 2do Sector · NK2<br />
        {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
      </div>
    </div>
  )
}

export default function ReciboModal({ datos, onClose }) {
  function imprimir() {
    const contenido = document.getElementById('recibo-print').innerHTML
    const ventana   = window.open('', '_blank', 'width=320,height=600')
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Recibo N° ${datos?.factura}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: monospace; font-size: 12px; width: 280px; padding: 8px; }
          @media print {
            @page { size: 80mm auto; margin: 2mm; }
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>${contenido}</body>
      </html>
    `)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => { ventana.print(); ventana.close() }, 400)
  }

  return (
    <Modal
      open={!!datos}
      title={`Recibo N° ${datos?.factura} — guardado correctamente`}
      onCancel={onClose}
      footer={
        <Space>
          <Button icon={<PrinterOutlined />} type="primary" onClick={imprimir}
            style={{ background: '#1a5c2a', borderColor: '#1a5c2a' }}>
            Imprimir recibo
          </Button>
          <Button icon={<CloseOutlined />} onClick={onClose}>
            Cerrar
          </Button>
        </Space>
      }
      width={360}
      destroyOnHidden
    >
      <div style={{ background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
        <Recibo datos={datos} />
      </div>
    </Modal>
  )
}
