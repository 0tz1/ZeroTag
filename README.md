# Artwork Detail Card (React)

Single-card React UI showcasing an artwork detail view with speech synthesis narration.

## Getting started

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal.

## ElevenLabs audio setup

1. Copy `.env.example` to `.env`.
2. Add your ElevenLabs API key and voice ID.
3. Start the proxy server in one terminal:

```bash
npm run server
```

4. Start the React dev server in another terminal:

```bash
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8787` by default.
If your proxy lives elsewhere, set `VITE_TTS_ENDPOINT` in `.env`.

## Build for production

```bash
npm run build
npm run preview
```

## Notes

- The "Play Audio" button uses the ElevenLabs SDK via the local proxy in `server/index.js`.
- All artwork data is hardcoded in `src/App.jsx`.
