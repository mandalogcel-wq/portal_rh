# Runbook — deploy do Portal RH Mandalog (para o Claude Code)

Você vai publicar este projeto (frontend + função serverless) e ligar a gravação
dos resultados no Google Sheets via n8n. Siga na ordem. Peça ao Marcus só o que
for conta dele (logins/credenciais); o resto execute.

## Contexto
- Jornada da vaga: **segunda a sábado**. Contato do RH para dúvidas: WhatsApp (11) 94749-5997
  (QR code com mensagem pronta em `public/qr-rh-whatsapp.svg`).
- Frontend estático em `public/index.html`. Função em `api/candidatura.js`.
- O portal faz `POST /api/candidatura` com o resultado; a função repassa ao n8n
  (URL escondida em `N8N_WEBHOOK_CANDIDATURA`); o n8n grava uma linha na planilha.
- Painel do RH e dos gestores em `public/painel.html` + `api/painel.js`
  (login, sessão em cookie assinado, leitura da planilha via n8n). Ver `docs/painel-rh.md`.
- n8n do Marcus: editor em `n8n-editor.zqpvje.easypanel.host`, webhooks de produção
  em `n8n-webhook.zqpvje.easypanel.host`. Usar sempre a URL no formato limpo
  `/webhook/rh-candidatura`, nunca a versão com UUID.
- Ao importar/alterar workflow no n8n via API/SDK, as credenciais Google são perdidas:
  reconecte e republique.

## Passo 1 — Repositório GitHub ✅ FEITO
- Repositório: `mandalogcel-wq/portal_rh`.

## Passo 2 — Google Sheets ✅ FEITO
- Planilha "Mandalog — Candidatos RH", aba `Candidatos`, cabeçalho de
  `docs/planilha-candidatos.md` (24 colunas), primeira linha congelada.
- ID: `15-sp05bPGDkNmVezG31LJrIV9QpGWzcxAON4ZSra1MA` (gid da aba: `861874780`).
- Compartilhada como editor com `automacao.ia@mandalog.com.br` (conta da credencial do n8n).

## Passo 3 — n8n (captura) ✅ FEITO
- Workflow **RH - Captura de Candidatura (Portal SAC)** (`2F7ZSfH4KZAEOhPP`), ativo,
  no projeto pessoal "Mandalog Integração". Um IF no começo separa os três tipos de
  envio (verificar / agendamento / candidatura); o caminho da candidatura é
  Gravou Áudio? → (Drive) → Montar Linha → **Montar Prompt da IA → Analisar com IA →
  Juntar Análise** → Google Sheets Append → Respond.
- Credencial Google Sheets ligada: `automacao.ia@mandalog.com.br`.
  Credencial Anthropic: `Mandalog` (`h1LSl7juXCwrsBPb`).
- `n8n/RH_Captura_Candidatura.json` é a cópia versionada desse workflow — se mudar
  um dos dois, atualizar o outro. **A URL da Z-API nessa cópia está redigida de
  propósito** (`SUA_INSTANCIA`/`SEU_TOKEN`): o repositório é público. A URL real
  está só no n8n.
- Outros dois workflows do RH, no mesmo projeto:
  - **RH - Painel de Candidatos (leitura)** (`kCasiMHSYheyWXwB`) — webhook
    `/webhook/rh-painel` protegido por Header Auth, devolve a aba em JSON para o painel.
  - **RH - Analise de IA dos candidatos ja recebidos** (`CKoSZuMJRLW1COak`) — roda
    sob demanda para analisar quem ficou sem análise.
- A URL de produção do webhook não fica no repositório: ela é o valor de
  `N8N_WEBHOOK_CANDIDATURA` na Vercel (ver Passo 4).

## Passo 4 — Vercel ✅ FEITO
- Projeto `portal_rh` em "Mandalog's projects" (plano Hobby), ligado ao repositório
  GitHub. Branch de produção: `claude/fervent-hopper-abgox5` (é a default do repo).
- URL: https://portalrh-delta.vercel.app · domínio próprio: vagas.mandalog.com.br
- Env var `N8N_WEBHOOK_CANDIDATURA` definida em Production e Preview.
- Sem build: a Vercel serve `public/` como estático e `api/` como função.
- **Faltam quatro env vars para o painel** (`PAINEL_USUARIOS`, `PAINEL_SESSION_SECRET`,
  `N8N_WEBHOOK_PAINEL`, `N8N_PAINEL_TOKEN`) — ver Passo 6 e `docs/painel-rh.md`.

## Passo 5 — Teste de ponta a ponta
- A gravação já foi testada direto no webhook (payload completo → linha na planilha).
  Falta o teste pelo navegador, depois do deploy:
- Abrir a URL de produção, completar uma candidatura.
- Verificar uma linha nova na planilha (`search_executions` no n8n ajuda a depurar).
- Testar um caso nota ≥ 85 → o portal deve abrir o agendamento.
- Se a candidatura não chegar: conferir CORS (mesma origem, não deve dar problema),
  a env var, e se o workflow está ATIVO e com a credencial Google reconectada.

## Passo 6 — Painel do RH (`/painel`) ⏳ FALTA LIGAR
O código está no ar; falta a configuração, que depende de conta do Marcus.
Detalhes e explicação em `docs/painel-rh.md`.

1. **n8n** — abrir o workflow **RH - Painel de Candidatos (leitura)**, nó
   `Webhook Painel`, campo "Credential for Header Auth": criar uma credencial nova
   chamada *Painel RH Token*, com **Name** = `X-Painel-Token` e **Value** = o token
   combinado. Não reaproveitar a credencial `mandalog` (ela é de outra integração).
   Salvar e **ativar o workflow**.
