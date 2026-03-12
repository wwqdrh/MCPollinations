/**
 * Pollinations API Client
 * 
 * A simple client for the Pollinations APIs that doesn't require Cloudflare Workers
 */

/**
 * Generates an image URL from a text prompt using the Pollinations Image API
 * 
 * @param {string} prompt - The text description of the image to generate
 * @param {Object} options - Additional options for image generation
 * @param {string} [options.model] - Model name to use for generation
 * @param {number} [options.seed] - Seed for reproducible results
 * @param {number} [options.width=1024] - Width of the generated image
 * @param {number} [options.height=1024] - Height of the generated image
 * @param {string} [options.apiKey] - API key for authentication
 * @returns {Object} - Object containing the image URL and metadata
 */
export async function generateImageUrl(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  const { 
    model, 
    seed, 
    width = 1024, 
    height = 1024,
    apiKey
  } = options;
  
  // Build the query parameters
  const queryParams = new URLSearchParams();
  if (model) queryParams.append('model', model);
  if (seed !== undefined) queryParams.append('seed', seed);
  if (width) queryParams.append('width', width);
  if (height) queryParams.append('height', height);
  if (apiKey) queryParams.append('key', apiKey);
  
  // Construct the URL
  const encodedPrompt = encodeURIComponent(prompt);
  const baseUrl = 'https://gen.pollinations.ai';
  let url = `${baseUrl}/image/${encodedPrompt}`;
  
  // Add query parameters if they exist
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  // Return the URL directly, keeping it simple
  return {
    imageUrl: url,
    prompt,
    width,
    height,
    model: model || 'flux', // Default model is flux
    seed
  };
}

/**
 * Generates an image from a text prompt and returns the image data as base64
 * 
 * @param {string} prompt - The text description of the image to generate
 * @param {Object} options - Additional options for image generation
 * @param {string} [options.model] - Model name to use for generation
 * @param {number} [options.seed] - Seed for reproducible results
 * @param {number} [options.width=1024] - Width of the generated image
 * @param {number} [options.height=1024] - Height of the generated image
 * @param {string} [options.apiKey] - API key for authentication
 * @returns {Promise<Object>} - Object containing the base64 image data, mime type, and metadata
 */
export async function generateImage(prompt, options = {}) {
  // First, generate the image URL
  const result = await generateImageUrl(prompt, options);
  
  try {
    // Prepare fetch options with optional auth headers
    const fetchOptions = {};
    if (options.apiKey) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${options.apiKey}`
      };
    }
    
    // Fetch the image from the URL
    const response = await fetch(result.imageUrl, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Get the image data as an ArrayBuffer
    const imageBuffer = await response.arrayBuffer();
    
    // Convert the ArrayBuffer to a base64 string
    const base64Data = Buffer.from(imageBuffer).toString('base64');
    
    // Determine the mime type from the response headers or default to image/png
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return {
      data: base64Data,
      mimeType: contentType,
      metadata: {
        prompt: result.prompt,
        width: result.width,
        height: result.height,
        model: result.model,
        seed: result.seed
      }
    };
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Generates audio from a text prompt using the Pollinations Audio API
 * 
 * @param {string} prompt - The text to convert to speech
 * @param {Object} options - Additional options for audio generation
 * @param {string} [options.voice="alloy"] - Voice to use for audio generation
 * @param {number} [options.seed] - Seed for reproducible results
 * @param {string} [options.apiKey] - API key for authentication
 * @returns {Promise<Object>} - Object containing the base64 audio data, mime type, and metadata
 */
export async function generateAudio(prompt, options = {}) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  const { 
    voice = "alloy", 
    seed,
    apiKey
  } = options;
  
  // Build the query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('voice', voice);
  if (seed !== undefined) queryParams.append('seed', seed);
  if (apiKey) queryParams.append('key', apiKey);
  
  // Construct the URL
  const encodedPrompt = encodeURIComponent(prompt);
  const baseUrl = 'https://gen.pollinations.ai';
  let url = `${baseUrl}/audio/${encodedPrompt}`;
  
  // Add query parameters
  const queryString = queryParams.toString();
  if (queryString) {
    url += `?${queryString}`;
  }
  
  try {
    console.error(`Generating audio from URL: ${url}`);
    
    // Prepare fetch options with optional auth headers
    const fetchOptions = {};
    if (apiKey) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${apiKey}`
      };
    }
    
    // Fetch the audio from the URL
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to generate audio: ${response.statusText}`);
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
        seed
      }
    };
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
}

/**
 * List available models from Pollinations APIs
 * 
 * @param {string} [type="image"] - The type of models to list ("image" or "text")
 * @param {string} [apiKey] - API key for authentication
 * @returns {Promise<Object>} - Object containing the list of available models
 */
export async function listModels(type = "image", apiKey = null) {
  try {
    const baseUrl = 'https://gen.pollinations.ai';
    const endpoint = type === "text" ? '/v1/models' : '/image/models';
    const url = `${baseUrl}${endpoint}`;
    
    console.error(`Fetching ${type} models from ${url}`);
    
    // Prepare fetch options with optional auth headers
    const fetchOptions = {};
    if (apiKey) {
      fetchOptions.headers = {
        'Authorization': `Bearer ${apiKey}`
      };
    }
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Error fetching models: ${response.statusText}`);
    }
    
    const responseData = await response.json();
    const models = type === "text" ? responseData.data || [] : responseData;
    return { models };
  } catch (error) {
    console.error(`Error in listModels for ${type}:`, error);
    throw error;
  }
}

// If this file is run directly (e.g., with Node.js)
if (typeof require !== 'undefined' && require.main === module) {
  async function run() {
    try {
      // Example: Generate an image URL
      const imageUrlResult = await generateImageUrl('A beautiful sunset over the ocean');
      console.log('Image URL Result:', imageUrlResult);
      
      // Example: List available models
      const modelsResult = await listModels();
      console.log('Available Models:', modelsResult);
      
      // Example: Generate audio
      console.log('Generating audio...');
      const audioResult = await generateAudio('Hello world, this is a test of the Pollinations API client.');
      console.log('Audio generated successfully!');
    } catch (error) {
      console.error('Error in example:', error);
    }
  }
  
  run();
}
