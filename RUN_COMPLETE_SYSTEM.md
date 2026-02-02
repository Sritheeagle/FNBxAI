# 🚀 FNBXAI Complete System - Setup & Run Guide

## 📋 **System Overview**

FNBXAI is a complete AI-powered educational system with:
- **🎨 Frontend**: React application with Student, Faculty, and Admin dashboards
- **🔧 Backend**: Node.js server with Express and MongoDB
- **🤖 VUAI Agent**: Specialized AI assistants for each dashboard
- **🔗 LangChain**: Advanced LLM integration with OpenAI
- **📚 Knowledge Base**: 19 comprehensive entries for all roles
- **⚡ Fast AI**: Optimized performance with caching

---

## 🎯 **Quick Start - Run Everything at Once**

### **Option 1: PowerShell Script (Recommended)**
```powershell
# Run the complete system
.\FNBXAI.ps1
```

### **Option 2: Batch File (Windows)**
```batch
# Run the complete system
START_FNBXAI.bat
```

### **Option 3: NPM Scripts**
```bash
# Run complete system
npm run start:all

# Or run batch version
npm run start:batch
```

---

## 📁 **File Structure**

```
FNBXAI1/12345/
├── 📄 FNBXAI.ps1              # PowerShell launcher (complete system)
├── 📄 START_FNBXAI.bat          # Batch launcher (complete system)
├── 📄 package.json              # Frontend dependencies and scripts
├── 📄 RUN_COMPLETE_SYSTEM.md    # This file
├── 📁 src/                     # Frontend React application
│   ├── Components/
│   │   ├── StudentDashboard/    # Student dashboard with AI
│   │   ├── FacultyDashboard/    # Faculty dashboard with AI
│   │   ├── AdminDashboard/      # Admin dashboard with AI
│   │   └── VuAiAgent/           # VUAI Agent component
│   └── ...
└── 📁 backend/                  # Backend server
    ├── 📄 server.js              # Main server file
    ├── 📄 package.json          # Backend dependencies
    ├── 📄 .env                   # Environment variables
    ├── 📁 config/                # Configuration files
    │   ├── database.js           # Database optimization
    │   └── llmConfig.js           # LLM and LangChain config
    ├── 📁 controllers/          # AI controllers
    │   ├── aiAgentController.js  # Original AI agent
    │   ├── studentAIController.js # Student specialized AI
    │   ├── facultyAIController.js # Faculty specialized AI
    │   ├── adminAIController.js   # Admin specialized AI
    │   └── optimizedAIController.js # Fast operations
    ├── 📁 routes/                # API routes
    │   ├── apiRoutes.js           # General API routes
    │   ├── specializedAIRoutes.js # Specialized AI routes
    │   ├── fastAIRoutes.js        # Fast optimization routes
    │   └── llmRoutes.js            # LLM-specific routes
    └── 📄 test*.js                # Test files
```

---

## 🛠️ **Prerequisites**

### **Required Software**
1. **Node.js** (v16 or higher)
2. **npm** (comes with Node.js)
3. **MongoDB** (cloud connection configured)
4. **PowerShell** (for .ps1 script) or **Command Prompt** (for .bat file)

### **Environment Variables**
The `.env` file is already configured with:
```
PORT=5000
MONGO_URI=mongodb+srv://FNBXAI_db_user:1JlyINjrx54rhf9P@cluster0.kdss6af.mongodb.net/friendly_notebook?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here
OPENAI_API_KEY=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
GOOGLE_API_KEY=AIzaSyC8imlzgkPWYuqOpI0bvvbOifM1yvh3mY0
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=friendly-notebook-ai
```

---

## 🚀 **Running the Complete System**

### **Method 1: PowerShell Script (Most Comprehensive)**

1. **Open PowerShell as Administrator**
2. **Navigate to project directory**:
   ```powershell
   cd "C:\Users\rajub\Downloads\FNBXAI1\12345"
   ```
3. **Run the script**:
   ```powershell
   .\FNBXAI.ps1
   ```
4. **Wait for all services to start** (approximately 30-60 seconds)

### **Method 2: Batch File (Simple)**

1. **Double-click** `START_FNBXAI.bat`
2. **Wait for all services to start**

### **Method 3: NPM Scripts**

1. **Open terminal in project directory**
2. **Run complete system**:
   ```bash
   npm run start:all
   ```
   Or:
   ```bash
   npm run start:batch
   ```

---

## 📊 **What Gets Started**

### **🖥️ Console Windows Opened:**

1. **FNBXAI Backend** - Node.js server with VUAI Agent
   - Port: 5000
   - Database: MongoDB connection
   - AI: VUAI Agent + LangChain + Specialized AI

2. **FNBXAI Knowledge Base** - Knowledge base seeding
   - 19 comprehensive entries
   - Role-specific data for all dashboards

3. **FNBXAI Frontend** - React application
   - Port: 3000
   - VUAI Agent integration
   - Student, Faculty, Admin dashboards

4. **FNBXAI AI Monitor** - AI system monitoring
   - Health checks every 30 seconds
   - Endpoint testing
   - Performance monitoring

5. **FNBXAI Database** - Database manager
   - MongoDB status monitoring
   - Collection information
   - Performance metrics

