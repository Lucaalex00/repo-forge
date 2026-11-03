<p align="center">
  <img src=".claude-plugin/icon.png" alt="Repo Forge logo" width="128" height="128" />
</p>

<h1 align="center">Repo Forge</h1>

<p align="center"><em>Dall'idea a un repository web solido, con una struttura che non cambia nel tempo.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.2.0-blue" alt="version" />
  <a href="https://github.com/Lucaalex00/repo-forge/actions/workflows/test.yml"><img src="https://github.com/Lucaalex00/repo-forge/actions/workflows/test.yml/badge.svg?branch=main" alt="CI" /></a>
  <img src="https://img.shields.io/badge/tests-103%20passing-brightgreen" alt="tests" />
  <img src="https://img.shields.io/badge/Claude%20Code-plugin-8A2BE2" alt="Claude Code plugin" />
  <img src="https://img.shields.io/badge/cross--model-AGENTS.md-informational" alt="cross-model" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="license" />
</p>

---

## Cos'è

**Repo Forge** è un plugin per **Claude Code** che ti accompagna dall'idea a un
repository web solido e ben strutturato. Fa un'intervista approfondita, ti
consiglia lo stack, propone regole su misura, genera i documenti "costituzione"
del progetto e poi **li blocca**: da quel momento la struttura si cambia solo con
una procedura controllata, non per caso.

Funziona nella CLI di Claude Code e nell'estensione VS Code, e si installa **a
livello utente** (`~/.claude`), così è disponibile in tutti i tuoi progetti.

### In breve

- 🔒 **Struttura bloccata** — i documenti chiave non si modificano per sbaglio; si cambiano via `/repo-forge:change` (ADR + approvazione + sblocco di 10 minuti).
- 🧭 **Due percorsi** — *Principiante* ("decidi tu", domande a scelta) ed *Esperto* ("guido io", domande aperte).
- 🗄️ **SQLite di default** — i database server (PostgreSQL, MySQL, SQL Server, MongoDB) solo se fornisci le credenziali, che finiscono **solo** nel `.env`.
- 🤝 **Cross-model** — genera anche `AGENTS.md` e un hook git di lock portabile, così le regole valgono pure con Codex, commit manuali e CI.

---

## Installazione (Windows, PowerShell)

> Prerequisito: avere **Claude Code** (comando `claude`) e **Node.js** sul PATH.

**In un passo** (aggiunge il marketplace e installa a livello utente):

```powershell
claude plugin install repo-forge@repo-forge --marketplace Lucaalex00/repo-forge --scope user
```

Verifica che risulti abilitato:

```powershell
claude plugin list
```

<details>
<summary>In due passi, o da dentro una sessione Claude Code</summary>

```powershell
claude plugin marketplace add Lucaalex00/repo-forge
claude plugin install repo-forge@repo-forge --scope user
```

Dentro una sessione: `/plugin marketplace add Lucaalex00/repo-forge` e poi
`/plugin install repo-forge@repo-forge`. Per fissare una versione:
`claude plugin marketplace add Lucaalex00/repo-forge#<commit-o-branch>`.
</details>

### Aggiornare / disinstallare

```powershell
claude plugin marketplace update repo-forge
claude plugin update repo-forge@repo-forge
claude plugin uninstall repo-forge
```

---

## Avvio rapido — crea un repo da zero

1. Crea una cartella vuota e aprici Claude Code:

   ```powershell
   mkdir C:\Progetti\mio-sito; cd C:\Progetti\mio-sito
   ```

2. Nella sessione Claude Code, lancia:

   ```text
   /repo-forge:new-repo
   ```

3. Scegli **Principiante** o **Esperto** e dì se vuoi il progetto su **GitHub**
   (se non hai un account, Repo Forge ti spiega come crearlo). Poi: gate delle
   50 parole sulla visione → stack → regole → workflow → **Project Brief** (da
   approvare) → scaffolding → documenti → **lock** → check → **pubblicazione su
   GitHub**.

> 💡 Se crei tu il repository sul sito di GitHub, crealo **vuoto** (senza README,
> .gitignore o licenza): altrimenti va unito a mano. `/repo-forge:publish`
> gestisce comunque anche quel caso.

