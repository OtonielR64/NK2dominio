import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Typography, Tag, Button, Row, Col, Spin, message, Alert } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { api } from '../services/api'

const { Text } = Typography

const fmt = n => '$ ' + Math.round(parseFloat(n) || 0).toLocaleString('es-CO')

const fmtFecha = f => {
  if (!f) return ''
  return new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
}

const fmtMes = m => {
  if (!m) return ''
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const match = String(m).match(/^(\d{4})-(\d{2})/)
  if (match) return `${meses[parseInt(match[2]) - 1]} de ${match[1]}`
  return m
}

// ── Calcula meses en mora para un residente ──────────────────────────────
function calcularMora(pagos) {
  const CONC_CASA  = ['11','19','20']
  const CONC_VEH   = ['12','14','15','16','17','18']
  const CONC_AMBOS = ['13']

  const hoy    = new Date()
  const refAbs = hoy.getFullYear() * 12 + hoy.getMonth() - 1  // mes anterior absoluto

  let ultAdmon = null
  let ultVeh   = null
  let tieneVeh = false

  pagos.forEach(r => {
    const cod = String(r.cod_concepto).trim()
    if (!r.mes_pago) return
    const mp  = String(r.mes_pago)
    const pts = mp.split('-')
    if (pts.length < 2) return
    const y = parseInt(pts[0]), m = parseInt(pts[1]) - 1
    if (isNaN(y) || isNaN(m)) return
    const fecha = new Date(y, m, 1)

    const esAdmon = CONC_CASA.includes(cod) || CONC_AMBOS.includes(cod)
    const esVeh   = CONC_VEH.includes(cod)  || CONC_AMBOS.includes(cod)
    if (esAdmon && (!ultAdmon || fecha > ultAdmon)) ultAdmon = fecha
    if (esVeh)   { tieneVeh = true; if (!ultVeh || fecha > ultVeh) ultVeh = fecha }
  })

  const mAdmon = ultAdmon
    ? refAbs - (ultAdmon.getFullYear() * 12 + ultAdmon.getMonth())
    : refAbs - (hoy.getFullYear() * 12 - 1)

  const mVeh = tieneVeh && ultVeh
    ? refAbs - (ultVeh.getFullYear() * 12 + ultVeh.getMonth())
    : null

  return { mAdmon, mVeh, tieneVeh, ultAdmon, ultVeh }
}

function BadgeMora({ mora }) {
  const { mAdmon, mVeh, tieneVeh } = mora

  const estadoAdmon = () => {
    if (mAdmon <= 0) return { type: 'success', msg: '✅ Administración al día' }
    if (mAdmon <= 2) return { type: 'warning', msg: `⚠ Administración: ${mAdmon} mes${mAdmon>1?'es':''} en mora` }
    return { type: 'error',   msg: `🔴 Administración: ${mAdmon} meses en mora` }
  }

  const estadoVeh = () => {
    if (!tieneVeh) return null
    if (mVeh === null || mVeh <= 0) return { type: 'success', msg: '✅ Vehículo al día' }
    if (mVeh <= 2) return { type: 'warning', msg: `⚠ Vehículo: ${mVeh} mes${mVeh>1?'es':''} en mora` }
    return { type: 'error',   msg: `🔴 Vehículo: ${mVeh} meses en mora` }
  }

  const a = estadoAdmon()
  const v = estadoVeh()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Alert message={a.msg} type={a.type} showIcon={false}
        style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500 }} />
      {v && <Alert message={v.msg} type={v.type} showIcon={false}
        style={{ padding: '8px 14px', fontSize: 13, fontWeight: 500 }} />}
    </div>
  )
}

