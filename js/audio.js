// Import the updateState function from the state module
import { updateState } from './state.js';

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
    try {
        // Dynamically import the Tone.js library
        const Tone = await import('https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js');
        try {
            // Create the synthesizers
            const sounds = {
                complete: new Tone.default.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 } }).toDestination(),
                confetti: new Tone.default.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.5 } }).toDestination(),
                coin: new Tone.default.Synth({ oscillator: { type: "square" }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }).toDestination()
            };
            // Update the application state with the created sounds
            updateState({ sounds });
        } catch (synthError) {
            // Log an error if creating the synthesizers fails
            console.error("Error creating audio synthesizers:", synthError);
            // Update the state with an empty sounds object
            updateState({ sounds: {} });
        }
    } catch (error) {
        // Log an error if Tone.js could not be loaded
        console.error("Tone.js could not be loaded. Audio functions are disabled.", error);
    }
}