> **Scorciatoia agentica / pochi token:** metti nella cartella un
> `repoforge.config.json` (schema ed esempio in
> `skills/repo-interview/references/`) e `/repo-forge:new-repo` salta
> l'intervista, andando diritto allo scaffolding.

---

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `/repo-forge:new-repo [beginner\|expert] [cartella]` | Flusso completo: intervista → stack → regole → workflow → Brief → scaffolding → documenti + lock → check. |
| `/repo-forge:change [cosa cambiare]` | Unico modo sicuro per modificare un file bloccato: ADR + approvazione + finestra di sblocco di 10 minuti, poi ri-blocca. |
| `/repo-forge:check` | Verifica finale (controllo deterministico: `locked.json`, file presenti, costituzione completa, ≥10 regole, `.env` ignorato, nessun placeholder). |
| `/repo-forge:check adopt` | **Adozione**: applica Repo Forge a un repository **già esistente**, deducendo stack e convenzioni dal codice reale. |
| `/repo-forge:publish [owner/repo] [private\|public]` | Pubblica su GitHub passo-passo: primo commit, creazione del repo (GitHub CLI o sito), push. Gestisce anche i repo creati con README. |

---

## Come funziona il "lock"

I file costituzione elencati in `.repoforge/locked.json` (nel tuo progetto) non
si possono modificare direttamente: un hook `PreToolUse` blocca la scrittura e
spiega perché. Per cambiarli usa `/repo-forge:change`, che scrive un ADR, chiede
la tua approvazione e apre un `.repoforge/unlock.json` valido 10 minuti; a
modifica fatta, lo sblocco viene rimosso e il blocco torna attivo.

`locked.json` è committato (il blocco viaggia col repo); `unlock.json` è
git-ignorato e locale. Lock, sblocco, ADR e verifica sono gestiti da script
deterministici (`scripts/lock.js`, `unlock.js`, `adr.js`, `verify.js`), così
timestamp e scadenze non dipendono da calcoli a mano.

Nei progetti generati vengono anche installati (da `scripts/install-guards.js`,
che si aggancia a Husky se c'è) due **guard pre-commit** (Node, cross-platform):
uno **anti-segreti** (blocca commit di `.env` reali o di chiavi/token) e uno di
**lock portabile**, che fa rispettare il blocco della struttura a qualsiasi
strumento — altri agenti, commit manuali, CI — non solo a Claude Code. Il primo
commit dei documenti è ammesso; sono bloccate solo le modifiche successive.
`/repo-forge:check` avvisa (e propone la correzione) se mancano.

---

## Altri modelli (Codex ecc.)

Oltre a `CLAUDE.md`, viene generato un **`AGENTS.md`** con le stesse regole, letto
da Codex e da altri agenti. L'enforcement del lock via hook git `pre-commit`
funziona indipendentemente dallo strumento che modifica il repo.

---

## Stack supportati

- **Frontend:** React (Vite), Next.js, Vue, Angular, SvelteKit, Astro
- **Backend:** .NET Web API, NestJS/Express, FastAPI, Django, Laravel, Symfony, Go, oppure full-stack (Next.js/Nuxt/SvelteKit/Laravel/Django) senza backend separato
- **Database:** SQLite (default), PostgreSQL, MySQL, SQL Server, MongoDB (con template Docker Compose e credenziali nel `.env`)

Ogni stack ha un template `CLAUDE.md` con pattern, naming, struttura cartelle e
comandi reali.

---

## Limiti noti

- Intervista e Brief sono guidati dal modello (conversazionali): la qualità
  dipende dalle tue risposte; i default coprono chi non sa rispondere.
- Lo scaffolding usa le CLI ufficiali, quindi serve la toolchain dello stack
  scelto (Node, .NET SDK, Python, PHP+Composer, Go). I comandi di installazione
  sono **verificati**, mai inventati: senza rete, Repo Forge mostra il link alla
  documentazione ufficiale invece del comando.

---

## Sviluppo e test

```bash
npm test                        # suite di test (Node, nessuna dipendenza)
node scripts/validate-plugin.js # validazione JSON + frontmatter
claude plugin validate .        # validazione ufficiale
```

La CI gira su **Ubuntu (Node 18/20/22) e Windows**. La cartella `sandbox/` è
usata solo per le simulazioni end-to-end ed è git-ignorata.

---

<p align="center"><sub>MIT · costruito per Claude Code</sub></p>
