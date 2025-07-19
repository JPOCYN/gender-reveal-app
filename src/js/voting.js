// Voting page logic for Gender Reveal Party
// Handles: voting, saving to Firebase, confirmation

document.addEventListener('DOMContentLoaded', () => {
  const votingPage = document.getElementById('votingPage');
  if (!votingPage || votingPage.classList.contains('hidden')) return;

  const voteBoyBtn = document.getElementById('voteBoyBtn');
  const voteGirlBtn = document.getElementById('voteGirlBtn');
  const voteMsg = document.getElementById('voteMsg');

  // Get roomId from URL
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  if (!roomId) return;

  // Prevent double voting using localStorage
  const votedKey = `voted_${roomId}`;
  if (localStorage.getItem(votedKey)) {
    voteMsg.textContent = 'You already voted!';
    voteBoyBtn.disabled = true;
    voteGirlBtn.disabled = true;
    return;
  }

  // Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  function castVote(gender) {
    const voteRef = db.ref(`parties/${roomId}/votes`).push();
    voteRef.set({ gender, timestamp: Date.now() }, (err) => {
      if (!err) {
        localStorage.setItem(votedKey, gender);
        voteMsg.textContent = `Vote for ${gender === 'boy' ? 'Boy 💙' : 'Girl 💖'} submitted!`;
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