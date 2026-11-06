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

## O lado do n8n

O portal manda `vaga_slug` em todo envio (verificar, candidatura e agendamento) e o
n8n já usa esse campo. **Abrir uma vaga nova exige uma entrada em dois lugares do
n8n**, além do JSON aqui:

1. **Fluxo de captura** → nó **Config da Vaga**: acrescente o slug com `aba`,
   `grupo` (WhatsApp), `cargo` e `corte`/`pesos` (que vão para o prompt da IA), e os
   mapas `triagem` e `perfil` — eles dizem qual id vira qual coluna da planilha.
2. **Fluxo do painel** → nó **Aba da Vaga**: acrescente `slug: 'NomeDaAba'`.
3. **Planilha**: crie a aba com o cabeçalho correspondente (as colunas base são
   iguais para todas as vagas; as de triagem e competências vêm dos mapas acima).

Com isso cada vaga tem a sua aba, o seu prompt de IA, o seu grupo de WhatsApp e a
trava de recandidatura passa a valer **por vaga** — a mesma pessoa pode se
candidatar a duas vagas diferentes, que é o certo.

No painel, as colunas de triagem e competências que aparecem na ficha vêm de
`colunas_triagem` e `colunas_perfil` no JSON da vaga. Se você acrescentar uma
competência, acrescente nos dois lugares (o mapa do n8n e o `colunas_perfil`).