export default function MiCuenta() {
  const navigate = useNavigate()
  const interior = localStorage.getItem('nk2_user')   || ''
  const nombre   = localStorage.getItem('nk2_nombre') || ''
  const role     = localStorage.getItem('nk2_role')

  const [pagos,   setPagos]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role !== 'residente') { navigate('/login', { replace: true }); return }
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await api.residenteData(interior)
      setPagos(Array.isArray(data) ? data : [])
    } catch {
      message.error('Error al cargar tus pagos.')
    }
    setLoading(false)
  }

  function cerrarSesion() {
    ['nk2_token','nk2_role','nk2_user','nk2_nombre'].forEach(k => localStorage.removeItem(k))
    navigate('/login', { replace: true })
  }

  // ── Stats calculadas con useMemo para garantizar actualización ──────────
  const totalPagado = useMemo(() => pagos.reduce((s, r) => s + (parseFloat(r.total) || 0), 0), [pagos])
  const ultimoPago  = useMemo(() => pagos.length ? pagos[0].fecha : null, [pagos])
  const mora        = useMemo(() => calcularMora(pagos), [pagos])

  const columns = [
    { title: 'Recibo',    dataIndex: 'factura',     key: 'rec', width: 90,  render: v => <Tag color="green">{v}</Tag> },
    { title: 'Fecha',     dataIndex: 'fecha',        key: 'fec', width: 130, render: v => fmtFecha(v) },
    { title: 'Concepto',  dataIndex: 'concepto',     key: 'con', ellipsis: true },
    { title: 'Mes pago',  dataIndex: 'mes_pago',     key: 'mes', width: 130, render: v => fmtMes(v) },
    { title: 'Cantidad',  dataIndex: 'cantidad',     key: 'can', width: 80,  align: 'center' },
    { title: 'Total',     dataIndex: 'total',        key: 'tot', width: 120, align: 'right',
      render: v => <Text strong style={{ color: '#1a5c2a', fontFamily: 'IBM Plex Mono, monospace' }}>{fmt(v)}</Text> },
    { title: 'Observación', dataIndex: 'observacion', key: 'obs', ellipsis: true },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#2e3440', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <div style={{ background: '#1a1a18', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Comité Ornato y Seguridad · NK2
          </Text>
          <Text style={{ display: 'block', color: '#888', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, marginTop: 2 }}>
            Portal del residente
          </Text>
        </div>
        <Button icon={<LogoutOutlined />} onClick={cerrarSesion}
          style={{ background: '#4a4a4a', borderColor: '#4a4a4a', color: '#fff', fontSize: 12 }}>
          🔒 Salir
        </Button>
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px', width: '100%' }}>

        {/* BIENVENIDA */}
        <Card size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
          <div style={{ background: '#2c3e7a', padding: '10px 18px', borderRadius: '6px 6px 0 0' }}>
            <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              🏠 Interior {interior} — {nombre}
            </Text>
          </div>

          {loading
            ? <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
            : (
              <div style={{ padding: '16px 18px' }}>
                {/* STATS */}
                <Row gutter={[16,12]} style={{ marginBottom: 16 }}>
                  <Col xs={12} sm={6}>
                    <div style={{ background: '#fafaf8', border: '1px solid #dddbd6', borderRadius: 6, padding: '12px 16px' }}>
                      <Text style={{ fontSize: 11, color: '#6b6b66', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 4 }}>Pagos registrados</Text>
                      <Text style={{ fontSize: 22, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: '#2c3e7a' }}>{pagos.length}</Text>
                    </div>
                  </Col>
                  <Col xs={12} sm={8}>
                    <div style={{ background: '#fafaf8', border: '1px solid #dddbd6', borderRadius: 6, padding: '12px 16px' }}>
                      <Text style={{ fontSize: 11, color: '#6b6b66', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 4 }}>Total pagado</Text>
                      <Text style={{ fontSize: 18, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: '#1a5c2a' }}>{fmt(totalPagado)}</Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={10}>
                    <div style={{ background: '#fafaf8', border: '1px solid #dddbd6', borderRadius: 6, padding: '12px 16px' }}>
                      <Text style={{ fontSize: 11, color: '#6b6b66', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 4 }}>Último pago registrado</Text>
                      <Text style={{ fontSize: 14, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>
                        {ultimoPago ? fmtFecha(ultimoPago) : '—'}
                      </Text>
                    </div>
                  </Col>
                </Row>

                {/* ESTADO DE MORA */}
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#6b6b66', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'IBM Plex Mono, monospace', display: 'block', marginBottom: 8 }}>Estado de cuenta</Text>
                  <BadgeMora mora={mora} />
                </div>
              </div>
            )
          }
        </Card>

        {/* TABLA */}
        <Card size="small" styles={{ body: { padding: 0 } }}>
          <div style={{ background: '#1a1a18', padding: '10px 18px' }}>
            <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Historial de pagos
            </Text>
          </div>
          {loading
            ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
            : <Table dataSource={pagos} columns={columns} rowKey="id" size="small" scroll={{ x: 700 }}
                pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `${t} registros` }}
                locale={{ emptyText: 'No se encontraron pagos registrados para este interior.' }} />
          }
        </Card>

      </div>
    </div>
  )
}
