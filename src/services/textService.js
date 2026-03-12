/**
 * Pollinations Text Service
 *
 * Functions for interacting with the Pollinations Text API
 */

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

/**
 * Responds with text to a prompt using the Pollinations Text API
 *
 * @param {string} prompt - The text prompt to generate a response for
 * @param {string} [model="openai"] - Model to use for text generation. Use listTextModels to see all available models
 * @param {number} [seed] - Seed for reproducible results (default: random)
 * @param {number} [temperature] - Controls randomness in the output (0.0 to 2.0)
 * @param {number} [top_p] - Controls diversity via nucleus sampling (0.0 to 1.0)
 * @param {string} [system] - System prompt to guide the model's behavior
 * @param {Object} [authConfig] - Optional authentication configuration {token, referrer}
 * @returns {Promise<string>} - The generated text response
 */
export async function respondText(prompt, model = "openai", seed = Math.floor(Math.random() * 1000000), temperature = null, top_p = null, system = null, authConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  // Prepare the request body
  const requestBody = {
    model: model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      { role: 'user', content: prompt }
    ]
  };

  // Add optional parameters
  if (seed !== undefined) requestBody.seed = seed;
  if (temperature !== null) requestBody.temperature = temperature;
  if (top_p !== null) requestBody.top_p = top_p;

  // Prepare fetch options with optional auth headers
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  };

  if (authConfig && authConfig.token) {
    fetchOptions.headers['Authorization'] = `Bearer ${authConfig.token}`;
  }

  // Construct the URL
  const baseUrl = 'https://gen.pollinations.ai';
  const url = `${baseUrl}/v1/chat/completions`;

  try {
    // Fetch the text from the URL
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate text: ${errorData.error?.message || response.statusText}`);
    }

    // Get the JSON response
    const responseData = await response.json();

    // Extract the generated text from the response
    const generatedText = responseData.choices?.[0]?.message?.content;
    if (!generatedText) {
      throw new Error('No text generated in response');
    }

    return generatedText;
  } catch (error) {
    log('Error generating text:', error);
    throw error;
  }
}

/**
 * List available text generation models from Pollinations API
 *
 * @returns {Promise<Object>} - Object containing the list of available text models
 */
export async function listTextModels() {
  try {
    const response = await fetch('https://gen.pollinations.ai/v1/models');

    if (!response.ok) {
      throw new Error(`Failed to list text models: ${response.statusText}`);
    }

    const responseData = await response.json();
    const models = responseData.data || [];
    return { models };
  } catch (error) {
    log('Error listing text models:', error);
    throw error;
  }
}
