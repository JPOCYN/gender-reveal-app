// js/vote_results.js
// Voting + results page with party info, name validation, live bars, scrollable name lists

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
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

  // State
  let userVoteId = localStorage.getItem(voteIdKey) || null;
  let userChanged = localStorage.getItem(changeKey) === '1';
  let pendingVote = null;
  let allVotes = [];

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

  // Name submit
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
    nameSection.classList.add('hidden');
    voteSection.classList.remove('hidden');
    resultsSection.classList.remove('hidden');
  });

  // If already voted, show name and results
  function setupAfterName() {
    nameSection.classList.add('hidden');
    voteSection.classList.remove('hidden');
    resultsSection.classList.remove('hidden');
  }

  // Voting logic
  function castVote(vote) {
    const name = localStorage.getItem(nameKey) || 'Guest';
    // If never voted, create new
    if (!userVoteId) {
      const newVoteRef = votesRef.push();
      newVoteRef.set({ name, vote, timestamp: Date.now() }, (err) => {
        if (!err) {
          localStorage.setItem(votedKey, vote);
          localStorage.setItem(voteIdKey, newVoteRef.key);
          voteMsg.textContent = `Vote for ${vote === 'boy' ? 'Boy 💙' : 'Girl 💖'} submitted!`;
          voteBoyBtn.disabled = false;
          voteGirlBtn.disabled = false;
          userVoteId = newVoteRef.key;
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
    const name = localStorage.getItem(nameKey) || 'Guest';
    votesRef.child(userVoteId).set({ name, vote: pendingVote, timestamp: Date.now() }, (err) => {
      if (!err) {
        localStorage.setItem(votedKey, pendingVote);
        localStorage.setItem(changeKey, '1');
        voteMsg.textContent = `Vote changed to ${pendingVote === 'boy' ? 'Boy 💙' : 'Girl 💖'}!`;
        voteBoyBtn.disabled = true;
        voteGirlBtn.disabled = true;
        userChanged = true;
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

  // On load, check if already voted
  if (localStorage.getItem(nameKey)) {
    setupAfterName();
    // If already voted, disable voting if changed
    if (localStorage.getItem(votedKey)) {
      voteMsg.textContent = `You already voted${userChanged ? ' and changed once.' : '.'}`;
      if (userChanged) {
        voteBoyBtn.disabled = true;
        voteGirlBtn.disabled = true;
      }
    }
  }

  // Always show voting/results UI if roomId is present
  nameSection.classList.remove('hidden');
  voteSection.classList.add('hidden');
  resultsSection.classList.add('hidden');

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
  });
}); 