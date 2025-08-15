const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Generate caption suggestions based on text content and optional image analysis
   * @param {string} currentText - The text user has already typed
   * @param {string} imageBase64 - Optional base64 encoded image for analysis
   * @param {string} imageType - Optional image MIME type
   * @returns {Promise<string>} - Generated caption suggestion
   */
  async generateCaptionSuggestion(currentText = '', imageBase64 = null, imageType = null) {
    try {
      let prompt = '';
      let parts = [];

      if (imageBase64 && imageType) {
        // Image analysis + caption generation
        prompt = `Analyze this image and help complete this social media post caption. 

Current text: "${currentText}"

Please provide a single, engaging caption suggestion that:
1. Complements the image content
2. Continues naturally from the current text (if any)
3. Is social media friendly (casual, engaging tone)
4. Is between 10-100 characters
5. Uses relevant emojis sparingly
6. Doesn't repeat the current text

Return only the suggested caption text, nothing else.`;

        parts = [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageType,
              data: imageBase64
            }
          }
        ];
      } else {
        // Text-only caption completion
        prompt = `Help complete this social media post caption:

Current text: "${currentText}"

Please provide a single, engaging completion that:
1. Continues naturally from the current text
2. Is social media friendly (casual, engaging tone)
3. Adds 10-50 more characters
4. Uses relevant emojis sparingly
5. Makes the post more engaging

Return only the suggested completion text, nothing else.`;

        parts = [{ text: prompt }];
      }

      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const suggestion = response.text().trim();

      // Clean up the response
      return this.cleanSuggestion(suggestion, currentText);

    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate caption suggestion');
    }
  }

  /**
   * Clean and format the AI suggestion
   * @param {string} suggestion - Raw AI suggestion
   * @param {string} currentText - Current user text
   * @returns {string} - Cleaned suggestion
   */
  cleanSuggestion(suggestion, currentText) {
    // Remove quotes if present
    let cleaned = suggestion.replace(/^["']|["']$/g, '');
    
    // Remove any repetition of current text
    if (currentText && cleaned.toLowerCase().startsWith(currentText.toLowerCase())) {
      cleaned = cleaned.substring(currentText.length).trim();
    }

    // Ensure it doesn't exceed reasonable length
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 200).trim();
      // Try to end at a word boundary
      const lastSpace = cleaned.lastIndexOf(' ');
      if (lastSpace > 150) {
        cleaned = cleaned.substring(0, lastSpace);
      }
    }

    // Ensure it's not too short
    if (cleaned.length < 5) {
      return 'Share your thoughts! ✨';
    }

    return cleaned;
  }

  /**
   * Convert image file to base64
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {string} - Base64 encoded image
   */
  imageToBase64(imageBuffer) {
    return imageBuffer.toString('base64');
  }
}

module.exports = new AIService();