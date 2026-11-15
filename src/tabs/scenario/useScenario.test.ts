import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { AdminConfig } from '../../api/adminApi'
import * as api from '../../api/adminApi'
import { useScenario } from './useScenario'

// Só a camada de rede é falsa: o hook inteiro (estado, ordem dos passos, regras de "pulado") roda de verdade.
vi.mock('../../api/adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/adminApi')>()),
  createUser: vi.fn(),
  updateUserProfile: vi.fn(),
  createVehicleAdmin: vi.fn(),
  createQuoteAdmin: vi.fn(),
  updateQuoteStatus: vi.fn(),
  createProposal: vi.fn(),
  updateProposalStatus: vi.fn(),
  createPolicy: vi.fn(),
}))

const config: AdminConfig = { baseUrl: 'http://test', adminKey: 'k' }
const m = vi.mocked(api)

beforeEach(() => {
  vi.resetAllMocks()
  m.createUser.mockResolvedValue({ uid: 'uid-1' } as never)
  m.updateUserProfile.mockResolvedValue({ uid: 'uid-1' } as never)
  m.createVehicleAdmin.mockResolvedValue({ id: 'veh-1' } as never)
  m.createQuoteAdmin.mockResolvedValue({ id: 'quote-1' } as never)
  m.updateQuoteStatus.mockResolvedValue({ id: 'quote-1' } as never)
  m.createProposal.mockResolvedValue({ id: 'prop-1' } as never)
  m.updateProposalStatus.mockResolvedValue({ id: 'prop-1' } as never)
  m.createPolicy.mockResolvedValue({ id: 'pol-1' } as never)
})

function setup() {
  const hook = renderHook(() => useScenario(config))
  // Os setters usam o estado do render atual: cada chamada precisa do seu próprio act.
  const set = (fn: (r: ReturnType<typeof useScenario>) => void) => act(() => fn(hook.result.current))
  set((r) => r.setAccount({ name: 'Fulano', email: 'f@t.dev', document: '52998224725' }))
  return { ...hook, set }
}

async function run(hook: ReturnType<typeof setup>) {
  await act(async () => {
    await hook.result.current.runScenario()
  })
  return hook.result.current.log
}

const steps = (log: { step: string }[]) => log.map((l) => l.step)

