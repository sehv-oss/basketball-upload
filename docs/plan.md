<!-- cspell:ignore baskteball memoizado sobrescrevíveis claude -->

# Plano — `basketball-upload`: upload por drag and drop com tema de basquete

## Contexto

Implementação fiel, em código aberto, do design de upload de arquivos "basquete" publicado no Figma Community por **Jorge Molina** — GitHub [jm-fuster](https://github.com/jm-fuster), Figma [@jm_fuster](https://www.figma.com/@jm_fuster), site [jorgemolinafuster.com](https://jorgemolinafuster.com).

No design, o dropzone é a tabela, o quadrado laranja é o alvo, o aro fica na borda inferior do dropzone e a rede pende abaixo dele. O usuário pode soltar arquivos ou **arremessar** um card de arquivo na cesta ("Drag and drop, or take the shot.").

O repo já foi criado a partir do template da org e está em `~/dev/repositories/@sehv-oss/basketball-upload`: remote `git@github.com:sehv-oss/basketball-upload.git`, branch `main`, 1 commit. Ele contém `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `LICENSE` (ISC), `SECURITY.md` e um `README.md` que ainda é o checklist do template.

**Entregáveis:**

- **`@sehv-oss/basketball-upload`** (core): Web Component `<basketball-upload>`, Shadow DOM, CSS com cascade layers, tokens e temas.
- **`@sehv-oss/basketball-upload-react`**: wrapper React 19 que consome o core.
- **`site/`**: site de demonstração no GitHub Pages (`https://sehv-oss.github.io/basketball-upload/`), no formato do `sehv-oss/i18n`.
- **Ferramentas:** Node 26 + corepack + pnpm, e os pacotes da org (`@sehv-oss/typescript-config`, `@sehv-oss/cspell-config`, `@sehv-oss/prettier-config`).

**Decisões tomadas com o usuário:**

- **Nome:** `basketball-upload`. A pasta local antiga `dnd-baskteball` (com erro de digitação) é só rascunho com os screenshots em `xd/`.
- **Arremesso: estilingue.** O usuário puxa o card para trás, o arco pontilhado mostra a trajetória **exata** e o arremesso acontece ao soltar. Errar é possível.
- **Dois pacotes + site**, no formato do `sehv-oss/i18n` (`packages/core`, `packages/react`, `site/`).
- **Site com CSS moderno próprio**, sem Tailwind (diferente do i18n): `@layer`, nesting, tokens e `light-dark()`. O site usa a mesma abordagem que o componente defende.
- **Customização por tipo de arquivo:** `registerFileType()` global + propriedade `fileTypes` por instância, que vence o global, com defaults embutidos (§2.5).

---

## 0. Referências da org (reusar, não reinventar)

| O quê                            | Repo `sehv-oss/…`                              | Como usar aqui                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Monorepo core + react + site** | `i18n`                                         | É a referência de estrutura. Root `@sehv-oss/i18n-monorepo` privado. `pnpm-workspace.yaml` com lista explícita de pacotes, `allowBuilds: { esbuild: false }`, `engineStrict: true` e `catalog:`. O changeset ignora o site. `packages/*` com `LICENSE` próprio, `homepage`, `bugs` e `repository.directory`. Testes em `packages/*/tests/` com Vitest `projects` (node + browser via Playwright). Site em `site/` com Vite + React + shiki: header com nav, hero, install tabs, seções com demo ao vivo + código, footer. Deploy das Pages no job `pages` do `publish.yaml` |
| Web Component + adapter React    | `pdf-viewer`                                   | Copiar e adaptar: o plugin `cssText()` do `tsdown.config.ts`; `register.ts` idempotente e seguro em SSR; `BaseElement` substituto sem DOM; `getStyleSheet()` lazy e compartilhado; padrão de tokens `--x-*` → `--_*`; adapter React (`createElement(tagName)`, listeners via `ref` de callbacks, props-objeto em `useLayoutEffect`); dev do site rodando a partir de `src/` (aliases, `.css` → `?raw`, full-reload, no `apps/playground/vite.config.ts`); ADRs em `docs/adr/`                                                                                               |
| Presets TS                       | `typescript-config`                            | `web/lib` (pacotes), `web/app` (site), `node/app` (configs .ts), `layer/react`, `layer/test`. Imports relativos com `.ts`, apenas sintaxe apagável (sem `enum`)                                                                                                                                                                                                                                                                                                                                                                                                             |
| CSpell / Prettier                | `cspell-config` (+`/pt-br`), `prettier-config` | `.cspell.config.ts` importa as duas configs (o site terá labels pt-BR); `.prettier.config.ts` reexporta a config                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| CI                               | `actions` (`@v1`)                              | `pull-request-node-pnpm` e `release-node-pnpm` (`eslint: false`, pois a org não tem config de ESLint; `test` + `test-setup` ligados), `publish-node-pnpm` e `deploy-pages-node-pnpm` (inputs **`build-script`** e `output-path`, conferido no remoto em 2026-10-06)                                                                                                                                                                                                                                                                                                         |

**Versões (exatas no `catalog:`, conferidas em 2026-10-06; rode `pnpm view` de novo ao implementar):**

- **Build e TS:** typescript 7.0.2 · tsdown 0.23.0 · vite 8.3.3 · @vitejs/plugin-react 6.1.2.
- **Testes:** vitest 5.0.3 · @vitest/browser-playwright 5.0.3 · @vitest/coverage-v8 5.0.3 · playwright 1.63.0 · vitest-browser-react 2.3.0.
- **React e tipos:** react/react-dom 19.3.0 · @types/react(-dom) 19.3.0 · @types/node 26.6.4.
- **Lint e release:** cspell 10.3.6 · prettier 3.9.9 · @changesets/cli 3.0.3.
- **Configs da org:** @sehv-oss/cspell-config 1.1.1 · @sehv-oss/prettier-config 1.0.2 · @sehv-oss/typescript-config 0.0.1.
- **Só no site:** shiki 4.5.0 · @fontsource-variable/inter 5.3.0.
- **Gerenciador:** **pnpm 11.26.0**, igual à org (o 12.9.1 existe, mas migrar é uma decisão para a org inteira).

---

## 1. Estrutura do repositório

```
basketball-upload/                       (repo já criado; ✚ = adicionar)
├── .changeset/ ✚          config.json (do i18n: ignore o site) + changeset inicial (minor) dos 2 pacotes
├── .github/
│   ├── ISSUE_TEMPLATE/, PULL_REQUEST_TEMPLATE.md   (já existem)
│   └── workflows/ ✚       pull-request.yaml, release.yaml, publish.yaml (com o job `pages`)
├── .vscode/ ✚             extensions.json (+ vitest.explorer), settings.json
├── docs/ ✚
│   ├── adr/               0001…0007 + README
│   └── design/reference/  os 8 screenshots de xd/, renomeados (§7)
├── packages/ ✚
│   ├── core/              @sehv-oss/basketball-upload        (src/, tests/, LICENSE, NOTICE.md, README.md)
│   └── react/             @sehv-oss/basketball-upload-react  (src/, tests/, LICENSE, NOTICE.md, README.md)
├── site/ ✚                @sehv-oss/basketball-upload-site (privado)
├── .cspell.config.ts .prettier.config.ts .prettierignore .gitignore .nvmrc(v26) ✚
├── package.json ✚         @sehv-oss/basketball-upload-monorepo, privado
├── pnpm-workspace.yaml ✚  packages: [packages/core, packages/react, site] + allowBuilds + engineStrict + catalog
├── tsconfig.node.json ✚   node/app → vitest.config.ts, .cspell/.prettier configs, tsdown.config.ts, site/vite.config.ts
├── vitest.config.ts ✚
├── NOTICE.md ✚            créditos do design (§7)
└── README.md              substituir o checklist do template pelo README do projeto, depois de cumprir o checklist (§8)
```

**Scripts da raiz** (`packageManager: "pnpm@11.26.0+sha512…"` via `corepack use pnpm@11.26.0`; `engines.node: ">=24 <27"`):

```jsonc
"build": "tsc --project tsconfig.node.json && pnpm --recursive build",  // ordem topológica: core → react → site
"test": "vitest run",
"test:setup": "pnpm exec playwright install chromium --with-deps",
"test:coverage": "vitest run --coverage",
"lint": "pnpm lint:cspell && pnpm lint:prettier",
"lint:cspell": "cspell --config .cspell.config.ts .",
"lint:prettier": "prettier --config .prettier.config.ts --check .",
"site:dev": "pnpm --filter @sehv-oss/basketball-upload-site dev",
"clean": "git clean -fdX",
"changeset": "changeset", "changeset:version": "changeset version", "changeset:publish": "changeset publish"
```

**Build e type-check por pacote:**

- Pacotes: `"build": "tsc --project tsconfig.json && tsdown"`. O CI só roda `pnpm build` (ADR 0005 do pdf-viewer), então o tsc vai junto no build.
- Site: `"build": "tsc --project tsconfig.json && vite build"`.

**Workflows:**

- `pull-request.yaml` e `release.yaml` chamam os reutilizáveis com `eslint: false`; testes e test-setup ficam ligados.
- `publish.yaml` é igual ao do i18n: o job `check` exige um commit `chore: release`; o job `packages` publica; o job `pages` usa `deploy-pages-node-pnpm.yaml@v1` com `build-script: pnpm build` e `output-path: ./site/dist/`.

---

## 2. Pacote core — `@sehv-oss/basketball-upload` (`packages/core`)

### 2.1 Arquivos

Convenções: o módulo de entrada tem o nome da pasta (nunca `index.ts`), imports relativos usam `.ts`, e o código puro não toca o DOM. Os testes ficam em `tests/` espelhando `src/`, como no i18n.

```
packages/core/
├── package.json     exports {".": dist/basketball-upload.{js,d.ts}, "./package.json"} (alinhar com a saída real do tsdown),
│                    sideEffects:false, files:[dist, NOTICE.md], homepage/bugs/repository.directory, contributors (§7)
├── tsconfig.json    extends web/lib; include src
├── tsconfig.tests.json  web/lib + layer/test; include src, tests
├── tsdown.config.ts entry {'basketball-upload': 'src/basketball-upload.ts'}, esm, platform browser, target es2022,
│                    dts+sourcemap, plugin cssText() (do pdf-viewer)
├── src/
│   ├── basketball-upload.ts           entrada pública
│   ├── css.d.ts
│   ├── game/      (puro)           config.ts, vector.ts, court.ts, simulate.ts, slingshot.ts
│   ├── upload/    (puro)           types.ts, UploadQueue.ts, accept.ts, format.ts, xhr.ts
│   ├── file-types/ (puro)          types.ts, defaults.ts, registry.ts (registerFileType + resolveFileType)
│   └── element/
│       ├── BasketballUploadElement.ts, register.ts, labels.ts, dom.ts
│       ├── views/                  Header, Hoop, FileCard, Trajectory, UploadList, ScorePop, LiveRegion
│       ├── controllers/            ShotController, DropController, FormController
│       └── styles/                 layers.css tokens.css reset.css layout.css hoop.css card.css list.css
│                                   states.css motion.css + styles.ts
└── tests/        game/*.test.ts, upload/*.test.ts, file-types/*.test.ts (node)
                  element/*.browser.test.ts (chromium)
```

### 2.2 API do elemento

|                                              |                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tag/classe**                               | `<basketball-upload>` / `BasketballUploadElement`; `registerBasketballUpload({ tagName })` é explícito, idempotente e não faz nada em SSR                                                                                                                                                                                                                       |
| **Atributos** (refletidos)                   | `theme` (`light`/`dark`/`system`), `accept`, `multiple`, `max-size` (bytes), `max-files`, `name`, `required`, `disabled`, `instant` (sem arremesso: tudo entra direto), `concurrency` (padrão 3)                                                                                                                                                                |
| **Propriedades-objeto**                      | `uploader: Uploader \| null`, `labels: Partial<Labels>`, `fileTypes: readonly FileType[]`                                                                                                                                                                                                                                                                       |
| **Somente leitura**                          | `items`, `score`, `files`, `form`, `validity`, `validationMessage`                                                                                                                                                                                                                                                                                              |
| **Métodos**                                  | `openPicker()`, `stage(files)` (vira card na quadra), `dunk(files)` (entra direto), `shoot()` (arremesso assistido do card do topo), `retry(id)`, `remove(id)`, `clear()`                                                                                                                                                                                       |
| **Eventos** (`CustomEvent`, `bubbles: true`) | `file-reject` {file, reason: `type`/`size`/`count`}, `shot` {file, result: `score`/`miss`}, `upload-start`/`upload-progress`/`upload-success`/`upload-error` {item, …}, `change` {items}                                                                                                                                                                        |
| **Slots**                                    | `title` ("Upload files"), `description` ("Drag and drop, or take the shot."), `prompt` ("Drop files here"), `hint` ("or take the shot")                                                                                                                                                                                                                         |
| **Parts**                                    | `header`, `title`, `description`, `counter`, `counter-label`, `counter-value`, `dropzone`, `dropzone-icon`, `prompt`, `hint`, `backboard-square`, `rim`, `net`, `file` + `file-<kind>`, `file-badge`, `file-artwork`, `trajectory`, `score-pop`, `list`, `item`, `item-icon` + `item-icon-<kind>`, `item-name`, `item-size`, `item-status`, `progress`, `retry` |
| **Custom states** (`:state()`)               | `dragging`, `drop-target`, `aiming`, `flying`, `scoring`, `rejected`, `disabled`                                                                                                                                                                                                                                                                                |

```ts
type Uploader = (
  file: File,
  ctx: {
    signal: AbortSignal;
    onProgress: (loaded: number, total?: number) => void;
  }
) => Promise<unknown>;
// UploadStatus: 'uploading' | 'uploaded' | 'error' | 'ready' (ready = sem uploader; o arquivo só vai no form)
```

- **Formulário (padrão web):** `static formAssociated = true`. `setFormValue(FormData)` recebe os arquivos aceitos sob `name`. `required` usa `setValidity({ valueMissing })`. `formResetCallback` limpa e `formDisabledCallback` desabilita.
- **Upload:** quem consome passa o `uploader`. O helper `createXhrUploader({ url, method, fieldName, headers, withCredentials })` usa XHR porque `upload.onprogress` é o único jeito confiável de medir progresso de envio. O contador "Uploaded N" conta **cestas** e incrementa no momento da cesta, como no screenshot 06, em que o contador já mostra 1 enquanto a lista diz "Uploading…".
- **Rejeitados** (`accept`/`max-size`/`max-files`): disparam o evento `file-reject`, anunciam na live region, aplicam `:state(rejected)` ao dropzone (shake de 400ms) e não entram na lista.

### 2.3 De onde vêm os arquivos

1. **DnD nativo sobre o dropzone (tabela):** destaque ativo; ao soltar, cada arquivo é **enterrado** (dunk, escalonado em 150ms): o card nasce no ponto do drop, vai até acima do aro e cai pela rede.
2. **DnD nativo na quadra** ou **file picker** (clique/Enter/Espaço no dropzone): os arquivos viram **cards na quadra**, empilhados no canto inferior esquerdo, prontos para o arremesso. Com `instant`, eles entram direto.
3. **Teclado:** o card é um `<button>` ("Shoot final_final_v7.pdf"); Enter/Espaço fazem um **arremesso assistido** (`solveAssistedShot`). Escape cancela a mira.
4. **`prefers-reduced-motion: reduce`:** sem voo nem física. O card some com fade, e a rede e o "+1" ficam só com opacidade.

### 2.4 Física (pura, determinística) — o arco **é** a trajetória

A ADR 0004 registra estas decisões.

- **Passo fixo** `dt = 1/120 s` com acumulador no rAF. A prévia (`previewPath`) e o voo usam a **mesma** `step()`, então os pontos sempre batem com o caminho real.
- **Unidade** `u` = largura do aro em px, medida via `getBoundingClientRect` no `pointerdown` e no `ResizeObserver`. O layout é todo CSS; a física só mede retângulos (`courtFromRects`).
- **Constantes iniciais** (calibradas no screenshot 01, em que os pontos têm Δx constante de ≈19px e Δvy constante de ≈15.5px a cada 1/15 s): gravidade ≈ **21 u/s²**; potência ≈ **12 /s** (velocidade = puxada × potência); puxada máxima **1 u** (com resistência elástica acima disso); puxada mínima **0.12 u** (abaixo disso, cancela); intervalo dos pontos **1/15 s**; raio de colisão **0.25 u × escala**; restituição: aro 0.45, chão 0.35, paredes 0.5. Ajustar no site.
- **Estilingue:** no `pointerdown` sobre o card, chamar `setPointerCapture` e aplicar `touch-action: none`. O host ganha `:state(aiming)` e `cursor: grabbing`. O card segue o ponteiro, limitado e inclinado. A velocidade é `−puxada × potência`. Soltar arremessa.
- **Pseudo-profundidade:** a escala do card vai de 1 → **0.7** até o primeiro evento previsto, reproduzindo os cards cada vez menores nos screenshots 03→06. O card gira com ω proporcional a `vx` (limitado a 180–540°/s).
- **Eventos** (a prévia termina no primeiro, como no screenshot 01, em que os pontos terminam dentro do quadrado):
  - **Quadrado:** o centro entra no quadrado perto do ápice ou descendo. Resultado: `vx *= −0.25`, `vy *= 0.3`, o card cai rente à tabela e tende a entrar.
  - **Bordas do aro:** dois círculos nas pontas, com reflexão pela normal. Cruzar o vão **subindo** conta como bater por baixo.
  - **Cesta:** o centro cruza a linha do aro **descendo** dentro do vão (`|x − centro| < meio-aro − 0.6·r`).
  - **Chão e paredes:** limites do host. Erro = o card quica, volta com mola para a pilha e dispara `shot` com `miss`.
- **Pontos:** `<svg part="trajectory">` com um pool de círculos. Durante o voo, os pontos já percorridos somem (screenshot 02).
- **Sequência da cesta** (roteirizada, para ficar idêntica ao design):
  1. 0–450ms: o card desce pelo centro da rede e fica em pé. A rede faz o swish (`scale: 1 1.18` a partir do topo, ida e volta).
  2. No instante da cesta: "+1" laranja no canto superior direito do quadrado, subindo e sumindo em 900ms. O contador faz um bump. Um item entra na lista com `@starting-style`. O upload começa.
  3. O card pousa abaixo da rede com opacidade ~0.6 (screenshot 06) e some em 400ms.
- **Ordem z** (o card passa atrás da frente do aro e da rede, screenshots 03–05): dropzone/quadrado (0) → aro de trás, mais escuro (1) → cards e trajetória (2) → aro da frente + suporte + rede (3) → "+1" (4). ⚠️ O `.hoop` **não** pode criar stacking context (nada de `transform`, `opacity`, `filter`, `contain` ou `container-type`); o `container-type` fica no host.
- **Destaque do dropzone:** `:state(drop-target)` liga também com o card **em voo** sobre o dropzone ou durante a cesta (03–05), e desliga ao pousar (06).

### 2.5 Customização por tipo de arquivo (ADR 0007)

```ts
interface FileType {
  kind: string;                                   // id estável → data-kind e parts `file-<kind>` / `item-icon-<kind>`
  match: string | ((file: File) => boolean);      // sintaxe de `accept` ('.pdf,application/pdf', 'image/*') ou predicado
  label?: string | ((file: File) => string);      // texto do badge; padrão: extensão em maiúsculas (máx. 4)
  color?: string;                                 // cor do badge/destaque (qualquer cor CSS; light-dark() ok)
  artwork?: 'lines' | 'thumbnail' | ((file: File) => Node); // miolo do card; 'thumbnail' = preview real da imagem
}
registerFileType(type: FileType): () => void      // global; o mais recente vence; retorna a função de unregister
element.fileTypes = [...]                          // por instância; vence o global
export const defaultFileTypes: readonly FileType[]
export function resolveFileType(file: File, instanceTypes?: readonly FileType[]): ResolvedFileType // puro, testado
```

- **Resolução:** instância → global (mais recente primeiro) → defaults → fallback `{ kind: 'file', label: EXT, color: neutro }`. O primeiro match vence. O matching por string reutiliza o `matchesAccept()` de `upload/accept.ts`.
- **Defaults embutidos:**

  | kind      | arquivos                | cor                          | arte                                                   |
  | --------- | ----------------------- | ---------------------------- | ------------------------------------------------------ |
  | `pdf`     | PDF                     | `#d8374e` (medida no design) | linhas                                                 |
  | `image`   | `image/*`               | azul                         | **thumbnail** (object URL, revogada quando o card sai) |
  | `video`   | vídeo                   | roxo                         | linhas                                                 |
  | `audio`   | áudio                   | âmbar                        | linhas                                                 |
  | `sheet`   | csv/xls/xlsx/ods        | verde                        | linhas                                                 |
  | `doc`     | doc/docx/odt/rtf/md/txt | azul escuro                  | linhas                                                 |
  | `slides`  | ppt/pptx/key/odp        | laranja escuro               | linhas                                                 |
  | `archive` | zip/rar/7z/tar/gz       | cinza                        | linhas                                                 |
  | `code`    | json/js/ts/html/css…    | slate                        | linhas                                                 |

  Ajuste as cores finais no site.

- **Override só com CSS:** o card aplica `--_file-color: var(--basketball-upload-file-<kind>, <color>)`, então `:root { --basketball-upload-file-pdf: … }` funciona sem JS. Para o resto, use `::part(file-<kind>)` / `::part(item-icon-<kind>)`.
- **Item da lista:** o ícone usa a mesma resolução (mesma cor/badge; miniatura no caso de imagens).
- **Segurança:** o `label` entra via `textContent` e o nome do arquivo nunca vira HTML. A arte customizada é um `Node` do consumidor. Uma arte SVG em thumbnail é renderizada como `<img>`, que não executa script.

### 2.6 CSS: layers, tokens, temas, CSS moderno (ADR 0003)

- **Uma** `CSSStyleSheet` construída, compartilhada e adotada no Shadow DOM. O consumidor não importa CSS.
- **Layers:** `@layer tokens, reset, layout, components, states, motion;`. `states` (custom states) fica acima de `components`; `motion` contém as keyframes e os overrides de reduced motion.
- **Tokens em 3 camadas:**
  1. Primitivos privados, com a paleta medida.
  2. Públicos `--basketball-upload-*`, lidos **uma vez** em `:host` para privados `--_*` com o default como fallback (padrão do pdf-viewer: um override no elemento ou em qualquer ancestral, inclusive `:root`, funciona).
  3. Regras internas usam só `--_*`.
- **Temas:** `color-scheme: light dark` + `light-dark()` nos defaults, e `:host([theme=light|dark])` força o esquema. Cada token é declarado uma vez. No escuro, o card do arquivo continua "papel" claro.
- **Recursos modernos** (baseline): `@layer`, nesting nativo, `light-dark()`, `oklch()`/`color-mix(in oklab, …)`, propriedades lógicas, container queries/`cqi` (`container-type` no host), `translate`/`rotate`/`scale` individuais (o loop do jogo só escreve essas propriedades), `:state()`, `::part`, `@starting-style`, `:focus-visible`, `tabular-nums`, `text-wrap: balance`. Evitar `@property` dentro do shadow root (é ignorado ali).
- **Tokens públicos:** `background`, `foreground`, `muted-foreground`, `subtle-foreground`, `surface`, `border`, `radius`, `accent`, `accent-strong`, `accent-surface`, `trajectory`, `net`, `counter-background`, `track`, `success`, `danger`, `file-surface`, `file-line`, `file-<kind>` (§2.5), `shadow`, `focus-ring`, `font-family` (`Inter, ui-sans-serif, system-ui, sans-serif`), `gutter`, `hoop-size`.

**Paleta clara medida nos screenshots** (pixel a pixel; o escuro é proposta):

| Token                                          | Claro        | Escuro (proposta)      |
| ---------------------------------------------- | ------------ | ---------------------- |
| background                                     | `#eff1f5`    | `#0f1115`              |
| surface (dropzone, item)                       | `#ffffff`    | `#181b21`              |
| foreground (título, prompt)                    | `#0f1115`    | `#f4f5f7`              |
| muted (subtítulo, ícone, label da pílula)      | `#6b6f78`    | `#a3a8b2`              |
| subtle (hint, tamanho, "Uploading…")           | `#989a9f`    | `#7c818b`              |
| counter-background                             | `#e3e7ed`    | `#232730`              |
| border (tracejado)                             | `#cbccd1`    | `#3a3f48`              |
| accent (quadrado, aro, "+1", progresso)        | `#f0612e`    | `#f26a39`              |
| accent-strong (suporte; aro de trás `#ce4f23`) | `#bd4d19`    | `#c4521f`              |
| accent-surface (dropzone ativo)                | `#fff4ef`    | mix 14% accent/surface |
| trajectory                                     | accent @ 60% | idem                   |
| net                                            | `#a9abb3`    | `#6b717c`              |
| track                                          | `#e6e8ec`    | `#2a2e36`              |
| success (label `#33ab73`)                      | `#2fb06d`    | `#34c07a`              |
| file-pdf                                       | `#d8374e`    | `#e5485f`              |
| file-line                                      | `#e4e5e9`    | (card continua claro)  |

**Geometria de referência** (frame de 754×887):

- **Cabeçalho:** gutter de 60px; título bold ≈30px; subtítulo ≈17px; pílula com label de 13px e valor de 16px semibold.
- **Dropzone:** 400×268, centralizado, raio ≈18px. O tracejado ≈8/6 é feito com um `<rect>` SVG (`stroke-dasharray`).
- **Ícone e textos do dropzone:** ícone de 24px; prompt ≈21px medium; hint de 14px.
- **Quadrado:** 34%×30% do dropzone, em `left: 33%`, `top: 64.6%`, traço de 3px.
- **Aro e suporte:** aro com 41% da largura do dropzone, elipse com ry ≈5, traço de 5px, na borda inferior. Suporte de 24×10.
- **Rede:** trapézio de 164→102px e ≈103px de altura, com diagonais cruzadas e anéis a ≈40% e ≈68% da altura.
- **Card:** ≈95×115, raio 10, orelha de 18px, badge de ≈40×20, sombra `0 8px 20px rgb(0 0 0 / .12)`.
- **Item da lista:** altura ≈82, raio 16, ícone de 34×40, progresso de 180px, check com círculo de 30px.

### 2.7 Acessibilidade e i18n

- O dropzone é um `<button>` real.
- Os cards são `<button>`.
- A live region (`aria-live=polite`) anuncia cesta, erro, upload concluído e arquivo rejeitado.
- O progresso usa `role=progressbar` com `aria-valuenow`.
- O foco visível usa o token `focus-ring`.
- Os textos ficam em `labels.ts` (padrão em inglês = texto do design), sobrescrevíveis via slots e via a propriedade `labels`.

---

## 3. Pacote React — `@sehv-oss/basketball-upload-react` (`packages/react`)

Adapter fino, no padrão de `pdf-viewer/src/react/PdfViewer.tsx`. Fica em `src/{basketball-upload-react.ts, BasketballUpload.tsx}`.

- **Dependências:** `@sehv-oss/basketball-upload: workspace:^`; peer deps `react`/`react-dom >=19`. O i18n põe `react` em `dependencies`; aqui fica peer, para não duplicar o React do consumidor.
- **tsconfig:** `web/lib` + `layer/react`.
- **Build:** tsdown com o core e o react como externals.
- **`'use client'`:** o `dist` precisa começar com `'use client'` para RSC/Next.js. Usar `banner` se o rolldown remover a diretiva.
- **`<BasketballUpload>`:**
  - Chama `registerBasketballUpload({ tagName })` durante o render.
  - Usa `ref` como prop (React 19).
  - Props primitivas viram **atributos kebab-case** (`'max-size': maxSize`, …), o que funciona igual no cliente e no SSR.
  - `uploader`, `labels` e `fileTypes` são atribuídos em `useLayoutEffect`. Documentar que `fileTypes` deve ser memoizado.
  - Os callbacks `onFileReject`, `onShot`, `onUploadStart`, `onUploadProgress`, `onUploadSuccess`, `onUploadError` e `onChange` são registrados via `addEventListener`, com um `ref` sempre atualizado para os callbacks.
  - `children` são repassados como slots.
- **Reexportação:** os tipos do core e o `registerFileType`.

---

## 4. Site de demonstração — `site/` (`@sehv-oss/basketball-upload-site`, privado)

- **Formato:** o mesmo do `i18n/site`: Vite + React, `base: '/basketball-upload/'`, `shiki` para os blocos de código, header fixo com nav e link do GitHub, hero, install tabs (npm/pnpm/yarn × core/react, com botão de copiar), seções `Section` (badge + título + descrição + demo ao vivo + código) e footer.
- **CSS:** moderno próprio, sem Tailwind. Fica em `site/src/styles/` com `@layer reset, tokens, base, layout, components, utilities;`, nesting, `light-dark()` e propriedades lógicas. O tema do site acompanha `prefers-color-scheme`, com toggle.
- **Fontes:** Inter e JetBrains Mono via `@fontsource-variable/*`, sem request externo.
- **Hero = a demo fiel:**
  - Uma área com fundo `#eff1f5` e o componente idêntico aos screenshots.
  - Arquivo demo `final_final_v7.pdf` (2.4 MB) já na quadra via `stage()`.
  - Uploader simulado (≈2.5s, respeitando o `signal`, com toggle de "falhar").
  - Controles: tema, `instant`, labels pt-BR, reset.
- **Seções:**
  1. **Web Component:** HTML/JS puro, ao vivo.
  2. **React:** `<BasketballUpload>` + log de eventos.
  3. **Theming:** override de tokens, parts e custom states.
  4. **File types:** botões que colocam na quadra exemplos de pdf/png (com miniatura)/mp4/zip, mais um tipo customizado registrado com `registerFileType` (ex.: `.fig` com cor e arte próprias).
  5. **Forms:** `name="files"` + `required` + submit mostrando o `FormData`.
  6. **Uploader:** código do `createXhrUploader`.
  7. **Credits:** §7.
- **Dev a partir das fontes:** `pnpm site:dev`. Adaptar o `librarySources()` do playground do pdf-viewer: aliases dos 2 pacotes para `src/`, `.css` dos pacotes via `?raw` e full-reload ao mudar o código da lib, tudo só em `serve`. O `tsconfig` do site tem `paths` para os `src/`. O `vite build` consome o `dist/` via `workspace:*`, então o site publicado é o pacote real.

---

## 5. Testes (Vitest `projects`, como no i18n)

`vitest.config.ts` na raiz (`globals: true`, coverage v8) com quatro projetos:

| projeto        | ambiente                                | inclui                                     |
| -------------- | --------------------------------------- | ------------------------------------------ |
| `core`         | node                                    | `packages/core/tests/**/*.test.ts`         |
| `core-browser` | chromium (`@vitest/browser-playwright`) | `packages/core/tests/**/*.browser.test.ts` |
| `react`        | chromium + `vitest-browser-react`       | `packages/react/tests/**/*.test.tsx`       |
| `react-ssr`    | node                                    | `packages/react/tests/**/*.ssr.test.tsx`   |

Os projetos de browser usam aliases para o `src`, como o i18n.

- **`core` (node):**
  - `previewPath()` ≡ caminho do voo.
  - Cesta só descendo pelo vão; subir pelo vão bate no aro.
  - Quadrado amortece e cai na cesta.
  - Bordas do aro refletem.
  - A puxada mínima cancela.
  - `solveAssistedShot` sempre resulta em cesta.
  - `UploadQueue`: concorrência, abort, retry, progresso.
  - `matchesAccept`, `formatBytes` ("2.4 MB").
  - `resolveFileType`: ordem instância → global → defaults → fallback; unregister; label padrão pela extensão.
- **`core-browser`:**
  - Registro idempotente.
  - Reflexão de atributos.
  - Drop com `DragEvent` + `DataTransfer` sintéticos gera dunk, item na lista e eventos.
  - Estilingue com `PointerEvent`s gera o evento `shot`.
  - `FormData(form)` contém os arquivos, e `required` invalida o form.
  - Parts `file-<kind>`, tokens por tipo e thumbnail de imagem.
- **`react`:** props viram atributos/propriedades, callbacks disparam, `ref` é o elemento e `fileTypes` é aplicado.
- **`react-ssr`:** `renderToString(<BasketballUpload />)` não quebra sem DOM.
- **CI:** `test:setup` instala o chromium (input `test-setup` do workflow).

---

## 6. ADRs (`docs/adr/`, formato do pdf-viewer)

| ADR  | Tema                                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------- |
| 0001 | Web Component como UI principal; o React é só adapter                                                          |
| 0002 | Monorepo pnpm com 2 pacotes + site (formato do i18n); por que diverge da ADR 0003 do pdf-viewer (pacote único) |
| 0003 | Shadow DOM, cascade layers, tokens em 3 camadas, `light-dark()`, parts, custom states                          |
| 0004 | Simulação de passo fixo compartilhada entre prévia e voo; estilingue; pseudo-profundidade; regras de cesta     |
| 0005 | Upload via `uploader` + helper XHR; form-associated custom element                                             |
| 0006 | Build com tsdown + tsc, e dev a partir das fontes                                                              |
| 0007 | Registro de tipos de arquivo (global + instância, ordem de resolução, overrides por CSS, segurança)            |

---

## 7. Créditos ao autor (requisito)

- **README da raiz, logo no topo**, uma seção **Credits**: "Design by **Jorge Molina** ([jm-fuster](https://github.com/jm-fuster) · [Figma @jm_fuster](https://www.figma.com/@jm_fuster) · [jorgemolinafuster.com](https://jorgemolinafuster.com)), originally published on Figma Community: `<URL do arquivo — preencher>`. This is an independent code implementation of that design and is not affiliated with or endorsed by the author."
- **Licença do design:** arquivos do Figma Community costumam usar **CC BY 4.0**. **Confirme na página do arquivo.** Ela exige crédito, link para a licença e indicação das mudanças, então liste o que foi adicionado: tema escuro, acessibilidade, pipeline de upload, tipos de arquivo, API de Web Component.
- **`NOTICE.md`:** na raiz e em cada pacote (em `files`, vai no tarball). Os READMEs dos pacotes trazem a mesma seção curta.
- **`package.json`:** `"contributors": [{ "name": "Jorge Molina", "url": "https://github.com/jm-fuster" }]` nos 2 pacotes.
- **Site:** seção Credits + footer "Design by Jorge Molina — Figma Community".
- **Screenshots** em `docs/design/reference/` (com crédito no README da pasta). Renomear assim:
  - `01-aim.png` (13-23-53)
  - `02-release.png` (13-24-20)
  - `03-flight-dropzone-active.png` (13-24-25)
  - `04-rim.png` (13-24-31)
  - `05-net.png` (13-24-36)
  - `06-score-uploading.png` (13-24-40)
  - `07-uploading.png` (13-24-45)
  - `08-uploaded.png` (13-24-49)
- **A confirmar com o usuário:** a URL exata do arquivo no Figma e a grafia do nome do autor ("Jorge Molina" no GitHub; o domínio sugere "Jorge Molina Fuster"). Opcional: avisar o autor depois de publicar.

---

## 8. Ordem de implementação

0. **Mudança para o repo novo:**
   - Em `~/dev/repositories/@sehv-oss/basketball-upload`, criar a branch `feat/initial-implementation` (os rulesets da org pedem PR com squash).
   - Copiar este plano para `docs/plan.md`.
   - Mover `xd/*.png` → `docs/design/reference/` com os nomes do §7.
   - Pedir confirmação antes de apagar a pasta antiga `dnd-baskteball`.
   - Seguir a implementação com o repo novo como diretório de trabalho.
   - Commits/PR só quando o usuário pedir.
1. **Scaffold:**
   - `corepack enable && corepack use pnpm@11.26.0`, `.nvmrc`, `pnpm-workspace.yaml` (catalog), `package.json` da raiz.
   - Configs da org (cspell com as palavras `sehv`, `dnd`, `Molina`, `Fuster`, `jorgemolinafuster`).
   - `.vscode/`, `.changeset/`, workflows.
   - `tsconfig.node.json`, `vitest.config.ts`.
   - Esqueleto dos 2 pacotes + site.
   - `pnpm install && pnpm build` verde.
2. **Core, UI estática:** tokens/layers/layout, cabeçalho e contador, hoop em SVG. Bater com o 01, sem card.
3. **Core, upload:** `UploadQueue`, lista, DnD nativo + dunk, picker, form association, rejeitados.
4. **Core, tipos de arquivo:** registry, defaults, thumbnail, parts/tokens por tipo.
5. **Core, jogo:** `game/*` com testes, estilingue + pontos, voo, colisões, sequência da cesta, erro com retorno, arremesso assistido, reduced motion.
6. **React adapter** + testes (browser + SSR).
7. **Site:** hero fiel + seções + install tabs + shiki.
8. **Docs:** READMEs no estilo do pdf-viewer (tabelas de atributos, tokens, parts, eventos e tipos; snippet `:not(:defined)`), ADRs, NOTICE, changeset inicial.
9. **GitHub** (o usuário faz, pelo checklist do template):
   - Settings → Pages → Source = **GitHub Actions**.
   - About → Website = `https://sehv-oss.github.io/basketball-upload/`.
   - Depois, trocar o README de checklist pelo README do projeto.

## 9. Verificação

1. `pnpm install` → `pnpm build` (tsc + tsdown nos pacotes + build do site) → `pnpm test:setup && pnpm test` → `pnpm lint`, todos verdes. São os mesmos passos dos workflows da org.
2. `pnpm site:dev`: comparar o hero **lado a lado com cada screenshot** de 01 a 08 (mirar, soltar, voo com dropzone ativo, aro, rede, cesta com "+1" e lista em "Uploading…", progresso, "Uploaded" com o check). Usar o navegador via claude-in-chrome ou capturas e ajustar tokens, geometria e física até ficar igual.
3. **Interações reais:** arrastar um PDF do sistema para o dropzone (dunk) e para a quadra (vira card); errar de propósito (quica e volta); acertar pelo quadrado e direto. Arrastar uma imagem (card com miniatura) e um tipo customizado (`.fig`).
4. **Teclado:** Tab até o dropzone e Enter abre o picker; Tab até o card e Enter faz o arremesso assistido; Escape cancela a mira.
5. **DevTools:** emular reduced motion; alternar os temas light/dark/system; override de `--basketball-upload-file-pdf` via `:root`.
6. **Formulário:** submit com `FormData` correto; `required` bloqueia.
7. **Tarballs:** `pnpm --filter "./packages/*" pack` e inspecionar `dist/`, README, LICENSE e NOTICE; `workspace:^` e `catalog:` substituídos por versões; `'use client'` no topo do dist do react.
8. **Build e preview do site:** `pnpm --filter @sehv-oss/basketball-upload-site build && … preview`, abrindo em `/basketball-upload/` (base path correto, assets carregando).

**Fora do escopo da v1:** adapters de Vue/Angular, efeitos sonoros, uploads resumíveis/em chunks, testes de regressão visual (bom próximo passo com o mesmo Playwright).

---

## 10. Notas de implementação (desvios em relação ao plano)

Registradas durante a implementação de 2026-10-06; as ADRs em `docs/adr/` são a referência.

- **`labels` → `messages`**: a propriedade de textos virou `messages` (tipo `Messages`, `defaultMessages`), porque form controls expõem `labels` como seus elementos `<label>`.
- **`remove(id)` / `retry(id)` → `removeItem(id)` / `retryItem(id)`**: `remove()` sombrearia `Element.remove()`.
- **Sem `score`**: o contador mostra a quantidade de arquivos na cesta (`items.length`); sobe na cesta e desce quando um item é removido.
- **Ordem da cesta**: como nos screenshots 05→06, o "+1", o contador, o item da lista e o upload só aparecem depois que o card atravessa a rede.
- **Pseudo-profundidade**: card subindo passa _na frente_ do aro e da tabela (só interagem perto do ápice ou na descida); a regra "bater por baixo do aro" saiu.
- **Quadrado**: amortece mantendo a direção (`vx *= 0.25`), em vez de inverter.
- **Prévia**: termina com um ponto no primeiro contato (como no design, um ponto aparece dentro do quadrado).
- **Calibração**: `powerHeadroom` 1.4 e spot de repouso em (≈160, 650) no frame de 754×887, reproduzindo o arco do screenshot 01 ponto a ponto.
- **vite 8.3.2** (não 8.3.3): o 8.3.3 saiu no mesmo dia e o `minimumReleaseAge` do pnpm 11 o bloqueia; nada de `minimumReleaseAgeExclude`.
- **`'use client'`** via `banner` do tsdown (diretiva no fonte não sobrevive ao bundle).
- **Testes**: projetos Vitest `core` (node), `core-browser`, `react` (Chromium) e `react-ssr` (node).
- **Site**: rota `?reference` renderiza só o elemento em 754×887 para comparação com `docs/design/reference/`.
