// Audio, Voice Announcement & Haptic Vibration Service for MyGiliran

/**
 * Play standard pleasant two-tone ding-dong chime using Web Audio API
 */
export function playCallChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    // Tone 1: D5 (587.33 Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: A5 (880 Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.3, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.65);
  } catch (err) {
    console.warn('Audio chime notice (user gesture needed on some browsers):', err);
  }
}

/**
 * Speak queue number aloud using browser Web Speech API
 * @param {string} queueNumber - e.g. "A001" or "A-12"
 * @param {string} [counterLabel] - optional counter name e.g. "Kaunter 1"
 * @param {string} [lang] - 'ms-MY' or 'en-US'
 */
export function speakQueueNumber(queueNumber, counterLabel = '', lang = 'ms-MY') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    // Format number string with spaces between letters and digits for clear pronunciation
    // e.g. "A105" -> "A 1 0 5"
    const formattedNum = queueNumber.replace(/([A-Za-z]+)(\d+)/, '$1 $2').split('').join(' ');

    let phrase = '';
    if (lang === 'ms-MY' || lang === 'ms') {
      phrase = `Nombor giliran, ${formattedNum}. ${counterLabel ? 'Sila ke ' + counterLabel : 'Sila ke kaunter.'}`;
    } else {
      phrase = `Number, ${formattedNum}. ${counterLabel ? 'Please proceed to ' + counterLabel : 'Please proceed to counter.'}`;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = 0.9;
    utterance.pitch = 1.05;

    // Pick best available voice matching language
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('ms') || v.lang.toLowerCase().includes('my')
    ) || voices.find((v) => v.lang.toLowerCase().startsWith('id')) || voices.find((v) => v.lang.toLowerCase().startsWith('en'));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis notice:', err);
  }
}

/**
 * Combined alert: Play chime first, followed smoothly by voice announcement
 */
export function playChimeAndVoice(queueNumber, counterLabel = '', lang = 'ms-MY') {
  playCallChime();
  setTimeout(() => {
    speakQueueNumber(queueNumber, counterLabel, lang);
  }, 750);
}

/**
 * Trigger mobile haptic vibration pattern for customer when called
 */
export function triggerHapticNotification() {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof window.navigator.vibrate === 'function') {
    try {
      window.navigator.vibrate([200, 100, 200, 100, 400]);
    } catch {
      // Ignore vibration permissions or mobile restrictions
    }
  }
}
