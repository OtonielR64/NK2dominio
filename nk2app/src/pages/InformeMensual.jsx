import { useState, useRef } from 'react'
import { Card, Button, DatePicker, Row, Col, Typography, Spin, message, Statistic } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import InformesNav from '../components/InformesNav'
import { api } from '../services/api'

const { Text } = Typography
const { RangePicker } = DatePicker

const BASE_INICIAL = 3637452.26
const fmt = n => '$ ' + Math.round(parseFloat(n) || 0).toLocaleString('es-CO')
const fmtFechaLarga = s => {
  if (!s) return '—'
  const d = new Date(s + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

const hdr = { background: '#2c5f8a', color: '#fff', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', padding: '7px 12px', letterSpacing: '.5px', border: '1px solid #2c5f8a' }
const hdrCol = { background: '#bed3ee', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', padding: '5px 12px', border: '1px solid #a0b8d8', textAlign: 'center' }
const filaDato = { padding: '5px 12px', border: '1px solid #d0d0d0', fontSize: 12 }
const filaDatoNum = { ...filaDato, textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }
const filaTotal = { padding: '6px 12px', border: '1px solid #a0b8d8', fontWeight: 700, fontSize: 12, background: '#deeaf7' }
const filaTotalNum = { ...filaTotal, textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }
const filaSaldo = { padding: '7px 12px', border: '1px solid #a0b8d8', fontWeight: 700, fontSize: 13, background: '#deeaf7' }
const filaSaldoNum = { ...filaSaldo, textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', fontSize: 14 }

function TablSeccion({ titulo, cols, filas, totalRow, saldoRow }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
      <tbody>
        <tr><td colSpan={2} style={hdr}>{titulo}</td></tr>
        <tr>{cols.map((c, i) => <td key={i} style={hdrCol}>{c}</td>)}</tr>
        {filas.map(([label, val], i) => (
          <tr key={i}>
            <td style={filaDato}>{label}</td>
            <td style={filaDatoNum}>{val}</td>
          </tr>
        ))}
        {totalRow && (
          <tr>
            <td style={filaTotal}>{totalRow[0]}</td>
            <td style={filaTotalNum}>{totalRow[1]}</td>
          </tr>
        )}
        {saldoRow && (
          <tr>
            <td style={filaSaldo}>{saldoRow[0]}</td>
            <td style={filaSaldoNum}>{saldoRow[1]}</td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export default function InformeMensual() {
  const hoy = new Date()
  const primerDiaMes = dayjs().startOf('month')
  const ultimoDiaMes = dayjs().endOf('month')
  const [rango, setRango] = useState([primerDiaMes, ultimoDiaMes])
  const [loading, setLoading] = useState(false)
  const [informe, setInforme] = useState(null)
  const cacheIng = useRef(null)
  const cacheSal = useRef(null)
  const cacheAbo = useRef(null)

  async function generarInforme() {
    if (!rango?.[0] || !rango?.[1]) { message.warning('Selecciona las dos fechas.'); return }
    const fIni = rango[0].format('YYYY-MM-DD')
    const fFin = rango[1].format('YYYY-MM-DD')
    if (fIni > fFin) { message.warning('La fecha inicial debe ser menor o igual a la final.'); return }

    setLoading(true)
    try {
      if (!cacheIng.current || !cacheSal.current || !cacheAbo.current) {
        const [ing, sal, abonos] = await Promise.all([api.getIngresos(), api.getSalidas(), api.getAbonos()])
        cacheIng.current = Array.isArray(ing)    ? ing    : []
        cacheSal.current = Array.isArray(sal)    ? sal    : []
        cacheAbo.current = Array.isArray(abonos) ? abonos : []
      }

      const ingAntes = cacheIng.current.filter(r => r.fecha < fIni).reduce((s, r) => s + (parseFloat(r.total) || 0), 0)
      const salAntes = cacheSal.current.filter(r => r.fecha < fIni).reduce((s, r) => s + (parseFloat(r.saldo) || 0), 0)
      const saldoAnterior = BASE_INICIAL + ingAntes - salAntes

      const ingPer = cacheIng.current.filter(r => r.fecha >= fIni && r.fecha <= fFin)
      let iContrib = 0, iAdmon = 0, iAmbos = 0, iVeh = 0
      ingPer.forEach(r => {
        const cod = String(r.cod_concepto).trim()
        const val = parseFloat(r.total) || 0
        if (['19','20'].includes(cod))              iContrib += val
        else if (cod === '11')                      iAdmon   += val
        else if (cod === '13')                      iAmbos   += val
        else if (['12','14','15','16','17','18'].includes(cod)) iVeh += val
      })
      const totIng = iContrib + iAdmon + iAmbos + iVeh

      const salPer = cacheSal.current.filter(r => r.fecha >= fIni && r.fecha <= fFin)
      let gSeg = 0, gAdm = 0, gSer = 0, gMant = 0, gOtros = 0
      salPer.forEach(r => {
        const cod = String(r.cod_concepto).trim()
        const val = parseFloat(r.saldo) || 0
        if (val <= 0) return
        if (cod === '21')                             gSeg   += val
        else if (['22','23','24','25'].includes(cod)) gAdm   += val
        else if (['27','28'].includes(cod))           gSer   += val
        else if (cod === '26')                        gMant  += val
        else if (cod === '29')                        gOtros += val
      })

      const aboPer = cacheAbo.current.filter(r => r.fecha >= fIni && r.fecha <= fFin)
      aboPer.forEach(r => {
        // concepto en abonos es "21 — Vigilancia" — extraer código
        const cod = String(r.concepto || '').split(' — ')[0].trim()
        const val = parseFloat(r.vlr_abono) || 0
        if (val <= 0) return
        if (cod === '21')                             gSeg   += val
        else if (['22','23','24','25'].includes(cod)) gAdm   += val
        else if (['27','28'].includes(cod))           gSer   += val
        else if (cod === '26')                        gMant  += val
        else if (cod === '29')                        gOtros += val
      })

      const totGas = gSeg + gAdm + gSer + gMant + gOtros
      const saldoAct = saldoAnterior + totIng - totGas

      setInforme({ fIni, fFin, saldoAnterior, iContrib, iAdmon, iAmbos, iVeh, totIng, gSeg, gAdm, gSer, gMant, gOtros, totGas, saldoAct })
    } catch { message.error('Error al cargar datos.') }
    setLoading(false)
  }

  const hoyStr = hoy.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div>
      <InformesNav />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>

        <Card size="small" style={{ marginBottom: 16 }} className="no-print"
          title={<Text style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6b6b66' }}>Parámetros del informe</Text>}>
          <Row gutter={[16, 12]} style={{ maxWidth: 480, marginBottom: 16 }}>
            <Col span={24}>
              <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: '#6b6b66', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 6 }}>Período</Text>
              <RangePicker value={rango} onChange={setRango} format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Col>
            <Col span={12}>
              <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: '#6b6b66', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 6 }}>Base inicial al 31-dic-2025</Text>
              <Statistic value={fmt(BASE_INICIAL)} valueStyle={{ fontSize: 14, fontFamily: 'IBM Plex Mono, monospace', color: '#1a5c2a' }} />
            </Col>
          </Row>
          <Row gutter={8}>
            <Col><Button type="primary" onClick={generarInforme} loading={loading} style={{ background: '#1a1a18', borderColor: '#1a1a18' }}>Generar informe</Button></Col>
            <Col><Button icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: '#2980b9', borderColor: '#2980b9', color: '#fff' }}>Imprimir / PDF</Button></Col>
          </Row>
        </Card>

        {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>}

        {informe && !loading && (
          <div style={{ background: '#fff', border: '1px solid #dddbd6', borderRadius: 6, padding: '32px 40px', fontSize: 13, lineHeight: 1.6 }} id="informe-doc">

            <div style={{ textAlign: 'center', marginBottom: 6, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              COMITÉ DE ORNATO Y SEGURIDAD NUEVO KENNEDY 2do SECTOR
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', marginBottom: 16, letterSpacing: '.5px' }}>
              INFORME FINANCIERO, PERÍODO:
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <tbody>
                <tr>
                  <th style={{ background: '#bed3ee', border: '1px solid #a0b8d8', padding: '6px 12px', fontSize: 12, fontWeight: 600, textAlign: 'center', textTransform: 'uppercase' }}>Fecha Inicial</th>
                  <th style={{ background: '#bed3ee', border: '1px solid #a0b8d8', padding: '6px 12px', fontSize: 12, fontWeight: 600, textAlign: 'center', textTransform: 'uppercase' }}>Fecha Final</th>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #a0b8d8', padding: '6px 12px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{fmtFechaLarga(informe.fIni)}</td>
                  <td style={{ border: '1px solid #a0b8d8', padding: '6px 12px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{fmtFechaLarga(informe.fFin)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: 11, fontStyle: 'italic', textAlign: 'justify', color: '#444', marginBottom: 16, padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 4, background: '#fafaf8' }}>
              Durante el periodo se registraron ingresos por aportes contributivos, de administración
              y vehículos destinados al sostenimiento del Conjunto Nuevo Kennedy 2do Sector.
              Los gastos correspondieron a servicios de seguridad, mantenimiento y gastos administrativos
              necesarios para el funcionamiento del Comité de Ornato y Seguridad.
            </div>

            <TablSeccion
              titulo="RESUMEN FINANCIERO"
              cols={['CONCEPTO', 'VALOR']}
              filas={[
                ['Saldo anterior / Base inicial:', fmt(informe.saldoAnterior)],
                ['Total aportes del período:', fmt(informe.totIng)],
                ['Total gastos del período:', fmt(informe.totGas)],
              ]}
              saldoRow={['SALDO ACTUAL:', fmt(informe.saldoAct)]}
            />

            <TablSeccion
              titulo="DETALLE DE INGRESOS"
              cols={['CONCEPTO', 'VALOR']}
              filas={[
                ['Aportes donaciones rejas / Otros…', fmt(informe.iContrib)],
                ['Aporte solo unidad residencial', fmt(informe.iAdmon)],
                ['Aporte unidad residencial y vehículos', fmt(informe.iAmbos)],
                ['Recaudos por vehículos', fmt(informe.iVeh)],
              ]}
              totalRow={['TOTAL INGRESOS:', fmt(informe.totIng)]}
            />

            <TablSeccion
              titulo="DETALLE DE GASTOS"
              cols={['CONCEPTO', 'VALOR']}
              filas={[
                ['Seguridad y vigilancia', fmt(informe.gSeg)],
                ['Cafetería / Papelería / Aseo… Otros', fmt(informe.gAdm)],
                ['Servicios públicos / Recarga celular garita', fmt(informe.gSer)],
                ['Mantenimiento Gral. / Áreas comunes', fmt(informe.gMant)],
                ['Reconocimiento gestión administrativa', fmt(informe.gOtros)],
              ]}
              totalRow={['TOTAL GASTOS:', fmt(informe.totGas)]}
            />

            <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 20 }}>
              {['Representante Principal', 'Revisor'].map(label => (
                <div key={label} style={{ textAlign: 'center', paddingTop: 40, borderTop: '1px solid #333', fontSize: 11, fontStyle: 'italic', color: '#c0550a' }}>{label}</div>
              ))}
            </div>
            <div style={{ textAlign: 'center', paddingTop: 40, borderTop: '1px solid #333', fontSize: 11, fontStyle: 'italic', color: '#c0550a', maxWidth: 260, margin: '0 auto 20px' }}>Fiscalizador</div>

            <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, marginTop: 20, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              COMITÉ DE ORNATO Y SEGURIDAD NK2
            </div>
            <div style={{ textAlign: 'right', fontSize: 10, color: '#6b6b66', marginTop: 16, fontFamily: 'IBM Plex Mono, monospace' }}>
              Fecha de impresión: {hoyStr}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print, .ant-layout-header, nav { display: none !important; }
          body { background: #fff !important; }
          #informe-doc { border: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}
