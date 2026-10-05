#!/usr/bin/env node
// Gera a linha de um usuário do painel para colar em PAINEL_USUARIOS (Vercel).
//
//   node scripts/gerar-senha.mjs "e-mail" "Nome Sobrenome" rh|gestor [senha]
//
// Sem a senha no fim, o script sorteia uma forte e mostra na tela. A senha em si
// não é guardada em lugar nenhum — só o hash vai para a variável de ambiente.

import crypto from 'node:crypto';
import { gerarHash } from '../api/_lib/sessao.js';

const [email, nome, papel = 'rh', senhaArg] = process.argv.slice(2);

if (!email || !nome) {
  console.error('Uso: node scripts/gerar-senha.mjs "email" "Nome" rh|gestor [senha]');
  process.exit(1);
}
if (papel !== 'rh' && papel !== 'gestor') {
  console.error('O papel precisa ser "rh" ou "gestor".');
  process.exit(1);
}

const senha = senhaArg || sorteiaSenha();
const linha = [email.toLowerCase(), gerarHash(senha), nome, papel].join('|');

console.log('');
console.log('Usuário :', nome, `(${papel})`);
console.log('E-mail  :', email.toLowerCase());
console.log('Senha   :', senha, senhaArg ? '' : '  <- sorteada agora, anote');
console.log('');
console.log('Linha para PAINEL_USUARIOS:');
console.log(linha);
console.log('');
console.log('Vários usuários na mesma variável: separe as linhas com ponto e vírgula.');

function sorteiaSenha() {
  // Sem caracteres que se confundem (0/O, 1/l/I) para poder ditar no WhatsApp.
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 18; i++) s += alfabeto[crypto.randomInt(alfabeto.length)];
  return s.slice(0, 6) + '-' + s.slice(6, 12) + '-' + s.slice(12, 18);
}
