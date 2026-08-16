# Hook por recurso como ViewModel, componente Tab como view pura

Cada tab do painel admin (`UsersTab`, `PoliciesTab`, `ClaimsTab`, `QuotesTab`) misturava estado (`useState`), efeitos (`useEffect`) e handlers de API no mesmo componente que também renderizava o JSX, sem separação entre lógica e apresentação. Decidimos extrair estado e handlers de cada recurso para um hook dedicado `use<Recurso>.ts` (consumindo `adminApi.ts`, sem JSX), deixando `<Recurso>Tab.tsx` como componente puro que só desestrutura o retorno do hook e renderiza. Cada par mora junto em `src/tabs/<recurso>/`. A decisão foi validada com um protótipo comparando as duas versões do `UsersTab` (estado local vs. hook) antes de replicar para os outros 3 tabs.

## Consequences

Ao contrário do `ViewModel` do Android (que sobrevive à desmontagem/rotação via `viewModelScope`), o hook React não tem instância persistente — é reuso de lógica, não de objeto. O estado se perde se o componente desmontar; não presumir paridade total com o padrão Android ao ler este código.