---

## 🌐 **Access Points**

Once everything is running, you can access:

### **🎨 Main Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### **🤖 AI Endpoints**
- **Student AI**: http://localhost:5000/ai/student/*
- **Faculty AI**: http://localhost:5000/ai/faculty/*
- **Admin AI**: http://localhost:5000/ai/admin/*
- **Fast AI**: http://localhost:5000/ai/fast/*
- **LLM API**: http://localhost:5000/llm/*

### **🔧 System Management**
- **Health Check**: http://localhost:5000/ai/fast/health
- **LangChain Status**: http://localhost:5000/llm/langchain/status
- **Performance**: http://localhost:5000/ai/fast/performance

---

## 🎯 **Testing the System**

### **1. Access the Frontend**
1. Open http://localhost:3000 in your browser
2. You'll see the login page

### **2. Test Each Dashboard**

#### **👨‍🎓 Student Dashboard**
- Login with student credentials
- Test the VUAI Agent with questions like:
  - "Explain Python variables"
  - "Help me with data structures"
  - "What are derivatives in calculus?"

#### **👨‍🏫 Faculty Dashboard**
- Login with faculty credentials
- Test the VUAI Agent with questions like:
  - "How to mark attendance with AI?"
  - "Generate an exam paper for Python"
  - "Create lecture notes for data structures"

#### **👨‍💼 Admin Dashboard**
- Login with admin credentials
- Test the VUAI Agent with questions like:
  - "How to manage student admissions?"
  - "Optimize faculty workload"
  - "Improve fee collection rates"

### **3. Monitor AI Responses**
- Watch the console windows for AI responses
- Check response times (should be <500ms)
- Verify role-specific responses

---

## 🔧 **Individual Component Control**

### **Start Backend Only**
```bash
npm run start:backend
```

### **Start Frontend Only**
```bash
npm start
```

### **Seed Knowledge Base**
```bash
npm run seed:knowledge
```

### **Test AI System**
```bash
npm run test:ai
```

### **Test LLM Setup**
```bash
npm run test:llm
```

---

## 🛠️ **Troubleshooting**

### **Common Issues & Solutions**

#### **Port Already in Use**
- The script automatically cleans up ports 5000 and 3000
- If issues persist, manually kill processes:
  ```powershell
  taskkill /F /IM node.exe
  ```

#### **MongoDB Connection Issues**
- The system uses cloud MongoDB (already configured)
- Check internet connection
- Verify MONGO_URI in .env file

#### **AI Agent Not Responding**
- Check backend console for errors
- Verify OpenAI API key in .env
- Run `npm run test:ai` to diagnose

#### **Frontend Not Loading**
- Ensure backend is running first
- Check for npm install errors
- Verify React dependencies

#### **PowerShell Execution Policy**
- Run PowerShell as Administrator
- The script sets execution policy automatically
- If issues persist: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

## 📊 **System Performance**

### **Expected Response Times**
- **Fast AI**: 44-350ms (cached queries)
- **Regular AI**: 300-500ms (first-time queries)
- **Database Operations**: <100ms
- **Frontend Loading**: 5-10 seconds

### **Resource Usage**
- **Memory**: ~200-500MB for all services
- **CPU**: Low during normal operation
- **Network**: Minimal (local connections)

---

## 🎉 **Success Indicators**

### **✅ System is Working When:**
1. **All 5 console windows open** without errors
2. **Frontend loads** at http://localhost:3000
3. **Backend responds** at http://localhost:5000
4. **AI agents respond** in all dashboards
5. **Response times** are under 500ms
6. **Knowledge base** is seeded (19 entries)

### **🎯 Test These Features:**
- ✅ Student AI: Programming and academic help
- ✅ Faculty AI: Teaching and administrative support
- ✅ Admin AI: Institutional management
- ✅ Fast AI: Optimized responses
- ✅ Database: All operations working
- ✅ Navigation: Between dashboard sections

---

## 🚀 **Production Deployment**

For production deployment:
1. **Replace OpenAI API key** with valid one
2. **Set up production MongoDB**
3. **Configure environment variables**
4. **Build frontend**: `npm run build`
5. **Deploy to hosting service**

---

## 📞 **Support**

### **🔧 Quick Commands**
```bash
# Check system status
curl http://localhost:5000/ai/fast/health

# Test AI endpoints
curl -X POST http://localhost:5000/ai/student/chat -H "Content-Type: application/json" -d "{\"message\":\"test\",\"user_id\":\"test\",\"role\":\"student\"}"

# Check LangChain status
curl http://localhost:5000/llm/langchain/status
```

### **📝 Log Locations**
- **Backend Console**: Real-time logs in backend window
- **Frontend Console**: Browser developer tools
- **AI Monitor**: Dedicated monitoring window
- **Database Manager**: Database status window

---

## 🎊 **You're All Set!**

**🚀 The complete FNBXAI system is now ready to run!**

1. **Run** `.\FNBXAI.ps1` or `START_FNBXAI.bat`
2. **Wait** for all services to start
3. **Open** http://localhost:3000
4. **Test** the VUAI Agent in each dashboard
5. **Enjoy** the complete AI-powered educational system!

**🎯 All components will start automatically and work together seamlessly!**
