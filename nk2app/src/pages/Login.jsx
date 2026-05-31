import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Space } from 'antd'
import { login, getRole, isLoggedIn } from '../services/auth'

const { Text } = Typography

export default function Login() {
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()
  const next      = location.state?.next || '/'

  const role = getRole()
  if (isLoggedIn()) {
    if (role === 'visor') { navigate('/informe', { replace: true }); return null }
    navigate(next, { replace: true }); return null
  }

  async function handleSubmit({ username, password }) {
    setLoading(true)
    setError('')
    try {
      const rol = await login(username, password)
      navigate(rol === 'visor' ? '/informe' : next, { replace: true })
    } catch (e) {
      setError(e.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f4f3f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <Card
        style={{ width: '100%', maxWidth: 380, padding: 0 }}
        styles={{ body: { padding: 0 } }}
        bordered
      >
        <div style={{
          background: '#1a1a18',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '6px 6px 0 0',
        }}>
          <Text style={{ color: '#fff', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 500 }}>
            Comité Ornato y Seguridad · NK2
          </Text>
          <br />
          <Text style={{ color: '#888', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: 1 }}>
            Ingresa tus credenciales para continuar
          </Text>
        </div>

        <div style={{ padding: '24px 20px' }}>
          <Form onFinish={handleSubmit} layout="vertical" onChange={() => setError('')}>
            <Form.Item
              label="Usuario"
              name="username"
              rules={[{ required: true, message: 'Ingresa tu usuario' }]}
            >
              <Input placeholder="usuario" autoFocus size="large" autoComplete="username" />
            </Form.Item>

            <Form.Item
              label="Contraseña"
              name="password"
              rules={[{ required: true, message: 'Ingresa tu contraseña' }]}
              validateStatus={error ? 'error' : ''}
              help={error || ''}
            >
              <Input.Password placeholder="••••••••" size="large" autoComplete="current-password" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                style={{ background: '#1a5c2a', borderColor: '#1a5c2a' }}
              >
                Ingresar
              </Button>
            </Form.Item>
          </Form>

          <div style={{ marginTop: 18, borderTop: '1px solid #f0ede8', paddingTop: 14 }}>
            <Space direction="vertical" size={6}>
              <Space size={8}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a5c2a', display: 'inline-block' }} />
                <Text style={{ fontSize: 11, color: '#6b6b66', fontFamily: 'IBM Plex Mono, monospace' }}>
                  Admin — acceso completo (formularios + informes)
                </Text>
              </Space>
              <Space size={8}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2c3e7a', display: 'inline-block' }} />
                <Text style={{ fontSize: 11, color: '#6b6b66', fontFamily: 'IBM Plex Mono, monospace' }}>
                  Visor — solo informes y consultas
                </Text>
              </Space>
            </Space>
          </div>
        </div>
      </Card>

      <Text style={{ marginTop: 20, fontSize: 11, color: '#aaa', fontFamily: 'IBM Plex Mono, monospace' }}>
        Contacta al administrador si olvidaste tus credenciales.
      </Text>
    </div>
  )
}
