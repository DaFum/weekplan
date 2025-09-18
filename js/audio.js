// Import state helpers
import { getState, updateState } from './state.js';

// Maximum time (ms) to wait for dynamic imports or script loads
const LOAD_TIMEOUT = 5000;

/**
 * Dynamically loads Tone.js either as an ESM module or via a script tag.
 * @returns {Promise<typeof import('tone')|null>} The Tone namespace or null on failure.
 */
async function loadTone() {
    try {
        const importPromise = import('https://esm.sh/tone@14');
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Tone.js import timed out')), LOAD_TIMEOUT);
        });
        const mod = await Promise.race([importPromise, timeoutPromise]);
        const Tone = mod?.default ?? mod?.Tone ?? mod;
        if (Tone && Tone.Synth) return Tone;
    } catch (error) {
        console.warn('Tone.js dynamic import failed, falling back to script tag.', error);
    }

    // Fallback: load UMD build via script tag
    try {
        return await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.min.js';
            script.async = true;
            const cleanup = () => {
                if (script.parentNode) document.head.removeChild(script);
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
            }, LOAD_TIMEOUT);
            document.head.appendChild(script);
        });
    } catch (error) {
        console.error('Tone.js could not be loaded or audio synthesizers could not be created. Audio functions are disabled.', error);
        return null;
    }
}

/**
 * Disposes existing synthesizers safely.
 * @param {Record<string, any>} sounds - Current sound objects.
 */
function disposeSounds(sounds) {
    if (typeof sounds !== 'object' || sounds === null) {
        return;
    }

    for (const [key, sound] of Object.entries(sounds)) {
        if (typeof sound?.dispose !== 'function') {
            continue;
        }

        try {
            sound.dispose();
        } catch (error) {
            console.warn(`Failed to dispose synth "${key}":`, error);
        }
    }
}

/**
 * Creates the application's synthesizers.
 * @param {typeof import('tone')} Tone - The Tone.js namespace.
 */
function createSynths(Tone) {
    return {
        complete: new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 }
        }).toDestination(),
        confetti: new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 }
        }).toDestination(),
        coin: new Tone.Synth({
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 }
        }).toDestination()
    };
}

/**
 * Initializes Tone.js synthesizers and registers them in the application state.
 */
export async function initSounds() {
    const {
        sounds: existingSounds = {},
        audioInitialized = false,
        audioInitializing = false
    } = getState();

    if (audioInitialized || audioInitializing) return;
    updateState({ audioInitializing: true });

    disposeSounds(existingSounds);

    const Tone = await loadTone();
    if (!Tone) {
        updateState({ sounds: {}, audioInitialized: false, audioInitializing: false });
        return;
    }

    const sounds = createSynths(Tone);
    updateState({ sounds, audioInitialized: true, audioInitializing: false });
}

