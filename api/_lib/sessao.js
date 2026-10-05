// Autenticação do painel do RH.
// Arquivos em api/ que começam com "_" não são publicados como função pela Vercel,
// então este módulo só existe para ser importado por api/painel.js.
//
// Nada de banco de dados: os usuários ficam numa variável de ambiente e a sessão
// é um cookie assinado (HMAC). Para a escala disso aqui (RH + gestores) é o
// suficiente, e não acrescenta infraestrutura nenhuma ao projeto.

import crypto from 'node:crypto';

export const COOKIE = 'mdl_painel';
const HORAS_SESSAO = 12;

/* ===== Senhas =====
   Formato do hash: pbkdf2$<iteracoes>$<salt b64url>$<hash b64url>
   Gere com: node scripts/gerar-senha.mjs "a senha" */

const ITERACOES = 210000;
const TAM_HASH = 32;
const DIGEST = 'sha512';

export function gerarHash(senha, iteracoes = ITERACOES) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(senha.normalize('NFKC'), salt, iteracoes, TAM_HASH, DIGEST);
  return `pbkdf2$${iteracoes}$${b64url(salt)}$${b64url(hash)}`;
}

export function conferemSenha(senha, guardado) {
  const partes = String(guardado || '').split('$');
  if (partes.length !== 4 || partes[0] !== 'pbkdf2') return false;
  const iteracoes = Number(partes[1]);
  if (!Number.isInteger(iteracoes) || iteracoes < 1000 || iteracoes > 1000000) return false;
  let salt, esperado;
  try {
    salt = Buffer.from(partes[2], 'base64url');
    esperado = Buffer.from(partes[3], 'base64url');
  } catch (e) { return false; }
  if (!salt.length || esperado.length !== TAM_HASH) return false;
  const calculado = crypto.pbkdf2Sync(String(senha).normalize('NFKC'), salt, iteracoes, TAM_HASH, DIGEST);
  return crypto.timingSafeEqual(calculado, esperado);
}

/* ===== Usuários =====
   PAINEL_USUARIOS = email|hash|Nome|papel;email|hash|Nome|papel
   papel: "rh" ou "gestor" (muda só a visão que abre por padrão). */

export function lerUsuarios() {
  const bruto = process.env.PAINEL_USUARIOS || '';
  return bruto.split(';').map(l => l.trim()).filter(Boolean).map(linha => {
    const [email, hash, nome, papel] = linha.split('|').map(s => (s || '').trim());
    return { email: (email || '').toLowerCase(), hash, nome: nome || email, papel: papel === 'gestor' ? 'gestor' : 'rh' };
  }).filter(u => u.email && u.hash);
}

export function autentica(email, senha) {
  const alvo = String(email || '').trim().toLowerCase();
  const usuarios = lerUsuarios();
  const achado = usuarios.find(u => u.email === alvo);
  // Mesmo sem o usuário, gasta um PBKDF2 para o tempo de resposta não revelar
  // quais e-mails existem.
  const referencia = achado ? achado.hash : (usuarios[0] && usuarios[0].hash) || gerarHash('x', 1000);
  const ok = conferemSenha(senha, referencia);
  if (!achado || !ok) return null;
  return { email: achado.email, nome: achado.nome, papel: achado.papel };
}

/* ===== Sessão (cookie assinado) ===== */

function segredo() {
  const s = process.env.PAINEL_SESSION_SECRET;
  if (!s || s.length < 24) throw new Error('PAINEL_SESSION_SECRET ausente ou curta (mínimo 24 caracteres)');
  return s;
}

function assina(dados) {
  return b64url(crypto.createHmac('sha256', segredo()).update(dados).digest());
}

export function criaSessao(usuario) {
  const corpo = { e: usuario.email, n: usuario.nome, p: usuario.papel, exp: Date.now() + HORAS_SESSAO * 3600 * 1000 };
  const dados = b64url(Buffer.from(JSON.stringify(corpo), 'utf8'));
  return `${dados}.${assina(dados)}`;
}

export function leSessao(req) {
  const token = (lerCookies(req)[COOKIE] || '');
  const ponto = token.lastIndexOf('.');
  if (ponto < 1) return null;
  const dados = token.slice(0, ponto), firma = token.slice(ponto + 1);
  let esperada;
  try { esperada = assina(dados); } catch (e) { return null; }
  const a = Buffer.from(firma), b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let corpo;
  try { corpo = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8')); } catch (e) { return null; }
  if (!corpo || !corpo.exp || Date.now() > corpo.exp) return null;
  return { email: corpo.e, nome: corpo.n, papel: corpo.p };
}

export function cookieSessao(valor, segundos) {
  const partes = [
    `${COOKIE}=${valor}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${segundos}`,
  ];
  return partes.join('; ');
}

function lerCookies(req) {
  const out = {};
  const bruto = (req.headers && req.headers.cookie) || '';
  bruto.split(';').forEach(par => {
    const i = par.indexOf('=');
    if (i < 1) return;
    out[par.slice(0, i).trim()] = par.slice(i + 1).trim();
  });
  return out;
}

function b64url(buf) { return Buffer.from(buf).toString('base64url'); }

/* ===== Freio simples de força bruta =====
   A função é serverless, então isso vale por instância — não é uma trava de
   verdade, só encarece a tentativa automatizada. A senha forte é a defesa real. */

const tentativas = new Map();
const JANELA = 10 * 60 * 1000;
const LIMITE = 8;

export function bloqueado(chave) {
  const reg = tentativas.get(chave);
  if (!reg) return false;
  if (Date.now() - reg.desde > JANELA) { tentativas.delete(chave); return false; }
  return reg.n >= LIMITE;
}

export function registraFalha(chave) {
  const reg = tentativas.get(chave);
  if (!reg || Date.now() - reg.desde > JANELA) tentativas.set(chave, { n: 1, desde: Date.now() });
  else reg.n++;
}

export function limpaFalhas(chave) { tentativas.delete(chave); }
