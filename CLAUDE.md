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
- Workflow **RH - Captura de Candidatura (Portal SAC)** (`nZYE0V0c1LB1G8ZQ`), ativo,
  no projeto pessoal "Mandalog Integração". Nós: Webhook POST → Code "Montar Linha" →
  Google Sheets Append → Respond.
- Credencial Google Sheets ligada: `automacao.ia@mandalog.com.br`.
- `n8n/RH_Captura_Candidatura.json` é a cópia versionada desse workflow — se mudar
  um dos dois, atualizar o outro.
- A URL de produção do webhook não fica no repositório: ela é o valor de
  `N8N_WEBHOOK_CANDIDATURA` na Vercel (ver Passo 4).

## Passo 4 — Vercel ✅ FEITO
- Projeto `portal_rh` em "Mandalog's projects" (plano Hobby), ligado ao repositório
  GitHub. Branch de produção: `claude/fervent-hopper-abgox5` (é a default do repo).
- URL: https://portalrh-delta.vercel.app
- Env var `N8N_WEBHOOK_CANDIDATURA` definida em Production e Preview.
- Sem build: a Vercel serve `public/` como estático e `api/` como função.
- Domínio próprio (ex.: vagas.mandalog.com.br) ainda não configurado — se for usar,
  adicionar em Domains **deste** projeto, não no `mandalog-cmd`.

## Passo 5 — Teste de ponta a ponta
- A gravação já foi testada direto no webhook (payload completo → linha na planilha).
  Falta o teste pelo navegador, depois do deploy:
- Abrir a URL de produção, completar uma candidatura.
- Verificar uma linha nova na planilha (`search_executions` no n8n ajuda a depurar).
- Testar um caso nota ≥ 85 → o portal deve abrir o agendamento.
- Se a candidatura não chegar: conferir CORS (mesma origem, não deve dar problema),
  a env var, e se o workflow está ATIVO e com a credencial Google reconectada.

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
- **Tráfego:** republicar a vaga / anúncios apontando para a URL do portal.

## Decisões a confirmar com o Marcus
- Projeto Vercel e domínio (ex.: vagas.mandalog.com.br).
- Corte da nota (hoje 85).
- Se a indisponibilidade aos sábados deve reprovar o candidato (hoje a resposta é só
  registrada na triagem, sem peso na nota).
- ESL e 1 ano de experiência: obrigatórios ou desejáveis (afeta só a pontuação da triagem).
