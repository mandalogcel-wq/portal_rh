# Passo a passo (deploy)

Arquitetura:

    Candidato → Portal (Vercel, estático)
              → POST /api/candidatura (função serverless, esconde a URL do n8n)
              → Webhook n8n (/webhook/rh-candidatura)
              → Google Sheets (linha do candidato)   [+ Drive p/ vídeo, opcional]

## 1. Google Sheets
- Crie a planilha conforme `docs/planilha-candidatos.md`.
- Copie o **ID da planilha** (parte da URL entre `/d/` e `/edit`).

## 2. n8n
- Importe `n8n/RH_Captura_Candidatura.json`.
- **Reconecte a credencial do Google Sheets** no nó "Google Sheets (Append)"
  (toda importação perde a credencial).
- Troque `COLE_AQUI_O_ID_DA_PLANILHA` pelo ID real.
- **Active** o workflow e copie a URL de produção do webhook
  (formato limpo: `https://SEU-N8N/webhook/rh-candidatura` — não a versão com UUID).

## 3. GitHub + Vercel
- `git init` → commit → cria repo no GitHub → `vercel link`/deploy.
- Na Vercel, defina a variável de ambiente:
  - `N8N_WEBHOOK_CANDIDATURA` = a URL do webhook do passo 2.
- Deploy de produção. O site serve `public/index.html` e a função `api/candidatura.js`.
- (Opcional) Domínio: apontar `vagas.mandalog.com.br` na Vercel.

## 4. Teste de ponta a ponta
- Abra o site, faça uma candidatura completa.
- Confirme que uma **linha nova apareceu na planilha**.
- Teste um caso com nota ≥ 85 (responda bem) → o portal abre o agendamento.

## Vídeo (fase 2)
Os vídeos são curtos (webm, ~75s), mas podem passar do limite de ~4,5MB da função Vercel.
Duas saídas:
- **Vercel Blob** (`@vercel/blob`): o navegador sobe o vídeo para o Blob e manda só o link no JSON.
- **Upload direto ao n8n**: um segundo webhook de vídeo que recebe o base64 e salva no Drive.
Comece gravando só os dados (texto) na planilha; ligue o vídeo depois.

## Agendamento sem encavalar (fase 2)
A trava entre candidatos (um horário reservado some para o próximo) deve usar a agenda real
dos gestores (Google Calendar) via n8n: o portal lê os horários livres e, ao reservar, o n8n
grava no Calendar e remove da lista. O protótipo atual trava só no navegador do candidato.
