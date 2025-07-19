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
      adminBadge.textContent = 'Admin Mode';
      adminBadge.className = 'fixed top-14 right-2 bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full shadow text-xs font-bold z-50';
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
      adminQR.className = 'sticky-qr';
      adminQR.innerHTML = `
        <div class="text-center">
          <div class="qr-container">
            <div id="adminGuestQR"></div>
          </div>
          <button id="copyGuestLinkBtn" class="copy-btn" data-i18n="copyInviteLink">📋 Copy Invite Link</button>
        </div>
      `;
      document.body.appendChild(adminQR);
      
      // Add copy functionality
      const copyBtn = adminQR.querySelector('#copyGuestLinkBtn');
      const guestLink = `${window.location.origin}/vote.html?roomId=${roomId}`;
      
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(guestLink).then(() => {
          copyBtn.textContent = '✅ Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy Invite Link';
            copyBtn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = guestLink;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          copyBtn.textContent = '✅ Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = '📋 Copy Invite Link';
            copyBtn.classList.remove('copied');
          }, 2000);
        });
      };
    }
    const guestLink = `${window.location.origin}/vote.html?roomId=${roomId}`;
    const qrDiv = adminQR.querySelector('#adminGuestQR');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: guestLink,
      width: 160,
      height: 160,
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
        itsAGirl: "It's a GIRL 💖!"
      },
      zh: {
        voteSubmitted: "投票給 {vote} 已提交！",
        errorSubmittingVote: "提交投票時發生錯誤。請重試！",
        alreadyChangedVote: "你已經更改過一次投票了。",
        voteChanged: "投票已更改為 {vote}！",
        errorChangingVote: "更改投票時發生錯誤。請重試！",
        itsABoy: "是個男孩 💙！",
        itsAGirl: "是個女孩 💖！"
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

  // F11 Fullscreen popup for admin (show once per session)
  function showFullscreenPopup() {
    const popup = document.getElementById('fullscreenPopup');
    const closeBtn = document.getElementById('closeFullscreenPopup');
    const sessionKey = `fullscreenPopupShown_${Date.now()}_${Math.random()}`;
    
    if (popup && !sessionStorage.getItem('fullscreenPopupShown')) {
      popup.classList.remove('hidden');
      sessionStorage.setItem('fullscreenPopupShown', 'true');
      
      if (closeBtn) {
        closeBtn.onclick = () => {
          popup.classList.add('hidden');
        };
      }
    }
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
    // Hide guest UI
    if (nameSection) nameSection.classList.add('hidden');
    if (voteSection) voteSection.classList.add('hidden');
    if (submitNameBtn) submitNameBtn.disabled = true;
    if (voteBoyBtn) voteBoyBtn.disabled = true;
    if (voteGirlBtn) voteGirlBtn.disabled = true;
    // Show results and reveal
    if (resultsSection) resultsSection.classList.remove('hidden');
    if (revealGenderBtn) revealGenderBtn.classList.remove('hidden');
    showAdminBadge();
    showAdminQR(roomId);
    
    // Show admin instructions
    showAdminInstructions();
    
    // Show F11 popup for admin
    showFullscreenPopup();
    
    // Add back to home button for admin
    const backToHomeBtn = document.createElement('button');
    backToHomeBtn.className = 'fixed bottom-4 left-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm z-40';
    backToHomeBtn.textContent = '← Back to Home';
    backToHomeBtn.onclick = () => {
      window.location.href = '/';
    };
    document.body.appendChild(backToHomeBtn);
    
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
    finalRevealMsg.textContent = data.actual === 'boy' ? getTranslation('itsABoy') : getTranslation('itsAGirl');
    let confetti = '';
    for (let i = 0; i < 30; i++) {
      confetti += data.actual === 'boy' ? '💙' : '💖';
    }
    finalConfetti.innerHTML = confetti;
    if (adminTokenParam) checkAdminMode();
  });
}); 