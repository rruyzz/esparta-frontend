// Gerador de dados plausíveis pra popular o wizard "Cenário Rápido" sem puxar
// dependência externa (sem faker) — mantém o estilo minimalista do projeto.

const FIRST_NAMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Hugo', 'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Patrícia', 'Rafael', 'Sofia', 'Tiago', 'Vitória', 'William']
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Almeida', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha']
const STREETS = ['Rua das Flores', 'Av. Paulista', 'Rua XV de Novembro', 'Rua Sete de Setembro', 'Av. Brasil', 'Rua das Palmeiras', 'Rua São João', 'Av. Rio Branco']
const NEIGHBORHOODS = ['Centro', 'Jardim América', 'Bela Vista', 'Vila Mariana', 'Boa Vista', 'Santa Cecília']
const CITIES: [string, string][] = [['São Paulo', 'SP'], ['Rio de Janeiro', 'RJ'], ['Belo Horizonte', 'MG'], ['Curitiba', 'PR'], ['Porto Alegre', 'RS'], ['Salvador', 'BA']]
const INSURERS = ['Porto Seguro', 'Bradesco Seguros', 'SulAmérica', 'Azul Seguros', 'Allianz Seguros', 'Tokio Marine']
const MAKES_MODELS = ['Fiat Argo 1.3', 'Chevrolet Onix 1.0', 'Volkswagen Gol 1.6', 'Hyundai HB20 1.0', 'Toyota Corolla 2.0', 'Honda Civic 1.5']

function pick<T>(pool: T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

function randomDigits(n: number): string {
  let s = ''
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10)
  return s
}

function modCheckDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0)
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

// Não há validação de CPF/CNPJ no backend hoje — gerar dígito verificador
// válido só evita um dado visivelmente falso durante os testes manuais.
export function randomCPF(): string {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const d1 = modCheckDigit(base, [10, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = modCheckDigit([...base, d1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2])
  return [...base, d1, d2].join('')
}

export function randomCNPJ(): string {
  const base = [...Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)), 0, 0, 0, 1]
  const d1 = modCheckDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = modCheckDigit([...base, d1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return [...base, d1, d2].join('')
}

export function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
}

export function randomEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]+/g, '.')
  return `${slug}.${Date.now().toString(36)}@teste.esparta.dev`
}

// Senha fixa de dev — mais fácil de reutilizar em teste manual no app do que
// copiar uma gerada aleatoriamente.
export const DEV_PASSWORD = 'Teste@123'

export function randomPhone(): string {
  return `(11) 9${randomDigits(4)}-${randomDigits(4)}`
}

export function randomCEP(): string {
  return randomDigits(8)
}

export function randomAddress() {
  const [city, state] = pick(CITIES)
  return {
    cep: randomCEP(),
    street: pick(STREETS),
    number: String(Math.floor(Math.random() * 2000) + 1),
    complement: '',
    neighborhood: pick(NEIGHBORHOODS),
    city,
    state,
  }
}

export function randomPlate(): string {
  // Formato Mercosul: AAA9A99
  const letter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26))
  const digit = () => Math.floor(Math.random() * 10)
  return `${letter()}${letter()}${letter()}${digit()}${letter()}${digit()}${digit()}`
}

export function randomYear(): number {
  return 2015 + Math.floor(Math.random() * 10)
}

export function randomInsurer(): string {
  return pick(INSURERS)
}

export function randomMakeModel(): string {
  return pick(MAKES_MODELS)
}

export function randomPolicyNumber(): string {
  return randomDigits(9)
}

export function randomEndorsementNumber(): string {
  return String(Math.floor(Math.random() * 5))
}

export function randomPdfUrl(prefix: string): string {
  return `https://example.com/${prefix}-${randomDigits(6)}.pdf`
}

export function randomPremium(): number {
  return Math.round((Math.random() * 3000 + 500) * 100) / 100
}

export function daysFromNow(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000
}

export function toDateInputValue(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10)
}
