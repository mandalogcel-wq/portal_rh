// Função serverless (Vercel) — recebe o resultado do portal e repassa ao n8n.
// A URL real do n8n fica escondida numa variável de ambiente (N8N_WEBHOOK_CANDIDATURA).
// Mesma origem do site, então não há problema de CORS para o portal.

export default async function handler(req, res) {
  // Pré-flight / segurança básica
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Método não permitido' });

  const webhook = process.env.N8N_WEBHOOK_CANDIDATURA;
  if (!webhook) return res.status(500).json({ ok: false, error: 'N8N_WEBHOOK_CANDIDATURA não configurada' });

  try {
    const payload = req.body || {};

    // Honeypot anti-spam opcional: se o portal mandar campo _hp preenchido, ignora.
    if (payload._hp) return res.status(200).json({ ok: true, ignored: true });

    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.status(200).json({ ok: true, n8n_status: r.status });
  } catch (err) {
    // Não derruba o candidato: loga e responde erro suave.
    console.error('Erro ao encaminhar candidatura ao n8n:', err);
    return res.status(502).json({ ok: false, error: 'Falha ao encaminhar ao n8n' });
  }
}

// OBS sobre vídeo: os vídeos vão como base64 dentro do JSON. A Vercel limita o corpo
// da função a ~4.5MB. Para vídeos maiores, o caminho recomendado é Vercel Blob
// (@vercel/blob) ou upload direto do navegador para um webhook de vídeo do n8n.
// Ver docs/passo-a-passo.md, seção "Vídeo".
