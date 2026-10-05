# Painel do RH e dos gestores

Página em `/painel` (ex.: https://vagas.mandalog.com.br/painel) com login e senha,
onde o RH e o gestor veem os candidatos, a análise da IA e as perguntas sugeridas
para a entrevista presencial.

## O que o painel mostra
- **Topo:** total de candidatos, quantos passaram do corte, quantos escolheram
  horário e a nota média.
- **Lista:** nota, nome, cidade/bairro, data e etiquetas (acima do corte, horário
  escolhido, análise da IA, indicação, saídas de tela, sem áudio). Dá para buscar
  por nome/e-mail/cidade, filtrar e ordenar.
- **Ficha do candidato** (clique na linha): análise da IA, contato com botão de
  WhatsApp, as notas por bloco, o radar das 7 competências, as respostas da
  triagem, os links dos áudios no Drive e o horário de entrevista escolhido.

O painel é **somente leitura** — nada que o RH faça nele muda a planilha.

## Quem entra
Os usuários ficam na variável `PAINEL_USUARIOS` na Vercel, um por linha,
separados por `;`:

```
email|hash-da-senha|Nome|papel
```

`papel` é `rh` ou `gestor`. **Os dois veem exatamente os mesmos dados** — a única
diferença é que o gestor abre o painel já com o filtro "A entrevistar" ligado, e o
RH abre em "Todos". Qualquer um pode trocar o filtro.

Para criar ou trocar uma senha:

```bash
node scripts/gerar-senha.mjs "fulano@mandalog.com.br" "Fulano de Tal" rh
```

Sem a senha no fim do comando o script sorteia uma forte e mostra na tela. A senha
nunca é guardada: só o hash (PBKDF2-SHA512, 210 mil iterações) vai para a variável
de ambiente. Para remover alguém do painel, apague a linha dele de `PAINEL_USUARIOS`
— ele perde o acesso no próximo login (a sessão aberta dura no máximo 12h).

## Como a sessão funciona
Depois do login a função serverless devolve um cookie `mdl_painel` assinado com
`PAINEL_SESSION_SECRET` (HMAC-SHA256), `HttpOnly`, `Secure` e `SameSite=Strict`,
válido por 12 horas. O cookie guarda só e-mail, nome e papel — não dá para forjar
nem para virar outro usuário sem a chave. Trocar `PAINEL_SESSION_SECRET` desloga
todo mundo na hora.

Há um freio de 8 tentativas de login por IP a cada 10 minutos. Como a função é
serverless, esse freio vale por instância — ele encarece o ataque automatizado,
mas quem segura a porta de verdade é a senha forte.

## De onde vem o dado
O painel não fala com o Google Sheets direto (a função da Vercel não tem credencial
Google). Ele chama `POST /api/painel`, que exige sessão válida e repassa para o
workflow **RH - Painel de Candidatos (leitura)** no n8n, que lê a aba `Candidatos`
e devolve as linhas em JSON.

Esse webhook é protegido por **Header Auth**: a Vercel manda o cabeçalho
`X-Painel-Token` e o n8n só responde se bater com a credencial ligada ao nó
`Webhook Painel`. Sem isso, qualquer um que descobrisse a URL baixaria os dados
pessoais de todos os candidatos.

## Variáveis na Vercel
| Variável | Para quê |
|---|---|
| `PAINEL_USUARIOS` | Quem entra no painel (linhas `email\|hash\|Nome\|papel`) |
| `PAINEL_SESSION_SECRET` | Chave que assina o cookie de sessão (mín. 24 caracteres) |
| `N8N_WEBHOOK_PAINEL` | URL do webhook `/webhook/rh-painel` |
| `N8N_PAINEL_TOKEN` | Valor do cabeçalho `X-Painel-Token` |

Todas em **Production e Preview**.

## A análise da IA
Gerada pelo Claude (`claude-opus-5-5`, credencial `Mandalog` no n8n) dentro do
workflow de captura, logo depois de montar a linha e **antes** de gravar na
planilha. Custa cerca de US$ 0,02 por candidato e grava quatro colunas:
`analise_ia`, `fortes_ia`, `atencao_ia` e `perguntas_ia`.

O que a IA recebe: as notas, as respostas da triagem, cidade/bairro, as 7
competências, quantas vezes o candidato saiu da tela e quantos áudios gravou.
**Os áudios não são transcritos** — a IA sabe quantos existem, não o que foi dito.

O prompt proíbe a IA de comentar ou deduzir gênero, idade, raça, origem, religião,
estado civil, filhos, aparência ou saúde, inclusive a partir do nome, e manda dizer
"não há informação" em vez de inventar. A ficha avisa que a análise é apoio à
decisão, não a decisão.

**Se a IA falhar, a candidatura não se perde:** o nó está com "continuar em caso de
erro", e a linha é gravada do mesmo jeito com os quatro campos vazios (testado).
O painel mostra um aviso nessas fichas.

### Reprocessar quem está sem análise
O workflow **RH - Analise de IA dos candidatos ja recebidos** roda sob demanda:
ele lê a planilha, pega quem está sem análise (ou com alguma parte vazia) e grava
de volta. É o que foi usado para analisar os candidatos que chegaram antes dessa
função existir. O `LIMITE` no nó "So Quem Falta" controla quantos por rodada.
