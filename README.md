# Gender Reveal Party App 🎈👶🏻

A beautiful, interactive gender reveal party app with real-time voting and live results! Perfect for families and friends celebrating the arrival of their little ones.

**🌐 Live Demo:** [https://www.bbreveal.com](https://www.bbreveal.com)

## ✨ Features

### 🎉 Core Features
- 🎈 **Create custom gender reveal parties** with personalized names
- 📱 **Mobile-friendly design** - works perfectly on phones and tablets
- 🔒 **Secure admin/guest separation** - only you control the reveal
- 📊 **Live voting results** with real-time updates
- 🎉 **Animated reveal celebrations** with confetti and emojis
- 🌐 **Multi-language support** (English/繁體中文)
- 📱 **QR code generation** for easy sharing
- 🛡️ **Robust name sanitization** (prevents encoding issues)

### 🎨 Enhanced UI/UX
- 🎯 **Sticky QR code area** for easy access during parties
- 💬 **First-time instruction modal** for new users
- 🏠 **Back to Home button** after gender reveal
- 💝 **Optional welcome message** for party hosts
- 📱 **Real-time vote popups** with guest names
- 🎊 **Party name display** on all pages
- 📱 **Mobile-responsive layout** with optimized positioning

### 🔧 Technical Features
- ⚡ **Fast loading** with optimized assets
- 🔍 **SEO optimized** for both English and Chinese (Hong Kong)
- 📊 **Google Analytics** integration for usage tracking
- 🗺️ **Sitemap and robots.txt** for search engine indexing
- 🌍 **International SEO** with hreflang tags
- 📱 **Progressive Web App** ready

## 🚀 Quick Start

### Option 1: Use the Live App
Visit **[https://www.bbreveal.com](https://www.bbreveal.com)** to use the app immediately - no setup required!

### Option 2: Deploy Your Own

#### Local Development

1. **Clone or download** this repository
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Firebase** (see Firebase Setup below)
4. **Run locally:**
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000 in your browser

#### Production Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```
2. **Deploy** the `dist` folder to your preferred hosting service

### 🔥 Firebase Setup

This app requires Firebase Realtime Database. Follow these steps:

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project"
   - Follow the setup wizard

2. **Enable Realtime Database:**
   - In your Firebase project, go to "Realtime Database"
   - Click "Create database"
   - Choose a location and start in test mode

3. **Get Your Firebase Config:**
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web app icon (</>)
   - Register your app and copy the config

4. **Set Up Environment Variables:**

   **For Local Development:**
   ```bash
   # Copy the template
   cp env.template .env
   
   # Edit .env with your Firebase credentials
   VITE_FIREBASE_API_KEY=your_actual_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

   **For Production (Vercel):**
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add all the Firebase environment variables listed above
   - Redeploy your app

**⚠️ Security Note:** Never commit your `.env` file to Git. The `.gitignore` file is already configured to exclude it.

### 🔒 Database Security Rules

Set up your Firebase Realtime Database rules for security:

```json
{
  "rules": {
    "parties": {
      "$roomId": {
        ".read": true,
        ".write": true,
        "votes": {
          ".read": true,
          ".write": true
        },
        "guests": {
          ".read": true,
          ".write": true
        }
      }
    }
  }
}
```

### 🚀 Deployment Options

You can deploy this app to any static hosting service:

- **🌐 Vercel (Recommended):** Connect your GitHub repo to Vercel for automatic deployments
- **📱 GitHub Pages:** Push to a GitHub repository and enable Pages
- **⚡ Netlify:** Drag and drop the folder to Netlify
- **🔥 Firebase Hosting:** Use Firebase Hosting for easy deployment
- **☁️ AWS S3:** Upload to S3 bucket with CloudFront

## 🎉 How to Use

### 1. **Create a Party:**
   - Visit the app at [https://www.bbreveal.com](https://www.bbreveal.com)
   - Click "Create My Party"
   - Enter your party name and select the actual gender
   - Add an optional welcome message for your guests
   - Get your admin and guest links

### 2. **Share with Guests:**
   - Send the guest link or QR code to friends and family
   - Guests can vote from their phones in real-time
   - Watch live results update as votes come in

### 3. **Reveal the Gender:**
   - Use the admin link to control the reveal
   - Press "Reveal Gender" when ready
   - Celebrate with confetti and animations!
   - Use the "Back to Home" button to return to the main page

## 📁 File Structure

```
gender-reveal-app/
├── src/
│   ├── index.html             # Landing page with SEO optimization
│   ├── wizard.html            # Party creation wizard
│   ├── vote.html              # Voting and results page
│   ├── result.html            # Results page
│   ├── debug.html             # Environment variables debug page
│   ├── js/
│   │   ├── app.js            # Main app logic
│   │   ├── wizard.js         # Wizard page logic
│   │   ├── vote_results.js   # Voting and results logic
│   │   └── qrcode.min.js     # QR code library
│   └── config/
│       ├── firebaseConfig.js # Firebase configuration
│       └── translations.js   # Multi-language support
├── public/
│   ├── sitemap.xml           # SEO sitemap
│   └── robots.txt            # Search engine crawling rules
├── dist/                     # Build output
├── package.json              # Dependencies
├── vite.config.js           # Vite configuration
└── README.md                # This file
```

## 🔒 Security Features

- The `.env` file is ignored by git to protect your Firebase credentials
- Admin tokens are generated securely for each party
- Guest and admin links are separate for security
- Robust input sanitization prevents XSS attacks
- Firebase security rules protect your data

## 🌐 Browser Support

- **Mobile:** iOS Safari, Chrome Mobile, Samsung Internet
- **Desktop:** Chrome, Firefox, Safari, Edge
- **Modern browsers** with ES6 support required

## 📊 SEO & Analytics

### Search Engine Optimization
- **Bilingual SEO** optimized for English and Chinese (Hong Kong)
- **Structured data** (JSON-LD) for rich search results
- **Sitemap.xml** and **robots.txt** for proper indexing
- **Hreflang tags** for international SEO
- **Open Graph tags** for social media sharing
- **Local SEO** targeting Hong Kong region

### Analytics Integration
- **Google Analytics** tracking for usage insights
- **Real-time data** on user behavior
- **Mobile vs desktop** usage tracking
- **Geographic data** for user location insights

## 🎯 Performance Features

- **Fast loading** with optimized assets
- **Mobile-first** responsive design
- **Progressive Web App** ready
- **CDN optimized** for global access
- **Minified code** for faster loading

## 📝 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for families and friends celebrating their little ones!** 🎈👶🏻

*Special thanks to all the families who inspired this app and continue to make it better with their feedback and love.* 