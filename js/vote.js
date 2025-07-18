// vote.js for vote.html
// 1. Ask for guest name, 2. Show voting buttons, 3. Save name+vote to Firebase, 4. Prevent double voting

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

  // Prevent double voting
  const votedKey = `voted_${roomId}`;
  if (localStorage.getItem(votedKey)) {
    nameSection.classList.add('hidden');
    voteSection.classList.remove('hidden');
    displayName.textContent = localStorage.getItem(`name_${roomId}`) || 'Guest';
    voteBoyBtn.disabled = true;
    voteGirlBtn.disabled = true;
    voteMsg.textContent = 'You already voted!';
    return;
  }

  // Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // Name submit
  submitNameBtn.addEventListener('click', () => {
    const name = guestNameInput.value.trim();
    if (!name) {
      guestNameInput.classList.add('border-red-500');
      return;
    }
    localStorage.setItem(`name_${roomId}`, name);
    nameSection.classList.add('hidden');
    voteSection.classList.remove('hidden');
    displayName.textContent = name;
  });

  // Voting
  function castVote(vote) {
    const name = localStorage.getItem(`name_${roomId}`) || 'Guest';
    const uniqueId = db.ref().push().key;
    db.ref(`rooms/${roomId}/votes/${uniqueId}`).set({ name, vote, timestamp: Date.now() }, (err) => {
      if (!err) {
        localStorage.setItem(votedKey, vote);
        voteMsg.textContent = `Vote for ${vote === 'boy' ? 'Boy 💙' : 'Girl 💖'} submitted!`;
        voteBoyBtn.disabled = true;
        voteGirlBtn.disabled = true;
      } else {
        voteMsg.textContent = 'Error submitting vote. Try again!';
      }
    });
  }

  voteBoyBtn.addEventListener('click', () => castVote('boy'));
  voteGirlBtn.addEventListener('click', () => castVote('girl'));
}); 