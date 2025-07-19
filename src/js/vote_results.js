// js/vote_results.js
// Strict admin/guest separation, admin QR, no admin voting

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  const guestParam = params.get('guest');
  const adminTokenParam = params.get('adminToken');

  if (!roomId) {
    document.body.innerHTML = '<div class="flex flex-col items-center justify-center min-h-screen"><h2 class="text-xl font-bold text-red-600">No party found. Please use a valid invite link.</h2></div>';
    return;
  }

  // Elements
  const partyNameEl = document.getElementById('partyName');
  const nameSection = document.getElementById('nameSection');
  const guestNameInput = document.getElementById('guestName');
  const submitNameBtn = document.getElementById('submitNameBtn');
  const nameError = document.getElementById('nameError');
  const voteSection = document.getElementById('voteSection');
  const voteBoyBtn = document.getElementById('voteBoyBtn');
  const voteGirlBtn = document.getElementById('voteGirlBtn');
  const voteMsg = document.getElementById('voteMsg');
  const resultsSection = document.getElementById('resultsSection');
  const boyBar = document.getElementById('boyBar');
  const girlBar = document.getElementById('girlBar');
  const boyCount = document.getElementById('boyCount');
  const girlCount = document.getElementById('girlCount');
  const boyNames = document.getElementById('boyNames');
  const girlNames = document.getElementById('girlNames');
  const changePopup = document.getElementById('changePopup');
  const confirmChangeBtn = document.getElementById('confirmChangeBtn');
  const cancelChangeBtn = document.getElementById('cancelChangeBtn');
  const revealGenderBtn = document.getElementById('revealGenderBtn');
  const revealPopup = document.getElementById('revealPopup');
  const confirmRevealBtn = document.getElementById('confirmRevealBtn');
  const cancelRevealBtn = document.getElementById('cancelRevealBtn');
  const finalReveal = document.getElementById('finalReveal');
  const finalRevealMsg = document.getElementById('finalRevealMsg');
  const finalConfetti = document.getElementById('finalConfetti');

  // Admin badge and QR
  let adminBadge = null;
  let adminQR = null;
  function showAdminBadge() {
    if (!adminBadge) {
      adminBadge = document.createElement('div');
      adminBadge.textContent = '🎛️ Admin';
      adminBadge.className = 'fixed top-14 right-2 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full shadow text-xs font-semibold z-50 opacity-80';
      // On wide screens, move left to avoid lang switcher
      if (window.innerWidth > 640) {
        adminBadge.className += ' sm:top-4 sm:right-36';
      }
      document.body.appendChild(adminBadge);
    }
  }
  function hideAdminBadge() {
    if (adminBadge) {
      adminBadge.remove();
      adminBadge = null;
    }
  }
  
  function hideAdminUI() {
    // Remove back to home button
    const backBtn = document.querySelector('button[onclick*="Back to Home"]');
    if (backBtn) {
      backBtn.remove();
    }
  }
  function showAdminQR(roomId) {
    if (!adminQR) {
      adminQR = document.createElement('div');
      adminQR.className = 'bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl p-4 shadow-lg mt-4 border border-pink-200 hidden';
      adminQR.innerHTML = `
        <div class="text-center">
          <div class="text-xl mb-2">📱 Share with Guests</div>
          <div class="mb-3">
            <div id="adminGuestQR" class="flex justify-center mb-2"></div>
            <div class="text-xs text-gray-600 mb-2">Scan to join and vote</div>
            <div class="bg-white rounded p-2 text-xs text-gray-700 mb-2 border">
              <div class="font-semibold mb-1">Guest Link:</div>
              <div id="guestLinkText" class="break-all text-xs"></div>
            </div>
            <button id="copyGuestLinkBtn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg transition-all text-xs" data-i18n="copyLink">Copy Link</button>
          </div>
        </div>
      `;
      resultsSection.parentNode.insertBefore(adminQR, resultsSection.nextSibling);
      
      // Add copy functionality
      const copyBtn = adminQR.querySelector('#copyGuestLinkBtn');
      const guestLinkText = adminQR.querySelector('#guestLinkText');
      const guestLink = `${window.location.origin}/vote.html?roomId=${roomId}`;
      guestLinkText.textContent = guestLink;
      
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(guestLink);
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('bg-green-500');
        setTimeout(() => {
          copyBtn.textContent = 'Copy Link';
          copyBtn.classList.remove('bg-green-500');
        }, 2000);
      };
    }
    const guestLink = `${window.location.origin}/vote.html?roomId=${roomId}`;
    const qrDiv = adminQR.querySelector('#adminGuestQR');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: guestLink,
      width: 128,
      height: 128,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  }
  function hideAdminQR() {
    if (adminQR) {
      adminQR.remove();
      adminQR = null;
    }
  }

  // LocalStorage keys
  const votedKey = `voted_${roomId}`;
  const nameKey = `name_${roomId}`;
  const changeKey = `changed_${roomId}`;
  const voteIdKey = `voteId_${roomId}`;

  // Cute emoji for badges
  const badgeEmojis = ['👶🏻','🍼','🎈','🎉','🧸','🎀','🦄','🐣','🐥','🦋','🌈','⭐','💫','🍭','🍬','🎂','🎁','😻','🐻','🐰'];
  
  // Sanitize and validate name input
  function sanitizeName(name) {
    if (!name || typeof name !== 'string') return 'Guest';
    
    // Decode URI component if needed
    let sanitized = name;
    try {
      sanitized = decodeURIComponent(name);
    } catch (e) {
      // If decodeURIComponent fails, use the original
      sanitized = name;
    }
    
    // Remove or replace problematic characters
    sanitized = sanitized
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/[\uFFFD]/g, '') // Remove replacement characters
      .trim();
    
    // If name is empty or only contains problematic characters, use fallback
    if (!sanitized || sanitized.length === 0) {
      return 'Guest';
    }
    
    // Limit length to prevent overflow
    if (sanitized.length > 20) {
      sanitized = sanitized.substring(0, 20) + '...';
    }
    
    return sanitized;
  }
  
  function emojiForName(name) {
    const sanitizedName = sanitizeName(name);
    let hash = 0;
    for (let i = 0; i < sanitizedName.length; i++) {
      hash = sanitizedName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return badgeEmojis[Math.abs(hash) % badgeEmojis.length];
  }

  // Firebase is initialized in firebaseConfig.js
  // Initialize Firebase and database references
  let db, infoRef, votesRef, revealRef, adminTokenRef;
  
  // Wait for Firebase to be properly initialized
  if (window.firebaseInitPromise) {
    await window.firebaseInitPromise;
  } else {
    // Fallback: wait for Firebase to be ready
    let attempts = 0;
    while (!firebase.apps.length && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!firebase.apps.length) {
      console.error('Firebase failed to initialize');
      document.body.innerHTML = '<div class="flex flex-col items-center justify-center min-h-screen"><h2 class="text-xl font-bold text-red-600">Error: Firebase failed to initialize. Please refresh the page.</h2></div>';
      return;
    }
  }
  
  db = firebase.database();
  infoRef = db.ref(`parties/${roomId}/info`);
  votesRef = db.ref(`parties/${roomId}/votes`);
  revealRef = db.ref(`parties/${roomId}/reveal`);
  adminTokenRef = db.ref(`parties/${roomId}/adminToken`);

  // State
  let userVoteId = localStorage.getItem(voteIdKey) || null;
  let userChanged = localStorage.getItem(changeKey) === '1';
  let pendingVote = null;
  let allVotes = [];
  let guestName = guestParam ? decodeURIComponent(guestParam) : localStorage.getItem(nameKey);
  let hasVoted = false;
  let isAdmin = false;

  // Fetch and show party info
  infoRef.once('value').then(snap => {
    const info = snap.val();
    if (info) {
      partyNameEl.textContent = info.partyName || 'Gender Reveal Party';
    } else {
      partyNameEl.textContent = 'Gender Reveal Party';
    }
  });

  // Vote animation functions
  function showVoteAnimation(voterName, vote) {
    const container = document.getElementById('voteAnimationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = 'vote-notification bg-white rounded-lg shadow-lg p-4 mb-2 max-w-xs';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-2xl">${vote === 'boy' ? '💙' : '💖'}</span>
        <div>
          <div class="font-bold text-sm">${voterName}</div>
          <div class="text-xs text-gray-600">${vote === 'boy' ? 'Boy' : 'Girl'}</div>
        </div>
      </div>
    `;
    
    container.appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 800);
  }

  // Legacy fullscreen popup (kept for compatibility)
  function showFullscreenPopup() {
    // This is now replaced by showFullscreenTip()
    // Keeping for backward compatibility
  }

  // Enhanced fullscreen detection and layout adaptation
  function detectFullscreen() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
  }

  // Detect large screens
  function detectLargeScreen() {
    return window.innerWidth >= 1200;
  }

  // Create confetti effect
  function createConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      container.appendChild(confetti);
    }
    
    // Remove confetti after animation
    setTimeout(() => {
      if (container.parentElement) {
        container.remove();
      }
    }, 5000);
  }

  // Enhanced adaptive layout for party display
  function adaptLayoutForParty() {
    const isFullscreen = detectFullscreen();
    const isLargeScreen = detectLargeScreen();
    const body = document.body;
    const mainContainer = document.querySelector('.w-full.max-w-md, .w-full.max-w-6xl');
    const resultsSection = document.getElementById('resultsSection');
    
    if (isFullscreen || isLargeScreen) {
      // Apply fullscreen layout
      body.classList.add('fullscreen-layout');
      if (isLargeScreen && !isFullscreen) {
        body.classList.add('large-screen-layout');
      }
      
      // Expand container for immersive experience
      if (mainContainer) {
        mainContainer.className = 'w-full max-w-6xl mx-auto p-8 bg-white cute-card text-center mt-4';
      }
      
      // Structure the results section for fullscreen
      if (resultsSection) {
        resultsSection.classList.add('party-display-mode');
        structureFullscreenResults();
      }
      
      // In fullscreen, show QR as toggleable via floating controls
      // Don't hide QR initially, let user control via toggle
      
      // Show enhanced floating controls
      showEnhancedFloatingControls();
      
      // Start subtle confetti animation
      startSubtleConfetti();
      
    } else {
      // Compact layout for normal mode
      body.classList.remove('fullscreen-layout', 'large-screen-layout');
      
      if (mainContainer) {
        mainContainer.className = 'w-full max-w-md mx-auto p-4 bg-white cute-card text-center mt-4';
      }
      
      if (resultsSection) {
        resultsSection.classList.remove('party-display-mode');
        restoreCompactResults();
      }
      
      // Show QR code in compact mode
      if (adminQR) {
        adminQR.classList.remove('hidden');
      }
      
      hideEnhancedFloatingControls();
      stopSubtleConfetti();
    }
  }

  // Structure results section for fullscreen display (CSS-only approach)
  function structureFullscreenResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) return;
    
    // Just add CSS classes - don't restructure DOM to preserve event handlers
    resultsSection.classList.add('fullscreen-results-structured');
    
    // Create live voting layout
    createLiveVotingLayout();
    
    // Show F11 instructions
    showF11Instructions();
    
    // Start subtle confetti
    startSubtleConfetti();
  }
  
  function createLiveVotingLayout() {
    const container = document.querySelector('.party-display-mode');
    if (!container) return;
    
    // Create live voting bars
    const voteBarsContainer = document.createElement('div');
    voteBarsContainer.className = 'live-vote-bars';
    voteBarsContainer.innerHTML = `
      <div class="vote-bar-container" id="boyVoteBar">
        <div class="vote-bar-header">
          <div class="vote-bar-label">
            <span class="vote-bar-emoji">💙</span>
            <span>Boy</span>
          </div>
          <div class="vote-count" id="boyVoteCount">0</div>
        </div>
        <div class="vote-bar-bg">
          <div class="vote-bar-fill boy" id="boyVoteFill" style="width: 0%"></div>
        </div>
      </div>
      
      <div class="vote-bar-container" id="girlVoteBar">
        <div class="vote-bar-header">
          <div class="vote-bar-label">
            <span class="vote-bar-emoji">❤️</span>
            <span>Girl</span>
          </div>
          <div class="vote-count" id="girlVoteCount">0</div>
        </div>
        <div class="vote-bar-bg">
          <div class="vote-bar-fill girl" id="girlVoteFill" style="width: 0%"></div>
        </div>
      </div>
    `;
    
    // Insert after the title
    const title = container.querySelector('h2');
    if (title) {
      title.parentNode.insertBefore(voteBarsContainer, title.nextSibling);
    }
    
    // Create sticky QR area
    const qrArea = document.createElement('div');
    qrArea.className = 'sticky-qr-area';
    qrArea.innerHTML = `
      <h3>📱 Guest Check-in</h3>
      <div class="qr-code" id="stickyQrCode"></div>
      <button class="copy-btn" id="copyInviteLinkBtn">📋 Copy Invite Link</button>
    `;
    document.body.appendChild(qrArea);
    
    // Create reveal button
    const revealBtn = document.createElement('button');
    revealBtn.className = 'reveal-gender-btn';
    revealBtn.textContent = 'Reveal Gender';
    revealBtn.id = 'revealGenderBtn';
    document.body.appendChild(revealBtn);
    
    // Generate QR code
    const qrContainer = qrArea.querySelector('#stickyQrCode');
    const copyBtn = qrArea.querySelector('#copyInviteLinkBtn');
    
    const guestLink = `${window.location.origin}/vote.html?roomId=${roomId}`;
    
    if (typeof QRCode !== 'undefined' && qrContainer) {
      new QRCode(qrContainer, {
        text: guestLink,
        width: 120,
        height: 120,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
    
    // Copy functionality
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(guestLink);
      copyBtn.textContent = '✅ Copied!';
      copyBtn.style.background = '#10b981';
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy Invite Link';
        copyBtn.style.background = '';
      }, 2000);
    };
    
    // Reveal button functionality
    revealBtn.onclick = () => {
      triggerGenderReveal();
    };
  }
  
  function updateLiveVoteBars(boyVotes, girlVotes) {
    const boyVoteCount = document.getElementById('boyVoteCount');
    const girlVoteCount = document.getElementById('girlVoteCount');
    const boyVoteFill = document.getElementById('boyVoteFill');
    const girlVoteFill = document.getElementById('girlVoteFill');
    const boyVoteBar = document.getElementById('boyVoteBar');
    const girlVoteBar = document.getElementById('girlVoteBar');
    
    if (!boyVoteCount || !girlVoteCount || !boyVoteFill || !girlVoteFill) return;
    
    const total = boyVotes + girlVotes;
    const boyPercentage = total > 0 ? (boyVotes / total) * 100 : 0;
    const girlPercentage = total > 0 ? (girlVotes / total) * 100 : 0;
    
    // Update vote counts with animation
    boyVoteCount.textContent = boyVotes;
    girlVoteCount.textContent = girlVotes;
    
    // Animate vote bars
    boyVoteFill.style.width = boyPercentage + '%';
    girlVoteFill.style.width = girlPercentage + '%';
    
    // Add animation class
    boyVoteFill.classList.add('vote-bar-animate');
    girlVoteFill.classList.add('vote-bar-animate');
    
    // Remove animation class after animation completes
    setTimeout(() => {
      boyVoteFill.classList.remove('vote-bar-animate');
      girlVoteFill.classList.remove('vote-bar-animate');
    }, 1000);
    
    // Update leading indicator
    if (boyVotes > girlVotes) {
      boyVoteBar.classList.add('leading');
      girlVoteBar.classList.remove('leading');
      boyVoteFill.classList.add('leading');
      girlVoteFill.classList.remove('leading');
    } else if (girlVotes > boyVotes) {
      girlVoteBar.classList.add('leading');
      boyVoteBar.classList.remove('leading');
      girlVoteFill.classList.add('leading');
      boyVoteFill.classList.remove('leading');
    } else {
      boyVoteBar.classList.remove('leading');
      girlVoteBar.classList.remove('leading');
      boyVoteFill.classList.remove('leading');
      girlVoteFill.classList.remove('leading');
    }
  }
  
  function triggerGenderReveal() {
    // Create massive confetti
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        createConfetti();
      }, i * 100);
    }
    
    // Change background
    document.body.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
    
    // Show celebration message
    const celebration = document.createElement('div');
    celebration.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 4rem;
      font-weight: 900;
      color: white;
      text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
      z-index: 1000;
      text-align: center;
    `;
    celebration.innerHTML = '🎉 GENDER REVEALED! 🎉';
    document.body.appendChild(celebration);
    
    // Remove after 3 seconds
    setTimeout(() => {
      celebration.remove();
      document.body.style.background = '';
    }, 3000);
  }
  
  function showF11Instructions() {
    // Check if instructions were already shown
    if (localStorage.getItem('f11InstructionsShown')) return;
    
    const instructions = document.createElement('div');
    instructions.className = 'f11-instructions';
    instructions.innerHTML = `
      <div class="content">
        <button class="dismiss-btn" id="dismissF11Btn">✖️</button>
        <h2>🎉 Fullscreen Party Mode</h2>
        <p>Press <span class="key">F11</span> to enter fullscreen mode for the best party experience!</p>
        <p class="text-sm text-gray-500">Your guests can scan the QR code to join and vote in real-time.</p>
        <button class="close-btn" id="closeF11Btn">Got it!</button>
      </div>
    `;
    
    document.body.appendChild(instructions);
    
    // Add event listeners
    const closeBtn = instructions.querySelector('#closeF11Btn');
    const dismissBtn = instructions.querySelector('#dismissF11Btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeF11Instructions);
    }
    
    if (dismissBtn) {
      dismissBtn.addEventListener('click', closeF11Instructions);
    }
    
    // Mark as shown
    localStorage.setItem('f11InstructionsShown', 'true');
  }
  
  function closeF11Instructions() {
    const instructions = document.querySelector('.f11-instructions');
    if (instructions) {
      instructions.remove();
    }
  }

  // Restore compact results structure
  function restoreCompactResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) return;
    
    // Just remove CSS classes
    resultsSection.classList.remove('fullscreen-results-structured');
  }

  // Simple floating controls for fullscreen
  function showEnhancedFloatingControls() {
    // Remove existing controls first
    const existingControls = document.getElementById('enhancedFloatingControls');
    if (existingControls) {
      existingControls.remove();
    }
    
    const controls = document.createElement('div');
    controls.id = 'enhancedFloatingControls';
    controls.className = 'floating-controls';
    controls.innerHTML = `
      <button id="homeBtn" class="hover:bg-gray-100">
        🏠 Home
      </button>
      <button id="confettiBtn" class="hover:bg-pink-100">
        🎉 Party Mode
      </button>
    `;
    document.body.appendChild(controls);
    
    // Use event delegation for better reliability
    controls.addEventListener('click', (e) => {
      const target = e.target;
      
      if (target.id === 'homeBtn') {
        window.location.href = '/';
      }
      
      if (target.id === 'confettiBtn') {
        createConfetti();
        // Add visual feedback
        target.style.transform = 'scale(0.95)';
        setTimeout(() => {
          target.style.transform = '';
        }, 150);
      }
    });
  }
  
  // QR Modal functions
  function showQRModal() {
    const modal = document.getElementById('qrModal');
    const qrContainer = document.getElementById('modalQRCode');
    
    if (modal && qrContainer) {
      // Generate QR code for the current page
      const currentURL = window.location.href;
      qrContainer.innerHTML = '';
      
      // Use QRCode library to generate QR code
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
          text: currentURL,
          width: 200,
          height: 200,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
      }
      
      modal.classList.add('show');
    }
    
    // Also toggle the admin QR section if it exists
    if (adminQR) {
      adminQR.classList.toggle('hidden');
    }
  }
  
  function closeQRModal() {
    const modal = document.getElementById('qrModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }
  
  // Close modal when clicking outside
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('qrModal');
    if (modal && e.target === modal) {
      closeQRModal();
    }
  });

  function hideEnhancedFloatingControls() {
    const controls = document.getElementById('enhancedFloatingControls');
    if (controls) {
      controls.remove();
    }
  }

  // Subtle confetti animation for fullscreen
  let confettiInterval;
  function startSubtleConfetti() {
    confettiInterval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every 2 seconds
        createConfetti();
      }
    }, 2000);
  }

  function stopSubtleConfetti() {
    if (confettiInterval) {
      clearInterval(confettiInterval);
    }
  }

  // Compact controls for fullscreen mode
  function showCompactControls() {
    // Create floating controls
    const controls = document.createElement('div');
    controls.id = 'compactControls';
    controls.className = 'fixed top-4 right-4 z-50 flex flex-col space-y-2';
    controls.innerHTML = `
      <button id="qrToggleBtn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-all text-xs opacity-80 hover:opacity-100">
        📱 QR
      </button>
      <button id="homeBtn" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-all text-xs opacity-80 hover:opacity-100">
        🏠 Home
      </button>
    `;
    document.body.appendChild(controls);
    
    // QR toggle functionality
    const qrToggleBtn = document.getElementById('qrToggleBtn');
    if (qrToggleBtn && adminQR) {
      qrToggleBtn.onclick = () => {
        adminQR.classList.toggle('hidden');
      };
    }
    
    // Home button
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
      homeBtn.onclick = () => {
        window.location.href = '/';
      };
    }
  }

  function hideCompactControls() {
    const controls = document.getElementById('compactControls');
    if (controls) {
      controls.remove();
    }
  }

  // One-time fullscreen tip
  function showFullscreenTip() {
    if (!localStorage.getItem('fullscreenTipShown')) {
      const tip = document.createElement('div');
      tip.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white p-6 rounded-xl z-50 max-w-md text-center';
      tip.innerHTML = `
        <div class="text-4xl mb-4">🖥️</div>
        <h3 class="text-xl font-bold mb-2">Perfect for Party Display!</h3>
        <p class="mb-4">Press <span class="bg-yellow-500 text-black px-2 py-1 rounded font-bold">F11</span> to enter fullscreen mode</p>
        <button onclick="this.parentElement.remove()" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          Got it!
        </button>
      `;
      document.body.appendChild(tip);
      localStorage.setItem('fullscreenTipShown', 'true');
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (tip.parentElement) {
          tip.remove();
        }
      }, 5000);
    }
  }

  // --- Smart Admin UI for Party Display ---
  function showAdminUI() {
    isAdmin = true;
    // Hide guest UI
    if (nameSection) nameSection.classList.add('hidden');
    if (voteSection) voteSection.classList.add('hidden');
    if (submitNameBtn) submitNameBtn.disabled = true;
    if (voteBoyBtn) voteBoyBtn.disabled = true;
    if (voteGirlBtn) voteGirlBtn.disabled = true;
    
    // Show results and reveal with celebration styling
    if (resultsSection) {
      resultsSection.classList.remove('hidden');
      resultsSection.classList.add('admin-results');
    }
    if (revealGenderBtn) revealGenderBtn.classList.remove('hidden');
    
    // Show minimal admin badge
    showAdminBadge();
    
    // Show compact QR code section
    showAdminQR(roomId);
    
    // Show one-time fullscreen tip
    showFullscreenTip();
    
    // Apply celebration styling to progress bars
    const boyBar = document.getElementById('boyBar');
    const girlBar = document.getElementById('girlBar');
    if (boyBar) boyBar.classList.add('celebration-bar');
    if (girlBar) girlBar.classList.add('celebration-bar-girl');
    
    // Set up fullscreen detection
    document.addEventListener('fullscreenchange', adaptLayoutForParty);
    document.addEventListener('webkitfullscreenchange', adaptLayoutForParty);
    document.addEventListener('mozfullscreenchange', adaptLayoutForParty);
    document.addEventListener('MSFullscreenChange', adaptLayoutForParty);
    
    // Initial layout adaptation
    adaptLayoutForParty();
    
    // Reveal button logic - use event delegation to handle dynamic elements
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'revealGenderBtn') {
        const revealPopup = document.getElementById('revealPopup');
        if (revealPopup) {
          revealPopup.classList.remove('hidden');
        }
      }
      if (e.target && e.target.id === 'confirmRevealBtn') {
        infoRef.once('value').then(snap => {
          const info = snap.val();
          if (info && info.prediction) {
            revealRef.set({ actual: info.prediction, revealedAt: Date.now() });
          }
        });
        const revealPopup = document.getElementById('revealPopup');
        if (revealPopup) {
          revealPopup.classList.add('hidden');
        }
      }
      if (e.target && e.target.id === 'cancelRevealBtn') {
        const revealPopup = document.getElementById('revealPopup');
        if (revealPopup) {
          revealPopup.classList.add('hidden');
        }
      }
    });
  }

  // Robust Admin token check (always run on load, never hidden by guest logic)
  function checkAdminMode() {
    if (adminTokenParam) {
      adminTokenRef.once('value').then(snap => {
        const token = snap.val();
        if (token && token === adminTokenParam) {
          showAdminUI();
        } else {
          if (revealGenderBtn) revealGenderBtn.classList.add('hidden');
          hideAdminBadge();
          hideAdminQR();
          hideAdminUI();
        }
      });
    } else {
      if (revealGenderBtn) revealGenderBtn.classList.add('hidden');
      hideAdminBadge();
      hideAdminQR();
      hideAdminUI();
    }
  }
  checkAdminMode();

  // Sanitize guest name to prevent encoding issues
  if (guestName) {
    guestName = sanitizeName(guestName);
  }

  // Name validation
  function validateName(name) {
    if (!name.trim()) return 'Name cannot be empty.';
    const lower = name.trim().toLowerCase();
    if (allVotes.some(v => v.name.trim().toLowerCase() === lower)) return 'This name has already voted.';
    return '';
  }

  // --- Guest flow ---
  // Guest flow: skip name input if guest param is present
  if (!adminTokenParam) {
    if (guestName) {
      nameSection.classList.add('hidden');
      voteSection.classList.remove('hidden');
      localStorage.setItem(nameKey, guestName);
      // Only hide results if the guest hasn't voted yet
      if (!localStorage.getItem(votedKey)) {
        resultsSection.classList.add('hidden');
      } else {
        resultsSection.classList.remove('hidden');
      }
    } else {
      nameSection.classList.remove('hidden');
      voteSection.classList.add('hidden');
      resultsSection.classList.add('hidden');
    }
  }

  // Name submit (guests only)
  if (submitNameBtn && !adminTokenParam) {
    submitNameBtn.addEventListener('click', () => {
      const name = guestNameInput.value.trim();
      nameError.textContent = '';
      const err = validateName(name);
      if (err) {
        nameError.textContent = err;
        guestNameInput.classList.add('border-red-500');
        return;
      }
      localStorage.setItem(nameKey, name);
      window.location.href = `${window.location.pathname}?roomId=${roomId}&guest=${encodeURIComponent(name)}`;
    });
  }

  // Voting logic (guests only)
  function castVote(vote) {
    if (!guestName || adminTokenParam) return;
    if (!userVoteId) {
      const newVoteRef = votesRef.push();
      newVoteRef.set({ name: guestName, vote, timestamp: Date.now() }, (err) => {
        if (!err) {
          localStorage.setItem(votedKey, vote);
          localStorage.setItem(voteIdKey, newVoteRef.key);
          voteMsg.textContent = `Vote for ${vote === 'boy' ? 'Boy 💙' : 'Girl 💖'} submitted!`;
          voteBoyBtn.disabled = false;
          voteGirlBtn.disabled = false;
          userVoteId = newVoteRef.key;
          hasVoted = true;
          resultsSection.classList.remove('hidden');
          showResults();
          checkAdminMode();
        } else {
          voteMsg.textContent = 'Error submitting vote. Try again!';
        }
      });
    } else {
      if (userChanged) {
        voteMsg.textContent = 'You have already changed your vote once.';
        voteBoyBtn.disabled = true;
        voteGirlBtn.disabled = true;
        return;
      }
      pendingVote = vote;
      changePopup.classList.remove('hidden');
    }
  }

  if (!adminTokenParam) {
    voteBoyBtn.addEventListener('click', () => castVote('boy'));
    voteGirlBtn.addEventListener('click', () => castVote('girl'));
  }

  if (!adminTokenParam) {
    confirmChangeBtn.addEventListener('click', () => {
      if (!userVoteId || pendingVote === null) return;
      votesRef.child(userVoteId).set({ name: guestName, vote: pendingVote, timestamp: Date.now() }, (err) => {
        if (!err) {
          localStorage.setItem(votedKey, pendingVote);
          localStorage.setItem(changeKey, '1');
          voteMsg.textContent = `Vote changed to ${pendingVote === 'boy' ? 'Boy 💙' : 'Girl 💖'}!`;
          voteBoyBtn.disabled = true;
          voteGirlBtn.disabled = true;
          userChanged = true;
          hasVoted = true;
          showResults();
          checkAdminMode();
        } else {
          voteMsg.textContent = 'Error changing vote. Try again!';
        }
        changePopup.classList.add('hidden');
        pendingVote = null;
      });
    });
    cancelChangeBtn.addEventListener('click', () => {
      changePopup.classList.add('hidden');
      pendingVote = null;
    });
  }

  // Add animation classes for vote bars and reveal button
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.3); }
      50% { box-shadow: 0 0 16px 8px rgba(59,130,246,0.15); }
    }
    @keyframes pulseGlowPink {
      0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0.3); }
      50% { box-shadow: 0 0 16px 8px rgba(236,72,153,0.15); }
    }
    .boy-bar-animate { animation: pulseGlow 1.5s infinite; }
    .girl-bar-animate { animation: pulseGlowPink 1.5s infinite; }
    @keyframes bounceIn {
      0% { transform: scale(0.7); opacity: 0.5; }
      60% { transform: scale(1.15); opacity: 1; }
      80% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    .vote-bounce { animation: bounceIn 0.5s; }
    @keyframes revealPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.3); }
      50% { box-shadow: 0 0 16px 8px rgba(251,191,36,0.15); }
    }
    .reveal-animate { animation: revealPulse 2s infinite; }
    .reveal-hover:hover { transform: scale(1.07) rotate(-2deg); box-shadow: 0 4px 24px 0 rgba(251,191,36,0.25); }
  `;
  document.head.appendChild(style);

  // Add animation classes to vote bars
  if (boyBar) boyBar.classList.add('boy-bar-animate');
  if (girlBar) girlBar.classList.add('girl-bar-animate');
  if (revealGenderBtn) {
    revealGenderBtn.classList.add('reveal-animate', 'transition', 'duration-300', 'reveal-hover');
  }

  // Enhanced showResults with confetti and animations
  function showResults() {
    votesRef.once('value').then(snap => {
      const votes = snap.val() || {};
      allVotes = Object.entries(votes).map(([id, v]) => ({ id, ...v }));
      const boyVotes = allVotes.filter(v => v.vote === 'boy');
      const girlVotes = allVotes.filter(v => v.vote === 'girl');
      const total = boyVotes.length + girlVotes.length;
      const boyPercent = total ? (boyVotes.length / total) * 100 : 0;
      const girlPercent = total ? (girlVotes.length / total) * 100 : 0;
      
      // Store previous values for animation detection
      const oldBoyWidth = boyBar.style.width;
      const oldGirlWidth = girlBar.style.width;
      
      boyBar.style.width = boyPercent + '%';
      girlBar.style.width = girlPercent + '%';
      boyCount.textContent = boyVotes.length;
      girlCount.textContent = girlVotes.length;
      
      // Enhanced bar animations
      boyBar.classList.remove('vote-bounce', 'vote-bar-animate');
      girlBar.classList.remove('vote-bounce', 'vote-bar-animate');
      void boyBar.offsetWidth; // force reflow
      void girlBar.offsetWidth;
      
      if (boyVotes.length) {
        boyBar.classList.add('vote-bounce');
        if (oldBoyWidth !== boyBar.style.width) {
          boyBar.classList.add('vote-bar-animate');
          setTimeout(() => boyBar.classList.remove('vote-bar-animate'), 600);
        }
      }
      if (girlVotes.length) {
        girlBar.classList.add('vote-bounce');
        if (oldGirlWidth !== girlBar.style.width) {
          girlBar.classList.add('vote-bar-animate');
          setTimeout(() => girlBar.classList.remove('vote-bar-animate'), 600);
        }
      }
      
      // Animate new names
      boyNames.innerHTML = '';
      girlNames.innerHTML = '';
      boyVotes.forEach(v => {
        const badge = document.createElement('span');
        badge.className = 'pill-badge pill-boy vote-bounce';
        const sanitizedName = sanitizeName(v.name);
        badge.textContent = emojiForName(sanitizedName) + ' ' + sanitizedName;
        boyNames.appendChild(badge);
        setTimeout(() => badge.classList.remove('vote-bounce'), 600);
      });
      girlVotes.forEach(v => {
        const badge = document.createElement('span');
        badge.className = 'pill-badge pill-girl vote-bounce';
        const sanitizedName = sanitizeName(v.name);
        badge.textContent = emojiForName(sanitizedName) + ' ' + sanitizedName;
        girlNames.appendChild(badge);
        setTimeout(() => badge.classList.remove('vote-bounce'), 600);
      });
      
      // Trigger confetti for new votes in fullscreen
      if ((detectFullscreen() || detectLargeScreen()) && total > (window.lastVoteCount || 0)) {
        createConfetti();
        window.lastVoteCount = total;
      }
    });
  }

  if (!adminTokenParam && guestName && localStorage.getItem(votedKey)) {
    hasVoted = true;
    showResults();
    checkAdminMode();
  }

  // Track previous vote count for animation detection
  let previousVoteCount = 0;
  
  votesRef.on('value', (snapshot) => {
    let boy = 0, girl = 0;
    let boyList = [], girlList = [];
    allVotes = [];
    snapshot.forEach(child => {
      const v = child.val();
      allVotes.push(v);
      if (v.vote === 'boy') boyList.push(v.name);
      if (v.vote === 'girl') girlList.push(v.name);
    });
    
    const total = boyList.length + girlList.length;
    boyCount.textContent = boyList.length;
    girlCount.textContent = girlList.length;
    boyBar.style.width = total ? `${(boyList.length/total)*100}%` : '0%';
    girlBar.style.width = total ? `${(girlList.length/total)*100}%` : '0%';
    
    // Update live vote bars for admin mode
    if (adminTokenParam) {
      updateLiveVoteBars(boyList.length, girlList.length);
    }
    
    // Show vote animation for admin when new votes come in
    if (adminTokenParam && total > previousVoteCount && total > 0) {
      // Find the newest vote (assuming it's the last one added)
      const newestVote = allVotes[allVotes.length - 1];
      if (newestVote && newestVote.name) {
        const sanitizedName = sanitizeName(newestVote.name);
        showVoteAnimation(sanitizedName, newestVote.vote);
        
        // Trigger confetti for new votes in fullscreen
        if (detectFullscreen() || detectLargeScreen()) {
          createConfetti();
        }
      }
    }
    previousVoteCount = total;
    
    // Cute pill badges with emoji
    boyNames.innerHTML = boyList.map(n => {
      const sanitizedName = sanitizeName(n);
      return `<span class='pill-badge pill-boy'>${emojiForName(sanitizedName)} ${sanitizedName}</span>`;
    }).join('');
    girlNames.innerHTML = girlList.map(n => {
      const sanitizedName = sanitizeName(n);
      return `<span class='pill-badge pill-girl'>${emojiForName(sanitizedName)} ${sanitizedName}</span>`;
    }).join('');
    if (!adminTokenParam && hasVoted) showResults();
    if (adminTokenParam) checkAdminMode();
  });

  revealRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    finalReveal.classList.remove('hidden');
    finalRevealMsg.textContent = `It's a ${data.actual === 'boy' ? 'BOY 💙' : 'GIRL 💖'}!`;
    let confetti = '';
    for (let i = 0; i < 30; i++) {
      confetti += data.actual === 'boy' ? '💙' : '💖';
    }
    finalConfetti.innerHTML = confetti;
    if (adminTokenParam) checkAdminMode();
  });
}); 