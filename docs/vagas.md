# Como abrir uma vaga nova

O portal é um motor só. O conteúdo de cada vaga vive em `public/vagas/<slug>.json`,
e `public/index.html` não precisa mudar para abrir, fechar ou editar uma vaga.

- `vagas.mandalog.com.br/` — lista as vagas **abertas**
- `vagas.mandalog.com.br/?vaga=controladoria` — abre o portal daquela vaga

Uma vaga que **não está** em `vagas/index.json` continua acessível pelo link direto,
mas não aparece na lista. É assim que se faz a revisão antes de publicar.

## Passo a passo

1. **Copie** um JSON existente (`sac.json` é o mais completo) para `vagas/<slug>.json`.
   O slug só pode ter letras minúsculas, números e hífen.
2. **Escreva o conteúdo** (campos abaixo).
3. **Revise pelo link direto** `/?vaga=<slug>` antes de listar.
4. **Publique**: acrescente uma linha em `vagas/index.json` com `status: "aberta"`.
5. **Encerre**, quando preencher: troque o `status` para `"encerrada"` nos **dois**
   arquivos. Quem abrir o link antigo vê "vaga encerrada" e as outras vagas abertas.

## Campos do JSON da vaga

| Campo | Para quê |
|---|---|
| `slug`, `status` | Identificador e `aberta` / `encerrada` |
| `titulo`, `local`, `jornada` | Linha de cima da capa |
| `resumo` | Frase do cartão na lista de vagas |
| `lead` | Parágrafo da capa — o que a pessoa vai fazer |
| `corte` | Nota mínima que abre o agendamento |
| `pesos` | `{triagem, tecnico, perfil}` — **tem que somar 1** |
| `gestor` | Nome e e-mail de quem conduz a entrevista |
| `agenda` | Janelas de horário, passo em minutos, dias à frente |
| `local_entrevista` | Texto do endereço na tela de confirmação |
| `passos` | Os 4 cartões de "Como é o processo" |
| `dims` | As competências do cargo (`SIGLA: "Nome"`) — viram o radar |
| `triagem` | Perguntas de requisito. `op` é `[["texto", pontos], ...]`; `score: false` registra sem pontuar |
| `secoes` | `tecnico` (mcq, tem resposta certa), `comportamento` (likert), `valores` (fc) |
| `audio` | Perguntas da entrevista gravada |

**Quantas competências?** Quantas fizerem sentido para o cargo — o radar se adapta.
O SAC usa 7, a Controladoria usa 5.

**Questão técnica boa** tem uma única `correta: true` e distratores plausíveis: o erro
está na ordem, no prazo ou no sistema usado, não em alternativas absurdas. As
alternativas são embaralhadas por candidato, então a posição da certa muda entre
pessoas.

**Corte e pesos:** no SAC o corte era 85 com o técnico valendo 45%, e só 1 de 28
candidatos passou. Comece mais baixo (70) e suba depois de ver as primeiras notas —
é mais fácil subir a régua do que descobrir um mês depois que ninguém passou.

## Validação antes de publicar

```bash
node -e "
const v=require('./public/vagas/<slug>.json');
console.log('pesos somam', Object.values(v.pesos).reduce((a,b)=>a+b,0));
v.secoes.filter(s=>s.tipo==='mcq').forEach(s=>
  console.log('questoes sem resposta certa:', s.questoes.filter(q=>!q.op.some(o=>o.correta)).length));
"
```

## O que ainda depende do n8n

O portal manda `vaga_slug` em todo envio (verificar, candidatura e agendamento).
Falta o n8n usar esse campo para:

- gravar **numa aba por vaga** (as competências mudam, então as colunas mudam);
- usar a **descrição daquela vaga** no prompt da análise de IA;
- avisar o **grupo de WhatsApp** daquela vaga;
- checar recandidatura **só dentro da mesma vaga** — a mesma pessoa pode,
  legitimamente, se candidatar a duas.

Enquanto isso não for feito, tudo cai na aba `Candidatos` com as colunas do SAC.
