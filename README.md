# Portal RH Mandalog — Assistente de SAC

Portal de seleção de candidatos da Mandalog. Frontend estático (um HTML) +
função serverless que grava os resultados no Google Sheets via n8n.

## O que faz
- Triagem + teste técnico/prático de SAC + perfil comportamental (7 competências) + entrevista em vídeo.
- Cronômetro por questão com pulo automático (anti-IA) e detecção de saída de tela.
- Calcula uma **nota final (0–100)**; quem passa de **85** já agenda entrevista no próprio portal.
- Envia o resultado para uma planilha de candidatos (via função serverless → n8n).

## Estrutura

    public/index.html          Portal (frontend, estático)
    api/candidatura.js         Função serverless (Vercel) → repassa ao n8n, esconde a URL
    n8n/RH_Captura_...json      Workflow de captura (importar no n8n)
    docs/planilha-candidatos.md Estrutura da planilha de candidatos
    docs/passo-a-passo.md       Deploy detalhado + fases 2 (vídeo, agenda)
    vercel.json                 Config da Vercel
    .env.example                Variáveis de ambiente

## Deploy rápido
Ver `CLAUDE.md` (runbook para o Claude Code executar) ou `docs/passo-a-passo.md` (manual).

Variável de ambiente necessária na Vercel:
- `N8N_WEBHOOK_CANDIDATURA` — URL do webhook de captura no n8n.

## Stack
Vercel (hospedagem + função) · n8n (automação) · Google Sheets (dados) · Google Drive (vídeos, fase 2).
