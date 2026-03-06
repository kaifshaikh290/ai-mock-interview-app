# 🚀 Quick Start Guide

## Immediate Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/ai-interview
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=supersecretkey123456789
GROQ_API_KEY=your-groq-api-key-here
```

### 3. Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Open Browser
Go to: `http://localhost:3000`

---

## Test User Flow

1. **Sign Up** → Create account at `/auth/signup`
2. **Login** → Sign in at `/auth/signin`
3. **Dashboard** → View at `/dashboard`
4. **New Interview** → Click "New Interview"
5. **Configure** → Select role, experience, type
6. **System Check** → Allow camera/mic, enter fullscreen
7. **Interview** → Answer 10 AI questions
8. **Report** → View scores and feedback

---

## Browser Requirements

✅ **Recommended:** Chrome, Edge  
⚠️ **Limited:** Firefox, Safari  
❌ **Not Supported:** IE

**Why?** Web Speech API and WebRTC work best on Chromium browsers.

---

## Common Issues

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
mongosh

# Or update MONGODB_URI to use Atlas
```

### "Groq API Error"
- Verify GROQ_API_KEY is correct
- Check your Groq account quota
- Ensure key has access to llama-3.1-8b-instant model

### "Camera not working"
- Allow permissions in browser
- Use HTTPS in production
- Try different browser

---

## Project Status

✅ **Working:**
- Authentication
- Dashboard
- Interview creation
- System checks
- AI question generation
- Report generation

⚠️ **Needs Improvement:**
- Speech-to-text (browser-dependent)
- Proctoring (client-side only)
- Security hardening
- Error handling

❌ **Not Implemented:**
- Text-to-speech
- Video recording
- Admin panel
- Analytics

---

## Next Steps

1. Read `AUDIT_REPORT.md` for detailed analysis
2. Review `README.md` for full documentation
3. Check `package.json` for available scripts
4. Explore `src/` folder structure

---

**Ready to start? Run `npm run dev`!** 🎉
