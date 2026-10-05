// Painel do RH e dos gestores — login, sessão e leitura dos candidatos.
//
// O painel não fala com o Google Sheets direto (esta função não tem credencial
// Google): ele chama um webhook dedicado do n8n, que lê a planilha e devolve as
// linhas já normalizadas. A URL desse webhook e o token do cabeçalho ficam em
// variáveis de ambiente da Vercel — nada disso entra no repositório.

import {
  COOKIE, autentica, criaSessao, leSessao, cookieSessao,
  bloqueado, registraFalha, limpaFalhas,
} from './_lib/sessao.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, erro: 'Método não permitido' });

  const acao = (req.body && req.body.acao) || '';

  try {
    if (acao === 'login') return await login(req, res);
    if (acao === 'logout') {
      res.setHeader('Set-Cookie', cookieSessao('', 0));
      return res.status(200).json({ ok: true });
    }

    // Tudo daqui para baixo exige sessão válida.
    const sessao = leSessao(req);
    if (!sessao) return res.status(401).json({ ok: false, erro: 'Sessão expirada' });

    if (acao === 'sessao') return res.status(200).json({ ok: true, usuario: sessao });
    if (acao === 'lista') return await lista(req, res, sessao);

    return res.status(400).json({ ok: false, erro: 'Ação desconhecida' });
  } catch (err) {
    console.error('Painel —', acao, err);
    return res.status(500).json({ ok: false, erro: 'Erro interno' });
  }
}

async function login(req, res) {
  const { email, senha } = req.body || {};
  const chave = (req.headers['x-forwarded-for'] || 'local').split(',')[0].trim();

  if (bloqueado(chave)) {
    return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Espere alguns minutos.' });
  }

  let usuario = null;
  try {
    usuario = autentica(email, senha);
  } catch (err) {
    console.error('Painel — autenticação:', err.message);
    return res.status(500).json({ ok: false, erro: 'Painel não configurado' });
  }

  if (!usuario) {
    registraFalha(chave);
    return res.status(401).json({ ok: false, erro: 'E-mail ou senha incorretos' });
  }

  let token;
  try {
    token = criaSessao(usuario);
  } catch (err) {
    console.error('Painel — sessão:', err.message);
    return res.status(500).json({ ok: false, erro: 'Painel não configurado' });
  }

  limpaFalhas(chave);
  res.setHeader('Set-Cookie', cookieSessao(token, 12 * 3600));
  return res.status(200).json({ ok: true, usuario });
}

async function lista(req, res, sessao) {
  const webhook = process.env.N8N_WEBHOOK_PAINEL;
  const token = process.env.N8N_PAINEL_TOKEN;
  if (!webhook || !token) {
    return res.status(500).json({ ok: false, erro: 'N8N_WEBHOOK_PAINEL / N8N_PAINEL_TOKEN não configuradas' });
  }

  const ctrl = new AbortController();
  const prazo = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Painel-Token': token },
      signal: ctrl.signal,
      body: JSON.stringify({ acao: 'lista', por: sessao.email }),
    });
    if (!r.ok) {
      console.error('Painel — n8n respondeu', r.status);
      return res.status(502).json({ ok: false, erro: 'Não consegui ler a planilha agora' });
    }
    const dados = await r.json();
    const candidatos = Array.isArray(dados) ? dados : (dados.candidatos || []);
    return res.status(200).json({ ok: true, usuario: sessao, candidatos });
  } catch (err) {
    console.error('Painel — leitura:', err.name === 'AbortError' ? 'timeout' : err);
    return res.status(502).json({ ok: false, erro: 'Não consegui ler a planilha agora' });
  } finally {
    clearTimeout(prazo);
  }
}
