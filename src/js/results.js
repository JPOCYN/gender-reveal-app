// Results page logic for Gender Reveal Party
// Handles: live vote count, reveal, confetti, winner display

document.addEventListener('DOMContentLoaded', () => {
  const resultsPage = document.getElementById('resultsPage');
  if (!resultsPage || resultsPage.classList.contains('hidden')) return;

  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  if (!roomId) return;

  const boyBar = document.getElementById('boyBar');
  const girlBar = document.getElementById('girlBar');
  const boyCount = document.getElementById('boyCount');
  const girlCount = document.getElementById('girlCount');
  const revealGenderBtn = document.getElementById('revealGenderBtn');
  const revealSection = document.getElementById('revealSection');
  const actualBoyBtn = document.getElementById('actualBoyBtn');
  const actualGirlBtn = document.getElementById('actualGirlBtn');
  const confettiSection = document.getElementById('confettiSection');
  const revealMsg = document.getElementById('revealMsg');
  const winnerEmojis = document.getElementById('winnerEmojis');

  // Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const votesRef = db.ref(`parties/${roomId}/votes`);
  const revealRef = db.ref(`parties/${roomId}/reveal`);

  let votes = [];

  // Listen for votes
  votesRef.on('value', (snapshot) => {
    votes = [];
    let boy = 0, girl = 0;
    snapshot.forEach(child => {
      const v = child.val();
      votes.push(v);
      if (v.gender === 'boy') boy++;
      if (v.gender === 'girl') girl++;
    });
    const total = boy + girl;
    boyCount.textContent = boy;
    girlCount.textContent = girl;
    boyBar.style.width = total ? `${(boy/total)*100}%` : '0%';
    girlBar.style.width = total ? `${(girl/total)*100}%` : '0%';
  });

  // Reveal gender
  revealGenderBtn.addEventListener('click', () => {
    revealSection.classList.remove('hidden');
  });
  actualBoyBtn.addEventListener('click', () => reveal('boy'));
  actualGirlBtn.addEventListener('click', () => reveal('girl'));

  function reveal(actual) {
    revealRef.set({ actual, revealedAt: Date.now() });
  }

  // Listen for reveal
  revealRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    revealSection.classList.add('hidden');
    confettiSection.classList.remove('hidden');
    // Confetti (simple emoji burst)
    let confetti = '';
    for (let i = 0; i < 30; i++) {
      confetti += data.actual === 'boy' ? '💙' : '💖';
    }
    revealMsg.textContent = `It's a ${data.actual === 'boy' ? 'BOY 💙' : 'GIRL 💖'}!`;
    // Show who guessed right
    let right = votes.filter(v => v.gender === data.actual).length;
    let wrong = votes.length - right;
    winnerEmojis.innerHTML = `${right} guessed right! ${data.actual === 'boy' ? '🎉🧢' : '🎉🎀'}<br>${wrong} guessed wrong! 😅`;
    setTimeout(() => { winnerEmojis.innerHTML += `<div>${confetti}</div>`; }, 500);
  });
}); 