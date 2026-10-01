# Planilha de candidatos — estrutura

A planilha já existe: **"Mandalog — Candidatos RH"**, aba **`Candidatos`**, ID
`15-sp05bPGDkNmVezG31LJrIV9QpGWzcxAON4ZSra1MA`. O que segue é a estrutura dela
(e o que recriar, se um dia for preciso).
Primeira linha (cabeçalho), exatamente nesta ordem (o n8n usa auto-map por nome de coluna):

| Coluna | Conteúdo |
|---|---|
| data | Data/hora do envio (ISO) |
| vaga | Nome da vaga |
| nome | Nome do candidato |
| whatsapp | WhatsApp com DDD |
| email | E-mail |
| experiencia | Experiência em SAC/last mile (triagem) |
| app_rastreamento | App de rastreamento usado |
| esl | Já usou ESL (Sim/Não) |
| regiao | Região onde mora |
| horario_pref | Horário preferido |
| nota_final | Nota final 0–100 |
| pct_triagem | % da triagem |
| pct_tecnico | % do teste técnico |
| comunicacao | Perfil — Comunicação (0–100) |
| senso_urgencia | Perfil — Senso de urgência |
| gestao_conflitos | Perfil — Gestão de conflitos |
| proatividade | Perfil — Proatividade |
| cobranca_influencia | Perfil — Cobrança e influência |
| resiliencia | Perfil — Resiliência |
| registro | Perfil — Capricho no registro |
| pct_perfil | % de aderência de perfil |
| status | AGENDAR_ENTREVISTA ou EM_ANALISE |
| foco_perdido | Nº de saídas de tela durante a prova |
| qtd_videos | Quantidade de vídeos enviados |

> Corte atual: **nota ≥ 85** marca `status = AGENDAR_ENTREVISTA`.
> Dica: deixe a coluna `nota_final` com formatação condicional (verde ≥ 85) para bater o olho.

**Vídeo (opcional, fase 2):** adicionar uma coluna `link_videos` e um nó Google Drive no n8n
que salva cada `videos[].dataUrl` (base64) numa pasta e grava o link aqui.
