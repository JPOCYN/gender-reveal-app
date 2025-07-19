# Gender Reveal Party App

A beautiful, interactive gender reveal party app with real-time voting and live results!

## Features

- 🎈 Create custom gender reveal parties
- 📱 Mobile-friendly design
- 🔒 Secure admin/guest separation
- 📊 Live voting results
- 🎉 Animated reveal celebrations
- 🌐 Multi-language support (English/繁體中文)
- 📱 QR code generation for easy sharing
- 🛡️ Robust name sanitization (prevents encoding issues)

## Setup Instructions

### Local Development

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

### Production Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```
2. **Deploy** the `dist` folder to your preferred hosting service

### Firebase Setup

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
   - Copy `env.template` to `.env`
   - Replace the placeholder values with your actual Firebase config:

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

5. **Update the Configuration (Alternative):**
   - If you prefer to hardcode values, open `firebaseConfig.js`
   - Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your_actual_api_key",
  authDomain: "your_project.firebaseapp.com",
  databaseURL: "https://your_project-default-rtdb.firebaseio.com",
  projectId: "your_project",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};
```

### 2. Database Rules

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

### 3. Deploy

You can deploy this app to any static hosting service:

- **GitHub Pages:** Push to a GitHub repository and enable Pages
- **Vercel:** Connect your GitHub repo to Vercel
- **Netlify:** Drag and drop the folder to Netlify
- **Firebase Hosting:** Use Firebase Hosting for easy deployment

## Usage

1. **Create a Party:**
   - Visit the app
   - Click "Create My Party"
   - Enter party name and select the actual gender
   - Get your admin and guest links

2. **Share with Guests:**
   - Send the guest link or QR code to friends
   - Guests can vote from their phones

3. **Reveal the Gender:**
   - Use the admin link to control the reveal
   - Press "Reveal Gender" when ready
   - Celebrate with confetti!

## File Structure

```
gender-reveal-app/
├── src/
│   ├── pages/
│   │   ├── index.html          # Landing page
│   │   ├── wizard.html         # Party creation wizard
│   │   ├── vote.html           # Voting and results page
│   │   └── result.html         # Results page
│   ├── js/
│   │   ├── app.js             # Main app logic
│   │   ├── wizard.js          # Wizard page logic
│   │   ├── vote_results.js    # Voting and results logic
│   │   └── qrcode.min.js      # QR code library
│   ├── config/
│   │   ├── firebaseConfig.js  # Firebase configuration
│   │   └── translations.js    # Multi-language support
│   └── styles/                # Future CSS files
├── public/                    # Static assets
├── dist/                      # Build output
├── package.json               # Dependencies
├── vite.config.js            # Vite configuration
└── README.md                 # This file
```

## Security Notes

- The `.env` file is ignored by git to protect your Firebase credentials
- Admin tokens are generated securely for each party
- Guest and admin links are separate for security

## Browser Support

- Modern browsers with ES6 support
- Mobile browsers (iOS Safari, Chrome Mobile)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## License

This project is open source and available under the MIT License.

---

Made with ❤️ for families and friends celebrating their little ones! 