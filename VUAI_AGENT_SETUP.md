# VUAI Agent - LLM Integration Setup Guide

## 🚀 Overview

The VUAI Agent has been successfully integrated with OpenAI and LangChain for intelligent, context-aware responses. The system now provides role-specific assistance for students, faculty, and administrators with enhanced dashboard navigation.

## ✅ Features Implemented

### 🤖 LLM Integration
- **OpenAI GPT-3.5 Turbo** integration via LangChain
- **Context-aware responses** based on user role and academic context
- **Conversation history** for personalized interactions
- **Knowledge base integration** for accurate information retrieval

### 🎯 Role-Specific Responses
- **Students**: Academic guidance, study assistance, dashboard navigation
- **Faculty**: Teaching support, class management, administrative help
- **Admin**: System management, user administration, knowledge base updates

### 🧭 Enhanced Navigation
- **Smart navigation commands**: `{{NAVIGATE:section}}` for direct dashboard access
- **Natural language navigation**: "navigate to attendance", "go to exams"
- **Context-aware suggestions**: Relevant section recommendations

### 📚 Knowledge Base
- **22 enhanced knowledge entries** with dashboard-specific information
- **Role-based filtering**: Students, faculty, admin, or all roles
- **Relevance scoring**: Intelligent matching for better responses

## 🔧 Configuration

### Environment Variables (.env)
```env
# OpenAI API Key
OPENAI_API_KEY=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

# Google API Key (for future integrations)
GOOGLE_API_KEY=AIzaSyC8imlzgkPWYuqOpI0bvvbOifM1yvh3mY0

# LangChain Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=friendly-notebook-ai
```

### Dependencies Installed
```bash
npm install langchain openai @langchain/openai @langchain/community @langchain/core --legacy-peer-deps
```

## 🎮 Usage Examples

### Student Interactions
```
User: "What's my attendance percentage?"
AI: "Hi Student! As your study companion, you can check your attendance in the Attendance section. {{NAVIGATE:attendance}}"

User: "Help me prepare for exams"
AI: "Find your exam schedule and preparation materials in the Exams section. {{NAVIGATE:exams}} I can also help you create study plans!"
```

### Faculty Interactions
```
User: "I need to upload materials for my class"
AI: "Hello Professor! Upload and organize study materials for your classes in the Materials section. {{NAVIGATE:materials}}"

User: "How do I mark attendance?"
AI: "Mark and track student attendance for your classes in the Attendance section. {{NAVIGATE:attendance}}"
```

### Admin Interactions
```
User: "Add a new student to the system"
AI: "Hello Administrator! Add, edit, and manage student accounts in the Students section. {{NAVIGATE:students}}"

User: "Update the AI knowledge base"
AI: "Update the AI agent knowledge base to improve responses and add new information. Use the knowledge management tools."
```

## 🗂️ Available Navigation Sections

### Student Dashboard
- `{{NAVIGATE:overview}}` - Academic progress and quick actions
- `{{NAVIGATE:semester}}` - Academic browser and study materials
- `{{NAVIGATE:attendance}}` - Attendance tracking
- `{{NAVIGATE:exams}}` - Exam schedule and preparation
- `{{NAVIGATE:tasks}}` - Assignments and deadlines
- `{{NAVIGATE:placement}}` - Career preparation
- `{{NAVIGATE:settings}}` - Profile and preferences

### Faculty Dashboard
- `{{NAVIGATE:overview}}` - Class schedules and statistics
- `{{NAVIGATE:materials}}` - Material management
- `{{NAVIGATE:attendance}}` - Attendance marking
- `{{NAVIGATE:exams}}` - Exam creation and management
- `{{NAVIGATE:messages}}` - Student communication
- `{{NAVIGATE:analytics}}` - Performance analytics
- `{{NAVIGATE:broadcast}}` - Class announcements

### Admin Dashboard
- `{{NAVIGATE:overview}}` - System statistics
- `{{NAVIGATE:students}}` - Student management
- `{{NAVIGATE:faculty}}` - Faculty management
- `{{NAVIGATE:curriculum}}` - Course and curriculum management

## 🔄 API Endpoints

### Chat & AI
- `POST /api/chat` - Send message to AI agent
- `GET /api/chat/history` - Get chat history
- `POST /api/agent/reload` - Reload AI knowledge

### Knowledge Base
- `GET /api/knowledge` - Get knowledge base entries
- `POST /api/knowledge/update` - Update knowledge base

## 🧪 Testing

### Test the AI Agent
```bash
cd backend
node testAI.js
```

### Manual Testing
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "navigate to attendance",
    "user_id": "test123",
    "role": "student",
    "user_name": "Test Student"
  }'
```

## 🚀 Startup Instructions

### 1. Start Backend Server
```bash
cd backend
npm start
```

### 2. Start Frontend (if not already running)
```bash
cd ..
npm start
```

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🎯 Key Improvements

1. **Intelligent Responses**: Now uses GPT-3.5 for contextual, helpful responses
2. **Enhanced Navigation**: Smart navigation commands for quick dashboard access
3. **Role Awareness**: Tailored responses for each user type
4. **Knowledge Integration**: AI can access and utilize the knowledge base
5. **Conversation Memory**: Maintains context across interactions
6. **Error Handling**: Graceful fallbacks when AI services are unavailable

## 🔍 Troubleshooting

### Common Issues
1. **API Key Errors**: Ensure OPENAI_API_KEY is correctly set in .env
2. **Connection Issues**: Check MongoDB connection and server status
3. **Navigation Not Working**: Verify frontend is properly handling {{NAVIGATE:}} commands

### Debug Mode
Add console logging in `aiAgentController.js` to debug AI responses:
```javascript
console.log(`[AI Agent] ${role} ${user_id}: ${message}`);
console.log(`[AI Agent] Response: ${response.substring(0, 100)}...`);
```

## 📈 Performance Notes

- **Response Time**: ~2-3 seconds for AI responses
- **Token Usage**: Optimized prompts to reduce costs
- **Caching**: Knowledge base results cached for efficiency
- **Fallback**: Basic responses available when AI is unavailable

---

## 🎉 Setup Complete!

The VUAI Agent is now fully integrated with LLM capabilities and ready to provide intelligent, context-aware assistance to all user types. The system combines the power of OpenAI's GPT-3.5 with a comprehensive knowledge base for the best user experience.
