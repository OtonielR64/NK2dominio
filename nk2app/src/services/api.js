const BASE = import.meta.env.VITE_API_URL

function getToken() {
  return localStorage.getItem('nk2_token')
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = 'Bearer ' + token

  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(BASE + path, opts)
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Error desconocido')
  return data.data
}

const get  = (path)        => req('GET',    path)
const post = (path, body)  => req('POST',   path, body)
const put  = (path, body)  => req('PUT',    path, body)
const del  = (path, body)  => req('DELETE', path, body)

export const api = {
  // Auth
  login:           (body) => post('/auth/login', body),
  me:              ()     => get('/auth/me'),
  changePassword:  (body) => put('/auth/change-password', body),

  // Usuarios (admin)
  getUsuarios:     ()     => get('/usuarios'),
  createUsuario:   (body) => post('/usuarios', body),
  updateUsuario:   (body) => put('/usuarios', body),
  deleteUsuario:   (body) => del('/usuarios', body),

  // Habitantes
  getHabitantes:   ()     => get('/habitantes'),
  saveHabitante:   (p)    => post('/habitantes', p),
  deleteHabitante: (p)    => del('/habitantes', p),
  residenteAuth:   (p)    => post('/habitantes/auth', p),
  residenteData:   (int_) => get('/habitantes/data?interior=' + int_),

  // Personal
  getPersonal:     ()     => get('/personal'),

  // Ingresos
  getIngresos:     ()     => get('/ingresos'),
  getNextRecibo:   ()     => get('/ingresos/next-recibo'),
  saveIngreso:     (p)    => post('/ingresos', p),
  updateIngreso:   (p)    => put('/ingresos', p),
  deleteIngreso:   (p)    => del('/ingresos', p),

  // Salidas
  getSalidas:      ()     => get('/salidas'),
  getNextRegistro: ()     => get('/salidas/next-registro'),
  saveSalida:      (p)    => post('/salidas', p),
  updateSalida:    (p)    => put('/salidas', p),
  deleteSalida:    (p)    => del('/salidas', p),

  // Abonos
  getAbonos:       (cod)  => get('/abonos' + (cod ? '?cod_registro=' + cod : '')),
  saveAbono:       (p)    => post('/abonos', p),

  // Totales
  getTotales:      ()     => get('/totales'),

  // Bloqueo de formularios
  getLock:         (form) => get('/locks?formulario=' + form),
  setLock:         (body) => post('/locks', body),
  releaseLock:     (body) => del('/locks', body),
}
