# 🚀 Vercel Deployment Guide - Gender Reveal App

## 📋 **Environment Variables Setup**

### **Step 1: Set Environment Variables in Vercel**

1. Go to your **Vercel Dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```bash
# Required Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyD7TJLAv20tPheXff5o5rXc_aMRSQrYL-g
VITE_FIREBASE_AUTH_DOMAIN=gender-reveal-app-7dc64.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://gender-reveal-app-7dc64-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=gender-reveal-app-7dc64
VITE_FIREBASE_STORAGE_BUCKET=gender-reveal-app-7dc64.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=306658063612
VITE_FIREBASE_APP_ID=1:306658063612:web:02554c3599ff65cce0d379
VITE_FIREBASE_MEASUREMENT_ID=G-ZP2PTQP8Q4
```

### **Step 2: Apply to All Environments**
- Set **Environment** to: `Production`, `Preview`, and `Development`
- This ensures variables work in all deployment contexts

### **Step 3: Redeploy**
After adding environment variables:
```bash
# Push a small change to trigger redeploy
git commit --allow-empty -m "Trigger redeploy with env vars"
git push origin main
```

---

## 🔧 **Troubleshooting Environment Variables**

### **Problem: "Environment variable not set" errors**

#### **Solution 1: Check Variable Names**
Ensure all variable names start with `VITE_`:
- ✅ `VITE_FIREBASE_API_KEY` (correct)
- ❌ `FIREBASE_API_KEY` (wrong - missing VITE_ prefix)

#### **Solution 2: Check Vercel Dashboard**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Verify all 8 Firebase variables are listed
3. Check they're applied to "Production", "Preview", and "Development"

#### **Solution 3: Redeploy After Adding Variables**
Variables only take effect after redeployment:
```bash
# Force redeploy
git commit --allow-empty -m "Redeploy with environment variables"
git push origin main
```

#### **Solution 4: Check Build Logs**
In Vercel:
1. Go to **Deployments**
2. Click on latest deployment
3. Check **Build Logs** for environment variable errors

---

## 🛠️ **Local Development Setup**

### **For Local Testing:**
1. Create a `.env` file in your project root:
```bash
# Copy from env.template
cp env.template .env
```

2. Edit `.env` with your values:
```bash
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. Test locally:
```bash
npm run dev
```

---

## 🔍 **Debug Console Messages**

### **What to Look For:**
When you open the browser console, you should see:

**✅ SUCCESS:**
```
🔧 Firebase Environment Debug: {
  mode: "production",
  envVars: {
    apiKey: "✅ Set",
    authDomain: "✅ Set", 
    databaseURL: "✅ Set",
    projectId: "✅ Set"
  }
}
Firebase config being used: {
  configSource: "Environment Variables"
}
```

**❌ PROBLEM:**
```
🔧 Firebase Environment Debug: {
  envVars: {
    apiKey: "❌ Missing",
    authDomain: "❌ Missing"
  }
}
Firebase config being used: {
  configSource: "Fallback Values"
}
```

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Variables Not Loading**
**Symptoms:** Console shows "❌ Missing" for environment variables
**Solution:** 
1. Check variable names have `VITE_` prefix
2. Redeploy after adding variables
3. Clear browser cache

### **Issue 2: Firebase Connection Fails**
**Symptoms:** "Firebase failed to initialize" error
**Solution:**
1. Verify Firebase project is active
2. Check database URL region matches your Firebase project
3. Ensure Firebase Realtime Database is enabled

### **Issue 3: App Works Locally but Not on Vercel**
**Symptoms:** Works with `npm run dev` but fails on deployed site
**Solution:**
1. Environment variables not set in Vercel
2. Check build logs in Vercel dashboard
3. Ensure all variables are applied to Production environment

### **Issue 4: Admin Token Errors**
**Symptoms:** Admin functions don't work
**Solution:**
1. Check Firebase database rules are applied
2. Verify admin token generation in console
3. Clear localStorage and try creating new party

---

## 📱 **Testing Your Deployment**

### **Step-by-Step Test:**
1. **Open your deployed app**
2. **Check browser console** for environment debug messages
3. **Create a test party** - should redirect to admin view
4. **Share guest link** - should show voting interface
5. **Vote as guest** - should appear in admin live results
6. **Test reveal function** - should show confetti celebration

### **Expected Console Output:**
```
🔧 Firebase Environment Debug: { ... envVars all "✅ Set" }
Firebase config being used: { configSource: "Environment Variables" }
Firebase initialized successfully
Creating party: { partyName: "Test", prediction: "boy" }
```

---

## ⚡ **Quick Deployment Checklist**

- [ ] All 8 Firebase environment variables set in Vercel
- [ ] Variables applied to Production, Preview, Development
- [ ] Project redeployed after adding variables
- [ ] Firebase Realtime Database enabled
- [ ] Firebase security rules applied
- [ ] Browser console shows "✅ Set" for all environment variables
- [ ] Test party creation works
- [ ] Test guest voting works
- [ ] Test reveal function works

---

## 🆘 **Still Having Issues?**

### **Get Environment Variable Status:**
Add this temporary debug code to see exactly what Vercel is providing:

```javascript
// Temporary debug - add to firebaseConfig.js
console.log('All Vite env vars:', import.meta.env);
console.log('All process env vars:', typeof process !== 'undefined' ? process.env : 'No process');
```

### **Contact Support:**
If you're still having issues, provide:
1. Screenshot of Vercel environment variables
2. Browser console output
3. Vercel build logs
4. Description of what's not working

Your app should now work perfectly on Vercel! 🎉 