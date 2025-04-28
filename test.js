const SpeechToText = require('./index');

// Create instance with options (or use defaults)
const speechToText = new SpeechToText('tr');

// Listen for speech events
speechToText.on('speech', (text) => {
  console.log('Recognized speech:', text);
});

// Start speech recognition
speechToText.start()
  .then(() => console.log('Speech recognition service initialized'))
  .catch(err => console.error('Failed to start speech recognition:', err));

// When you want to stop:
// speechToText.stop();


/**
 * @param {string} languageCode - Language code (e.g., 'en', 'tr', etc.)
 * @param {string[]} chromeargs - Additional Chrome arguments (e.g., ['--mute', '--no-stdout'])
 * @param {number} checkInterval - Interval to check for new speech in ms (default: 700)
 * @param {boolean} debug - Enable debug mode (default: false)
 * @example
 * const speechToText = new SpeechToText('en', ["--no-sandbox"], 700, true);
 */