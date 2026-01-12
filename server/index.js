import http from 'node:http';
import { config } from 'dotenv';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

config();

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.ELEVENLABS_API_KEY;
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const elevenlabs = API_KEY ? new ElevenLabsClient({ apiKey: API_KEY }) : null;

const sendJson = (res, status, payload) => {
  const data = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  });
  res.end(data);
};

const sendText = (res, status, message) => {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
  });
  res.end(message);
};

const toBuffer = async (audio) => {
  if (!audio) return null;
  if (Buffer.isBuffer(audio)) return audio;
  if (audio instanceof ArrayBuffer) return Buffer.from(audio);
  if (ArrayBuffer.isView(audio)) {
    return Buffer.from(audio.buffer, audio.byteOffset, audio.byteLength);
  }
  if (typeof audio.arrayBuffer === 'function') {
    const arrayBuffer = await audio.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
  if (typeof audio.getReader === 'function') {
    const reader = audio.getReader();
    const chunks = [];
    let totalLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalLength);
  }
  if (Symbol.asyncIterator in audio) {
    const chunks = [];
    let totalLength = 0;
    for await (const chunk of audio) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      chunks.push(buffer);
      totalLength += buffer.length;
    }
    return Buffer.concat(chunks, totalLength);
  }
  return null;
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.url !== '/api/tts' || req.method !== 'POST') {
    sendText(res, 404, 'Not found');
    return;
  }

  if (!API_KEY || !elevenlabs) {
    sendText(res, 500, 'Missing ELEVENLABS_API_KEY');
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) {
      req.destroy();
    }
  });

  req.on('end', async () => {
    try {
      const payload = body ? JSON.parse(body) : {};
      const text = payload?.text?.trim();
      const voiceId = payload?.voiceId?.trim() || DEFAULT_VOICE_ID;

      if (!text) {
        sendText(res, 400, 'Missing text');
        return;
      }

      if (!voiceId) {
        sendText(res, 400, 'Missing voiceId');
        return;
      }

      const audio = await elevenlabs.textToSpeech.convert(voiceId, {
        text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
        voiceSettings: {
          stability: 0.35,
          similarityBoost: 0.85,
        },
      });
      const audioBuffer = await toBuffer(audio);

      if (!audioBuffer) {
        sendText(res, 500, 'Unable to process audio response');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
      });
      res.end(audioBuffer);
    } catch (error) {
      sendText(res, 500, 'Server error');
    }
  });
});

server.listen(PORT, () => {
  console.log(`ElevenLabs proxy listening on http://localhost:${PORT}`);
});
