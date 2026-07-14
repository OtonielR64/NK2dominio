import { api } from './api'

const TOKEN_KEY  = 'nk2_token'
const ROLE_KEY   = 'nk2_role'
const USER_KEY   = 'nk2_user'
const MCP_KEY    = 'nk2_mcp'   // must_change_password

export async function login(username, password) {
  const data = await api.login({ username, password })
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(ROLE_KEY,  data.rol)
  localStorage.setItem(USER_KEY,  data.username)
  localStorage.setItem(MCP_KEY,   data.must_change_password ? '1' : '0')
  return data
}

export function logout() {
  [TOKEN_KEY, ROLE_KEY, USER_KEY, MCP_KEY].forEach(k => localStorage.removeItem(k))
}

export function getRole()     { return localStorage.getItem(ROLE_KEY) }
export function getToken()    { return localStorage.getItem(TOKEN_KEY) }
export function getUsername() { return localStorage.getItem(USER_KEY) }
export function isSuperAdmin() { return getRole() === 'superadmin' }
export function isAdmin()     { return getRole() === 'admin' || getRole() === 'superadmin' }
export function isLoggedIn()  { return !!getToken() }

export function mustChangePassword() {
  return localStorage.getItem(MCP_KEY) === '1'
}

export function clearMustChange() {
  localStorage.setItem(MCP_KEY, '0')
}
