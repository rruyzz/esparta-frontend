import type { AdminConfig } from '../../api/adminApi'
import type { QuoteStatus, QuoteCoverages, VehicleUsageType, ProposalStatus } from '../../types'
import { useQuotes } from './useQuotes'
import { StatusHistory } from '../shared/StatusHistory'

interface Props {
  config: AdminConfig
}

const badgeStyle: Record<QuoteStatus, React.CSSProperties> = {
  AGUARDANDO: { background: '#fff8e1', color: '#f57f17' },
  RESPONDIDA: { background: '#e3f2fd', color: '#1565c0' },
  FECHADA:    { background: '#e8f5e9', color: '#2e7d32' },
}

const proposalBadgeStyle: Record<ProposalStatus, React.CSSProperties> = {
  GERADA:   { background: '#fff8e1', color: '#f57f17' },
  ENVIADA:  { background: '#e3f2fd', color: '#1565c0' },
  ASSINADA: { background: '#e8f5e9', color: '#2e7d32' },
}

const VEHICLE_USAGE_TYPES: VehicleUsageType[] = ['PARTICULAR', 'COMERCIAL']

const input: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff',
}

const label: React.CSSProperties = {
  display: 'block', fontSize: 13, color: '#555', marginBottom: 5,
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 600,
}

const coverageLabels: Record<keyof QuoteCoverages, string> = {
  comprehensive:      'Compreensiva',
  civil_liability:    'Resp. Civil',
  personal_accidents: 'Acid. Pessoais',
  rental_car:         'Carro Reserva',
}

function formatDate(epochMs: number) {
  return new Date(epochMs).toLocaleDateString('pt-BR')
}

function formatDateTime(epochMs: number) {
  return new Date(epochMs).toLocaleString('pt-BR')
}

