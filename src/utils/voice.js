class VoiceEngine {
  constructor() {
    this.queue = [];
    this.speaking = false;
    this.muted = false;
    this.lastSpoken = '';
    this.lastSpokenAt = 0;
  }

  setMuted(m) {
    this.muted = m;
    if (m && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  /** Speak a phrase. Skips duplicates within 5 seconds. */
  say(text, { priority = 'normal' } = {}) {
    if (this.muted) return;
    if (typeof speechSynthesis === 'undefined') return;

    const now = Date.now();
    if (text === this.lastSpoken && now - this.lastSpokenAt < 5000) return;
    this.lastSpoken = text;
    this.lastSpokenAt = now;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    if (priority === 'high') {
      // High-priority instructions cut in front
      speechSynthesis.cancel();
    }
    speechSynthesis.speak(utter);
  }

  cancel() {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }
}

export const voice = new VoiceEngine();

/**
 * Take a Google Maps instruction like "Turn <b>right</b> onto Mall Rd" and
 * produce a clean spoken phrase like "Turn right onto Mall Road".
 */
export const cleanInstruction = (raw) => {
  if (!raw) return '';
  return raw
    .replace(/<[^>]+>/g, ' ')           // strip HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/\bRd\b/g, 'Road')
    .replace(/\bSt\b/g, 'Street')
    .replace(/\bAve\b/g, 'Avenue')
    .replace(/\bBlvd\b/g, 'Boulevard')
    .replace(/\bDr\b/g, 'Drive')
    .trim();
};

/** Given distance-to-maneuver in meters, return phrase like "In 200 meters, " */
export const distancePhrase = (m) => {
  if (m < 30) return 'Now ';
  if (m < 80) return 'In 50 meters, ';
  if (m < 250) return 'In 200 meters, ';
  if (m < 600) return 'In 500 meters, ';
  return `In ${Math.round(m / 100) * 100} meters, `;
};