import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    const supported =
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance !== 'undefined';
    setIsSupported(supported);

    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopSpeech = () => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const startSpeech = () => {
    if (!isSupported) return;
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleAudioToggle = () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }
    startSpeech();
  };

  useEffect(() => {
    if (activePage !== 'artwork' && isSpeaking) {
      stopSpeech();
    }
  }, [activePage, isSpeaking]);

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
                aria-label={
                  isSupported
                    ? isSpeaking
                      ? 'Stop audio narration'
                      : 'Play audio narration'
                    : 'Audio narration unavailable'
                }
              >
                {isSpeaking ? 'Stop Audio' : 'Play Audio'}
              </button>
              {!isSupported && (
                <p className="audio-helper" role="status">
                  Audio playback is not supported in this browser.
                </p>
              )}
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
