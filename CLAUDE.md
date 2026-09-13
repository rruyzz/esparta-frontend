# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev      # dev server em http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # ESLint
npm run preview  # serve o build de produção localmente
```

Não há testes automatizados; verificação é pelo TypeScript (`tsc -b`) e ESLint.

## Arquitetura

Painel admin React + Vite + TypeScript. Single-page app sem roteador — navegação é feita por estado (`activeTab` em `App.tsx`).

**Fluxo de dados:**
```
App.tsx (AdminConfig state)
  └── Tab components (UsersTab, PoliciesTab, ClaimsTab, QuotesTab, ScenarioTab)
        └── src/api/adminApi.ts  ← único ponto de acesso ao backend
              └── GET/POST/PATCH /v1/admin/*
```

`AdminConfig` (`baseUrl` + `adminKey`) é criado em `App.tsx` e passado por props para cada tab. Componentes **nunca** chamam `fetch` diretamente; sempre delegam para funções de `adminApi.ts`.

**`src/api/adminApi.ts`** — equivalente ao Repository no KMM: todas as funções da API admin estão aqui. A helper interna `request<T>()` injeta o header `X-Admin-Key` e lança erro se `!res.ok`.

**`src/types/index.ts`** — interfaces TypeScript espelhando os `json:` tags Go (snake_case). Datas são epoch ms (número). Nunca adicionar lógica aqui — só tipos.

**`src/tabs/<recurso>/`** — uma pasta por recurso (`users/`, `policies/`, `claims/`, `quotes/`), cada uma com o par:

- `use<Recurso>.ts` — hook que concentra estado (`useState`) e handlers (`load`, `create`, `save`, etc.), consumindo `adminApi.ts`. Equivalente a um ViewModel/Presenter no Android: dono da lógica, sem JSX.
- `<Recurso>Tab.tsx` — componente funcional "burro": só desestrutura o retorno de `use<Recurso>(config)` e renderiza. Não declara `useState` de dados nem chama `adminApi.ts` diretamente. Padrão uniforme: estados `loading`, `error`, dados vindos do hook.

Um hook pode exportar uma função pura de montagem de payload (ex.: `toCreatePolicyPayload` em `usePolicies.ts`) pra ser reaproveitada por outro fluxo sem duplicar o mapeamento — foi assim que o wizard abaixo reaproveitou o payload `AUTO` aninhado da Apólice.

**`src/tabs/scenario/`** — exceção ao padrão "uma pasta por recurso": `useScenario.ts` + `ScenarioTab.tsx` não fazem CRUD de uma entidade só, e sim orquestram a cadeia conta→veículo→cotação→proposta→apólice num fluxo único (wizard "Cenário Rápido" pra gerar dados de teste em dev local), chamando várias funções de `adminApi.ts` em sequência. Mesmo par hook+view, escopo diferente.

**`src/tabs/shared/`** — componentes de apresentação usados por mais de um recurso (ex: `StatusHistory.tsx`, usado por Claims e Quotes). Só vira compartilhado na segunda ocorrência do mesmo padrão — não antecipar.

**`src/lib/`** — helpers puros sem estado, reaproveitáveis por qualquer tab (ex.: `fakeData.ts`, gerador de dados de teste plausíveis usado pelo wizard `scenario/`). Diferente de `src/tabs/shared/`: aqui não tem JSX, só funções.

## Convenções

- JSON snake_case em toda a stack — bater com os `json:` tags do Go.
- Styling inline via `style={{}}` — sem CSS modules, sem Tailwind, sem styled-components.
- Autenticação: `X-Admin-Key: esparta-admin-2026` (configurável pelo usuário no header do app).
- Ao adicionar um novo recurso, criar `src/tabs/<recurso>/use<Recurso>.ts` (hook com estado/lógica) + `src/tabs/<recurso>/<Recurso>Tab.tsx` (view), adicionar as funções em `adminApi.ts`, registrar o tipo em `types/index.ts`, e adicionar a entry em `TABS` no `App.tsx`.
- `color-scheme` em `index.css` é fixado como `light` — o admin não tem modo escuro; deixar `light dark` faz o navegador estilizar `<input>`/`<select>` nativos com texto claro em fundo escuro, invisível sobre o fundo branco forçado inline.
