// Espelha os json: tags dos models Go (snake_case).
// Equivalente a data classes no Kotlin — só dados, zero lógica.

// ── Usuário ──────────────────────────────────────────────────────────────────

export interface Address {
  cep: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
}

export interface User {
  uid: string
  name: string
  email: string
  cpf: string
  phone?: string
  address?: Address
}

// ── Apólice ───────────────────────────────────────────────────────────────────

export type PolicyStatus = 'ATIVO' | 'PENDENTE' | 'CANCELADO'
export type PolicyType = 'VIDA' | 'AUTO' | 'RESIDENCIAL' | 'SAUDE' | 'VIAGEM'

export interface Policy {
  id: string
  insurer_name: string
  type: PolicyType
  start_date: number  // epoch ms
  end_date: number    // epoch ms
  status: PolicyStatus
  pdf_url: string
  cpf: string
}

// ── Sinistro ──────────────────────────────────────────────────────────────────

export type ClaimStatus =
  | 'ABERTO'
  | 'EM_ANALISE'
  | 'DOCUMENTACAO_PENDENTE'
  | 'ENCERRADO'

export type OccurrenceType = 'COLISAO' | 'ROUBO' | 'INCENDIO' | 'OUTRO'

export interface Claim {
  id: string
  policy_id: string
  occurrence_type: OccurrenceType
  description: string
  photo_url?: string
  status: ClaimStatus
  status_note?: string
  status_updated_at: number  // epoch ms
  opened_at: number          // epoch ms
}

export interface ClaimHistoryEntry {
  id: string
  from_status: ClaimStatus
  to_status: ClaimStatus
  note?: string
  changed_at: number  // epoch ms
}

// ── Cotação ───────────────────────────────────────────────────────────────────

export type QuoteStatus = 'AGUARDANDO' | 'RESPONDIDA' | 'FECHADA'

export interface QuoteCoverages {
  comprehensive: boolean
  civil_liability: boolean
  personal_accidents: boolean
  rental_car: boolean
}

export interface VehicleSnapshot {
  plate: string
  year: number
  usage_type: string
  overnight_cep: string
}

export interface QuoteResponseData {
  premium: number    // R$
  valid_until: number  // epoch ms
  notes?: string
}

export interface Quote {
  id: string
  vehicle_id: string
  vehicle_snapshot: VehicleSnapshot
  coverages: QuoteCoverages
  notes?: string
  status: QuoteStatus
  response?: QuoteResponseData
  responded_at?: number  // epoch ms
  closed_at?: number     // epoch ms
  created_at: number     // epoch ms
}

export interface QuoteHistoryEntry {
  from_status: QuoteStatus
  to_status: QuoteStatus
  note?: string
  changed_at: number  // epoch ms
}
