import { describe, expect, it } from 'vitest'
import { endOfDayMs } from './dates'

// Decisão do Rodolfo (15/11/2026): "Válida até" vale até o FIM do dia escolhido, e não até a 0h dele.
describe('endOfDayMs', () => {
  it('é 23:59:59.999 do dia escolhido, no fuso do navegador', () => {
    expect(endOfDayMs('2026-12-01')).toBe(new Date(2026, 11, 1, 23, 59, 59, 999).getTime())
  })

  it('fica no mesmo dia: 1ms depois já é o dia seguinte', () => {
    expect(new Date(endOfDayMs('2026-12-01') + 1).getDate()).toBe(2)
    expect(new Date(endOfDayMs('2026-12-01')).getDate()).toBe(1)
  })

  it('vira de mês e de ano', () => {
    expect(endOfDayMs('2026-12-31')).toBe(new Date(2026, 11, 31, 23, 59, 59, 999).getTime())
    expect(endOfDayMs('2027-01-01')).toBe(new Date(2027, 0, 1, 23, 59, 59, 999).getTime())
  })

  it('é maior que a 0h do mesmo dia (o que o painel gravava antes)', () => {
    expect(endOfDayMs('2026-12-01')).toBeGreaterThan(new Date('2026-12-01').getTime())
  })
})
