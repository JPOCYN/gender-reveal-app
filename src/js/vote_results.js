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
      adminQR.className = 'bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl p-4 shadow-lg mt-4 border border-pink-200';
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
      
      // Hide QR code in fullscreen, show floating controls
      if (adminQR) {
        adminQR.classList.add('hidden');
      }
      
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

  // Structure results section for fullscreen display
  function structureFullscreenResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) return;
    
    // Check if already structured
    if (resultsSection.querySelector('.fullscreen-results-container')) return;
    
    // Get existing elements
    const heading = resultsSection.querySelector('h2');
    const voteBars = resultsSection.querySelectorAll('.flex.items-center');
    const boyNames = document.getElementById('boyNames');
    const girlNames = document.getElementById('girlNames');
    const revealBtn = document.getElementById('revealGenderBtn');
    
    // Create structured layout
    const container = document.createElement('div');
    container.className = 'fullscreen-results-container';
    
    // Add heading
    if (heading) {
      container.appendChild(heading.cloneNode(true));
    }
    
    // Create vote bars container
    const barsContainer = document.createElement('div');
    barsContainer.className = 'vote-bars-container';
    
    voteBars.forEach(bar => {
      barsContainer.appendChild(bar.cloneNode(true));
    });
    container.appendChild(barsContainer);
    
    // Create names container
    if (boyNames && girlNames) {
      const namesContainer = document.createElement('div');
      namesContainer.className = 'names-container';
      namesContainer.appendChild(boyNames.cloneNode(true));
      namesContainer.appendChild(girlNames.cloneNode(true));
      container.appendChild(namesContainer);
    }
    
    // Create reveal button container
    if (revealBtn) {
      const btnContainer = document.createElement('div');
      btnContainer.className = 'reveal-button-container';
      btnContainer.appendChild(revealBtn.cloneNode(true));
      container.appendChild(btnContainer);
    }
    
    // Replace content
    resultsSection.innerHTML = '';
    resultsSection.appendChild(container);
    
    // Update references to new elements
    updateElementReferences();
  }

  // Restore compact results structure
  function restoreCompactResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) return;
    
    // Check if needs restoration
    const container = resultsSection.querySelector('.fullscreen-results-container');
    if (!container) return;
    
    // Restore original structure
    const heading = container.querySelector('h2');
    const voteBars = container.querySelectorAll('.flex.items-center');
    const boyNames = container.querySelector('#boyNames');
    const girlNames = container.querySelector('#girlNames');
    const revealBtn = container.querySelector('#revealGenderBtn');
    
    resultsSection.innerHTML = '';
    
    if (heading) resultsSection.appendChild(heading.cloneNode(true));
    
    const mainDiv = document.createElement('div');
    mainDiv.className = 'mb-4';
    
    voteBars.forEach(bar => {
      mainDiv.appendChild(bar.cloneNode(true));
    });
    
    if (boyNames) mainDiv.appendChild(boyNames.cloneNode(true));
    if (girlNames) mainDiv.appendChild(girlNames.cloneNode(true));
    
    resultsSection.appendChild(mainDiv);
    
    if (revealBtn) resultsSection.appendChild(revealBtn.cloneNode(true));
    
    // Update references to new elements
    updateElementReferences();
  }

  // Update element references after restructuring
  function updateElementReferences() {
    window.boyBar = document.getElementById('boyBar');
    window.girlBar = document.getElementById('girlBar');
    window.boyCount = document.getElementById('boyCount');
    window.girlCount = document.getElementById('girlCount');
    window.boyNames = document.getElementById('boyNames');
    window.girlNames = document.getElementById('girlNames');
    window.revealGenderBtn = document.getElementById('revealGenderBtn');
  }

  // Enhanced floating controls for fullscreen
  function showEnhancedFloatingControls() {
    const controls = document.createElement('div');
    controls.id = 'enhancedFloatingControls';
    controls.className = 'floating-controls';
    controls.innerHTML = `
      <button id="qrToggleBtn" class="hover:bg-blue-100">
        📱 QR Code
      </button>
      <button id="homeBtn" class="hover:bg-gray-100">
        🏠 Home
      </button>
      <button id="confettiBtn" class="hover:bg-pink-100">
        🎉 Confetti
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
    
    // Confetti button
    const confettiBtn = document.getElementById('confettiBtn');
    if (confettiBtn) {
      confettiBtn.onclick = () => {
        createConfetti();
      };
    }
  }

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
    
    // Reveal button logic
    if (revealGenderBtn) {
      revealGenderBtn.onclick = () => {
        revealPopup.classList.remove('hidden');
      };
    }
    if (confirmRevealBtn) {
      confirmRevealBtn.onclick = () => {
        infoRef.once('value').then(snap => {
          const info = snap.val();
          if (info && info.prediction) {
            revealRef.set({ actual: info.prediction, revealedAt: Date.now() });
          }
        });
        revealPopup.classList.add('hidden');
      };
    }
    if (cancelRevealBtn) {
      cancelRevealBtn.onclick = () => {
        revealPopup.classList.add('hidden');
      };
    }
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