import { useState, useRef } from 'react'
import { Card, Button, InputNumber, Radio, Table, Tag, Space, Typography, message, Row, Col } from 'antd'
import { SearchOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons'
import InformesNav from '../components/InformesNav'
import { api } from '../services/api'

const { Text } = Typography

const MESES_NOMBRES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const CONC_CASA  = ['11','19','20']
const CONC_VEH   = ['12','14','15','16','17','18']
const CONC_AMBOS = ['13']

function mesStrADate(mesStr) {
  if (!mesStr) return null
  const s = String(mesStr).toLowerCase().trim()
  if (/^\d{4}-\d{2}/.test(s)) {
    const [y, m] = s.split('-').map(Number)
    if (!isNaN(y) && !isNaN(m)) return new Date(y, m - 1, 1)
  }
  const parts = s.split('-')
  if (parts.length >= 2) {
    const mi = MESES_NOMBRES.indexOf(parts[0])
    const y = parseInt(parts[parts.length - 1])
    if (mi >= 0 && !isNaN(y)) return new Date(y, mi, 1)
  }
  return null
}

// ─── Referencia: último mes completamente cerrado ────────────────────────────
// Regla: comparar contra el último día del mes INMEDIATAMENTE ANTERIOR a hoy.
// Ejemplo:
//   Hoy = cualquier día de junio 2026  →  referencia = mayo 2026
//   Hoy = cualquier día de enero 2027  →  referencia = diciembre 2026
//
// Un residente está AL DÍA si su último mes cubierto >= mes de referencia.
// Meses de mora = (mes_referencia) - (último_mes_cubierto)  [en meses absolutos]
// ─────────────────────────────────────────────────────────────────────────────
function mesRefAbsoluto() {
  const hoy = new Date()
  // getMonth() es 0-based: enero=0 … diciembre=11
  // "Mes anterior" en términos absolutos:
  const totalMeses = hoy.getFullYear() * 12 + hoy.getMonth() // mes actual absoluto
  return totalMeses - 1                                        // mes anterior absoluto
}

function diffMeses(fecha) {
  if (!fecha) return 9999
  const ref  = mesRefAbsoluto()
  const pago = fecha.getFullYear() * 12 + fecha.getMonth()    // último mes cubierto
  return ref - pago  // positivo = meses en mora, 0 = al día, negativo = pagó adelantado
}

function fmtFecha(d) {
  if (!d) return null
  return MESES_NOMBRES[d.getMonth()] + '-' + d.getFullYear()
}

function badgeEstado(m, tieneVeh) {
  if (!tieneVeh && m === -1) return <Tag color="default">No aplica</Tag>
  if (m === 9999) return <Tag color="error">Sin pago</Tag>
  if (m <= 0) return <Tag color="success">Al día</Tag>
  if (m <= 2) return <Tag color="warning">Mora leve</Tag>
  return <Tag color="error">En mora</Tag>
}

function numMeses(m, tieneVeh) {
  if (!tieneVeh && m === -1) return <Text type="secondary" style={{ fontSize: 12 }}>No aplica</Text>
  if (m === 9999) return <Text type="danger" style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>Sin pago</Text>
  if (m <= 0) return <Text style={{ color: '#1a5c2a', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>0</Text>
  const color = m <= 2 ? '#854f0b' : '#c0392b'
  return <Text style={{ color, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>{m}</Text>
}

export default function Morosos() {
  const [minMeses, setMinMeses] = useState(1)
  const [tipo, setTipo] = useState('ambos')
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState(null)
  const [filtroLabel, setFiltroLabel] = useState('')
  const cacheIng = useRef(null)
  const cacheHab = useRef(null)

  async function buscar() {
    if (!minMeses || minMeses < 1) { message.warning('Ingresa el número mínimo de meses sin pagar.'); return }
    setLoading(true)
    try {
      if (!cacheIng.current || !cacheHab.current) {
        const [ing, hab] = await Promise.all([api.getIngresos(), api.getHabitantes()])
        cacheIng.current = ing || []
        cacheHab.current = hab || []
      }

      const dict = {}
      cacheHab.current.forEach(h => {
        dict[String(h.interior)] = { nombre: h.nombre, ultAdmon: null, ultVeh: null, tieneVeh: false }
      })

      cacheIng.current.forEach(r => {
        const inter = String(r.interior).trim()
        const cod = String(r.cod_concepto).trim()
        const cantidad = parseInt(r.cantidad) || 1
        if (!dict[inter]) return
        const fechaBase = mesStrADate(String(r.mes_pago).trim())
        if (!fechaBase) return
        const fechaFin = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + cantidad - 1, 1)
        const esAdmon = CONC_CASA.includes(cod) || CONC_AMBOS.includes(cod)
        const esVeh   = CONC_VEH.includes(cod) || CONC_AMBOS.includes(cod)
        if (esAdmon && (!dict[inter].ultAdmon || fechaFin > dict[inter].ultAdmon)) dict[inter].ultAdmon = fechaFin
        if (esVeh) {
          dict[inter].tieneVeh = true
          if (!dict[inter].ultVeh || fechaFin > dict[inter].ultVeh) dict[inter].ultVeh = fechaFin
        }
      })

      const rows = []
      Object.entries(dict).forEach(([inter, d]) => {
        const mAdmon = diffMeses(d.ultAdmon)
        const mVeh   = d.tieneVeh ? diffMeses(d.ultVeh) : -1
        let incluir = false
        if (tipo === 'admon')    incluir = mAdmon >= minMeses
        else if (tipo === 'vehiculo') incluir = d.tieneVeh && mVeh >= minMeses
        else incluir = (mAdmon >= minMeses) || (d.tieneVeh && mVeh >= minMeses)
        if (incluir) rows.push({ key: inter, inter, nombre: d.nombre, ultAdmon: d.ultAdmon, mAdmon, ultVeh: d.ultVeh, mVeh, tieneVeh: d.tieneVeh })
      })

      setResultados(rows)
      const tipoLbl = tipo === 'admon' ? 'Solo Admón' : tipo === 'vehiculo' ? 'Solo Vehículo' : 'Admón + Vehículo'
      setFiltroLabel(`Mínimo ${minMeses} mes(es) · ${tipoLbl} — ${rows.length} registro(s)`)
    } catch { message.error('Error al cargar datos.') }
    setLoading(false)
  }

  function exportarCSV() {
    if (!resultados?.length) { message.warning('Primero realiza una búsqueda.'); return }
    const headers = ['Interior','Nombre','Últ. Pago Admón','Meses sin Admón','Últ. Pago Vehículo','Meses sin Vehículo']
    const rows = resultados.map(r => [
      `"${r.inter}"`,
      `"${r.nombre}"`,
      `"${r.ultAdmon ? fmtFecha(r.ultAdmon) : 'Sin registro'}"`,
      r.mAdmon === 9999 ? '"Sin pago"' : r.mAdmon,
      `"${!r.tieneVeh ? 'No aplica' : r.ultVeh ? fmtFecha(r.ultVeh) : 'Sin registro'}"`,
      !r.tieneVeh ? '"No aplica"' : r.mVeh === 9999 ? '"Sin pago"' : r.mVeh,
    ].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `NK2_Morosos_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const columns = [
    { title: 'Interior', dataIndex: 'inter', width: 90, sorter: (a, b) => a.inter.localeCompare(b.inter), render: v => <Text strong>{v}</Text> },
    { title: 'Nombre', dataIndex: 'nombre', sorter: (a, b) => a.nombre.localeCompare(b.nombre) },
    {
      title: 'Últ. pago Admón', dataIndex: 'ultAdmon', width: 150,
      sorter: (a, b) => (a.ultAdmon?.getTime() || 0) - (b.ultAdmon?.getTime() || 0),
      render: v => v
        ? <Text style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: '#6b6b66' }}>{fmtFecha(v)}</Text>
        : <Text type="danger" style={{ fontSize: 12, fontStyle: 'italic' }}>Sin registro</Text>
    },
    {
      title: 'Meses sin Admón', dataIndex: 'mAdmon', width: 150, defaultSortOrder: 'descend',
      sorter: (a, b) => a.mAdmon - b.mAdmon,
      render: (m) => <Space size={6}>{badgeEstado(m, true)}{numMeses(m, true)}</Space>
    },
    {
      title: 'Últ. pago Vehículo', dataIndex: 'ultVeh', width: 160,
      sorter: (a, b) => (a.ultVeh?.getTime() || 0) - (b.ultVeh?.getTime() || 0),
      render: (v, r) => !r.tieneVeh
        ? <Tag color="default">No aplica</Tag>
        : v
          ? <Text style={{ fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: '#6b6b66' }}>{fmtFecha(v)}</Text>
          : <Text type="danger" style={{ fontSize: 12, fontStyle: 'italic' }}>Sin registro</Text>
    },
    {
      title: 'Meses sin Vehículo', dataIndex: 'mVeh', width: 160,
      sorter: (a, b) => a.mVeh - b.mVeh,
      render: (m, r) => <Space size={6}>{badgeEstado(m, r.tieneVeh)}{numMeses(m, r.tieneVeh)}</Space>
    },
  ]

  return (
    <div>
      <InformesNav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        <Card size="small" style={{ marginBottom: 16 }} className="no-print"
          title={<Text style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6b6b66' }}>Parámetros de búsqueda</Text>}>
          <Row gutter={[24, 16]} align="bottom">
            <Col>
              <div style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: '#6b6b66', fontFamily: 'IBM Plex Mono, monospace' }}>Meses mínimos sin pagar</Text>
              </div>
              <Space>
                <InputNumber min={1} max={24} value={minMeses} onChange={setMinMeses}
                  style={{ width: 80, fontSize: 18, fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', textAlign: 'center' }} />
                <Text type="secondary">mes(es) o más</Text>
              </Space>
            </Col>
            <Col>
              <div style={{ marginBottom: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase', color: '#6b6b66', fontFamily: 'IBM Plex Mono, monospace' }}>Filtrar por tipo de pago</Text>
              </div>
              <Radio.Group value={tipo} onChange={e => setTipo(e.target.value)}>
                <Space direction="vertical" size={4}>
                  <Radio value="admon">Solo Administración (casa)</Radio>
                  <Radio value="vehiculo">Solo Vehículo</Radio>
                  <Radio value="ambos">Admón o Vehículo (ambos)</Radio>
                </Space>
              </Radio.Group>
            </Col>
          </Row>
          <Row gutter={8} style={{ marginTop: 18 }}>
            <Col><Button type="primary" icon={<SearchOutlined />} onClick={buscar} loading={loading} style={{ background: '#1a1a18', borderColor: '#1a1a18' }}>Buscar</Button></Col>
            <Col><Button icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: '#2980b9', borderColor: '#2980b9', color: '#fff' }}>Imprimir</Button></Col>
            <Col><Button icon={<DownloadOutlined />} onClick={exportarCSV} style={{ background: '#1d6f42', borderColor: '#1d6f42', color: '#fff' }}>Excel</Button></Col>
          </Row>
        </Card>

        {resultados !== null && (
          <Card size="small"
            title={
              <Row justify="space-between" align="middle">
                <Text style={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: '#6b6b66' }}>Resultados</Text>
                <Text style={{ fontSize: 12, color: '#6b6b66', fontStyle: 'italic' }}>{filtroLabel}</Text>
              </Row>
            }>
            {resultados.length === 0
              ? <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '32px 0' }}>
                  ✓ No se encontraron morosos con {minMeses} o más meses sin pagar.
                </Text>
              : <Table
                  size="small"
                  dataSource={resultados}
                  columns={columns}
                  pagination={{ pageSize: 50, showSizeChanger: true }}
                  scroll={{ x: 'max-content' }}
                />
            }
          </Card>
        )}
      </div>
    </div>
  )
}
