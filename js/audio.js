import { updateState } from './state.js';

/**
 * Initialisiert drei einfache Tone.Synth-Instrumente und registriert sie im Anwendungszustand.
 *
 * Versucht, Tone.js dynamisch zu importieren. Bei Erfolg werden die Synthesizer
 * erstellt und im State registriert. Bei einem Fehler wird eine Meldung in der Konsole
 * ausgegeben, und die Sound-Funktionalität ist deaktiviert.
 *
 * Legt die folgenden Synthesizer an und verbindet sie mit der Audio-Ausgabe:
 * - `complete`: Sinus-Oszillator, schnelles Attack, mittleres Release (für Erfolgstöne).
 * - `confetti`: Dreieck-Oszillator, etwas längeres Attack/Decay (für Konfetti-/Feier-Effekte).
 * - `coin`: Rechteck-Oszillator, kurzes Hüllverhalten (für Münz-/Klick-Effekte).
 *
 * Speichert die erzeugten Instanzen unter dem Schlüssel `sounds` durch Aufruf von `updateState({ sounds })`.
 */
export async function initSounds() {
    try {
        const Tone = await import('https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js');
        try {
            const sounds = {
                complete: new Tone.default.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 } }).toDestination(),
                confetti: new Tone.default.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 } }).toDestination(),
                coin: new Tone.default.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }).toDestination()
            };
            updateState({ sounds });
        } catch (synthError) {
            console.error("Fehler beim Erstellen der Audio-Synthesizer:", synthError);
            updateState({ sounds: {} });
        }
    } catch (error) {
        console.error("Tone.js konnte nicht geladen werden. Audio-Funktionen sind deaktiviert.", error);
    }
}
