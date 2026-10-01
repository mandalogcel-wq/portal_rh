# Runbook — deploy do Portal RH Mandalog (para o Claude Code)

Você vai publicar este projeto (frontend + função serverless) e ligar a gravação
dos resultados no Google Sheets via n8n. Siga na ordem. Peça ao Marcus só o que
for conta dele (logins/credenciais); o resto execute.

## Contexto
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

## Passo 4 — Vercel
- `vercel link` (org/projeto a confirmar com o Marcus).
- Definir env var de produção: `N8N_WEBHOOK_CANDIDATURA` = URL do passo 3.
- `vercel --prod`. Garantir que `/` serve o portal e `/api/candidatura` responde.

## Passo 5 — Teste de ponta a ponta
- A gravação já foi testada direto no webhook (payload completo → linha na planilha).
  Falta o teste pelo navegador, depois do deploy:
- Abrir a URL de produção, completar uma candidatura.
- Verificar uma linha nova na planilha (`search_executions` no n8n ajuda a depurar).
- Testar um caso nota ≥ 85 → o portal deve abrir o agendamento.
- Se a candidatura não chegar: conferir CORS (mesma origem, não deve dar problema),
  a env var, e se o workflow está ATIVO e com a credencial Google reconectada.

## Fases seguintes (não bloqueiam o v1)
- **Vídeo → Drive:** base64 pode passar de 4,5MB na função. Usar Vercel Blob
  (`@vercel/blob`) ou um webhook de vídeo dedicado no n8n que salva no Drive e grava
  o link na planilha. Ver docs/passo-a-passo.md.
- **Agenda sem encavalar:** ligar os horários livres à agenda real dos gestores
  (Google Calendar) via n8n, para travar entre candidatos.
- **Tráfego:** republicar a vaga / anúncios apontando para a URL do portal.

## Decisões a confirmar com o Marcus
- Projeto Vercel e domínio (ex.: vagas.mandalog.com.br).
- Corte da nota (hoje 85) e gestores da entrevista.
- ESL e 1 ano de experiência: obrigatórios ou desejáveis (afeta só a pontuação da triagem).
