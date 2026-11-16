/**
 * "Válida até" vale até o FIM do dia escolhido (decisão do Rodolfo, 15/11/2026): 23:59:59.999 no fuso do navegador
 * de quem usa o painel. Gravar a data às 0h (o que `new Date('2026-12-01')` faz) expirava a cotação antes de o dia
 * começar. Recebe o valor de um `<input type="date">` (`AAAA-MM-DD`).
 */
export function endOfDayMs(dateInput: string): number {
  const [year, month, day] = dateInput.split('-').map(Number)
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime()
}
