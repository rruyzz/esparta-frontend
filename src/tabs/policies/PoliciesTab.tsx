import type { AdminConfig } from '../../api/adminApi'
import type { PolicyStatus, PolicyType, PaymentType } from '../../types'
import { usePolicies } from './usePolicies'

interface Props {
  config: AdminConfig
}

const POLICY_TYPES: PolicyType[] = ['VIDA', 'AUTO', 'RESIDENCIAL', 'SAUDE', 'VIAGEM']
const POLICY_STATUSES: PolicyStatus[] = ['ATIVO', 'PENDENTE', 'CANCELADO']
const POLICY_STATUS_OPTIONS: PolicyStatus[] = ['ATIVO', 'PENDENTE', 'CANCELADO', 'VENCIDA']
const PAYMENT_TYPES: PaymentType[] = ['A_VISTA', 'PARCELADO']

const fieldLabel: React.CSSProperties = { display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }
const fieldInput: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }
const sectionBox: React.CSSProperties = { border: '1px solid #e0e0e0', borderRadius: 8, padding: 14, marginBottom: 16, background: '#fff' }
const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#1a1a2e', marginBottom: 10, display: 'block' }

const badgeStyle: Record<PolicyStatus, React.CSSProperties> = {
  ATIVO:     { background: '#e8f5e9', color: '#2e7d32' },
  PENDENTE:  { background: '#fff8e1', color: '#f57f17' },
  CANCELADO: { background: '#ffebee', color: '#c62828' },
  VENCIDA:   { background: '#eeeeee', color: '#616161' },
}

const badge: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 12,
  fontSize: 11,
  fontWeight: 600,
}

function formatDate(epochMs: number) {
  return new Date(epochMs).toLocaleDateString('pt-BR')
}

