// js/vote_results.js
// Strict admin/guest separation, admin QR, no admin voting

document.addEventListener('DOMContentLoaded', () => {
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
  function showAdminQR(roomId) {
    if (!adminQR) {
      adminQR = document.createElement('div');
      adminQR.className = 'flex flex-col items-center mt-6';
      adminQR.innerHTML = '<div class="font-bold mb-2 text-lg">Scan to Join and Vote</div><div id="adminGuestQR"></div><div class="text-xs text-gray-500 mt-1">Share this QR code with guests</div>';
      resultsSection.parentNode.insertBefore(adminQR, resultsSection.nextSibling);
    }
    const guestLink = `${window.location.origin}/vote.html?roomId=${roomId}`;
    const qrDiv = adminQR.querySelector('#adminGuestQR');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: guestLink,
      width: 192,
      height: 192,
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
  const badgeEmojis = ['👶🏻','🍼','🎈','🎉','🧸','🎀','🦄','🐣','🐥','🦋','🌈','⭐','💫','🍭','🍬','🎂','��','😻','🐻','🐰'];
  function emojiForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return badgeEmojis[Math.abs(hash) % badgeEmojis.length];
  }

  // Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.database();
  const infoRef = db.ref(`parties/${roomId}/info`);
  const votesRef = db.ref(`parties/${roomId}/votes`);
  const revealRef = db.ref(`parties/${roomId}/reveal`);
  const adminTokenRef = db.ref(`parties/${roomId}/adminToken`);

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
        }
      });
    } else {
      if (revealGenderBtn) revealGenderBtn.classList.add('hidden');
      hideAdminBadge();
      hideAdminQR();
    }
  }
  checkAdminMode();

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
        badge.textContent = emojiForName(v.name) + ' ' + v.name;
        boyNames.appendChild(badge);
        setTimeout(() => badge.classList.remove('vote-bounce'), 600);
      });
      girlVotes.forEach(v => {
        const badge = document.createElement('span');
        badge.className = 'pill-badge pill-girl vote-bounce';
        badge.textContent = emojiForName(v.name) + ' ' + v.name;
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
    // Cute pill badges with emoji
    boyNames.innerHTML = boyList.map(n => `<span class='pill-badge pill-boy'>${emojiForName(n)} ${n}</span>`).join('');
    girlNames.innerHTML = girlList.map(n => `<span class='pill-badge pill-girl'>${emojiForName(n)} ${n}</span>`).join('');
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