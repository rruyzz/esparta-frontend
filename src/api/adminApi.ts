import type {
  User,
  Policy,
  PolicyStatus,
  PolicyType,
  Claim,
  ClaimStatus,
  OccurrenceType,
  ClaimHistoryEntry,
  Quote,
  QuoteStatus,
  QuoteHistoryEntry,
  QuoteCoverages,
  QuoteResponseData,
} from '../types'

// ── Configuração ──────────────────────────────────────────────────────────────
// Equivalente ao "Repository" no KMM: centraliza todo acesso à API.
// Os componentes nunca chamam fetch diretamente — só chamam funções daqui.

export interface AdminConfig {
  baseUrl: string
  adminKey: string
}

// ── Helper interno ────────────────────────────────────────────────────────────
// Equivalente ao suspend fun request<T>() no repositório Kotlin.

async function request<T>(
  config: AdminConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(config.baseUrl + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': config.adminKey,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }

  // 204 No Content não tem body
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ── Usuários ──────────────────────────────────────────────────────────────────

export function listUsers(config: AdminConfig): Promise<User[]> {
  return request(config, 'GET', '/v1/admin/users')
}

export function createUser(
  config: AdminConfig,
  data: { email: string; password: string; name: string; cpf: string },
): Promise<{ uid: string; email: string }> {
  return request(config, 'POST', '/v1/admin/users', data)
}

export function deleteUser(config: AdminConfig, uid: string): Promise<void> {
  return request(config, 'DELETE', '/v1/admin/users', { uid })
}

// ── Apólices ──────────────────────────────────────────────────────────────────

export function listPolicies(config: AdminConfig, cpf?: string): Promise<Policy[]> {
  const query = cpf ? `?cpf=${encodeURIComponent(cpf)}` : ''
  return request(config, 'GET', `/v1/admin/policies${query}`)
}

export function createPolicy(
  config: AdminConfig,
  data: {
    cpf: string
    insurer_name: string
    type: PolicyType
    start_date: number
    end_date: number
    status: PolicyStatus
    pdf_url?: string
  },
): Promise<{ id: string }> {
  return request(config, 'POST', '/v1/admin/policies', data)
}

// ── Sinistros ─────────────────────────────────────────────────────────────────

export function listClaims(config: AdminConfig, cpf?: string): Promise<Claim[]> {
  const query = cpf ? `?cpf=${encodeURIComponent(cpf)}` : ''
  return request(config, 'GET', `/v1/admin/claims${query}`)
}

export function createClaim(
  config: AdminConfig,
  data: {
    cpf: string
    policy_id: string
    occurrence_type: OccurrenceType
    description: string
    photo_url?: string
  },
): Promise<{ id: string }> {
  return request(config, 'POST', '/v1/admin/claims', data)
}

export function updateClaimStatus(
  config: AdminConfig,
  id: string,
  status: ClaimStatus,
  status_note?: string,
): Promise<{ id: string }> {
  return request(config, 'PATCH', `/v1/admin/claims/${id}`, { status, status_note })
}

export function getClaimHistory(
  config: AdminConfig,
  id: string,
): Promise<ClaimHistoryEntry[]> {
  return request(config, 'GET', `/v1/admin/claims/${id}/history`)
}

// ── Cotações ──────────────────────────────────────────────────────────────────

export function listQuotes(config: AdminConfig, cpf?: string): Promise<Quote[]> {
  const query = cpf ? `?cpf=${encodeURIComponent(cpf)}` : ''
  return request(config, 'GET', `/v1/admin/quotes${query}`)
}

export function updateQuoteStatus(
  config: AdminConfig,
  id: string,
  status: QuoteStatus,
  response?: QuoteResponseData,
  note?: string,
): Promise<{ id: string }> {
  return request(config, 'PATCH', `/v1/admin/quotes/${id}`, { status, response, note })
}

export function getQuoteHistory(
  config: AdminConfig,
  id: string,
): Promise<QuoteHistoryEntry[]> {
  return request(config, 'GET', `/v1/admin/quotes/${id}/history`)
}
