import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const artwork = {
  title: 'Untitled Landscape',
  year: '2024',
  medium: 'Oil on canvas',
  artist: 'Ceylan He',
  description:
    'A contemplative landscape study exploring color temperature, depth, and quiet motion through layered brushwork.',
  imageUrl: 'https://picsum.photos/300/200',
};

const speechText = `${artwork.title}. ${artwork.description}`;
const ttsEndpoint = import.meta.env.VITE_TTS_ENDPOINT || '/api/tts';

function App() {
  const pages = useMemo(
    () => [
      { id: 'artwork', label: 'Artwork' },
      { id: 'about', label: 'About' },
      { id: 'archive', label: 'Archive' },
      { id: 'contact', label: 'Contact' },
    ],
    []
  );
  const [activePage, setActivePage] = useState('artwork');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      typeof window.fetch !== 'undefined' &&
      typeof window.Audio !== 'undefined';
    setIsSupported(supported);

    if (!supported) return;
    const audio = new Audio();
    audioRef.current = audio;
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => {
      setIsSpeaking(false);
      setErrorMessage('Audio playback failed. Please try again.');
    };

    return () => {
      abortRef.current?.abort();
      audio.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  const stopSpeech = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const startSpeech = useCallback(async () => {
    if (!isSupported) return;
    setErrorMessage('');
    setIsLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(ttsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: speechText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Audio request failed.');
      }

      const audioBlob = await response.blob();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;

      if (!audioRef.current) return;
      audioRef.current.src = audioUrl;
      await audioRef.current.play();
      setIsSpeaking(true);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setErrorMessage('Audio could not be generated. Check the ElevenLabs server.');
      setIsSpeaking(false);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const handleAudioToggle = useCallback(() => {
    if (isSpeaking || isLoading) {
      stopSpeech();
      return;
    }
    startSpeech();
  }, [isSpeaking, isLoading, startSpeech, stopSpeech]);

  useEffect(() => {
    if (activePage !== 'artwork' && (isSpeaking || isLoading)) {
      stopSpeech();
    }
  }, [activePage, isSpeaking, isLoading, stopSpeech]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">ZeroTag</div>
        <nav className="nav" aria-label="Primary">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              className="nav-button"
              onClick={() => setActivePage(page.id)}
              aria-current={activePage === page.id ? 'page' : undefined}
            >
              {page.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app">
        {activePage === 'artwork' ? (
          <article className="card" aria-labelledby="artwork-title">
            <img
              className="artwork-image"
              src={artwork.imageUrl}
              alt="Abstract landscape artwork"
              loading="lazy"
            />
            <header className="card-header">
              <p className="eyebrow">Artwork</p>
              <h1 id="artwork-title" className="title">
                {artwork.title}
              </h1>
            </header>
            <section className="meta-grid" aria-label="Artwork details">
              <div className="meta-item">
                <span className="label">Year</span>
                <span className="value">{artwork.year}</span>
              </div>
              <div className="meta-item">
                <span className="label">Medium</span>
                <span className="value">{artwork.medium}</span>
              </div>
              <div className="meta-item">
                <span className="label">Artist</span>
                <span className="value">{artwork.artist}</span>
              </div>
            </section>
            <section className="description-section" aria-label="Artwork description">
              <h2 className="section-title">Description</h2>
              <p className="description">{artwork.description}</p>
            </section>
            <section className="audio-section" aria-label="Audio narration">
              <button
                type="button"
                className="audio-button"
                onClick={handleAudioToggle}
                disabled={!isSupported}
                aria-pressed={isSpeaking}
                aria-busy={isLoading}
                aria-label={
                  isSupported
                    ? isSpeaking
                      ? 'Stop audio narration'
                      : isLoading
                        ? 'Stop audio preparation'
                        : 'Play audio narration'
                    : 'Audio narration unavailable'
                }
              >
                {isSpeaking || isLoading ? 'Stop Audio' : 'Play Audio'}
              </button>
              {!isSupported ? (
                <p className="audio-helper" role="status">
                  Audio playback is not supported in this browser.
                </p>
              ) : null}
              {isSupported && isLoading ? (
                <p className="audio-helper" role="status">
                  Preparing your narration...
                </p>
              ) : null}
              {errorMessage ? (
                <p className="audio-helper is-error" role="status">
                  {errorMessage}
                </p>
              ) : null}
            </section>
          </article>
        ) : (
          <section className="page-panel" aria-live="polite">
            <p className="eyebrow">ZeroTag</p>
            <h1 className="title">
              {pages.find((page) => page.id === activePage)?.label}
            </h1>
            {activePage === 'about' ? (
              <p className="description">
                ZeroTag curates contemporary artwork with a focus on materiality, tone,
                and the quiet narrative of landscapes.
              </p>
            ) : (
              <p className="description">Content coming soon.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