export function PoliciesTab({ config }: Props) {
  const {
    policies, loading, error,
    showForm, setShowForm,
    form, setForm,
    creating, create,
    statusDraft, setStatusDraft,
    saving, saveStatus,
    addCoverage, removeCoverage, updateCoverage,
    setVehicle, setOwner, setInsuredDetails, setMainDriver,
  } = usePolicies(config)

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: '#1a1a2e' }}>Apólices</strong>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ padding: '9px 14px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
        >
          + Nova Apólice
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {showForm && (
        <form onSubmit={create} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: 20, marginBottom: 20, background: '#fafafa' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Documento do segurado (CPF/CNPJ)</label>
              <input
                required placeholder="00000000000" value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Seguradora</label>
              <input
                required placeholder="Porto Seguro" value={form.insurerName}
                onChange={(e) => setForm({ ...form, insurerName: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as PolicyType })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                {POLICY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Início</label>
              <input
                required type="date" value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Vencimento</label>
              <input
                required type="date" value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PolicyStatus })}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                {POLICY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Número da Apólice</label>
              <input
                required placeholder="123.456.789-0" value={form.policyNumber}
                onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
                style={fieldInput}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={fieldLabel}>Número do Endosso</label>
              <input
                required placeholder="0" value={form.endorsementNumber}
                onChange={(e) => setForm({ ...form, endorsementNumber: e.target.value })}
                style={fieldInput}
              />
            </div>
          </div>

          <div style={sectionBox}>
            <span style={sectionTitle}>Prêmio</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Valor (R$)</label>
                <input
                  required type="number" step="0.01" min="0" placeholder="2400.00" value={form.premiumAmount}
                  onChange={(e) => setForm({ ...form, premiumAmount: e.target.value })}
                  style={fieldInput}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Forma de pagamento</label>
                <select
                  value={form.paymentType}
                  onChange={(e) => setForm({ ...form, paymentType: e.target.value as PaymentType })}
                  style={fieldInput}
                >
                  {PAYMENT_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {form.paymentType === 'PARCELADO' && (
                <div style={{ flex: 1 }}>
                  <label style={fieldLabel}>Parcelas</label>
                  <input
                    required type="number" min="1" placeholder="12" value={form.installments}
                    onChange={(e) => setForm({ ...form, installments: e.target.value })}
                    style={fieldInput}
                  />
                </div>
              )}
            </div>
          </div>

          {form.type === 'AUTO' && (
            <>
              <div style={sectionBox}>
                <span style={sectionTitle}>Coberturas</span>
                {form.coverages.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 2 }}>
                      {i === 0 && <label style={fieldLabel}>Nome</label>}
                      <input
                        placeholder="Colisão" value={c.name}
                        onChange={(e) => updateCoverage(i, { name: e.target.value })}
                        style={fieldInput}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      {i === 0 && <label style={fieldLabel}>LMI</label>}
                      <input
                        type="number" step="0.01" min="0" placeholder="80000" value={c.coverageLimit}
                        onChange={(e) => updateCoverage(i, { coverageLimit: e.target.value })}
                        style={fieldInput}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      {i === 0 && <label style={fieldLabel}>Prêmio</label>}
                      <input
                        type="number" step="0.01" min="0" placeholder="1200.50" value={c.premium}
                        onChange={(e) => updateCoverage(i, { premium: e.target.value })}
                        style={fieldInput}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      {i === 0 && <label style={fieldLabel}>Franquia</label>}
                      <input
                        type="number" step="0.01" min="0" placeholder="2500" value={c.deductible}
                        onChange={(e) => updateCoverage(i, { deductible: e.target.value })}
                        style={fieldInput}
                      />
                    </div>
                    <button
                      type="button" onClick={() => removeCoverage(i)}
                      style={{ padding: '9px 12px', border: '1px solid #c62828', background: '#fff', color: '#c62828', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  type="button" onClick={addCoverage}
                  style={{ padding: '8px 12px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                >
                  + Cobertura
                </button>
              </div>

              <div style={sectionBox}>
                <span style={sectionTitle}>Veículo</span>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Placa</label>
                    <input required placeholder="ABC1D23" value={form.vehicle.plate} onChange={(e) => setVehicle({ plate: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={fieldLabel}>Marca/Modelo</label>
                    <input required placeholder="Fiat Argo 1.3" value={form.vehicle.makeModel} onChange={(e) => setVehicle({ makeModel: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Ano</label>
                    <input required type="number" placeholder="2022" value={form.vehicle.year} onChange={(e) => setVehicle({ year: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Uso</label>
                    <select value={form.vehicle.usageType} onChange={(e) => setVehicle({ usageType: e.target.value })} style={fieldInput}>
                      <option value="PARTICULAR">PARTICULAR</option>
                      <option value="COMERCIAL">COMERCIAL</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Chassi</label>
                    <input placeholder="9BD..." value={form.vehicle.chassis} onChange={(e) => setVehicle({ chassis: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Código FIPE</label>
                    <input placeholder="001234-5" value={form.vehicle.fipeCode} onChange={(e) => setVehicle({ fipeCode: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>CEP de pernoite</label>
                    <input placeholder="01310100" value={form.vehicle.overnightCep} onChange={(e) => setVehicle({ overnightCep: e.target.value })} style={fieldInput} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Gravame/Alienação (opcional)</label>
                    <input placeholder="FINANCIADO" value={form.vehicle.lienStatus} onChange={(e) => setVehicle({ lienStatus: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Antifurto (opcional)</label>
                    <input placeholder="RASTREADOR_SATELITAL" value={form.vehicle.antiTheftDevice} onChange={(e) => setVehicle({ antiTheftDevice: e.target.value })} style={fieldInput} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', marginTop: 18 }}>
                    <input type="checkbox" checked={form.vehicle.taxExempt} onChange={(e) => setVehicle({ taxExempt: e.target.checked })} />
                    Isenção Fiscal
                  </label>
                </div>
              </div>

              <div style={sectionBox}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', marginBottom: form.hasOwner ? 10 : 0 }}>
                  <input type="checkbox" checked={!form.hasOwner} onChange={(e) => setForm({ ...form, hasOwner: !e.target.checked })} />
                  Proprietário é o mesmo que o Segurado
                </label>
                {form.hasOwner && (
                  <>
                    <span style={sectionTitle}>Proprietário</span>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 2 }}>
                        <label style={fieldLabel}>Nome</label>
                        <input value={form.owner.name} onChange={(e) => setOwner({ name: e.target.value })} style={fieldInput} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>CPF/CNPJ</label>
                        <input value={form.owner.document} onChange={(e) => setOwner({ document: e.target.value })} style={fieldInput} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Nascimento</label>
                        <input type="date" value={form.owner.birthDate} onChange={(e) => setOwner({ birthDate: e.target.value })} style={fieldInput} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Sexo</label>
                        <select value={form.owner.sex} onChange={(e) => setOwner({ sex: e.target.value })} style={fieldInput}>
                          <option value="F">F</option>
                          <option value="M">M</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Vínculo com o Segurado</label>
                        <input placeholder="CONJUGE" value={form.owner.relationshipToInsured} onChange={(e) => setOwner({ relationshipToInsured: e.target.value })} style={fieldInput} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div style={sectionBox}>
                <span style={sectionTitle}>Segurado (Apólice)</span>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Documento (CPF/CNPJ)</label>
                    <input required value={form.insuredDetails.document} onChange={(e) => setInsuredDetails({ document: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Tipo de Pessoa</label>
                    <select value={form.insuredDetails.personType} onChange={(e) => setInsuredDetails({ personType: e.target.value })} style={fieldInput}>
                      <option value="FISICA">FISICA</option>
                      <option value="JURIDICA">JURIDICA</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Sexo</label>
                    <select value={form.insuredDetails.sex} onChange={(e) => setInsuredDetails({ sex: e.target.value })} style={fieldInput}>
                      <option value="F">F</option>
                      <option value="M">M</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Nascimento</label>
                    <input type="date" value={form.insuredDetails.birthDate} onChange={(e) => setInsuredDetails({ birthDate: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Estado Civil</label>
                    <input placeholder="CASADO" value={form.insuredDetails.maritalStatus} onChange={(e) => setInsuredDetails({ maritalStatus: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Nome Social (opcional)</label>
                    <input value={form.insuredDetails.socialName} onChange={(e) => setInsuredDetails({ socialName: e.target.value })} style={fieldInput} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>Classe Bônus</label>
                    <input placeholder="A" value={form.insuredDetails.bonusClass} onChange={(e) => setInsuredDetails({ bonusClass: e.target.value })} style={fieldInput} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={fieldLabel}>CI</label>
                    <input placeholder="12345678901234" value={form.insuredDetails.ci} onChange={(e) => setInsuredDetails({ ci: e.target.value })} style={fieldInput} />
                  </div>
                </div>
              </div>

              <div style={sectionBox}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#555', marginBottom: form.hasMainDriver ? 10 : 0 }}>
                  <input type="checkbox" checked={form.hasMainDriver} onChange={(e) => setForm({ ...form, hasMainDriver: e.target.checked })} />
                  Possui Condutor Principal distinto do Segurado
                </label>
                {form.hasMainDriver && (
                  <>
                    <span style={sectionTitle}>Condutor Principal</span>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 2 }}>
                        <label style={fieldLabel}>Nome</label>
                        <input value={form.mainDriver.name} onChange={(e) => setMainDriver({ name: e.target.value })} style={fieldInput} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>CPF</label>
                        <input value={form.mainDriver.document} onChange={(e) => setMainDriver({ document: e.target.value })} style={fieldInput} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Nascimento</label>
                        <input type="date" value={form.mainDriver.birthDate} onChange={(e) => setMainDriver({ birthDate: e.target.value })} style={fieldInput} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Sexo</label>
                        <select value={form.mainDriver.sex} onChange={(e) => setMainDriver({ sex: e.target.value })} style={fieldInput}>
                          <option value="M">M</option>
                          <option value="F">F</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={fieldLabel}>Estado Civil</label>
                        <input placeholder="CASADO" value={form.mainDriver.maritalStatus} onChange={(e) => setMainDriver({ maritalStatus: e.target.value })} style={fieldInput} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 5 }}>URL do PDF (opcional)</label>
            <input
              placeholder="https://..." value={form.pdfUrl}
              onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#fff' }}
            />
          </div>
          <button
            type="submit" disabled={creating}
            style={{ width: '100%', padding: 12, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
          >
            {creating ? 'Criando...' : 'Criar Apólice'}
          </button>
        </form>
      )}

      {policies.length === 0 ? (
        <p>Nenhuma apólice encontrada.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: '8px 12px' }}>Seguradora</th>
              <th style={{ padding: '8px 12px' }}>Tipo</th>
              <th style={{ padding: '8px 12px' }}>Status</th>
              <th style={{ padding: '8px 12px' }}>Início → Vencimento</th>
              <th style={{ padding: '8px 12px' }}>Documento</th>
              <th style={{ padding: '8px 12px' }}>Alterar status</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{p.insurer_name}</td>
                <td style={{ padding: '10px 12px', color: '#555' }}>{p.type}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ ...badge, ...badgeStyle[p.status] }}>{p.status}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#777', fontSize: 12 }}>
                  {formatDate(p.start_date)} → {formatDate(p.end_date)}
                </td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#888' }}>
                  {p.document}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select
                      value={statusDraft[p.id] ?? p.status}
                      onChange={(e) => setStatusDraft({ ...statusDraft, [p.id]: e.target.value as PolicyStatus })}
                      style={{ padding: '6px 8px', border: '1px solid #ccc', borderRadius: 6, fontSize: 12, background: '#fff' }}
                    >
                      {POLICY_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => saveStatus(p.id)}
                      disabled={saving === p.id || (statusDraft[p.id] ?? p.status) === p.status}
                      style={{ padding: '6px 12px', border: '1px solid #1a1a2e', background: '#fff', color: '#1a1a2e', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                    >
                      {saving === p.id ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