describe('useScenario.runScenario', () => {
  it('só conta: cria o usuário, grava o endereço e termina', async () => {
    const hook = setup()
    const log = await run(hook)

    expect(m.createUser).toHaveBeenCalledWith(config, expect.objectContaining({
      email: 'f@t.dev', document: '52998224725', person_type: 'FISICA',
    }))
    expect(m.updateUserProfile).toHaveBeenCalledWith(config, 'uid-1', expect.objectContaining({ phone: undefined }))
    expect(steps(log)).toEqual(['Conta', 'Endereço'])
    expect(log.every((l) => l.status === 'ok')).toBe(true)
    expect(m.createVehicleAdmin).not.toHaveBeenCalled()
    expect(hook.result.current.running).toBe(false)
  })

  it('falha ao criar a conta interrompe tudo, mesmo com os outros passos ligados', async () => {
    m.createUser.mockRejectedValue(new Error('e-mail já existe'))
    const hook = setup()
    hook.set((r) => r.setVehicle({ enabled: true, plate: 'ABC1D23', year: '2020', overnightCep: '01310100' }))
    hook.set((r) => r.setPolicyEnabled(true))
    const log = await run(hook)

    expect(log).toEqual([{ step: 'Conta', status: 'error', message: 'e-mail já existe' }])
    expect(m.updateUserProfile).not.toHaveBeenCalled()
    expect(m.createVehicleAdmin).not.toHaveBeenCalled()
    expect(m.createPolicy).not.toHaveBeenCalled()
    expect(hook.result.current.running).toBe(false)
  })

  it('falha ao gravar o endereço não interrompe os passos seguintes', async () => {
    m.updateUserProfile.mockRejectedValue(new Error('422'))
    const hook = setup()
    hook.set((r) => r.setVehicle({ enabled: true, plate: 'ABC1D23', year: '2020', overnightCep: '01310100' }))
    const log = await run(hook)

    expect(log[1]).toEqual({ step: 'Endereço', status: 'error', message: '422' })
    expect(steps(log)).toContain('Veículo')
    expect(m.createVehicleAdmin).toHaveBeenCalled()
  })

  it('veículo: converte o ano para número e usa o documento da conta', async () => {
    const hook = setup()
    hook.set((r) => r.setVehicle({ enabled: true, plate: 'ABC1D23', year: '2021', overnightCep: '01310100' }))
    await run(hook)

    expect(m.createVehicleAdmin).toHaveBeenCalledWith(config, {
      document: '52998224725', plate: 'ABC1D23', year: 2021, usage_type: 'PARTICULAR', overnight_cep: '01310100',
    })
  })

  describe('cotação', () => {
    const withQuote = (hook: ReturnType<typeof setup>, targetStatus: 'AGUARDANDO' | 'RESPONDIDA' | 'FECHADA') => {
      hook.set((r) => r.setVehicle({ enabled: true, plate: 'ABC1D23', year: '2020', overnightCep: '01310100' }))
      hook.set((r) => r.setQuote({ enabled: true, targetStatus, premium: '1500.5' }))
    }

    it('sem veículo criado, a cotação é pulada e não chama a API', async () => {
      const hook = setup()
      hook.set((r) => r.setQuote({ enabled: true }))
      const log = await run(hook)

      expect(log.at(-1)).toEqual({ step: 'Cotação', status: 'error', message: 'pulado: precisa de um veículo criado' })
      expect(m.createQuoteAdmin).not.toHaveBeenCalled()
    })

    it('se o veículo falhou, a cotação também é pulada', async () => {
      m.createVehicleAdmin.mockRejectedValue(new Error('placa inválida'))
      const hook = setup()
      withQuote(hook, 'FECHADA')
      const log = await run(hook)

      expect(steps(log)).toEqual(['Conta', 'Endereço', 'Veículo', 'Cotação'])
      expect(log.at(-1)?.message).toMatch(/pulado/)
      expect(m.createQuoteAdmin).not.toHaveBeenCalled()
    })

    it('AGUARDANDO: cria e não muda o status', async () => {
      const hook = setup()
      withQuote(hook, 'AGUARDANDO')
      await run(hook)

      expect(m.createQuoteAdmin).toHaveBeenCalledTimes(1)
      expect(m.updateQuoteStatus).not.toHaveBeenCalled()
    })

    it('RESPONDIDA: uma transição, com o prêmio convertido para número', async () => {
      const hook = setup()
      withQuote(hook, 'RESPONDIDA')
      await run(hook)

      expect(m.updateQuoteStatus).toHaveBeenCalledTimes(1)
      expect(m.updateQuoteStatus).toHaveBeenCalledWith(config, 'quote-1', 'RESPONDIDA', expect.objectContaining({ premium: 1500.5 }))
    })

    it('FECHADA: passa por RESPONDIDA e depois FECHADA, nessa ordem', async () => {
      const hook = setup()
      withQuote(hook, 'FECHADA')
      const log = await run(hook)

      expect(m.updateQuoteStatus).toHaveBeenCalledTimes(2)
      expect(m.updateQuoteStatus).toHaveBeenNthCalledWith(1, config, 'quote-1', 'RESPONDIDA', expect.anything())
      expect(m.updateQuoteStatus).toHaveBeenNthCalledWith(2, config, 'quote-1', 'FECHADA')
      expect(steps(log)).toEqual(['Conta', 'Endereço', 'Veículo', 'Cotação', 'Cotação → RESPONDIDA', 'Cotação → FECHADA'])
    })

    it('prêmio vazio vira 0, e não NaN', async () => {
      const hook = setup()
      hook.set((r) => r.setVehicle({ enabled: true, plate: 'ABC1D23', year: '2020', overnightCep: '01310100' }))
      hook.set((r) => r.setQuote({ enabled: true, targetStatus: 'RESPONDIDA', premium: '' }))
      await run(hook)

      expect(m.updateQuoteStatus).toHaveBeenCalledWith(config, 'quote-1', 'RESPONDIDA', expect.objectContaining({ premium: 0 }))
    })

    it('erro ao responder a cotação é registrado e não derruba os passos seguintes', async () => {
      m.updateQuoteStatus.mockRejectedValue(new Error('transição inválida'))
      const hook = setup()
      withQuote(hook, 'FECHADA')
      hook.set((r) => r.setPolicyEnabled(true))
      const log = await run(hook)

      expect(log.find((l) => l.status === 'error')).toEqual({ step: 'Cotação', status: 'error', message: 'transição inválida' })
      expect(m.createPolicy).toHaveBeenCalled()
    })
  })

  describe('proposta', () => {
    const withProposal = (hook: ReturnType<typeof setup>, quoteTarget: 'RESPONDIDA' | 'FECHADA', propTarget: 'GERADA' | 'ENVIADA' | 'ASSINADA') => {
      hook.set((r) => r.setVehicle({ enabled: true, plate: 'ABC1D23', year: '2020', overnightCep: '01310100' }))
      hook.set((r) => r.setQuote({ enabled: true, targetStatus: quoteTarget }))
      hook.set((r) => r.setProposal({ enabled: true, pdfUrl: 'https://x/p.pdf', proposedPremium: '900', targetStatus: propTarget }))
    }

    it('só existe com cotação FECHADA: com RESPONDIDA é pulada', async () => {
      const hook = setup()
      withProposal(hook, 'RESPONDIDA', 'GERADA')
      const log = await run(hook)

      expect(log.at(-1)).toEqual({ step: 'Proposta', status: 'error', message: 'pulado: precisa de uma cotação FECHADA' })
      expect(m.createProposal).not.toHaveBeenCalled()
    })

    it('GERADA: cria e não muda o status', async () => {
      const hook = setup()
      withProposal(hook, 'FECHADA', 'GERADA')
      await run(hook)

      expect(m.createProposal).toHaveBeenCalledWith(config, expect.objectContaining({ quote_id: 'quote-1', proposed_premium: 900 }))
      expect(m.updateProposalStatus).not.toHaveBeenCalled()
    })

    it('ENVIADA: uma transição', async () => {
      const hook = setup()
      withProposal(hook, 'FECHADA', 'ENVIADA')
      await run(hook)

      expect(m.updateProposalStatus).toHaveBeenCalledTimes(1)
      expect(m.updateProposalStatus).toHaveBeenCalledWith(config, 'prop-1', 'ENVIADA')
    })

    it('ASSINADA: passa por ENVIADA e depois ASSINADA', async () => {
      const hook = setup()
      withProposal(hook, 'FECHADA', 'ASSINADA')
      await run(hook)

      expect(m.updateProposalStatus).toHaveBeenNthCalledWith(1, config, 'prop-1', 'ENVIADA')
      expect(m.updateProposalStatus).toHaveBeenNthCalledWith(2, config, 'prop-1', 'ASSINADA')
    })
  })

  it('apólice: usa o documento da conta, mesmo que o formulário da apólice tenha outro', async () => {
    const hook = setup()
    hook.set((r) => r.setPolicy({ ...r.policy, document: '00000000000' }))
    hook.set((r) => r.setPolicyEnabled(true))
    await run(hook)

    expect(m.createPolicy).toHaveBeenCalledTimes(1)
    expect(m.createPolicy.mock.calls[0][1]).toMatchObject({ document: '52998224725' })
  })

  it('um novo run limpa o log anterior e running volta a false', async () => {
    const hook = setup()
    await run(hook)
    expect(hook.result.current.log).toHaveLength(2)

    m.createUser.mockRejectedValue(new Error('x'))
    await run(hook)
    expect(hook.result.current.log).toEqual([{ step: 'Conta', status: 'error', message: 'x' }])
    expect(hook.result.current.running).toBe(false)
  })
})

