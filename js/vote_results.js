// js/vote_results.js
// Improved guest flow, voting/results, reveal logic (secure adminToken, cute badges, robust admin mode)

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

  // Admin badge
  let adminBadge = null;
  function showAdminBadge() {
    if (!adminBadge) {
      adminBadge = document.createElement('div');
      adminBadge.textContent = 'Admin Mode';
      adminBadge.className = 'fixed top-2 right-2 bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full shadow text-xs font-bold z-50';
      document.body.appendChild(adminBadge);
    }
  }
  function hideAdminBadge() {
    if (adminBadge) {
      adminBadge.remove();
      adminBadge = null;
    }
  }

  // LocalStorage keys
  const votedKey = `voted_${roomId}`;
  const nameKey = `name_${roomId}`;
  const changeKey = `changed_${roomId}`;
  const voteIdKey = `voteId_${roomId}`;

  // Cute emoji for badges
  const badgeEmojis = ['👶','🍼','🎈','🎉','🧸','🎀','🦄','🐣','🐥','🦋','🌈','⭐','💫','🍭','🍬','🎂','🥳','😻','🐻','🐰'];
  function emojiForName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return badgeEmojis[Math.abs(hash) % badgeEmojis.length];
  }

  // Firebase
  firebase.initializeApp(firebaseConfig);
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

  // Robust Admin token check (always run on load, never hidden by guest logic)
  function checkAdminMode() {
    if (adminTokenParam) {
      adminTokenRef.once('value').then(snap => {
        const token = snap.val();
        if (token && token === adminTokenParam && revealGenderBtn) {
          isAdmin = true;
          revealGenderBtn.classList.remove('hidden');
          showAdminBadge();
          revealGenderBtn.onclick = () => {
            revealPopup.classList.remove('hidden');
          };
          confirmRevealBtn.onclick = () => {
            infoRef.once('value').then(snap => {
              const info = snap.val();
              if (info && info.prediction) {
                revealRef.set({ actual: info.prediction, revealedAt: Date.now() });
              }
            });
            revealPopup.classList.add('hidden');
          };
          cancelRevealBtn.onclick = () => {
            revealPopup.classList.add('hidden');
          };
        } else {
          if (revealGenderBtn) revealGenderBtn.classList.add('hidden');
          hideAdminBadge();
        }
      });
    } else {
      if (revealGenderBtn) revealGenderBtn.classList.add('hidden');
      hideAdminBadge();
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

  // Guest flow: skip name input if guest param is present
  if (guestName) {
    nameSection.classList.add('hidden');
    voteSection.classList.remove('hidden');
    localStorage.setItem(nameKey, guestName);
    resultsSection.classList.add('hidden');
  } else {
    nameSection.classList.remove('hidden');
    voteSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
  }

  // Name submit
  if (submitNameBtn) {
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

  // Voting logic
  function castVote(vote) {
    if (!guestName) return;
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
          showResults();
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

  voteBoyBtn.addEventListener('click', () => castVote('boy'));
  voteGirlBtn.addEventListener('click', () => castVote('girl'));

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

  function showResults() {
    resultsSection.classList.remove('hidden');
  }

  if (guestName && localStorage.getItem(votedKey)) {
    hasVoted = true;
    showResults();
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
    if (hasVoted) showResults();
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
  });
}); 