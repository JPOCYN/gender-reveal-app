// js/vote_results.js
// Fullscreen admin layout with no-scroll design

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  const guestParam = params.get('guest');
  const adminTokenParam = params.get('adminToken');

  if (!roomId) {
    document.body.innerHTML = '<div class="flex flex-col items-center justify-center min-h-screen"><h2 class="text-xl font-bold text-red-600">No party found. Please use a valid invite link.</h2></div>';
    return;
  }

  // Layout elements
  const loadingState = document.getElementById('loadingState');
  const adminLayout = document.getElementById('adminLayout');
  const guestLayout = document.getElementById('guestLayout');
  const welcomeModal = document.getElementById('welcomeModal');
  const welcomeGotItBtn = document.getElementById('welcomeGotItBtn');
  const guestWelcomeModal = document.getElementById('guestWelcomeModal');
  const guestWelcomeTitle = document.getElementById('guestWelcomeTitle');
  const guestWelcomeMessage = document.getElementById('guestWelcomeMessage');
  const guestWelcomeContinueBtn = document.getElementById('guestWelcomeContinueBtn');
  const viewHostMessageBtn = document.getElementById('viewHostMessageBtn');
  const guestCounter = document.getElementById('guestCounter');
  const countdownOverlay = document.getElementById('countdownOverlay');
  const countdownNumber = document.getElementById('countdownNumber');
  const votePopupContainer = document.getElementById('votePopupContainer');
  const partyHeader = document.getElementById('partyHeader');
  const adminPartyName = document.getElementById('adminPartyName');

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
  
  // Admin layout elements
  const adminQR = document.getElementById('adminQR');
  const copyInviteBtn = document.getElementById('copyInviteBtn');
  const boyBarFill = document.getElementById('boyBarFill');
  const girlBarFill = document.getElementById('girlBarFill');
  const boyCount = document.getElementById('boyCount');
  const girlCount = document.getElementById('girlCount');
  const boyNames = document.getElementById('boyNames');
  const girlNames = document.getElementById('girlNames');
  
  // Guest layout elements
  const boyBar = document.getElementById('boyBar');
  const girlBar = document.getElementById('girlBar');
  const boyCountGuest = document.getElementById('boyCountGuest');
  const girlCountGuest = document.getElementById('girlCountGuest');
  const boyNamesGuest = document.getElementById('boyNamesGuest');
  const girlNamesGuest = document.getElementById('girlNamesGuest');
  
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

  // Admin badge
  let adminBadge = null;
  function showAdminBadge() {
    if (!adminBadge) {
      adminBadge = document.createElement('div');
      adminBadge.innerHTML = '<span data-i18n="partyScreenMode">👀 Party Screen</span>';
      adminBadge.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold z-50 border-2 border-white cursor-pointer hover:scale-105 transition-transform';
      adminBadge.title = getTranslation('partyScreenTooltip');
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
  function setupAdminQR(roomId) {
    if (adminQR && copyInviteBtn) {
      const guestLink = `${window.location.origin}/vote.html?roomId=${roomId}`;
      
      // Generate QR code
      adminQR.innerHTML = '';
      new QRCode(adminQR, {
        text: guestLink,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      
      // Setup copy button
      copyInviteBtn.onclick = () => {
        navigator.clipboard.writeText(guestLink).then(() => {
          copyInviteBtn.textContent = '✅ Copied!';
          copyInviteBtn.classList.add('copied');
          setTimeout(() => {
            copyInviteBtn.textContent = '📋 Copy Invite Link';
            copyInviteBtn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = guestLink;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          copyInviteBtn.textContent = '✅ Copied!';
          copyInviteBtn.classList.add('copied');
          setTimeout(() => {
            copyInviteBtn.textContent = '📋 Copy Invite Link';
            copyInviteBtn.classList.remove('copied');
          }, 2000);
        });
      };
    }
  }

  // LocalStorage keys
  const votedKey = `voted_${roomId}`;
  const nameKey = `name_${roomId}`;
  const changeKey = `changed_${roomId}`;
  const voteIdKey = `voteId_${roomId}`;
  const adminCacheKey = `admin_${roomId}`;

  // Translation helper function
  function getTranslation(key, lang = localStorage.getItem('lang') || 'en') {
    const translations = {
      en: {
        voteSubmitted: "Vote for {vote} submitted!",
        errorSubmittingVote: "Error submitting vote. Try again!",
        alreadyChangedVote: "You have already changed your vote once.",
        voteChanged: "Vote changed to {vote}!",
        errorChangingVote: "Error changing vote. Try again!",
        itsABoy: "It's a BOY 💙!",
        itsAGirl: "It's a GIRL 💖!",
        guestsCheckedIn: "🎉 {{count}} guests checked in",
        oneGuestCheckedIn: "🎉 1 guest checked in",
        votedBoyPopup: "💙 {name} just voted for Boy!",
        votedGirlPopup: "💖 {name} just voted for Girl!",
        voteChangedPopup: "🔁 {name} switched vote to {vote}",
        announced: "🎊 Announced!",
        defaultPartyName: "Gender Reveal Party",
        partyScreenTooltip: "F11 for full-screen party view",
        welcomeModalTitle: "🎉 Welcome, {name}!",
        welcomeModalButton: "Continue to Vote",
        viewHostMessageAgain: "🔔 View Host Message Again"
      },
      zh: {
        voteSubmitted: "投票給 {vote} 已提交！",
        errorSubmittingVote: "提交投票時發生錯誤。請重試！",
        alreadyChangedVote: "你已經更改過一次投票了。",
        voteChanged: "投票已更改為 {vote}！",
        errorChangingVote: "更改投票時發生錯誤。請重試！",
        itsABoy: "是個男孩 💙！",
        itsAGirl: "是個女孩 💖！",
        guestsCheckedIn: "🎉 {{count}} 位賓客已報到",
        oneGuestCheckedIn: "🎉 1 位賓客已報到",
        votedBoyPopup: "💙 {name} 剛投票給男孩！",
        votedGirlPopup: "💖 {name} 剛投票給女孩！",
        voteChangedPopup: "🔁 {name} 改投 {vote}",
        announced: "🎊 已揭曉！",
        defaultPartyName: "性別揭曉派對",
        partyScreenTooltip: "按 F11 進入全螢幕派對顯示",
        welcomeModalTitle: "🎉 歡迎，{name}！",
        welcomeModalButton: "繼續投票",
        viewHostMessageAgain: "🔔 再次查看主辦人訊息"
      }
    };
    const t = translations[lang] || translations['en'];
    return t[key] || key;
  }

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
  let partyWelcomeMessage = null;

  // Fetch and show party info
  infoRef.once('value').then(snap => {
    const info = snap.val();
    if (info) {
      partyNameEl.textContent = info.partyName || 'Gender Reveal Party';
      partyWelcomeMessage = info.welcomeMessage || null;
      
      // Show welcome message to guests if they just entered their name
      if (!isAdmin && guestParam && partyWelcomeMessage) {
        showGuestWelcomeModal(guestName, partyWelcomeMessage);
      } else if (!isAdmin && partyWelcomeMessage && guestName) {
        // For returning guests, just show the "View Host Message Again" button
        if (viewHostMessageBtn) {
          viewHostMessageBtn.classList.remove('hidden');
        }
      }
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

  // Translation helper function that supports interpolation
  function t(key, params = {}) {
    let text = getTranslation(key);
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`{{${param}}}`, 'g');
        text = text.replace(regex, params[param]);
      });
    }
    return text;
  }

  // Guest counter functionality
  let currentGuestCount = 0;
  function updateGuestCounter(newCount) {
    if (guestCounter && isAdmin) {
      const countText = newCount === 1 ? 
        t('oneGuestCheckedIn') :
        t('guestsCheckedIn', { count: newCount });
      
      const span = guestCounter.querySelector('span');
      if (span) {
        span.textContent = countText;
        
        // Add bounce animation if count increased
        if (newCount > currentGuestCount) {
          guestCounter.classList.remove('counter-update');
          void guestCounter.offsetWidth; // Force reflow
          guestCounter.classList.add('counter-update');
          setTimeout(() => guestCounter.classList.remove('counter-update'), 600);
        }
      }
      currentGuestCount = newCount;
    }
  }
  
  // Function to refresh guest counter when language changes
  function refreshGuestCounter() {
    if (currentGuestCount > 0) {
      updateGuestCounter(currentGuestCount);
    }
  }
  
  // Function to refresh admin badge tooltip when language changes
  function refreshAdminBadge() {
    if (adminBadge) {
      adminBadge.title = getTranslation('partyScreenTooltip');
    }
  }
  
  // Make functions available globally for language switching
  window.refreshGuestCounter = refreshGuestCounter;
  window.refreshAdminBadge = refreshAdminBadge;
  window.updatePartyName = updatePartyName;

  // Vote popup notifications
  const activePopups = new Set();
  const maxPopups = 2;
  
  function showVotePopup(guestName, vote, isChange = false) {
    if (!isAdmin || activePopups.size >= maxPopups) return;
    
    const popup = document.createElement('div');
    const sanitizedName = sanitizeName(guestName);
    
    let message, voteClass;
    if (isChange) {
      message = getTranslation('voteChangedPopup').replace('{name}', sanitizedName).replace('{vote}', vote === 'boy' ? '💙 Boy' : '💖 Girl');
      voteClass = 'vote-change';
    } else {
      message = vote === 'boy' ? 
        getTranslation('votedBoyPopup').replace('{name}', sanitizedName) :
        getTranslation('votedGirlPopup').replace('{name}', sanitizedName);
      voteClass = vote === 'boy' ? 'boy-vote' : 'girl-vote';
    }
    
    popup.className = `vote-popup ${voteClass}`;
    popup.textContent = message;
    
    // Position popup (stack them if multiple)
    const topOffset = 2 + (activePopups.size * 5);
    popup.style.top = `${topOffset}rem`;
    
    votePopupContainer.appendChild(popup);
    activePopups.add(popup);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeVotePopup(popup);
    }, 3000);
  }
  
  function removeVotePopup(popup) {
    if (!activePopups.has(popup)) return;
    
    popup.classList.add('removing');
    activePopups.delete(popup);
    
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 500);
  }

  // Countdown functionality
  function startCountdown(callback) {
    if (!countdownOverlay || !countdownNumber) return;
    
    let count = 3;
    countdownOverlay.classList.remove('hidden');
    
    function updateCountdown() {
      countdownNumber.textContent = count;
      countdownNumber.style.animation = 'none';
      void countdownNumber.offsetWidth; // Force reflow
      countdownNumber.style.animation = 'countdownPulse 1s ease-in-out';
      
      if (count > 0) {
        count--;
        setTimeout(updateCountdown, 1000);
      } else {
        setTimeout(() => {
          countdownOverlay.classList.add('hidden');
          if (callback) callback();
        }, 1000);
      }
    }
    
    updateCountdown();
  }

  // Party name functionality
  function updatePartyName(partyName) {
    if (adminPartyName && isAdmin) {
      const name = partyName || getTranslation('defaultPartyName');
      adminPartyName.textContent = name;
    }
  }

  // Welcome modal for admin (show once per page load)
  function showWelcomeModal() {
    if (welcomeModal && !sessionStorage.getItem('welcomeModalShown')) {
      welcomeModal.classList.remove('hidden');
      sessionStorage.setItem('welcomeModalShown', 'true');
      
      if (welcomeGotItBtn) {
        welcomeGotItBtn.onclick = () => {
          welcomeModal.classList.add('hidden');
        };
      }
    }
  }

  // Guest welcome modal (for host message)
  function showGuestWelcomeModal(name, message) {
    if (!guestWelcomeModal || !message) return;
    
    // Update title with guest name
    if (guestWelcomeTitle) {
      const titleText = getTranslation('welcomeModalTitle').replace('{name}', sanitizeName(name));
      guestWelcomeTitle.textContent = titleText;
    }
    
    // Set welcome message content
    if (guestWelcomeMessage) {
      guestWelcomeMessage.textContent = message;
    }
    
    // Show modal
    guestWelcomeModal.classList.remove('hidden');
    
    // Set up continue button
    if (guestWelcomeContinueBtn) {
      guestWelcomeContinueBtn.onclick = () => {
        guestWelcomeModal.classList.add('hidden');
        // Show the "View Host Message Again" button
        if (viewHostMessageBtn && !isAdmin) {
          viewHostMessageBtn.classList.remove('hidden');
        }
      };
    }
  }
  
      function showGuestUI() {
      isAdmin = false;
      
      // Hide loading state first
      if (loadingState) loadingState.classList.add('hidden');
      
      // Show guest layout, hide admin layout
      if (guestLayout) guestLayout.classList.remove('hidden');
      if (adminLayout) adminLayout.classList.add('hidden');
      
      // Hide guest counter for non-admin users (party header stays hidden via CSS)
      if (guestCounter) guestCounter.classList.add('hidden');
      
      // Initialize guest flow
      initializeGuestFlow();
    }

  // Enhanced admin instructions
  function showAdminInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg';
    instructions.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <span class="text-2xl">🎉</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-blue-800" data-i18n="adminWelcome">Welcome to your Party Control Center!</h3>
          <div class="mt-2 text-sm text-blue-700">
            <p class="mb-2" data-i18n="adminInstructions1">• Share the QR code or guest link with your friends</p>
            <p class="mb-2" data-i18n="adminInstructions2">• Watch live votes appear in real-time</p>
            <p class="mb-2" data-i18n="adminInstructions3">• Press "Reveal Gender" when ready to announce</p>
            <p class="mb-2" data-i18n="adminInstructions4">• Press F11 for fullscreen party display</p>
          </div>
        </div>
      </div>
    `;
    
    // Insert instructions at the top of results section
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
      resultsSection.insertBefore(instructions, resultsSection.firstChild);
    }
  }

  // --- Admin UI encapsulation ---
  function showAdminUI() {
    isAdmin = true;
    
    // Hide loading state first
    if (loadingState) loadingState.classList.add('hidden');
    
    // Show admin layout, hide guest layout
    if (adminLayout) adminLayout.classList.remove('hidden');
    if (guestLayout) guestLayout.classList.add('hidden');
    
    // Setup admin components
    setupAdminQR(roomId);
    showAdminBadge();
    
    // Show guest counter for admin (party header is always visible now)
    if (guestCounter) guestCounter.classList.remove('hidden');
    
    // Load and display party name
    infoRef.once('value').then(snap => {
      const info = snap.val();
      if (info && info.partyName) {
        updatePartyName(info.partyName);
      } else {
        updatePartyName(null); // Will use default name
      }
    });
    
    // Show welcome modal for first-time experience
    showWelcomeModal();
    
    // Enhanced reveal button logic with countdown
    if (revealGenderBtn) {
      revealGenderBtn.onclick = () => {
        if (revealGenderBtn.classList.contains('announced')) return;
        revealPopup.classList.remove('hidden');
      };
    }
    if (confirmRevealBtn) {
      confirmRevealBtn.onclick = () => {
        revealPopup.classList.add('hidden');
        
        // Start countdown then reveal
        startCountdown(() => {
          infoRef.once('value').then(snap => {
            const info = snap.val();
            if (info && info.prediction) {
              revealRef.set({ actual: info.prediction, revealedAt: Date.now() });
              
              // Update button to announced state
              if (revealGenderBtn) {
                revealGenderBtn.innerHTML = getTranslation('announced');
                revealGenderBtn.classList.add('announced');
              }
            }
          });
        });
      };
    }
    if (cancelRevealBtn) {
      cancelRevealBtn.onclick = () => {
        revealPopup.classList.add('hidden');
      };
    }
  }

  // Setup "View Host Message Again" button
  if (viewHostMessageBtn) {
    viewHostMessageBtn.addEventListener('click', () => {
      if (partyWelcomeMessage && guestName) {
        showGuestWelcomeModal(guestName, partyWelcomeMessage);
      }
    });
  }

  // Robust Admin token check (always run on load, never hidden by guest logic)
  function checkAdminMode() {
    // Check for cached admin status first (party owner detection)
    const cachedAdminToken = localStorage.getItem(adminCacheKey);
    const isPartyOwner = sessionStorage.getItem('isPartyOwner') === 'true';
    
    if (adminTokenParam) {
      // If this is a party owner just redirected from creation, show admin UI immediately
      if (isPartyOwner || cachedAdminToken === adminTokenParam) {
        // Clear the party owner flag since it's one-time use
        sessionStorage.removeItem('isPartyOwner');
        showAdminUI();
        return;
      }
      
      // Verify admin token with Firebase
      adminTokenRef.once('value').then(snap => {
        const token = snap.val();
        if (token && token === adminTokenParam) {
          // Cache the valid admin token for this party
          localStorage.setItem(adminCacheKey, adminTokenParam);
          showAdminUI();
        } else {
          // Invalid token, clear cache and show guest UI
          localStorage.removeItem(adminCacheKey);
          showGuestUI();
          hideAdminBadge();
        }
      }).catch(() => {
        // Firebase error, show guest UI
        showGuestUI();
        hideAdminBadge();
      });
    } else {
      // No admin token parameter, check if user was previously admin for this party
      if (cachedAdminToken) {
        // Verify cached token is still valid
        adminTokenRef.once('value').then(snap => {
          const token = snap.val();
          if (token && token === cachedAdminToken) {
            // Redirect to admin mode with token
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('adminToken', cachedAdminToken);
            window.location.href = currentUrl.toString();
            return;
          } else {
            // Invalid cached token, clear it
            localStorage.removeItem(adminCacheKey);
            showGuestUI();
            hideAdminBadge();
          }
        }).catch(() => {
          // Firebase error, clear cache and show guest UI
          localStorage.removeItem(adminCacheKey);
          showGuestUI();
          hideAdminBadge();
        });
      } else {
        // No cached admin status, show guest UI
        showGuestUI();
        hideAdminBadge();
      }
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
  // This will be called after admin verification is complete
  function initializeGuestFlow() {
    if (!adminTokenParam && !isAdmin) {
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
          const voteText = vote === 'boy' ? 'Boy 💙' : 'Girl 💖';
          voteMsg.textContent = getTranslation('voteSubmitted').replace('{vote}', voteText);
          voteBoyBtn.disabled = false;
          voteGirlBtn.disabled = false;
          userVoteId = newVoteRef.key;
          hasVoted = true;
          resultsSection.classList.remove('hidden');
          showResults();
          checkAdminMode();
        } else {
          voteMsg.textContent = getTranslation('errorSubmittingVote');
        }
      });
    } else {
      if (userChanged) {
        voteMsg.textContent = getTranslation('alreadyChangedVote');
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
          const voteText = pendingVote === 'boy' ? 'Boy 💙' : 'Girl 💖';
          voteMsg.textContent = getTranslation('voteChanged').replace('{vote}', voteText);
          voteBoyBtn.disabled = true;
          voteGirlBtn.disabled = true;
          userChanged = true;
          hasVoted = true;
          showResults();
          checkAdminMode();
        } else {
          voteMsg.textContent = getTranslation('errorChangingVote');
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

  // Animate new votes in showResults
  function showResults() {
    votesRef.once('value').then(snap => {
      const votes = snap.val() || {};
      allVotes = Object.entries(votes).map(([id, v]) => ({ id, ...v }));
      const boyVotes = allVotes.filter(v => v.vote === 'boy');
      const girlVotes = allVotes.filter(v => v.vote === 'girl');
      const total = boyVotes.length + girlVotes.length;
      const boyPercent = total ? (boyVotes.length / total) * 100 : 0;
      const girlPercent = total ? (girlVotes.length / total) * 100 : 0;
      boyBar.style.width = boyPercent + '%';
      girlBar.style.width = girlPercent + '%';
      boyCount.textContent = boyVotes.length;
      girlCount.textContent = girlVotes.length;
      // Animate bars
      boyBar.classList.remove('vote-bounce');
      girlBar.classList.remove('vote-bounce');
      void boyBar.offsetWidth; // force reflow
      void girlBar.offsetWidth;
      if (boyVotes.length) boyBar.classList.add('vote-bounce');
      if (girlVotes.length) girlBar.classList.add('vote-bounce');
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
    });
  }

  if (!adminTokenParam && guestName && localStorage.getItem(votedKey)) {
    hasVoted = true;
    showResults();
    checkAdminMode();
  }

  // Track previous vote count and votes for popup detection
  let previousVoteCount = 0;
  let previousVotes = new Map(); // Map of voter name to their vote
  
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
    const boyPercent = total ? (boyList.length / total) * 100 : 0;
    const girlPercent = total ? (girlList.length / total) * 100 : 0;
    
    // Update admin layout
    if (isAdmin && boyCount && girlCount && boyBarFill && girlBarFill && boyNames && girlNames) {
      // Update counts with animation
      if (parseInt(boyCount.textContent) !== boyList.length) {
        boyCount.classList.add('count-grow');
        setTimeout(() => boyCount.classList.remove('count-grow'), 600);
      }
      if (parseInt(girlCount.textContent) !== girlList.length) {
        girlCount.classList.add('count-grow');
        setTimeout(() => girlCount.classList.remove('count-grow'), 600);
      }
      
      boyCount.textContent = boyList.length;
      girlCount.textContent = girlList.length;
      boyBarFill.style.width = boyPercent + '%';
      girlBarFill.style.width = girlPercent + '%';
      
      // Add pulse animation when bars change
      if (boyList.length > 0) {
        boyBarFill.classList.add('bar-pulse-blue');
        setTimeout(() => boyBarFill.classList.remove('bar-pulse-blue'), 1000);
      }
      if (girlList.length > 0) {
        girlBarFill.classList.add('bar-pulse-pink');
        setTimeout(() => girlBarFill.classList.remove('bar-pulse-pink'), 1000);
      }
      
      // Update names with pill badges
      boyNames.innerHTML = boyList.map(n => {
        const sanitizedName = sanitizeName(n);
        return `<span class='pill-badge pill-boy'>${emojiForName(sanitizedName)} ${sanitizedName}</span>`;
      }).join('');
      girlNames.innerHTML = girlList.map(n => {
        const sanitizedName = sanitizeName(n);
        return `<span class='pill-badge pill-girl'>${emojiForName(sanitizedName)} ${sanitizedName}</span>`;
      }).join('');
    }
    
    // Update guest layout
    if (!isAdmin && boyCountGuest && girlCountGuest && boyBar && girlBar && boyNamesGuest && girlNamesGuest) {
      boyCountGuest.textContent = boyList.length;
      girlCountGuest.textContent = girlList.length;
      boyBar.style.width = boyPercent + '%';
      girlBar.style.width = girlPercent + '%';
      
      // Update names with simple badges for guest view
      boyNamesGuest.innerHTML = boyList.map(n => {
        const sanitizedName = sanitizeName(n);
        return `<span class='pill-badge pill-boy'>${emojiForName(sanitizedName)} ${sanitizedName}</span>`;
      }).join('');
      girlNamesGuest.innerHTML = girlList.map(n => {
        const sanitizedName = sanitizeName(n);
        return `<span class='pill-badge pill-girl'>${emojiForName(sanitizedName)} ${sanitizedName}</span>`;
      }).join('');
    }
    
    // Detect new votes and changes for popups
    if (isAdmin) {
      const currentVotes = new Map();
      allVotes.forEach(v => {
        currentVotes.set(v.name, v.vote);
      });
      
      // Check for new votes or vote changes
      currentVotes.forEach((vote, name) => {
        const previousVote = previousVotes.get(name);
        if (!previousVote) {
          // New voter
          showVotePopup(name, vote, false);
        } else if (previousVote !== vote) {
          // Vote changed
          showVotePopup(name, vote, true);
        }
      });
      
      previousVotes = currentVotes;
      
      // Update guest counter
      updateGuestCounter(total);
    }
    
    // Legacy animation for compatibility
    if (adminTokenParam && total > previousVoteCount && total > 0) {
      const newestVote = allVotes[allVotes.length - 1];
      if (newestVote && newestVote.name) {
        const sanitizedName = sanitizeName(newestVote.name);
        showVoteAnimation(sanitizedName, newestVote.vote);
      }
    }
    previousVoteCount = total;
    
    if (!adminTokenParam && hasVoted) showResults();
    if (adminTokenParam) checkAdminMode();
  });

  revealRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    finalReveal.classList.remove('hidden');
    finalRevealMsg.textContent = data.actual === 'boy' ? getTranslation('itsABoy') : getTranslation('itsAGirl');
    let confetti = '';
    for (let i = 0; i < 30; i++) {
      confetti += data.actual === 'boy' ? '💙' : '💖';
    }
    finalConfetti.innerHTML = confetti;
    if (adminTokenParam) checkAdminMode();
  });
}); 