describe('useScenario: dados aleatórios', () => {
  it('randomizeAccount gera CNPJ (14 dígitos) para JURIDICA e CPF (11) para FISICA', () => {
    const { result } = renderHook(() => useScenario(config))
    const digits = (s: string) => s.replace(/\D/g, '')

    act(() => result.current.randomizeAccount())
    expect(digits(result.current.account.document)).toHaveLength(11)
    expect(result.current.account.email).toContain('@')

    act(() => result.current.setAccount({ personType: 'JURIDICA' }))
    act(() => result.current.randomizeAccount())
    expect(digits(result.current.account.document)).toHaveLength(14)
  })

  it('randomizeVehicle reaproveita o CEP do endereço da conta', () => {
    const { result } = renderHook(() => useScenario(config))
    act(() => result.current.setAddress({ cep: '01310100' }))
    act(() => result.current.randomizeVehicle())
    expect(result.current.vehicle.overnightCep).toBe('01310100')
  })

  it('setAddress preserva o resto da conta', () => {
    const { result } = renderHook(() => useScenario(config))
    act(() => result.current.setAccount({ name: 'Ana' }))
    act(() => result.current.setAddress({ city: 'Recife' }))
    expect(result.current.account.name).toBe('Ana')
    expect(result.current.account.address.city).toBe('Recife')
  })
})
