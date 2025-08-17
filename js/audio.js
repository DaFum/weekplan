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
    const sounds = {
        complete: new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 } }).toDestination(),
        confetti: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 } }).toDestination(),
        coin: new Tone.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }).toDestination()
    };
    updateState({ sounds });
}
