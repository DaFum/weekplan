import { updateState } from './state.js';

/**
 * Initialisiert drei einfache Tone.Synth-Instrumente und registriert sie im Anwendungszustand.
 *
 * Legt die folgenden Synthesizer an und verbindet sie mit der Audio-Ausgabe:
 * - `complete`: Sinus-Oszillator, schnelles Attack, mittleres Release (für Erfolgstöne).
 * - `confetti`: Dreieck-Oszillator, etwas längeres Attack/Decay (für Konfetti-/Feier-Effekte).
 * - `coin`: Rechteck-Oszillator, kurzes Hüllverhalten (für Münz-/Klick-Effekte).
 *
 * Speichert die erzeugten Instanzen unter dem Schlüssel `sounds` durch Aufruf von `updateState({ sounds })`.
 */
export function initSounds() {
    // Fail-safe: Tone.js vorhanden?
    if (typeof window.Tone === 'undefined') {
        console.warn('[audio] Tone.js nicht geladen – Sounds werden deaktiviert.');
        updateState({ sounds: {} });
        return;
    }

    // Autoplay-Policy: AudioContext an erste User-Geste koppeln
    if (Tone.context.state !== 'running') {
        const unlock = () => {
            Tone.start().catch(() => {});
            window.removeEventListener('pointerdown', unlock, true);
            window.removeEventListener('keydown', unlock, true);
        };
        window.addEventListener('pointerdown', unlock, true);
        window.addEventListener('keydown', unlock, true);
    }

    const sounds = {
        complete: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 } }).toDestination(),
        confetti: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 } }).toDestination(),
        coin: new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }).toDestination()
    };
    updateState({ sounds });
}
