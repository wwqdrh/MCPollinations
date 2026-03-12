/**
 * Pollinations Audio Service
 *
 * Functions for interacting with the Pollinations Audio API
 */

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

/**
 * Generates an audio response to a text prompt using the Pollinations Audio API
 *
 * @param {string} prompt - The text prompt to respond to with audio
 * @param {string} [voice="alloy"] - Voice to use for audio generation. Available options: "alloy", "echo", "fable", "onyx", "nova", "shimmer", "coral", "verse", "ballad", "ash", "sage", "amuch", "dan"
 * @param {number} [seed] - Seed for reproducible results
 * @param {string} [voiceInstructions] - Additional instructions for voice character/style
 * @param {Object} [authConfig] - Optional authentication configuration {token, referrer}
 * @returns {Promise<Object>} - Object containing the base64 audio data, mime type, and metadata
 */
export async function respondAudio(prompt, voice = "alloy", seed, voiceInstructions, authConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  // Build the query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('voice', voice);
  if (seed !== undefined) queryParams.append('seed', seed);

  // Add API key if provided
  if (authConfig && authConfig.token) {
    queryParams.append('key', authConfig.token);
  }

  // Construct the URL
  let finalPrompt = prompt;

  // Add voice instructions if provided
  if (voiceInstructions) {
    finalPrompt = `${voiceInstructions}\n\n${prompt}`;
  }

  const encodedPrompt = encodeURIComponent(finalPrompt);
  const baseUrl = 'https://gen.pollinations.ai';
  let url = `${baseUrl}/audio/${encodedPrompt}`;

  // Add query parameters
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  try {
    // Prepare fetch options with optional auth headers
    const fetchOptions = {};
    if (authConfig && authConfig.token) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${authConfig.token}`
      };
    }

    // Fetch the audio from the URL
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate audio: ${errorData.error?.message || response.statusText}`);
    }

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Convert the ArrayBuffer to a base64 string
    const base64Data = Buffer.from(audioBuffer).toString('base64');

    // Determine the mime type from the response headers or default to audio/mpeg
    const contentType = response.headers.get('content-type') || 'audio/mpeg';

    return {
      data: base64Data,
      mimeType: contentType,
      metadata: {
        prompt,
        voice,
        model: 'tts-1',
        seed,
        voiceInstructions
      }
    };
  } catch (error) {
    log('Error generating audio:', error);
    throw error;
  }
}



/**
 * List available audio voices
 *
 * @returns {Promise<Object>} - Object containing the list of available voice options
 */
export async function listAudioVoices() {
  // Return the complete list of available voices
  const voices = [
    "alloy",
    "echo",
    "fable",
    "onyx",
    "nova",
    "shimmer",
    "coral",
    "verse",
    "ballad",
    "ash",
    "sage",
    "amuch",
    "dan"
  ];

  return { voices };
}
