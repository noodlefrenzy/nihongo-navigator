import { UnavailableError } from './provider.mjs';

export function createHandler(service) {
  const requests = new Map();
  const send = (res, status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(body));
  };
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const address = req.socket.remoteAddress;
      const minute = Math.floor(Date.now() / 60000);
      const record = requests.get(address);
      const count = record?.minute === minute ? record.count + 1 : 1;
      requests.set(address, { minute, count });
      if (requests.size > 1000) for (const [key, value] of requests) if (value.minute < minute) requests.delete(key);
      if (count > 60) { send(res, 429, { error: 'Too many requests. Try again in a minute.' }); return; }
      if (req.method === 'GET' && url.pathname.startsWith('/place-content/')) {
        const id = decodeURIComponent(url.pathname.slice('/place-content/'.length));
        const card = await service.content(id, url.searchParams.get('level') || 'beginner');
        send(res, card ? 200 : 404, card || { error: 'Unknown place or level.' }); return;
      }
      if (req.method === 'POST' && url.pathname === '/judge-translation') {
        if (!req.headers['content-type']?.startsWith('application/json')) { send(res, 415, { error: 'JSON required.' }); return; }
        let bytes = 0;
        const chunks = [];
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 16384) { send(res, 413, { error: 'Answer too large.' }); return; }
          chunks.push(Buffer.from(chunk));
        }
        let input;
        try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { send(res, 400, { error: 'Invalid JSON.' }); return; }
        if (!input || typeof input.sentence_id !== 'string' || input.sentence_id.length > 150 || typeof input.answer !== 'string' || !input.answer.trim() || input.answer.length > 1000) {
          send(res, 400, { error: 'A sentence ID and an answer of 1–1,000 characters are required.' }); return;
        }
        // The client never supplies sentences, references, facts or grading rules.
        const result = await service.judge(input.sentence_id, input.answer);
        send(res, result ? 200 : 404, result || { error: 'Unknown sentence. Reopen the place card.' }); return;
      }
      send(res, 404, { error: 'Unknown endpoint.' });
    } catch (error) {
      if (error instanceof URIError) send(res, 400, { error: 'Invalid place ID.' });
      else if (error instanceof UnavailableError) send(res, 503, { error: error.message });
      else {
        console.error('Content request failed:', error.message);
        send(res, 502, { error: 'The content service could not validate this response. Please try again later.' });
      }
    }
  };
}
