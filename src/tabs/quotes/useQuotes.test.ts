import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { AdminConfig } from '../../api/adminApi'
import type { Quote } from '../../types'
import * as api from '../../api/adminApi'
import { describeCopyQuoteError, useQuotes } from './useQuotes'

vi.mock('../../api/adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/adminApi')>()),
  listQuotes: vi.fn(),
  updateQuoteStatus: vi.fn(),
  copyQuoteAdmin: vi.fn(),
}))

const config: AdminConfig = { baseUrl: 'http://test', adminKey: 'k' }
const m = vi.mocked(api)
const apiError = (status: number, body: string) => new Error(`POST /v1/admin/quotes/q1/copy → ${status}: ${body}\n`)

describe('describeCopyQuoteError', () => {
  const casos: [string, Error, string][] = [
    ['cotação que não expirou', apiError(409, 'quote not expired'), 'Só uma cotação expirada pode ser copiada.'],
    ['cotação inexistente', apiError(404, 'Quote not found'), 'Cotação não encontrada.'],
    ['chave de admin inválida', apiError(403, 'Forbidden'), 'Chave de admin inválida. Confira o campo Admin Key.'],
    ['erro desconhecido mantém o texto', apiError(500, 'Internal Server Error'), 'POST /v1/admin/quotes/q1/copy → 500: Internal Server Error'],
  ]
  for (const [nome, erro, esperado] of casos) it(nome, () => expect(describeCopyQuoteError(erro)).toBe(esperado))
})

