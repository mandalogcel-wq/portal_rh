# Runbook — deploy do Portal RH Mandalog (para o Claude Code)

Você vai publicar este projeto (frontend + função serverless) e ligar a gravação
dos resultados no Google Sheets via n8n. Siga na ordem. Peça ao Marcus só o que
for conta dele (logins/credenciais); o resto execute.

## Contexto
- Frontend estático em `public/index.html`. Função em `api/candidatura.js`.
- O portal faz `POST /api/candidatura` com o resultado; a função repassa ao n8n
  (URL escondida em `N8N_WEBHOOK_CANDIDATURA`); o n8n grava uma linha na planilha.
- n8n do Marcus: instância em `mandalog.app.n8n.cloud` (confirmar). Usar sempre a
  URL de webhook no formato limpo `/webhook/rh-candidatura`, nunca a versão com UUID.
- Ao importar/alterar workflow no n8n via API/SDK, as credenciais Google são perdidas:
  reconecte e republique.

## Passo 1 — Repositório GitHub
- `git init`, commit inicial de todo o projeto.
- Criar repo (privado) com `gh repo create mandalog/portal-rh-sac --private --source=. --push`
  (confirmar org/nome com o Marcus).

## Passo 2 — Google Sheets
- Criar a planilha "Mandalog — Candidatos RH", aba `Candidatos`, com o cabeçalho
  EXATO de `docs/planilha-candidatos.md`. Guardar o ID da planilha.

## Passo 3 — n8n (captura)
- Importar `n8n/RH_Captura_Candidatura.json`.
- No nó "Google Sheets (Append)": reconectar a credencial Google e trocar
  `COLE_AQUI_O_ID_DA_PLANILHA` pelo ID real; sheetName = `Candidatos`.
- Ativar o workflow. Pegar a URL de produção do webhook (`/webhook/rh-candidatura`).
- (Alternativa: se preferir, recriar o workflow pelos tools do n8n em vez de importar —
  mesma lógica: Webhook POST → Code "Montar Linha" → Google Sheets Append → Respond.)

## Passo 4 — Vercel
- `vercel link` (org/projeto a confirmar com o Marcus).
- Definir env var de produção: `N8N_WEBHOOK_CANDIDATURA` = URL do passo 3.
- `vercel --prod`. Garantir que `/` serve o portal e `/api/candidatura` responde.

## Passo 5 — Teste de ponta a ponta
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
- Org/nome do repo e projeto Vercel; domínio (ex.: vagas.mandalog.com.br).
- Corte da nota (hoje 85) e gestores da entrevista.
- ESL e 1 ano de experiência: obrigatórios ou desejáveis (afeta só a pontuação da triagem).
