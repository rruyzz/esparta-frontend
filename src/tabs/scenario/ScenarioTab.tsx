import type { AdminConfig } from '../../api/adminApi'
import type { PersonType, VehicleUsageType, QuoteStatus, ProposalStatus, PolicyType, PolicyStatus, PaymentType } from '../../types'
import { useScenario } from './useScenario'

interface Props {
  config: AdminConfig
}

const PERSON_TYPES: PersonType[] = ['FISICA', 'JURIDICA']
const USAGE_TYPES: VehicleUsageType[] = ['PARTICULAR', 'COMERCIAL']
const QUOTE_TARGETS: QuoteStatus[] = ['AGUARDANDO', 'RESPONDIDA', 'FECHADA']
const PROPOSAL_TARGETS: ProposalStatus[] = ['GERADA', 'ENVIADA', 'ASSINADA']
const POLICY_TYPES: PolicyType[] = ['VIDA', 'AUTO', 'RESIDENCIAL', 'SAUDE', 'VIAGEM']
const POLICY_STATUSES: PolicyStatus[] = ['ATIVO', 'PENDENTE', 'CANCELADO', 'VENCIDA']
const PAYMENT_TYPES: PaymentType[] = ['A_VISTA', 'PARCELADO']

const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }
const fieldInput: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }
const sectionBox: React.CSSProperties = { border: '1px solid #e0e0e0', borderRadius: 10, padding: 16, marginBottom: 16, background: '#fafafa' }
const sectionHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }
const sectionTitle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#1a1a2e' }
const rollButton: React.CSSProperties = { padding: '7px 12px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 12, cursor: 'pointer' }
const row: React.CSSProperties = { display: 'flex', gap: 10, marginBottom: 10 }

export function ScenarioTab({ config }: Props) {
  const {
    account, setAccount, setAddress, randomizeAccount,
    vehicle, setVehicle, randomizeVehicle,
    quote, setQuote, setQuoteCoverages, randomizeQuote,
    proposal, setProposal, randomizeProposal,
    policy, setPolicy, policyEnabled, setPolicyEnabled, randomizePolicy,
    addPolicyCoverage, removePolicyCoverage, updatePolicyCoverage,
    setPolicyVehicle, setPolicyOwner, setPolicyInsuredDetails, setPolicyMainDriver,
    running, log, runScenario,
  } = useScenario(config)

  const isLocalBaseUrl = /localhost|127\.0\.0\.1/.test(config.baseUrl)
  const canQuote = vehicle.enabled
  const canProposal = quote.enabled && quote.targetStatus === 'FECHADA'

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: '#1a1a2e' }}>Cenário Rápido</strong>
        <p style={{ fontSize: 13, color: '#777', marginTop: 4 }}>
          Monta conta, endereço, veículo, cotação, proposta e apólice num fluxo só —
          use "Gerar genérico" pra preencher com dados plausíveis, ou edite os campos direto.
        </p>
      </div>

      {!isLocalBaseUrl && (
        <div style={{ background: '#fff8e1', border: '1px solid #f9d976', color: '#8a6d00', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          ⚠️ baseUrl não parece local (<code>{config.baseUrl}</code>) — este wizard cria conta e dados reais no backend apontado.
        </div>
      )}

      {/* ── Conta ──────────────────────────────────────────────────────── */}
      <div style={sectionBox}>
        <div style={sectionHeader}>
          <span style={sectionTitle}>Conta</span>
          <button type="button" style={rollButton} onClick={randomizeAccount}>🎲 Gerar genérico</button>
        </div>
        <div style={row}>
          <div style={{ flex: 2 }}>
            <label style={fieldLabel}>Nome</label>
            <input style={fieldInput} value={account.name} onChange={(e) => setAccount({ name: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Tipo de Pessoa</label>
            <select style={fieldInput} value={account.personType} onChange={(e) => setAccount({ personType: e.target.value as PersonType })}>
              {PERSON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Documento</label>
            <input style={fieldInput} value={account.document} onChange={(e) => setAccount({ document: e.target.value })} />
          </div>
        </div>
        <div style={row}>
          <div style={{ flex: 2 }}>
            <label style={fieldLabel}>E-mail</label>
            <input style={fieldInput} value={account.email} onChange={(e) => setAccount({ email: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Senha</label>
            <input style={fieldInput} value={account.password} onChange={(e) => setAccount({ password: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Telefone (opcional)</label>
            <input style={fieldInput} value={account.phone} onChange={(e) => setAccount({ phone: e.target.value })} />
          </div>
        </div>
        <div style={row}>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>CEP</label>
            <input style={fieldInput} value={account.address.cep} onChange={(e) => setAddress({ cep: e.target.value })} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={fieldLabel}>Rua</label>
            <input style={fieldInput} value={account.address.street} onChange={(e) => setAddress({ street: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Número</label>
            <input style={fieldInput} value={account.address.number} onChange={(e) => setAddress({ number: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Complemento</label>
            <input style={fieldInput} value={account.address.complement} onChange={(e) => setAddress({ complement: e.target.value })} />
          </div>
        </div>
        <div style={row}>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Bairro</label>
            <input style={fieldInput} value={account.address.neighborhood} onChange={(e) => setAddress({ neighborhood: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>Cidade</label>
            <input style={fieldInput} value={account.address.city} onChange={(e) => setAddress({ city: e.target.value })} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={fieldLabel}>UF</label>
            <input style={fieldInput} value={account.address.state} onChange={(e) => setAddress({ state: e.target.value })} />
          </div>
        </div>
      </div>

      {/* ── Veículo ────────────────────────────────────────────────────── */}
      <div style={sectionBox}>
        <div style={sectionHeader}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
            <input type="checkbox" checked={vehicle.enabled} onChange={(e) => setVehicle({ enabled: e.target.checked })} />
            Veículo
          </label>
          <button type="button" style={rollButton} disabled={!vehicle.enabled} onClick={randomizeVehicle}>🎲 Gerar genérico</button>
        </div>
        {vehicle.enabled && (
          <div style={row}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Placa</label>
              <input style={fieldInput} value={vehicle.plate} onChange={(e) => setVehicle({ plate: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Ano</label>
              <input style={fieldInput} type="number" value={vehicle.year} onChange={(e) => setVehicle({ year: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Uso</label>
              <select style={fieldInput} value={vehicle.usageType} onChange={(e) => setVehicle({ usageType: e.target.value as VehicleUsageType })}>
                {USAGE_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>CEP de pernoite</label>
              <input style={fieldInput} value={vehicle.overnightCep} onChange={(e) => setVehicle({ overnightCep: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      {/* ── Cotação ────────────────────────────────────────────────────── */}
      <div style={sectionBox}>
        <div style={sectionHeader}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
            <input type="checkbox" checked={quote.enabled} disabled={!canQuote} onChange={(e) => setQuote({ enabled: e.target.checked })} />
            Cotação
          </label>
          <button type="button" style={rollButton} disabled={!quote.enabled} onClick={randomizeQuote}>🎲 Gerar genérico</button>
        </div>
        {!canQuote && <p style={{ fontSize: 12, color: '#999', marginTop: -6 }}>Precisa incluir Veículo pra habilitar.</p>}
        {quote.enabled && (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
              {(['comprehensive', 'civil_liability', 'personal_accidents', 'rental_car'] as const).map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
                  <input type="checkbox" checked={quote.coverages[key]} onChange={(e) => setQuoteCoverages({ [key]: e.target.checked })} />
                  {key}
                </label>
              ))}
            </div>
            <div style={row}>
              <div style={{ flex: 2 }}>
                <label style={fieldLabel}>Notas (opcional)</label>
                <input style={fieldInput} value={quote.notes} onChange={(e) => setQuote({ notes: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Avançar até</label>
                <select style={fieldInput} value={quote.targetStatus} onChange={(e) => setQuote({ targetStatus: e.target.value as QuoteStatus })}>
                  {QUOTE_TARGETS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {(quote.targetStatus === 'RESPONDIDA' || quote.targetStatus === 'FECHADA') && (
              <div style={row}>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Prêmio da resposta (R$)</label>
                  <input style={fieldInput} type="number" step="0.01" value={quote.premium} onChange={(e) => setQuote({ premium: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Válida até</label>
                  <input style={fieldInput} type="date" value={quote.validUntil} onChange={(e) => setQuote({ validUntil: e.target.value })} />
                </div>
                <div style={{ flex: 2 }}>
                  <label style={fieldLabel}>Notas da resposta</label>
                  <input style={fieldInput} value={quote.responseNotes} onChange={(e) => setQuote({ responseNotes: e.target.value })} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Proposta ───────────────────────────────────────────────────── */}
      <div style={sectionBox}>
        <div style={sectionHeader}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
            <input type="checkbox" checked={proposal.enabled} disabled={!canProposal} onChange={(e) => setProposal({ enabled: e.target.checked })} />
            Proposta
          </label>
          <button type="button" style={rollButton} disabled={!proposal.enabled} onClick={randomizeProposal}>🎲 Gerar genérico</button>
        </div>
        {!canProposal && <p style={{ fontSize: 12, color: '#999', marginTop: -6 }}>Precisa que a Cotação avance até FECHADA pra habilitar.</p>}
        {proposal.enabled && (
          <>
            <div style={row}>
              <div style={{ flex: 2 }}>
                <label style={fieldLabel}>URL do PDF</label>
                <input style={fieldInput} value={proposal.pdfUrl} onChange={(e) => setProposal({ pdfUrl: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Prêmio proposto (R$)</label>
                <input style={fieldInput} type="number" step="0.01" value={proposal.proposedPremium} onChange={(e) => setProposal({ proposedPremium: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Válida até</label>
                <input style={fieldInput} type="date" value={proposal.validUntil} onChange={(e) => setProposal({ validUntil: e.target.value })} />
              </div>
            </div>
            <div style={{ flex: 1, maxWidth: 200 }}>
              <label style={fieldLabel}>Avançar até</label>
              <select style={fieldInput} value={proposal.targetStatus} onChange={(e) => setProposal({ targetStatus: e.target.value as ProposalStatus })}>
                {PROPOSAL_TARGETS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      {/* ── Apólice ────────────────────────────────────────────────────── */}
      <div style={sectionBox}>
        <div style={sectionHeader}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
            <input type="checkbox" checked={policyEnabled} onChange={(e) => setPolicyEnabled(e.target.checked)} />
            Apólice
          </label>
          <button type="button" style={rollButton} disabled={!policyEnabled} onClick={randomizePolicy}>🎲 Gerar genérico</button>
        </div>
        {policyEnabled && (
          <>
            <div style={row}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Seguradora</label>
                <input style={fieldInput} value={policy.insurerName} onChange={(e) => setPolicy({ ...policy, insurerName: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Tipo</label>
                <select style={fieldInput} value={policy.type} onChange={(e) => setPolicy({ ...policy, type: e.target.value as PolicyType })}>
                  {POLICY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Status</label>
                <select style={fieldInput} value={policy.status} onChange={(e) => setPolicy({ ...policy, status: e.target.value as PolicyStatus })}>
                  {POLICY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={row}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Início</label>
                <input style={fieldInput} type="date" value={policy.startDate} onChange={(e) => setPolicy({ ...policy, startDate: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Vencimento</label>
                <input style={fieldInput} type="date" value={policy.endDate} onChange={(e) => setPolicy({ ...policy, endDate: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Número da Apólice</label>
                <input style={fieldInput} value={policy.policyNumber} onChange={(e) => setPolicy({ ...policy, policyNumber: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Número do Endosso</label>
                <input style={fieldInput} value={policy.endorsementNumber} onChange={(e) => setPolicy({ ...policy, endorsementNumber: e.target.value })} />
              </div>
            </div>
            <div style={row}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Prêmio (R$)</label>
                <input style={fieldInput} type="number" step="0.01" value={policy.premiumAmount} onChange={(e) => setPolicy({ ...policy, premiumAmount: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Forma de pagamento</label>
                <select style={fieldInput} value={policy.paymentType} onChange={(e) => setPolicy({ ...policy, paymentType: e.target.value as PaymentType })}>
                  {PAYMENT_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={fieldLabel}>URL do PDF</label>
                <input style={fieldInput} value={policy.pdfUrl} onChange={(e) => setPolicy({ ...policy, pdfUrl: e.target.value })} />
              </div>
            </div>

            {policy.type === 'AUTO' && (
              <>
                <div style={{ ...sectionBox, background: '#fff' }}>
                  <span style={{ ...sectionTitle, display: 'block', marginBottom: 10 }}>Coberturas</span>
                  {policy.coverages.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                      <div style={{ flex: 2 }}>
                        {i === 0 && <label style={fieldLabel}>Nome</label>}
                        <input style={fieldInput} value={c.name} onChange={(e) => updatePolicyCoverage(i, { name: e.target.value })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        {i === 0 && <label style={fieldLabel}>LMI</label>}
                        <input style={fieldInput} type="number" value={c.coverageLimit} onChange={(e) => updatePolicyCoverage(i, { coverageLimit: e.target.value })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        {i === 0 && <label style={fieldLabel}>Prêmio</label>}
                        <input style={fieldInput} type="number" value={c.premium} onChange={(e) => updatePolicyCoverage(i, { premium: e.target.value })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        {i === 0 && <label style={fieldLabel}>Franquia</label>}
                        <input style={fieldInput} type="number" value={c.deductible} onChange={(e) => updatePolicyCoverage(i, { deductible: e.target.value })} />
                      </div>
                      <button type="button" onClick={() => removePolicyCoverage(i)} style={{ padding: '9px 12px', border: '1px solid #c62828', background: '#fff', color: '#c62828', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                        Remover
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addPolicyCoverage} style={rollButton}>+ Cobertura</button>
                </div>

                <div style={{ ...sectionBox, background: '#fff' }}>
                  <span style={{ ...sectionTitle, display: 'block', marginBottom: 10 }}>Veículo (Apólice)</span>
                  <div style={row}>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Placa</label>
                      <input style={fieldInput} value={policy.vehicle.plate} onChange={(e) => setPolicyVehicle({ plate: e.target.value })} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={fieldLabel}>Marca/Modelo</label>
                      <input style={fieldInput} value={policy.vehicle.makeModel} onChange={(e) => setPolicyVehicle({ makeModel: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Ano</label>
                      <input style={fieldInput} type="number" value={policy.vehicle.year} onChange={(e) => setPolicyVehicle({ year: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>CEP de pernoite</label>
                      <input style={fieldInput} value={policy.vehicle.overnightCep} onChange={(e) => setPolicyVehicle({ overnightCep: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div style={{ ...sectionBox, background: '#fff' }}>
                  <span style={{ ...sectionTitle, display: 'block', marginBottom: 10 }}>Segurado (Apólice)</span>
                  <div style={row}>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Documento</label>
                      <input style={fieldInput} value={policy.insuredDetails.document} onChange={(e) => setPolicyInsuredDetails({ document: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Nascimento</label>
                      <input style={fieldInput} type="date" value={policy.insuredDetails.birthDate} onChange={(e) => setPolicyInsuredDetails({ birthDate: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Classe Bônus</label>
                      <input style={fieldInput} value={policy.insuredDetails.bonusClass} onChange={(e) => setPolicyInsuredDetails({ bonusClass: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>CI</label>
                      <input style={fieldInput} value={policy.insuredDetails.ci} onChange={(e) => setPolicyInsuredDetails({ ci: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div style={{ ...sectionBox, background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
                    <input type="checkbox" checked={policy.hasOwner} onChange={(e) => setPolicy({ ...policy, hasOwner: e.target.checked })} />
                    Proprietário diferente do Segurado (opcional)
                  </label>
                  {policy.hasOwner && (
                    <div style={{ ...row, marginTop: 10 }}>
                      <div style={{ flex: 2 }}>
                        <label style={fieldLabel}>Nome</label>
                        <input style={fieldInput} value={policy.owner.name} onChange={(e) => setPolicyOwner({ name: e.target.value })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Documento</label>
                        <input style={fieldInput} value={policy.owner.document} onChange={(e) => setPolicyOwner({ document: e.target.value })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Vínculo</label>
                        <input style={fieldInput} value={policy.owner.relationshipToInsured} onChange={(e) => setPolicyOwner({ relationshipToInsured: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ ...sectionBox, background: '#fff', marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555' }}>
                    <input type="checkbox" checked={policy.hasMainDriver} onChange={(e) => setPolicy({ ...policy, hasMainDriver: e.target.checked })} />
                    Condutor Principal distinto do Segurado (opcional)
                  </label>
                  {policy.hasMainDriver && (
                    <div style={{ ...row, marginTop: 10, marginBottom: 0 }}>
                      <div style={{ flex: 2 }}>
                        <label style={fieldLabel}>Nome</label>
                        <input style={fieldInput} value={policy.mainDriver.name} onChange={(e) => setPolicyMainDriver({ name: e.target.value })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Documento</label>
                        <input style={fieldInput} value={policy.mainDriver.document} onChange={(e) => setPolicyMainDriver({ document: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        disabled={running}
        onClick={runScenario}
        style={{ width: '100%', padding: 12, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
      >
        {running ? 'Executando...' : 'Executar Cenário'}
      </button>

      {log.length > 0 && (
        <div style={{ marginTop: 16, border: '1px solid #e0e0e0', borderRadius: 8, padding: 14 }}>
          {log.map((entry, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, padding: '4px 0', color: entry.status === 'ok' ? '#2e7d32' : '#c62828' }}>
              <span>{entry.status === 'ok' ? '✅' : '❌'}</span>
              <strong>{entry.step}</strong>
              <span style={{ fontFamily: 'monospace', color: '#777' }}>{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