2. **Vercel** — em Settings → Environment Variables (Production e Preview):
   `PAINEL_USUARIOS`, `PAINEL_SESSION_SECRET`, `N8N_WEBHOOK_PAINEL`
   (`https://n8n-webhook.zqpvje.easypanel.host/webhook/rh-painel`) e
   `N8N_PAINEL_TOKEN` (o mesmo valor do passo 1). Redeploy.
3. Abrir `vagas.mandalog.com.br/painel`, entrar e conferir se os candidatos aparecem.

Usuários novos: `node scripts/gerar-senha.mjs "email" "Nome" rh|gestor`.

## Fases seguintes (não bloqueiam o v1)
- ~~Vídeo → Drive~~ ✅ FEITO (virou áudio): a entrevista final grava **áudio** (32kbps,
  ~300KB por resposta de 75s), o n8n sobe na pasta "Mandalog — Áudios Candidatos RH"
  (`18LlMKV4-6q6nq5ZxMT5eGW-sl_xqGpJc`) e grava o link em `link_audios`. Folga grande
  no limite de 4,5MB da função; se um dia voltar a ser vídeo, aí sim precisa de Vercel Blob.
- **Agenda de entrevistas — ESCOPO FECHADO (sem Google Calendar).** O Marcus decidiu
  não usar o Google Calendar: o aviso no grupo do WhatsApp basta. O que está no ar:
  - O portal envia o horário escolhido (`tipo=agendamento`, mesmo endpoint
    `/api/candidatura`, com nota, gestor, cidade e bairro). Um IF no início do workflow
    separa os três tipos de envio (verificar / agendamento / candidatura).
  - O horário vai para a coluna `entrevista_em` da linha do candidato.
  - O n8n posta no grupo **Reestruturação 3C - GRU** (`120363430026918823-group`) via
    **Z-API**, instância "Supley" (`3F433452...`), Client-Token na credencial
    **"Header Auth account"** (`UitEFSpGVNbn30ZQ`), header `Client-Token`. O número da
    instância (11988957042) é membro do grupo. Nada a configurar nos webhooks da Z-API
    — só enviamos, não recebemos.
  - A tela final não promete entrevista confirmada: diz que o RH confirma pelo WhatsApp.
  - Gestor: **Rodrigo Freitas — rodrigo.freitas@mandalog.com.br** (const `GESTOR`).
  - Grade: **10h–12h e 14h–16h, de 30 em 30 min**, 5 dias úteis à frente (const `AGENDA`
    no `public/index.html`; `janelas` aceita quantos períodos quiser).
  - **Consequência aceita:** sem Calendar não há trava real entre candidatos. Dois
    candidatos podem escolher o mesmo horário — os dois caem no grupo e o RH desempata
    na mão. As colunas `entrevista_gestor`, `meet_link` e `evento_id` existem na planilha
    e ficam vazias. Se um dia isso incomodar, dá para travar lendo os `entrevista_em` já
    ocupados na planilha, sem precisar de Calendar.

- **Trava de recandidatura** ✅ FEITO: antes de iniciar a avaliação o portal chama
  `tipo=verificar`, que busca o e-mail **ou** o WhatsApp na planilha e responde
  `ja_participou`. Há também uma marca em `localStorage` que pega o caso comum
  (recarregar a página). Se a verificação falhar ou demorar mais de 6s, o candidato
  passa — é melhor deixar entrar um duplicado do que barrar alguém legítimo por falha
  de rede; o duplicado aparece na planilha e o RH resolve.
- **Questões técnicas:** reescritas com distratores plausíveis — o erro está na ordem,
  no prazo ou no sistema usado, não em alternativas absurdas. As alternativas são
  embaralhadas uma vez por candidato, então a posição da correta muda entre pessoas.
- **Análise de IA + painel** ✅ FEITO (falta só ligar as variáveis — Passo 6):
  a cada candidatura o n8n chama o Claude e grava `analise_ia`, `fortes_ia`,
  `atencao_ia` e `perguntas_ia` na planilha; o painel em `/painel` mostra tudo
  para o RH e para o gestor. Os 10 candidatos que já estavam na planilha foram
  analisados retroativamente. Se a IA cair, a linha é gravada sem a análise —
  isso foi testado de propósito, quebrando a URL da Anthropic.
- **Tráfego:** republicar a vaga / anúncios apontando para a URL do portal.

## Decisões a confirmar com o Marcus
- **Corte da nota (hoje 85) — o mais urgente.** Dos 10 candidatos reais recebidos até
  05/10, nenhum chegou a 85: as notas foram 49, 58, 58, 60, 60, 68, 70, 74, 78 e 81.
  Do jeito que está, ninguém vê a tela de agendamento e ninguém é marcado para
  entrevista. O gargalo é o teste técnico (45% da nota): só um candidato passou de 71%,
  e vários com mais de 1 ano de experiência tiraram 29–43%. Ou o corte desce
  (75 liberaria 3 pessoas, 70 liberaria 4), ou o peso do técnico cai, ou as questões
  ficam mais fáceis. Enquanto isso não for decidido, o RH chama pelo painel na mão.
- **Rotacionar o token da Z-API.** A URL da instância, com o token, ficou commitada
  num repositório público desde 01/10. A cópia no repositório já foi redigida, mas
  o histórico do git continua com ela. Gerar um token novo na Z-API e trocar no n8n.
- Se a análise da IA deve considerar o conteúdo dos áudios (hoje não: eles não são
  transcritos, a IA só sabe quantos existem).
- Se a indisponibilidade aos sábados deve reprovar o candidato (hoje a resposta é só
  registrada na triagem, sem peso na nota).
- ESL e 1 ano de experiência: obrigatórios ou desejáveis (afeta só a pontuação da triagem).
