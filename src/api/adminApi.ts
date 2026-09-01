import type {
  User,
  PersonType,
  Policy,
  PolicyStatus,
  PolicyType,
  Premium,
  AutoPolicyPayload,
  Claim,
  ClaimStatus,
  OccurrenceType,
  ClaimHistoryEntry,
  Quote,
  QuoteStatus,
  QuoteHistoryEntry,
  QuoteResponseData,
  QuoteCoverages,
  Vehicle,
  VehicleUsageType,
  Proposal,
  ProposalStatus,
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
  data: { email: string; password: string; name: string; document: string; person_type: PersonType },
): Promise<{ uid: string; email: string }> {
  return request(config, 'POST', '/v1/admin/users', data)
}

export function deleteUser(config: AdminConfig, uid: string): Promise<void> {
  return request(config, 'DELETE', '/v1/admin/users', { uid })
}

// ── Apólices ──────────────────────────────────────────────────────────────────

export function listPolicies(config: AdminConfig, document?: string): Promise<Policy[]> {
  const query = document ? `?document=${encodeURIComponent(document)}` : ''
  return request(config, 'GET', `/v1/admin/policies${query}`)
}

export function createPolicy(
  config: AdminConfig,
  data: {
    document: string
    insurer_name: string
    type: PolicyType
    start_date: number
    end_date: number
    status: PolicyStatus
    pdf_url?: string
    policy_number: string
    endorsement_number: string
    premium: Premium
    auto?: AutoPolicyPayload
  },
): Promise<{ id: string }> {
  return request(config, 'POST', '/v1/admin/policies', data)
}

export function updatePolicyStatus(
  config: AdminConfig,
  id: string,
  status: PolicyStatus,
): Promise<{ id: string }> {
  return request(config, 'PATCH', `/v1/admin/policies/${id}`, { status })
}

// ── Sinistros ─────────────────────────────────────────────────────────────────

export function listClaims(config: AdminConfig, document?: string): Promise<Claim[]> {
  const query = document ? `?document=${encodeURIComponent(document)}` : ''
  return request(config, 'GET', `/v1/admin/claims${query}`)
}

export function createClaim(
  config: AdminConfig,
  data: {
    document: string
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

export function listQuotes(config: AdminConfig, document?: string): Promise<Quote[]> {
  const query = document ? `?document=${encodeURIComponent(document)}` : ''
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

export function createQuoteAdmin(
  config: AdminConfig,
  data: {
    document: string
    vehicle_id: string
    policy_id?: string
    coverages: QuoteCoverages
    notes?: string
  },
): Promise<{ id: string }> {
  return request(config, 'POST', '/v1/admin/quotes', data)
}

// ── Veículos ──────────────────────────────────────────────────────────────────

export function listVehiclesAdmin(config: AdminConfig, document: string): Promise<Vehicle[]> {
  return request(config, 'GET', `/v1/admin/vehicles?document=${encodeURIComponent(document)}`)
}

export function createVehicleAdmin(
  config: AdminConfig,
  data: {
    document: string
    plate: string
    year: number
    usage_type: VehicleUsageType
    overnight_cep: string
  },
): Promise<{ id: string }> {
  return request(config, 'POST', '/v1/admin/vehicles', data)
}

// ── Propostas ─────────────────────────────────────────────────────────────────

export function listProposalsByQuote(config: AdminConfig, quoteId: string): Promise<Proposal[]> {
  return request(config, 'GET', `/v1/admin/proposals?quote_id=${encodeURIComponent(quoteId)}`)
}

export function createProposal(
  config: AdminConfig,
  data: { quote_id: string; pdf_url: string },
): Promise<{ id: string }> {
  return request(config, 'POST', '/v1/admin/proposals', data)
}

export function updateProposalStatus(
  config: AdminConfig,
  id: string,
  status: ProposalStatus,
): Promise<{ id: string }> {
  return request(config, 'PATCH', `/v1/admin/proposals/${id}`, { status })
}
