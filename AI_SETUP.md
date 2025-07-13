# AI Features Setup Guide for Nevexa

This guide will help you set up AI features for your Nevexa social media platform using **Gemini 1.5 Flash** and OpenAI.

## 🚀 AI Features Included

### 1. **Content Moderation**
- Auto-detect inappropriate content using OpenAI's moderation API
- Spam and hate speech detection
- Real-time content filtering

### 2. **Smart Content Generation**
- AI-powered post captions using **Gemini 1.5 Flash**
- Hashtag recommendations
- Content optimization suggestions

### 3. **AI Chat Assistant**
- Smart reply suggestions using **Gemini 1.5 Flash**
- Conversation context understanding
- Natural language processing

### 4. **Content Recommendations**
- Personalized content ideas using **Gemini 1.5 Flash**
- User interest-based suggestions
- Trending topic recommendations

### 5. **User Matching**
- "People you might know" suggestions using **Gemini 1.5 Flash**
- Interest-based user recommendations
- Smart connection suggestions

### 6. **Sentiment Analysis**
- Post sentiment detection using **Gemini 1.5 Flash**
- Content mood analysis
- Engagement prediction

### 7. **Enhanced Content Analysis** (NEW!)
- Engagement potential analysis
- Best posting time suggestions
- Content type classification
- Target audience identification
- Advanced hashtag recommendations

## 📋 Prerequisites

1. **OpenAI API Key**
   - Sign up at [OpenAI](https://platform.openai.com/)
   - Get your API key from the dashboard
   - Add to your `.env` file

2. **Gemini API Key**
   - Sign up at [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Get your API key
   - Add to your `.env` file as `GEMINI_API_KEY`

## 🔧 Setup Instructions

### Step 1: Install Dependencies

```bash
# Navigate to server directory
cd server

# Install AI packages
npm install openai @google/generative-ai
```

### Step 2: Environment Configuration

Create a `.env` file in your `server` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/nevexa

# Session
SESSION_SECRET=your-session-secret-here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Services
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=5000
NODE_ENV=development
```

### Step 3: Update User Model (Optional)

If you want to store user interests for better AI recommendations, update your user model:

```javascript
// In server/models/user.model.js
const userSchema = new mongoose.Schema({
  // ... existing fields
  interests: {
    type: [String],
    default: []
  }
});
```

### Step 4: Start the Servers

```bash
# Terminal 1: Start the backend server
cd server
npm start

# Terminal 2: Start the frontend
cd client
npm run dev
```

## 🎯 API Endpoints

### AI Routes (`/api/ai`)

- `POST /api/ai/moderate` - Content moderation (OpenAI)
- `POST /api/ai/caption` - Generate post captions (Gemini 1.5 Flash)
- `POST /api/ai/hashtags` - Generate hashtags (Gemini 1.5 Flash)
- `POST /api/ai/replies` - Generate smart replies (Gemini 1.5 Flash)
- `GET /api/ai/recommendations` - Get content recommendations (Gemini 1.5 Flash)
- `POST /api/ai/sentiment` - Analyze sentiment (Gemini 1.5 Flash)
- `POST /api/ai/analyze` - Enhanced content analysis (Gemini 1.5 Flash) **NEW!**
- `GET /api/ai/suggestions` - Get user suggestions (Gemini 1.5 Flash)
- `POST /api/ai/post` - Create post with AI features

## 🎨 Frontend Components

### New Components Added:

1. **AIEnhancedPostDialog** (`components/ai-enhanced-post-dialog.tsx`)
   - AI-powered post creation
   - Caption generation
   - Hashtag suggestions
   - Content moderation

2. **AIChatAssistant** (`components/ai-chat-assistant.tsx`)
   - Smart reply generation
   - Conversation assistance

3. **AIContentRecommendations** (`components/ai-content-recommendations.tsx`)
   - Content idea suggestions
   - Personalized recommendations

4. **AIContentAnalyzer** (`components/ai-content-analyzer.tsx`) **NEW!**
   - Enhanced content analysis
   - Engagement prediction
   - Posting time recommendations
   - Target audience identification

## 💡 Usage Examples

### Content Moderation
```javascript
const result = await moderateContent("Your post content here");
if (!result.isAppropriate) {
  console.log("Content violates guidelines");
}
```

### Generate Caption with Gemini 1.5 Flash
```javascript
const caption = await generateCaption("A beautiful sunset", ["photography", "nature"]);
```

### Smart Replies with Gemini 1.5 Flash
```javascript
const replies = await generateSmartReplies("Hello! How are you?", "casual conversation");
```

### Enhanced Content Analysis
```javascript
const analysis = await analyzeContent("Your post content here");
console.log("Engagement:", analysis.engagement);
console.log("Best time to post:", analysis.postingTime);
console.log("Hashtags:", analysis.hashtags);
```

### User Suggestions
```javascript
const suggestions = await getUserSuggestions(5);
```

## 🔒 Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Content Moderation**
   - Always validate AI moderation results
   - Implement manual review for flagged content
   - Log moderation decisions for audit

3. **Rate Limiting**
   - Implement rate limits on AI endpoints
   - Monitor API usage
   - Set up alerts for high usage

## 🚨 Error Handling

The AI service includes comprehensive error handling:

- Network failures
- API rate limits
- Invalid responses
- Timeout handling
- Fallback mechanisms for Gemini API failures

## 📊 Monitoring

### Performance Metrics
- API response times
- Success/failure rates
- User engagement with AI features
- Gemini 1.5 Flash performance

### Logging
- All AI operations are logged
- Error tracking
- Usage analytics

## 🎯 Best Practices

1. **User Experience**
   - Always show loading states
   - Provide fallback options
   - Clear error messages

2. **Performance**
   - Cache AI responses when possible
   - Implement request debouncing
   - Use optimistic updates

3. **Accessibility**
   - Screen reader support
   - Keyboard navigation
   - Clear visual indicators

## 🔧 Troubleshooting

### Common Issues:

1. **API Key Errors**
   - Verify API keys are correct
   - Check environment variables
   - Ensure keys have proper permissions

2. **Rate Limiting**
   - Implement exponential backoff
   - Add request queuing
   - Monitor usage limits

3. **Network Issues**
   - Add retry logic
   - Implement offline fallbacks
   - Show appropriate error messages

4. **Gemini API Issues**
   - Check API key validity
   - Verify model availability
   - Monitor quota usage

## 📈 Future Enhancements

1. **Advanced Features**
   - Image analysis and tagging
   - Voice-to-text transcription
   - Multi-language support

2. **Personalization**
   - User behavior learning
   - Custom AI models
   - Preference-based recommendations

3. **Integration**
   - Third-party AI services
   - Custom model training
   - Advanced analytics

## 🤝 Support

For issues or questions:
1. Check the console for error messages
2. Verify API key configuration
3. Test individual endpoints
4. Review network connectivity
5. Check Gemini API status

---

**Happy coding with Gemini 1.5 Flash! 🚀** 