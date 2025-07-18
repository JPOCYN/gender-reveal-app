// js/vote_results.js
// Combined voting and live results logic with one allowed vote change

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  if (!roomId) {
    alert('No roomId specified in URL.');
    return;
  }

  const nameSection = document.getElementById('nameSection');
  const voteSection = document.getElementById('voteSection');
  const guestNameInput = document.getElementById('guestName');
  const submitNameBtn = document.getElementById('submitNameBtn');
  const displayName = document.getElementById('displayName');
  const voteBoyBtn = document.getElementById('voteBoyBtn');
  const voteGirlBtn = document.getElementById('voteGirlBtn');
  const voteMsg = document.getElementById('voteMsg');
  const resultsSection = document.getElementById('resultsSection');
  const boyBar = document.getElementById('boyBar');
  const girlBar = document.getElementById('girlBar');
  const boyCount = document.getElementById('boyCount');
  const girlCount = document.getElementById('girlCount');
  const guestList = document.getElementById('guestList');
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
  const votesRef = db.ref(`rooms/${roomId}/votes`);

  // State
  let userVoteId = localStorage.getItem(voteIdKey) || null;
  let userChanged = localStorage.getItem(changeKey) === '1';
  let pendingVote = null;

  // Show results section always after name
  function showResults() {
    resultsSection.classList.remove('hidden');
  }

  // Name submit
  submitNameBtn.addEventListener('click', () => {
    const name = guestNameInput.value.trim();
    if (!name) {
      guestNameInput.classList.add('border-red-500');
      return;
    }
    localStorage.setItem(nameKey, name);
    nameSection.classList.add('hidden');
    voteSection.classList.remove('hidden');
    displayName.textContent = name;
    showResults();
  });

  // If already voted, show name and results
  function setupAfterName() {
    nameSection.classList.add('hidden');
    voteSection.classList.remove('hidden');
    displayName.textContent = localStorage.getItem(nameKey) || 'Guest';
    showResults();
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

  // Live results
  votesRef.on('value', (snapshot) => {
    let boy = 0, girl = 0;
    let guests = [];
    snapshot.forEach(child => {
      const v = child.val();
      guests.push(v);
      if (v.vote === 'boy') boy++;
      if (v.vote === 'girl') girl++;
    });
    const total = boy + girl;
    boyCount.textContent = boy;
    girlCount.textContent = girl;
    boyBar.style.width = total ? `${(boy/total)*100}%` : '0%';
    girlBar.style.width = total ? `${(girl/total)*100}%` : '0%';
    guestList.innerHTML = guests.map(g => `<li>${g.name} <span class="${g.vote==='boy'?'text-blue-500':'text-pink-500'}">${g.vote==='boy'?'💙':'💖'}</span></li>`).join('');
  });
}); 