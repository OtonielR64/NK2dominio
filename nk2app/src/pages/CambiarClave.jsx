import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Alert, message } from 'antd'
import { KeyOutlined } from '@ant-design/icons'
import { api } from '../services/api'
import { getUsername, getRole, mustChangePassword, clearMustChange } from '../services/auth'

const { Text } = Typography

export default function CambiarClave() {
  const [loading, setLoading] = useState(false)
  const navigate  = useNavigate()
  const forzado   = mustChangePassword()
  const username  = getUsername()
  const rol       = getRole()

  async function onFinish({ password }) {
    setLoading(true)
    try {
      await api.changePassword({ password })
      clearMustChange()
      message.success('Contraseña actualizada correctamente')
      navigate(rol === 'visor' ? '/informe' : '/', { replace: true })
    } catch (e) {
      message.error(e.message || 'Error al cambiar la contraseña')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 440, margin: '40px auto', padding: '0 16px' }}>
      <Card styles={{ body: { padding: 0 } }} bordered style={{ overflow: 'hidden' }}>
        <div style={{ background: '#4a1a6a', padding: '12px 20px' }}>
          <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            🔑 Cambiar contraseña
          </Text>
          {username && (
            <Text style={{ display: 'block', color: '#c9b4e0', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, marginTop: 2 }}>
              Usuario: {username}
            </Text>
          )}
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {forzado && (
            <Alert
              type="warning"
              showIcon
              message="Debes definir tu contraseña personal antes de continuar."
              description="El administrador te asignó una contraseña temporal. Elige una nueva contraseña que solo tú conozcas."
              style={{ marginBottom: 20 }}
            />
          )}

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Nueva contraseña"
              name="password"
              rules={[
                { required: true, message: 'Requerida' },
                { min: 6, message: 'Mínimo 6 caracteres' },
              ]}
            >
              <Input.Password placeholder="Mínimo 6 caracteres" size="large" autoFocus autoComplete="new-password" />
            </Form.Item>

            <Form.Item
              label="Confirmar contraseña"
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Requerida' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve()
                    return Promise.reject(new Error('Las contraseñas no coinciden'))
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Repite la contraseña" size="large" autoComplete="new-password" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary" htmlType="submit" block size="large"
                loading={loading} icon={<KeyOutlined />}
                style={{ background: '#4a1a6a', borderColor: '#4a1a6a' }}
              >
                Guardar contraseña
              </Button>
            </Form.Item>

            {!forzado && (
              <Button block style={{ marginTop: 10 }} onClick={() => navigate(-1)}>
                Cancelar
              </Button>
            )}
          </Form>
        </div>
      </Card>
    </div>
  )
}
