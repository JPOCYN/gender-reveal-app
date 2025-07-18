// js/vote_results.js
// Improved guest flow, voting/results, reveal logic

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  const guestParam = params.get('guest');
  const isOwner = params.get('admin') === '1';

  if (!roomId) {
    document.body.innerHTML = '<div class="flex flex-col items-center justify-center min-h-screen"><h2 class="text-xl font-bold text-red-600">No party found. Please use a valid invite link.</h2></div>';
    return;
  }

  // Elements
  const partyNameEl = document.getElementById('partyName');
  const hostPredictionEl = document.getElementById('hostPrediction');
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

  // LocalStorage keys
  const votedKey = `voted_${roomId}`;
  const nameKey = `name_${roomId}`;
  const changeKey = `changed_${roomId}`;
  const voteIdKey = `voteId_${roomId}`;

  // Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const infoRef = db.ref(`rooms/${roomId}/info`);
  const votesRef = db.ref(`rooms/${roomId}/votes`);
  const revealRef = db.ref(`rooms/${roomId}/reveal`);

  // State
  let userVoteId = localStorage.getItem(voteIdKey) || null;
  let userChanged = localStorage.getItem(changeKey) === '1';
  let pendingVote = null;
  let allVotes = [];
  let guestName = guestParam ? decodeURIComponent(guestParam) : localStorage.getItem(nameKey);
  let hasVoted = false;

  // Fetch and show party info
  infoRef.once('value').then(snap => {
    const info = snap.val();
    if (info) {
      partyNameEl.textContent = info.partyName || 'Gender Reveal Party';
      hostPredictionEl.innerHTML = `Host predicts: <span class="${info.prediction==='boy'?'text-blue-500':'text-pink-500'} font-bold">${info.prediction==='boy'?'Boy 💙':'Girl 💖'}</span>`;
    } else {
      partyNameEl.textContent = 'Gender Reveal Party';
      hostPredictionEl.textContent = '';
    }
  });

  // Name validation
  function validateName(name) {
    if (!name.trim()) return 'Name cannot be empty.';
    // Check for duplicate name in Firebase
    const lower = name.trim().toLowerCase();
    if (allVotes.some(v => v.name.trim().toLowerCase() === lower)) return 'This name has already voted.';
    return '';
  }

  // Guest flow: skip name input if guest param is present
  if (guestName) {
    nameSection.classList.add('hidden');
    voteSection.classList.remove('hidden');
    // Save to localStorage for later
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
      // Redirect to self with guest param
      window.location.href = `${window.location.pathname}?roomId=${roomId}&guest=${encodeURIComponent(name)}`;
    });
  }

  // Voting logic
  function castVote(vote) {
    if (!guestName) return;
    // If never voted, create new
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
      // If already changed once, block
      if (userChanged) {
        voteMsg.textContent = 'You have already changed your vote once.';
        voteBoyBtn.disabled = true;
        voteGirlBtn.disabled = true;
        return;
      }
      // Show popup to confirm change
      pendingVote = vote;
      changePopup.classList.remove('hidden');
    }
  }

  voteBoyBtn.addEventListener('click', () => castVote('boy'));
  voteGirlBtn.addEventListener('click', () => castVote('girl'));

  // Popup logic
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

  // Hide results until voted
  function showResults() {
    resultsSection.classList.remove('hidden');
  }

  // On load, check if already voted
  if (guestName && localStorage.getItem(votedKey)) {
    hasVoted = true;
    showResults();
  }

  // Live results
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
    // Animate bars
    boyBar.style.width = total ? `${(boyList.length/total)*100}%` : '0%';
    girlBar.style.width = total ? `${(girlList.length/total)*100}%` : '0%';
    // Scrollable name lists
    boyNames.innerHTML = boyList.map(n => `<div class='truncate'>${n}</div>`).join('');
    girlNames.innerHTML = girlList.map(n => `<div class='truncate'>${n}</div>`).join('');
    // Only show results if guest has voted
    if (hasVoted) showResults();
  });

  // Reveal Gender logic (admin/owner only)
  if (isOwner && revealGenderBtn) {
    revealGenderBtn.classList.remove('hidden');
    revealGenderBtn.addEventListener('click', () => {
      revealPopup.classList.remove('hidden');
    });
    confirmRevealBtn.addEventListener('click', () => {
      // Set reveal in Firebase
      infoRef.once('value').then(snap => {
        const info = snap.val();
        if (info && info.prediction) {
          revealRef.set({ actual: info.prediction, revealedAt: Date.now() });
        }
      });
      revealPopup.classList.add('hidden');
    });
    cancelRevealBtn.addEventListener('click', () => {
      revealPopup.classList.add('hidden');
    });
  }

  // Listen for reveal
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