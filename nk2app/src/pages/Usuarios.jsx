import { useState, useEffect } from 'react'
import {
  Card, Table, Button, Tag, Modal, Form, Input, Select, Space,
  Typography, Popconfirm, message, Alert, Divider
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons'
import { api } from '../services/api'
import { getUsername } from '../services/auth'

const { Text } = Typography

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading,  setLoading]  = useState(true)

  // Modal crear
  const [modalCrear, setModalCrear] = useState(false)
  const [formCrear]  = Form.useForm()
  const [savingCrear, setSavingCrear] = useState(false)

  // Modal editar
  const [modalEditar, setModalEditar] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [formEditar]  = Form.useForm()
  const [savingEditar, setSavingEditar] = useState(false)

  // Modal cambiar clave de otro usuario
  const [modalClave,  setModalClave]  = useState(false)
  const [clavePara,   setClavePara]   = useState(null)
  const [formClave]   = Form.useForm()
  const [savingClave, setSavingClave] = useState(false)

  const mio = getUsername()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      setUsuarios(await api.getUsuarios())
    } catch (e) {
      message.error(e.message)
    }
    setLoading(false)
  }

  // ── Crear ──────────────────────────────────────────────────────────────────
  async function handleCrear(values) {
    setSavingCrear(true)
    try {
      const res = await api.createUsuario(values)
      message.success(res.mensaje)
      setModalCrear(false)
      formCrear.resetFields()
      cargar()
    } catch (e) {
      message.error(e.message)
    }
    setSavingCrear(false)
  }

  // ── Editar (rol / activo) ──────────────────────────────────────────────────
  function abrirEditar(u) {
    setEditando(u)
    formEditar.setFieldsValue({ rol: u.rol, activo: Number(u.activo) })
    setModalEditar(true)
  }

  async function handleEditar(values) {
    setSavingEditar(true)
    try {
      const res = await api.updateUsuario({ id: editando.id, rol: values.rol, activo: values.activo === 1 ? true : false })
      message.success(res.mensaje)
      setModalEditar(false)
      cargar()
    } catch (e) {
      message.error(e.message)
    }
    setSavingEditar(false)
  }

  // ── Resetear clave ─────────────────────────────────────────────────────────
  function abrirClave(u) {
    setClavePara(u)
    formClave.resetFields()
    setModalClave(true)
  }

  async function handleClave(values) {
    setSavingClave(true)
    try {
      const res = await api.updateUsuario({ id: clavePara.id, nueva_password: values.nueva_password })
      message.success(res.mensaje + ' El usuario deberá cambiarla al iniciar sesión.')
      setModalClave(false)
      cargar()
    } catch (e) {
      message.error(e.message)
    }
    setSavingClave(false)
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  async function handleEliminar(u) {
    try {
      const res = await api.deleteUsuario({ id: u.id })
      message.success(res.mensaje)
      cargar()
    } catch (e) {
      message.error(e.message)
    }
  }

  const columns = [
    {
      title: 'Usuario', dataIndex: 'username', key: 'username',
      render: (v, r) => (
        <Space>
          <Text strong>{v}</Text>
          {v === mio && <Tag color="blue">yo</Tag>}
          {r.must_change_password == 1 && <Tag color="orange">debe cambiar clave</Tag>}
        </Space>
      ),
    },
    {
      title: 'Rol', dataIndex: 'rol', key: 'rol',
      render: v => <Tag color={v === 'admin' ? 'purple' : 'cyan'}>{v}</Tag>,
    },
    {
      title: 'Estado', dataIndex: 'activo', key: 'activo',
      render: v => v == 1
        ? <Tag color="green">Activo</Tag>
        : <Tag color="red">Inactivo</Tag>,
    },
    {
      title: 'Acciones', key: 'acc', width: 220,
      render: (_, u) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(u)}>
            Editar
          </Button>
          <Button size="small" icon={<KeyOutlined />} onClick={() => abrirClave(u)}>
            Clave
          </Button>
          {u.username !== mio && (
            <Popconfirm
              title={`¿Eliminar usuario "${u.username}"?`}
              okText="Sí, eliminar" cancelText="Cancelar"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleEliminar(u)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>
      <Card styles={{ body: { padding: 0 } }} bordered style={{ overflow: 'hidden' }}>
        <div style={{ background: '#4a1a6a', padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            👥 Gestión de usuarios
          </Text>
          <Button
            type="primary" icon={<PlusOutlined />} size="small"
            style={{ background: '#fff', color: '#4a1a6a', borderColor: '#fff', fontWeight: 600 }}
            onClick={() => { formCrear.resetFields(); setModalCrear(true) }}
          >
            Nuevo usuario
          </Button>
        </div>

        <div style={{ padding: 16 }}>
          <Alert
            type="info" showIcon style={{ marginBottom: 16 }}
            message="El administrador crea el usuario y define una contraseña temporal. El nuevo usuario debe cambiarla al primer inicio de sesión."
          />
          <Table
            dataSource={usuarios} columns={columns} rowKey="id"
            loading={loading} size="small" pagination={false}
          />
        </div>
      </Card>

      {/* Modal crear */}
      <Modal
        title="Crear nuevo usuario" open={modalCrear}
        onCancel={() => setModalCrear(false)} footer={null}
      >
        <Form form={formCrear} layout="vertical" onFinish={handleCrear}
          initialValues={{ rol: 'admin' }}>
          <Form.Item label="Nombre de usuario" name="username"
            rules={[{ required: true, message: 'Requerido' }, { pattern: /^\S+$/, message: 'Sin espacios' }]}>
            <Input placeholder="Ej: MariaG" autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} />
          </Form.Item>
          <Form.Item label="Rol" name="rol" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="admin">Administrador — acceso completo</Select.Option>
              <Select.Option value="visor">Visor — solo consulta e informes</Select.Option>
            </Select>
          </Form.Item>
          <Divider style={{ margin: '12px 0' }} />
          <Alert
            type="warning" showIcon style={{ marginBottom: 14 }}
            message="Define una contraseña temporal y compártela con el usuario de forma privada. Al iniciar sesión, el sistema le pedirá que la cambie."
          />
          <Form.Item label="Contraseña temporal" name="password"
            rules={[{ required: true, message: 'Requerida' }, { min: 6, message: 'Mínimo 6 caracteres' }]}>
            <Input.Password placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalCrear(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={savingCrear}
                style={{ background: '#4a1a6a', borderColor: '#4a1a6a' }}>
                Crear usuario
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal editar */}
      <Modal
        title={`Editar — ${editando?.username}`} open={modalEditar}
        onCancel={() => setModalEditar(false)} footer={null}
      >
        <Form form={formEditar} layout="vertical" onFinish={handleEditar}>
          <Form.Item label="Rol" name="rol" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="admin">Administrador — acceso completo</Select.Option>
              <Select.Option value="visor">Visor — solo consulta e informes</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Estado" name="activo" rules={[{ required: true }]}>
            <Select>
              <Select.Option value={1}>Activo</Select.Option>
              <Select.Option value={0}>Inactivo (no puede iniciar sesión)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalEditar(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={savingEditar}
                style={{ background: '#4a1a6a', borderColor: '#4a1a6a' }}>
                Guardar cambios
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal cambiar clave de otro usuario */}
      <Modal
        title={`Restablecer contraseña — ${clavePara?.username}`}
        open={modalClave} onCancel={() => setModalClave(false)} footer={null}
        destroyOnClose
      >
        <Alert
          type="warning" showIcon style={{ marginBottom: 16 }}
          message="Define una nueva contraseña temporal. El usuario deberá cambiarla al iniciar sesión."
        />
        <Form form={formClave} layout="vertical" onFinish={handleClave}>
          <Form.Item label="Nueva contraseña temporal" name="nueva_password"
            rules={[{ required: true, message: 'Requerida' }, { min: 6, message: 'Mínimo 6 caracteres' }]}>
            <Input.Password placeholder="Mínimo 6 caracteres" autoFocus autoComplete="new-password" />
          </Form.Item>
          <Form.Item label="Confirmar" name="confirm"
            dependencies={['nueva_password']}
            rules={[
              { required: true, message: 'Requerida' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('nueva_password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Las contraseñas no coinciden'))
                },
              }),
            ]}>
            <Input.Password placeholder="Repite la contraseña" autoComplete="new-password" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalClave(false)}>Cancelar</Button>
              <Button type="primary" htmlType="submit" loading={savingClave}
                style={{ background: '#854f0b', borderColor: '#854f0b' }}>
                Restablecer contraseña
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
