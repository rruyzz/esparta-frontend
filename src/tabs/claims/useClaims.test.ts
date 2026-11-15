import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { AdminConfig } from '../../api/adminApi'
import * as api from '../../api/adminApi'
import { describeCreateClaimError, useClaims } from './useClaims'

vi.mock('../../api/adminApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/adminApi')>()),
  listClaims: vi.fn(),
  createClaim: vi.fn(),
  updateClaimStatus: vi.fn(),
  getClaimHistory: vi.fn(),
}))

const config: AdminConfig = { baseUrl: 'http://test', adminKey: 'k' }
const m = vi.mocked(api)

// Mesmo formato que o `request()` do adminApi: `${method} ${path} → ${status}: ${corpo}` (o corpo vem com \n do http.Error).
const apiError = (status: number, body: string) => new Error(`POST /v1/admin/claims → ${status}: ${body}\n`)

describe('describeCreateClaimError', () => {
  const casos: [string, Error, string][] = [
    ['apólice vencida', apiError(409, 'policy expired'), 'Esta apólice está vencida e não pode abrir sinistro. Escolha uma apólice vigente.'],
    ['apólice cancelada', apiError(409, 'policy cancelled'), 'Esta apólice está cancelada e não pode abrir sinistro. Escolha uma apólice vigente.'],
    ['segurado inexistente', apiError(404, 'user not found'), 'Nenhum segurado encontrado com esse CPF.'],
    ['apólice de outro CPF', apiError(404, 'policy not found'), 'Essa apólice não pertence ao CPF informado.'],
    ['chave de admin inválida', apiError(403, 'Forbidden'), 'Chave de admin inválida. Confira o campo Admin Key.'],
    ['backend fora do ar ou endereço errado', new TypeError('Failed to fetch'), 'Não foi possível falar com o backend. Confira o endereço no campo Backend.'],
    ['erro desconhecido mantém o texto original', apiError(500, 'Internal Server Error'), 'POST /v1/admin/claims → 500: Internal Server Error'],
  ]
  for (const [nome, erro, esperado] of casos) {
    it(nome, () => expect(describeCreateClaimError(erro)).toBe(esperado))
  }
})

describe('useClaims.create', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    m.listClaims.mockResolvedValue([])
  })

  async function setup() {
    const hook = renderHook(() => useClaims(config))
    await act(async () => {}) // deixa o load() inicial terminar
    act(() => hook.result.current.setShowForm(true))
    act(() => hook.result.current.setForm({ ...hook.result.current.form, document: '52998224725', policyId: 'pol-1', description: 'bati' }))
    return hook
  }
  const submit = (hook: Awaited<ReturnType<typeof setup>>) =>
    act(async () => {
      await hook.result.current.create({ preventDefault: vi.fn() } as unknown as React.FormEvent)
    })

  it('apólice vencida: mostra a mensagem no formulário, mantém o formulário aberto e não usa o erro geral da lista', async () => {
    m.createClaim.mockRejectedValue(apiError(409, 'policy expired'))
    const hook = await setup()
    await submit(hook)

    expect(hook.result.current.createError).toBe('Esta apólice está vencida e não pode abrir sinistro. Escolha uma apólice vigente.')
    expect(hook.result.current.showForm).toBe(true)
    expect(hook.result.current.form.policyId).toBe('pol-1') // o que foi digitado não se perde
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.creating).toBe(false)
  })

  it('sucesso: fecha o formulário, limpa o erro e recarrega a lista', async () => {
    m.createClaim.mockResolvedValue({ id: 'c1' } as never)
    const hook = await setup()
    m.listClaims.mockClear()
    await submit(hook)

    expect(m.createClaim).toHaveBeenCalledWith(config, {
      document: '52998224725', policy_id: 'pol-1', occurrence_type: 'COLISAO', description: 'bati', photo_url: undefined,
    })
    expect(hook.result.current.showForm).toBe(false)
    expect(hook.result.current.createError).toBeNull()
    expect(m.listClaims).toHaveBeenCalledTimes(1)
  })

  it('uma nova tentativa limpa o erro da anterior', async () => {
    m.createClaim.mockRejectedValueOnce(apiError(409, 'policy expired')).mockResolvedValueOnce({ id: 'c1' } as never)
    const hook = await setup()
    await submit(hook)
    expect(hook.result.current.createError).not.toBeNull()

    await submit(hook)
    expect(hook.result.current.createError).toBeNull()
    expect(hook.result.current.showForm).toBe(false)
  })
})
