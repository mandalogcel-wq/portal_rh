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
| regiao | Região escolhida na triagem (pontua proximidade) |
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
| qtd_audios | Quantidade de áudios gravados |
| link_audios | Links dos áudios no Drive (um por linha) |
| cidade | Cidade onde o candidato mora (cadastro) |
| bairro | Bairro onde o candidato mora (cadastro) |
| indicado | Veio pela campanha Indique e Ganhe (Sim/Não) |
| indicado_por | Nome do colaborador que indicou (vazio se não houve indicação) |
| entrevista_em | Horário escolhido pelo candidato na tela de agendamento |
| entrevista_gestor | Gestor da entrevista (preenchido quando o Calendar estiver ligado) |
| meet_link | Link do Google Meet (idem) |
| evento_id | ID do evento no Google Calendar (idem) |

> Corte atual: **nota ≥ 85** marca `status = AGENDAR_ENTREVISTA`.
> Dica: deixe a coluna `nota_final` com formatação condicional (verde ≥ 85) para bater o olho.

**Áudios:** cada resposta da entrevista é gravada em áudio pelo portal, sobe para a pasta
**"Mandalog — Áudios Candidatos RH"** no Drive (`18LlMKV4-6q6nq5ZxMT5eGW-sl_xqGpJc`) e o link
entra em `link_audios`. Quando o candidato não libera o microfone, a linha é gravada do mesmo
jeito, com `qtd_audios = 0` e `link_audios` vazio.
