// Import state helpers
import { getState, updateState } from './state.js';

/**
 * Initializes three simple Tone.Synth instruments and registers them in the application state.
 *
 * This function attempts to dynamically import the Tone.js library. If successful,
 * it creates the synthesizers and registers them in the state. If an error occurs,
 * a message is logged to the console, and the sound functionality is disabled.
 *
 * The following synthesizers are created and connected to the audio output:
 * - `complete`: Sine oscillator with a fast attack and medium release, used for success sounds.
 * - `confetti`: Triangle oscillator with a slightly longer attack/decay, used for confetti/celebration effects.
 * - `coin`: Square oscillator with a short envelope, used for coin/click effects.
 *
 * The created instances are saved under the `sounds` key by calling `updateState({ sounds })`.
 */
export async function initSounds() {
    const { sounds: existingSounds = {}, audioInitialized = false } = getState();
    if (audioInitialized || Object.keys(existingSounds).length > 0) return;

    let Tone;
    try {
        // Prefer ESM build; fallback handled below if this fails
        const importPromise = import('https://esm.sh/tone@14');
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Tone.js import timed out")), 5000)
        );
        const mod = await Promise.race([importPromise, timeoutPromise]);
        Tone = mod?.default ?? mod?.Tone ?? mod;
    } catch (error) {
        console.warn("Tone.js dynamic import failed, falling back to script tag.", error);
        Tone = null;
    }

    if (!Tone || !Tone.Synth) {
        // Fallback: load UMD build via script tag
        try {
            Tone = await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.min.js';
                script.async = true;
                const cleanup = () => {
                  if (script.parentNode) {
                    document.head.removeChild(script);
                  }
                  clearTimeout(timeoutId);
                };
                script.onload = () => {
                  cleanup();
                  resolve(window.Tone);
                };
                script.onerror = () => {
                  cleanup();
                  reject(new Error('Tone.js script failed to load'));
                };
                const timeoutId = setTimeout(() => {
                  cleanup();
                  reject(new Error('Tone.js script load timed out'));
                }, 5000);
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error('Tone.js could not be loaded or audio synthesizers could not be created. Audio functions are disabled.', error);
            updateState({ sounds: {}, audioInitialized: false });
            return;
        }
    }

    // Dispose any existing synths before creating new ones
    for (const key of Object.keys(existingSounds)) {
        try { existingSounds[key]?.dispose?.(); } catch {}
    }

    // Create the synthesizers
    const sounds = {
        complete: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 } }).toDestination(),
        confetti: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 } }).toDestination(),
        coin: new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }).toDestination()
    };

    // Update the application state with the created sounds
    updateState({ sounds, audioInitialized: true });
}
