import { useState, useEffect } from 'react'
import {
  Card, Input, Button, Form, Select, DatePicker, InputNumber,
  Table, Typography, Progress, Row, Col, Descriptions, Tag,
  message, Spin
} from 'antd'
import { SearchOutlined, SaveOutlined, ClearOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '../services/api'

const { Text } = Typography

const fmt = n => '$ ' + Math.round(parseFloat(n) || 0).toLocaleString('es-CO')
const fmtFecha = f => {
  if (!f) return ''
  return new Date(f + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}
const hoyISO = dayjs()

export default function Abonos() {
  const [personal,   setPersonal]   = useState([])
  const [buscarCod,  setBuscarCod]  = useState('')
  const [buscando,   setBuscando]   = useState(false)
  const [registro,   setRegistro]   = useState(null)   // { cod, concepto, vlrTotal, abonado, saldo }
  const [historial,  setHistorial]  = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    api.getPersonal()
      .then(p => setPersonal(p || []))
      .catch(() => message.error('Error al cargar personal.'))
  }, [])

  async function buscarRegistro() {
    const cod = buscarCod.trim()
    if (!cod) { message.warning('Escribe el N° de registro a buscar.'); return }
    setBuscando(true)
    try {
      const salidas = await api.getSalidas()
      const reg = (salidas || []).find(r => String(r.cod_registro).trim().toLowerCase() === cod.toLowerCase())
      if (!reg) {
        message.error(`No se encontró el registro "${cod}" en BD_SALIDAS.`)
        setRegistro(null)
        setHistorial([])
        setBuscando(false)
        return
      }
      const vlrTotal = parseFloat(reg.vlr_total) || 0
      const abonado  = parseFloat(reg.abono)     || 0
      const saldo    = parseFloat(reg.saldo)      || 0
      setRegistro({ cod: reg.cod_registro, concepto: `${reg.cod_concepto} — ${reg.concepto}`, vlrTotal, abonado, saldo })

      // Cargar historial de abonos
      try {
        const abonos = await api.getAbonos(reg.cod_registro)
        setHistorial(abonos || [])
      } catch {
        setHistorial([])
      }

      if (saldo <= 0) {
        message.info('Este registro ya está completamente pagado.')
      } else {
        form.setFieldsValue({ fecha: hoyISO, vlr_abono: 0, observacion: '' })
      }
    } catch {
      message.error('Error de conexión.')
    }
    setBuscando(false)
  }

  async function onFinish(values) {
    if (!registro) return
    const abono = values.vlr_abono || 0
    if (abono > registro.saldo) {
      message.error('El abono supera el saldo pendiente.')
      return
    }
    const selAdmin = personal.find(p => String(p.id) === String(values.administrador))
    const datos = {
      cod_registro:   registro.cod,
      fecha:          values.fecha.format('YYYY-MM-DD'),
      administrador:  selAdmin?.nombre || '',
      concepto:       registro.concepto,
      vlr_total_obra: registro.vlrTotal,
      vlr_abono:      abono,
      observacion:    values.observacion.trim(),
    }
    try {
      const res = await api.saveAbono(datos)
      message.success(res.mensaje)
      await buscarRegistro()
      form.resetFields()
      form.setFieldValue('fecha', hoyISO)
    } catch {
      message.error('Error de conexión.')
    }
  }

  function limpiar() {
    form.setFieldsValue({ fecha: hoyISO, administrador: undefined, vlr_abono: 0, observacion: '' })
  }

  const abono      = Form.useWatch('vlr_abono', form) || 0
  const saldoNuevo = registro ? Math.max(0, registro.saldo - abono) : 0
  const pct        = registro?.vlrTotal > 0
    ? Math.min(100, Math.round((registro.abonado / registro.vlrTotal) * 100))
    : 0

  const colsHistorial = [
    { title: '#', key: 'n', render: (_, __, i) => <Tag color={parseFloat(_.saldo) <= 0 ? 'green' : 'red'}>{i + 1}</Tag>, width: 50 },
    { title: 'Fecha',         dataIndex: 'fecha',          key: 'fecha',    render: v => fmtFecha(v) },
    { title: 'Administrador', dataIndex: 'administrador',   key: 'admin' },
    { title: 'Concepto',      dataIndex: 'concepto',        key: 'concepto', ellipsis: true },
    { title: 'Vlr Obra',      dataIndex: 'vlr_total_obra',  key: 'obra',     render: v => fmt(v), align: 'right' },
    { title: 'Abono',         dataIndex: 'vlr_abono',       key: 'abono',    render: v => <Text strong style={{ color: '#7a1a1a' }}>{fmt(v)}</Text>, align: 'right' },
    { title: 'Saldo',         dataIndex: 'saldo',           key: 'saldo',    render: v => <Text style={{ color: parseFloat(v) <= 0 ? '#1a5c2a' : '#854f0b' }}>{fmt(v)}</Text>, align: 'right' },
    { title: 'Observación',   dataIndex: 'observacion',     key: 'obs',      ellipsis: true },
  ]

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>

      {/* BUSCAR */}
      <Card style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
        <div style={{ background: '#1a1a18', padding: '10px 18px', borderRadius: '6px 6px 0 0' }}>
          <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Buscar registro de gasto
          </Text>
        </div>
        <div style={{ padding: 18 }}>
          <Text style={{ fontSize: 11, color: '#6b6b66', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.8px' }}>
            N° Registro en BD_SALIDAS
          </Text>
          <Row gutter={8} style={{ marginTop: 6 }}>
            <Col flex="1">
              <Input
                placeholder="Ej: NK-21"
                value={buscarCod}
                onChange={e => setBuscarCod(e.target.value)}
                onPressEnter={buscarRegistro}
              />
            </Col>
            <Col>
              <Button
                type="primary"
                icon={buscando ? <Spin size="small" /> : <SearchOutlined />}
                onClick={buscarRegistro}
                loading={buscando}
                style={{ background: '#1a1a18', borderColor: '#1a1a18' }}
              >
                Buscar
              </Button>
            </Col>
          </Row>
          <Text type="secondary" style={{ fontSize: 11 }}>Escribe el código del gasto y presiona Buscar o Enter</Text>

          {/* INFO REGISTRO */}
          {registro && (
            <div style={{ background: '#fafaf8', border: '1px solid #dddbd6', borderRadius: 6, padding: '14px 16px', marginTop: 16 }}>
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col xs={12} sm={6}>
                  <Text style={{ fontSize: 11, color: '#6b6b66', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'IBM Plex Mono, monospace' }}>N° Registro</Text>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: 14, marginTop: 3 }}>{registro.cod}</div>
                </Col>
                <Col xs={12} sm={6}>
                  <Text style={{ fontSize: 11, color: '#6b6b66', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'IBM Plex Mono, monospace' }}>Valor total obra</Text>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: 14, color: '#7a1a1a', marginTop: 3 }}>{fmt(registro.vlrTotal)}</div>
                </Col>
                <Col xs={12} sm={6}>
                  <Text style={{ fontSize: 11, color: '#6b6b66', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'IBM Plex Mono, monospace' }}>Abonado</Text>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: 14, color: '#854f0b', marginTop: 3 }}>{fmt(registro.abonado)}</div>
                </Col>
                <Col xs={12} sm={6}>
                  <Text style={{ fontSize: 11, color: '#6b6b66', textTransform: 'uppercase', letterSpacing: '.8px', fontFamily: 'IBM Plex Mono, monospace' }}>Saldo pendiente</Text>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, fontSize: 14, color: registro.saldo <= 0 ? '#1a5c2a' : '#854f0b', marginTop: 3 }}>{fmt(registro.saldo)}</div>
                </Col>
              </Row>
              <div>
                <Row justify="space-between" style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: '#6b6b66' }}>Progreso de pago</Text>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>{pct}%</Text>
                </Row>
                <Progress percent={pct} showInfo={false} strokeColor="#1a5c2a" trailColor="#f0ede8" size={['100%', 10]} />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* FORMULARIO ABONO */}
      {registro && registro.saldo > 0 && (
        <Card style={{ marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
          <div style={{ background: '#7a1a1a', padding: '10px 18px', borderRadius: '6px 6px 0 0' }}>
            <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Registrar nuevo abono — {registro.cod}
            </Text>
          </div>
          <div style={{ padding: 18 }}>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ fecha: hoyISO, vlr_abono: 0 }}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Fecha" name="fecha" rules={[{ required: true, message: 'Requerido' }]}>
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Administrador" name="administrador" rules={[{ required: true, message: 'Requerido' }]}>
                    <Select
                      placeholder="-- seleccionar --"
                      options={personal.map(p => ({ value: String(p.id), label: `${p.nombre} — ${p.cargo}` }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item label="Valor total obra">
                    <InputNumber value={registro.vlrTotal} disabled style={{ width: '100%' }}
                      formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Ya abonado">
                    <InputNumber value={registro.abonado} disabled style={{ width: '100%' }}
                      formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item label="Saldo actual">
                    <InputNumber value={registro.saldo} disabled style={{ width: '100%' }}
                      formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Valor abono actual ($)" name="vlr_abono"
                    rules={[
                      { required: true, message: 'Requerido' },
                      { type: 'number', min: 1, message: 'Debe ser mayor a cero' },
                    ]}>
                    <InputNumber style={{ width: '100%' }} min={0} step={1000}
                      formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={v => v.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Saldo después del abono">
                    <InputNumber value={saldoNuevo} disabled style={{ width: '100%' }}
                      formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Observación" name="observacion" rules={[{ required: true, message: 'Requerido' }]}>
                <Input.TextArea rows={2} placeholder="Ej: 2do abono obra mantenimiento fachada..." />
              </Form.Item>

              {/* RESUMEN */}
              <div style={{ background: '#fafaf8', border: '1px solid #dddbd6', borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
                <Row justify="space-between" align="middle" style={{ borderBottom: '1px solid #dddbd6', paddingBottom: 10, marginBottom: 10 }}>
                  <Text style={{ fontSize: 14 }}>Abono a registrar</Text>
                  <Text strong style={{ color: '#7a1a1a', fontSize: 16, fontFamily: 'IBM Plex Mono, monospace' }}>{fmt(abono)}</Text>
                </Row>
                <Row justify="space-between">
                  <Text type="secondary" style={{ fontSize: 12 }}>Saldo anterior</Text>
                  <Text style={{ color: '#854f0b', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{fmt(registro.saldo)}</Text>
                </Row>
                <Row justify="space-between" style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Saldo después del abono</Text>
                  <Text style={{ color: saldoNuevo <= 0 ? '#1a5c2a' : '#854f0b', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, fontWeight: 600 }}>{fmt(saldoNuevo)}</Text>
                </Row>
                <Row justify="space-between" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #dddbd6' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Valor total obra</Text>
                  <Text style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>{fmt(registro.vlrTotal)}</Text>
                </Row>
              </div>

              <Row gutter={10}>
                <Col span={8}>
                  <Button block type="primary" htmlType="submit" icon={<SaveOutlined />}
                    style={{ background: '#7a1a1a', borderColor: '#7a1a1a' }}>
                    Guardar abono
                  </Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<ClearOutlined />} onClick={limpiar}>Limpiar</Button>
                </Col>
                <Col span={8}>
                  <Button block icon={<CloseOutlined />}
                    onClick={() => { setRegistro(null); setHistorial([]); setBuscarCod('') }}
                    style={{ background: '#4a4a4a', borderColor: '#4a4a4a', color: '#fff' }}>
                    Cancelar
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
        </Card>
      )}

      {/* HISTORIAL */}
      {registro && (
        <Card styles={{ body: { padding: 0 } }}>
          <div style={{ background: '#1a1a18', padding: '10px 18px', borderRadius: '6px 6px 0 0' }}>
            <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Historial de abonos — {registro.cod}
            </Text>
          </div>
          <Table
            dataSource={historial}
            columns={colsHistorial}
            rowKey={(_, i) => i}
            size="small"
            scroll={{ x: 700 }}
            pagination={false}
            locale={{ emptyText: 'Sin abonos registrados aún para este código' }}
            summary={data => data.length > 0 && (
              <Table.Summary.Row style={{ background: '#fafaf8', fontWeight: 600 }}>
                <Table.Summary.Cell index={0} colSpan={5}>Total abonado</Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <Text strong style={{ color: '#7a1a1a', fontFamily: 'IBM Plex Mono, monospace' }}>
                    {fmt(data.reduce((s, r) => s + (parseFloat(r.vlr_abono) || 0), 0))}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} colSpan={2} />
              </Table.Summary.Row>
            )}
          />
        </Card>
      )}
    </div>
  )
}