describe('useQuotes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    m.listQuotes.mockResolvedValue([])
    m.updateQuoteStatus.mockResolvedValue({ id: 'q1' } as never)
  })

  async function setup() {
    const hook = renderHook(() => useQuotes(config))
    await act(async () => {}) // deixa o load() inicial terminar
    return hook
  }

  it('responder grava a validade no FIM do dia escolhido', async () => {
    const hook = await setup()
    act(() => hook.result.current.setPremiumDraft({ q1: '1800' }))
    act(() => hook.result.current.setValidUntilDraft({ q1: '2026-12-01' }))
    await act(async () => { await hook.result.current.respond('q1') })

    expect(m.updateQuoteStatus).toHaveBeenCalledWith(config, 'q1', 'RESPONDIDA', expect.objectContaining({
      premium: 1800,
      valid_until: new Date(2026, 11, 1, 23, 59, 59, 999).getTime(),
    }))
  })

  it('fechar chama a transição FECHADA (também vale para a cotação expirada)', async () => {
    const hook = await setup()
    await act(async () => { await hook.result.current.close('q1') })

    expect(m.updateQuoteStatus).toHaveBeenCalledWith(config, 'q1', 'FECHADA')
  })

  const expirada: Quote = {
    id: 'q1', vehicle_id: 'v1', status: 'EXPIRADA', created_at: 1, notes: 'obs original',
    vehicle_snapshot: { plate: 'ABC1D23', year: 2021, usage_type: 'PARTICULAR', overnight_cep: '01310100' },
    coverages: { comprehensive: true, civil_liability: true, personal_accidents: false, rental_car: false },
    response: { premium: 2100, valid_until: 1 },
  }

  it('abrir a cópia pré-preenche coberturas e observações com os da cotação expirada, sem valor nem validade', async () => {
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))

    expect(hook.result.current.copyingId).toBe('q1')
    expect(hook.result.current.copyDraft).toEqual({
      coverages: expirada.coverages, notes: 'obs original', premium: '', validUntil: '',
    })
  })

  it('copiar sem valor: envia os ajustes, recarrega a lista e deixa a nova cotação aguardando', async () => {
    m.copyQuoteAdmin.mockResolvedValue({ id: 'q2' })
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))
    act(() => hook.result.current.setCopyDraft({ ...hook.result.current.copyDraft, coverages: { ...expirada.coverages, rental_car: true }, notes: 'agora com carro reserva' }))
    m.listQuotes.mockClear()
    await act(async () => { await hook.result.current.submitCopy('q1') })

    expect(m.copyQuoteAdmin).toHaveBeenCalledWith(config, 'q1', {
      coverages: { ...expirada.coverages, rental_car: true }, notes: 'agora com carro reserva',
    })
    expect(m.updateQuoteStatus).not.toHaveBeenCalled()
    expect(m.listQuotes).toHaveBeenCalledTimes(1)
    expect(hook.result.current.notice).toBe('Cotação copiada: a nova cotação está aguardando resposta.')
    expect(hook.result.current.copyingId).toBeNull()
    expect(hook.result.current.error).toBeNull()
  })

  it('copiar com valor e validade: a nova cotação já nasce respondida, com a validade no fim do dia', async () => {
    m.copyQuoteAdmin.mockResolvedValue({ id: 'q2' })
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))
    act(() => hook.result.current.setCopyDraft({ ...hook.result.current.copyDraft, premium: '2400', validUntil: '2026-12-10' }))
    await act(async () => { await hook.result.current.submitCopy('q1') })

    expect(m.updateQuoteStatus).toHaveBeenCalledWith(config, 'q2', 'RESPONDIDA', {
      premium: 2400, valid_until: new Date(2026, 11, 10, 23, 59, 59, 999).getTime(), notes: '',
    })
    expect(hook.result.current.notice).toBe('Cotação copiada e já respondida.')
  })

  it('valor sem validade (ou o contrário) é recusado antes de criar a cópia', async () => {
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))
    act(() => hook.result.current.setCopyDraft({ ...hook.result.current.copyDraft, premium: '2400' }))
    await act(async () => { await hook.result.current.submitCopy('q1') })

    expect(hook.result.current.error).toBe('Informe o valor e a validade juntos, ou deixe os dois em branco.')
    expect(m.copyQuoteAdmin).not.toHaveBeenCalled()
    expect(hook.result.current.copyingId).toBe('q1') // o formulário continua aberto
  })

  it('valor inválido é recusado antes de criar a cópia', async () => {
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))
    act(() => hook.result.current.setCopyDraft({ ...hook.result.current.copyDraft, premium: '0', validUntil: '2026-12-10' }))
    await act(async () => { await hook.result.current.submitCopy('q1') })

    expect(hook.result.current.error).toBe('Valor inválido.')
    expect(m.copyQuoteAdmin).not.toHaveBeenCalled()
  })

  it('a cópia criou mas responder falhou: avisa, mantém a nova cotação aguardando e fecha o formulário', async () => {
    m.copyQuoteAdmin.mockResolvedValue({ id: 'q2' })
    m.updateQuoteStatus.mockRejectedValue(new Error('PATCH /v1/admin/quotes/q2 → 500: boom'))
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))
    act(() => hook.result.current.setCopyDraft({ ...hook.result.current.copyDraft, premium: '2400', validUntil: '2026-12-10' }))
    await act(async () => { await hook.result.current.submitCopy('q1') })

    expect(hook.result.current.notice).toBe('Cotação copiada, mas não foi possível responder. Responda a nova cotação na lista.')
    expect(hook.result.current.error).toContain('500')
    expect(hook.result.current.copyingId).toBeNull()
  })

  it('copiar com erro mostra a frase legível, não avisa sucesso e mantém o formulário aberto', async () => {
    m.copyQuoteAdmin.mockRejectedValue(apiError(409, 'quote not expired'))
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))
    await act(async () => { await hook.result.current.submitCopy('q1') })

    expect(hook.result.current.error).toBe('Só uma cotação expirada pode ser copiada.')
    expect(hook.result.current.notice).toBeNull()
    expect(hook.result.current.copyingId).toBe('q1')
    expect(hook.result.current.saving).toBeNull()
  })

  it('cancelar fecha o formulário sem chamar a API', async () => {
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))
    act(() => hook.result.current.cancelCopy())

    expect(hook.result.current.copyingId).toBeNull()
    expect(m.copyQuoteAdmin).not.toHaveBeenCalled()
  })

  it('uma nova ação limpa o aviso anterior', async () => {
    m.copyQuoteAdmin.mockResolvedValue({ id: 'q2' })
    const hook = await setup()
    act(() => hook.result.current.openCopy(expirada))
    await act(async () => { await hook.result.current.submitCopy('q1') })
    expect(hook.result.current.notice).not.toBeNull()

    await act(async () => { await hook.result.current.close('q1') })
    expect(hook.result.current.notice).toBeNull()
  })
})
