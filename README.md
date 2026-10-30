# Repo Forge

Repo Forge è un plugin per **Claude Code** che ti accompagna dall'idea a un
repository web solido e **con una struttura che non cambia nel tempo**. Fa
un'intervista approfondita, ti consiglia lo stack, propone regole su misura,
genera i documenti "costituzione" del progetto e poi **li blocca**: da quel
momento le modifiche alla struttura passano da una procedura controllata, non
avvengono per caso.

Funziona sia nella CLI di Claude Code sia nell'estensione VS Code. È pensato per
essere installato **a livello utente** (`~/.claude`), così è disponibile in
tutti i tuoi progetti.

## Cosa fa, in breve

1. **Intervista** con due percorsi a scelta:
   - **Principiante** ("decidi tu"): poche domande a risposta fissa con default
     consigliati, linguaggio semplice, il resto deciso in automatico;
   - **Esperto** ("guido io"): domande aperte, controllo diretto di stack,
     versioni e layout.
   In entrambi i casi la **visione** ha un gate obbligatorio di almeno 50 parole;
   poi funzionalità, requisiti non funzionali, vincoli, layout, stack e regole.
2. **Consiglio sullo stack** separato per Frontend, Backend e Database. Il
   database di default è **SQLite**; i database server (SQL Server, PostgreSQL,
   MySQL, MongoDB) solo se fornisci le credenziali, che finiscono **solo** nel
   file `.env`.
3. **Almeno 10 regole** su misura (guardrail + guideline), che puoi modificare.
4. **Consigli su metodi e strumenti** (state management, Playwright/Playwright
   MCP, Context7 MCP, GitHub MCP, Husky/pre-commit, Docker…). I comandi di
   installazione vengono verificati, non inventati.
5. **Project Brief** con osservazioni, rischi e decisioni delegate a te. Si
   procede **solo** dopo la tua approvazione esplicita.
6. **Scaffolding** con le CLI ufficiali, nel layout che scegli tu (monorepo o
   repo separati; docs alla root / sotto il frontend / sotto il backend / in un
   repo dedicato; script DB dentro il backend o in una cartella separata).
7. **Documenti costituzione** separati (`PROJECT_BRIEF`, `ARCHITECTURE`,
   `GUIDELINES`, `GUARDRAILS`, `CONVENTIONS`, `WORKFLOW`, `CHANGELOG`, ADR, e un
   `CLAUDE.md` alla root e per ogni parte), poi **bloccati** tramite
   `.repoforge/locked.json`. Un hook impedisce le modifiche dirette.
8. **Checklist** di verifica finale.

## Installazione globale (passo passo, Windows)

Prerequisiti: avere **Claude Code** installato e funzionante (comando `claude`).
I percorsi di esempio usano `C:\Progetti`.

1. Apri **PowerShell**.
2. **Installa in un passo** (aggiunge il marketplace e installa):

   ```powershell
   claude plugin install repo-forge@repo-forge --marketplace Lucaalex00/repo-forge --scope user
   ```

3. Verifica che sia installato:

   ```powershell
   claude plugin list
   ```

In due passi (equivalente), oppure da dentro una sessione di Claude Code:

```powershell
claude plugin marketplace add Lucaalex00/repo-forge
claude plugin install repo-forge@repo-forge --scope user
```

Dentro una sessione: `/plugin marketplace add Lucaalex00/repo-forge` e poi
`/plugin install repo-forge@repo-forge`.

Per fissare una versione specifica puoi puntare a un commit o a un branch:
`claude plugin marketplace add Lucaalex00/repo-forge#<commit-o-branch>`
(una release taggata potrà essere aggiunta in seguito dalla sezione Releases di
GitHub).

> **Provarlo senza installarlo** (utile per svilupparlo): da una copia locale
> del repository esegui `claude --plugin-dir .` in quella cartella.

### Note per Windows

- Tutto il plugin è scritto in Node puro e usa percorsi cross-platform, quindi
  l'hook di blocco funziona sia con percorsi `C:\...` sia POSIX, e riconosce sia
  i comandi di scrittura bash sia quelli PowerShell.
- Serve **Node.js** sul PATH (lo stesso che usa Claude Code). Alcune CLI di
  scaffolding sono esigenti sulla versione di Node: Repo Forge la controlla
  prima di procedere e, se serve, usa una versione compatibile della CLI.

## Comandi

| Comando | Cosa fa |
| --- | --- |
| `/repo-forge:new-repo [cartella]` | Avvia il flusso completo: intervista → stack → regole → workflow → Brief → scaffolding → documenti + lock → check. |
| `/repo-forge:change [cosa cambiare]` | Unico modo sicuro per modificare un file bloccato: ADR + approvazione + finestra di sblocco temporanea (10 minuti), poi ri-blocca. |
| `/repo-forge:check` | Checklist di verifica finale del repository. |
| `/repo-forge:check adopt` | **Adozione**: applica Repo Forge a un repository **già esistente** (deduce stack e convenzioni dal codice, genera i documenti dal repo reale e li blocca). |

## Come funziona il "lock"

I file costituzione elencati in `.repoforge/locked.json` (nel tuo progetto) non
si possono modificare direttamente: un hook `PreToolUse` blocca la scrittura e
spiega perché. Per cambiarli usa `/repo-forge:change`, che scrive un ADR, chiede
la tua approvazione e crea un `.repoforge/unlock.json` valido 10 minuti; a
modifica fatta, il file di sblocco viene rimosso e il blocco torna attivo.
`locked.json` viene committato (il blocco viaggia col repo); `unlock.json` è
git-ignorato e locale. La creazione di `locked.json` e della finestra di sblocco
è gestita da script deterministici (`scripts/lock.js`, `scripts/unlock.js`), così
timestamp e scadenza non dipendono da calcoli a mano.

Nei progetti generati viene anche installato un **guard pre-commit anti-segreti**
(Node, cross-platform) che blocca il commit di file `.env` reali o di chiavi/token
evidenti.

## Limiti noti

- Il flusso dell'intervista e del Brief è guidato dal modello (conversazionale):
  la qualità dipende dalle tue risposte; i default coprono chi non sa rispondere.
- I comandi di scaffolding e di installazione cambiano nel tempo: Repo Forge li
  **verifica** prima di eseguirli, ma se la rete non è disponibile mostra il
  link alla documentazione ufficiale invece del comando.
- Il backend .NET richiede l'SDK `dotnet` installato localmente (non incluso).
- Il plugin non ha ancora un'icona per il catalogo (warning non bloccante in
  `claude plugin validate`).

## Aggiornare il plugin

```powershell
claude plugin marketplace update repo-forge
claude plugin update repo-forge@repo-forge
```

Per disinstallarlo: `claude plugin uninstall repo-forge`.

## Sviluppo e test

```bash
npm test                      # suite di test (Node, nessuna dipendenza)
node scripts/validate-plugin.js   # validazione JSON + frontmatter
claude plugin validate .      # validazione ufficiale
```

La cartella `sandbox/` è usata solo per le simulazioni end-to-end ed è
git-ignorata.