function formatMoney(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export function QuotesTab({ config }: Props) {
  const {
    quotes, loading, error,
    premiumDraft, setPremiumDraft,
    validUntilDraft, setValidUntilDraft,
    notesDraft, setNotesDraft,
    saving, openHistory, history, historyLoading,
    respond, close, toggleHistory,
    showCreateForm, setShowCreateForm,
    createForm, setCreateForm,
    lookupDone, lookupLoading, lookupPolicies, lookupVehicles,
    creating, searchInsured, createQuote,
    openProposal, proposals, proposalLoading,
    pdfUrlDraft, setPdfUrlDraft, proposalSaving,
    toggleProposal, generateProposal, advanceProposal,
  } = useQuotes(config)

  if (loading) return <p>Carregando...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 14, color: '#1a1a2e' }}>Cotações</strong>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
        >
          + Nova Cotação
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showCreateForm && (
        <form onSubmit={createQuote} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 20, background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>CPF do segurado</label>
              <input
                required placeholder="00000000000" value={createForm.cpf}
                onChange={(e) => setCreateForm({ ...createForm, cpf: e.target.value })}
                style={input}
              />
            </div>
            <button
              type="button" onClick={searchInsured} disabled={lookupLoading}
              style={{ padding: '9px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              {lookupLoading ? 'Buscando...' : 'Buscar segurado'}
            </button>
          </div>

          {lookupDone && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio" checked={createForm.mode === 'novo'}
                    onChange={() => setCreateForm({ ...createForm, mode: 'novo', policyId: '' })}
                  />
                  Seguro novo
                </label>
                <label style={{ fontSize: 13, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio" checked={createForm.mode === 'renovacao'}
                    onChange={() => setCreateForm({ ...createForm, mode: 'renovacao' })}
                  />
                  Renovação
                </label>
              </div>

              {createForm.mode === 'renovacao' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={label}>Apólice AUTO sendo renovada</label>
                  {lookupPolicies.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#999' }}>Esse CPF não tem apólice AUTO cadastrada.</p>
                  ) : (
                    <select
                      required value={createForm.policyId}
                      onChange={(e) => setCreateForm({ ...createForm, policyId: e.target.value })}
                      style={input}
                    >
                      <option value="">Selecione...</option>
                      {lookupPolicies.map((p) => (
                        <option key={p.id} value={p.id}>{p.insurer_name} · {p.status}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={label}>Veículo</label>
                <label style={{ fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <input
                    type="checkbox" checked={createForm.useNewVehicle}
                    onChange={(e) => setCreateForm({ ...createForm, useNewVehicle: e.target.checked, vehicleId: '' })}
                  />
                  Cadastrar veículo novo
                </label>

                {!createForm.useNewVehicle ? (
                  lookupVehicles.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#999' }}>Esse CPF não tem veículo cadastrado.</p>
                  ) : (
                    <select
                      required value={createForm.vehicleId}
                      onChange={(e) => setCreateForm({ ...createForm, vehicleId: e.target.value })}
                      style={input}
                    >
                      <option value="">Selecione...</option>
                      {lookupVehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.plate} · {v.year}</option>
                      ))}
                    </select>
                  )
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={label}>Placa</label>
                      <input
                        required placeholder="ABC1234" value={createForm.newVehicle.plate}
                        onChange={(e) => setCreateForm({ ...createForm, newVehicle: { ...createForm.newVehicle, plate: e.target.value } })}
                        style={input}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={label}>Ano</label>
                      <input
                        required type="number" placeholder="2020" value={createForm.newVehicle.year}
                        onChange={(e) => setCreateForm({ ...createForm, newVehicle: { ...createForm.newVehicle, year: e.target.value } })}
                        style={input}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={label}>Uso</label>
                      <select
                        value={createForm.newVehicle.usageType}
                        onChange={(e) => setCreateForm({ ...createForm, newVehicle: { ...createForm.newVehicle, usageType: e.target.value as VehicleUsageType } })}
                        style={input}
                      >
                        {VEHICLE_USAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={label}>CEP de pernoite</label>
                      <input
                        required placeholder="01000-000" value={createForm.newVehicle.overnightCep}
                        onChange={(e) => setCreateForm({ ...createForm, newVehicle: { ...createForm.newVehicle, overnightCep: e.target.value } })}
                        style={input}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={label}>Coberturas</label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {(Object.keys(coverageLabels) as (keyof QuoteCoverages)[]).map((k) => (
                    <label key={k} style={{ fontSize: 13, color: '#333', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox" checked={createForm.coverages[k]}
                        onChange={(e) => setCreateForm({ ...createForm, coverages: { ...createForm.coverages, [k]: e.target.checked } })}
                      />
                      {coverageLabels[k]}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={label}>Observações (opcional)</label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  style={{ ...input, resize: 'vertical', minHeight: 60 }}
                />
              </div>

              <button
                type="submit" disabled={creating}
                style={{ width: '100%', padding: 12, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
              >
                {creating ? 'Criando...' : 'Criar Cotação'}
              </button>
            </>
          )}
        </form>
      )}

      {quotes.length === 0 && <p>Nenhuma cotação encontrada.</p>}

      {quotes.map((q) => {
        const activeCoverages = (Object.keys(coverageLabels) as (keyof QuoteCoverages)[])
          .filter((k) => q.coverages[k])
          .map((k) => coverageLabels[k])

        return (
          <div key={q.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 14, fontSize: 13 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600 }}>{q.vehicle_snapshot.plate || '—'}</span>
              <span style={{ color: '#555' }}>{q.vehicle_snapshot.year} · {q.vehicle_snapshot.usage_type}</span>
              {q.policy_id && (
                <span style={{ ...badge, background: '#ede7f6', color: '#5e35b1' }}>Renovação</span>
              )}
              <span style={{ flex: 1 }} />
              <span style={{ ...badge, ...badgeStyle[q.status] }}>{q.status}</span>
              <span style={{ color: '#999', fontSize: 12 }}>{formatDate(q.created_at)}</span>
            </div>

            <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
              {activeCoverages.length ? activeCoverages.join(' · ') : 'Nenhuma cobertura selecionada'}
            </div>

            {q.notes && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Obs. do segurado: "{q.notes}"</div>
            )}

            {q.status === 'AGUARDANDO' && (
              <div style={{ marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Prêmio anual (R$)</label>
                    <input
                      type="number" step="0.01" min="0" placeholder="3200.00"
                      value={premiumDraft[q.id] ?? ''}
                      onChange={(e) => setPremiumDraft({ ...premiumDraft, [q.id]: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fafafa' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Válido até</label>
                    <input
                      type="date"
                      value={validUntilDraft[q.id] ?? ''}
                      onChange={(e) => setValidUntilDraft({ ...validUntilDraft, [q.id]: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fafafa' }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#555', marginBottom: 4 }}>Observações (opcional)</label>
                  <textarea
                    placeholder="Ex.: Inclui assistência 24h, franquia reduzida disponível..."
                    value={notesDraft[q.id] ?? ''}
                    onChange={(e) => setNotesDraft({ ...notesDraft, [q.id]: e.target.value })}
                    style={{ width: '100%', resize: 'vertical', minHeight: 60, padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fafafa' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button
                    onClick={() => respond(q.id)}
                    disabled={saving === q.id}
                    style={{ padding: '9px 20px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    {saving === q.id ? 'Enviando...' : 'Responder cotação'}
                  </button>
                  <button
                    onClick={() => toggleHistory(q.id)}
                    style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Histórico
                  </button>
                </div>
              </div>
            )}

            {q.status !== 'AGUARDANDO' && q.response && (
              <div style={{ marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>{formatMoney(q.response.premium)}</div>
                {q.status === 'RESPONDIDA' && (
                  <div style={{ color: '#555' }}>Válido até: <strong>{formatDate(q.response.valid_until)}</strong></div>
                )}
                {q.response.notes && (
                  <div style={{ marginTop: 4, fontStyle: 'italic', color: '#555' }}>"{q.response.notes}"</div>
                )}
                <div style={{ marginTop: 6, fontSize: 11, color: '#aaa' }}>
                  {q.status === 'RESPONDIDA' && q.responded_at && `Respondido em ${formatDateTime(q.responded_at)}`}
                  {q.status === 'FECHADA' && q.closed_at && `Fechada em ${formatDateTime(q.closed_at)}`}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {q.status === 'RESPONDIDA' && (
                    <button
                      onClick={() => close(q.id)}
                      disabled={saving === q.id}
                      style={{ padding: '8px 16px', background: '#fff', color: '#c62828', border: '1px solid #c62828', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                    >
                      {saving === q.id ? 'Fechando...' : 'Fechar cotação'}
                    </button>
                  )}
                  <button
                    onClick={() => toggleHistory(q.id)}
                    style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Histórico
                  </button>
                  {q.status === 'FECHADA' && (
                    <button
                      onClick={() => toggleProposal(q.id)}
                      style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                    >
                      Proposta
                    </button>
                  )}
                </div>
              </div>
            )}

            {openHistory === q.id && (
              <StatusHistory loading={historyLoading} entries={history} badgeStyle={badgeStyle} />
            )}

            {openProposal === q.id && (
              <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                {proposalLoading ? (
                  <div style={{ fontSize: 12, color: '#aaa' }}>Carregando...</div>
                ) : proposals.length === 0 ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      placeholder="https://... (PDF da proposta)"
                      value={pdfUrlDraft}
                      onChange={(e) => setPdfUrlDraft(e.target.value)}
                      style={{ flex: 1, padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fafafa' }}
                    />
                    <button
                      onClick={() => generateProposal(q.id)}
                      disabled={proposalSaving}
                      style={{ padding: '9px 16px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {proposalSaving ? 'Gerando...' : 'Gerar Proposta'}
                    </button>
                  </div>
                ) : (
                  proposals.map((p) => (
                    <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ ...badge, ...proposalBadgeStyle[p.status] }}>{p.status}</span>
                      <a href={p.pdf_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1565c0' }}>Ver PDF</a>
                      <span style={{ flex: 1 }} />
                      {p.status === 'GERADA' && (
                        <button
                          onClick={() => advanceProposal(q.id, p.id, 'ENVIADA')}
                          disabled={proposalSaving}
                          style={{ padding: '7px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
                        >
                          Marcar Enviada
                        </button>
                      )}
                      {p.status === 'ENVIADA' && (
                        <button
                          onClick={() => advanceProposal(q.id, p.id, 'ASSINADA')}
                          disabled={proposalSaving}
                          style={{ padding: '7px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
                        >
                          Marcar Assinada
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
