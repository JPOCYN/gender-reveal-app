// result.js for result.html
// 1. Show live boy/girl vote counts, 2. List guest names and votes, 3. Reveal Gender button (admin only), 4. After reveal, show confetti and results

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  if (!roomId) {
    alert('No roomId specified in URL.');
    return;
  }

  const boyBar = document.getElementById('boyBar');
  const girlBar = document.getElementById('girlBar');
  const boyCount = document.getElementById('boyCount');
  const girlCount = document.getElementById('girlCount');
  const guestList = document.getElementById('guestList');
  const revealGenderBtn = document.getElementById('revealGenderBtn');
  const revealSection = document.getElementById('revealSection');
  const actualBoyBtn = document.getElementById('actualBoyBtn');
  const actualGirlBtn = document.getElementById('actualGirlBtn');
  const confettiSection = document.getElementById('confettiSection');
  const revealMsg = document.getElementById('revealMsg');
  const winnerEmojis = document.getElementById('winnerEmojis');
  const rightList = document.getElementById('rightList');
  const wrongList = document.getElementById('wrongList');

  // Only show Reveal button if admin (host)
  // For demo: if ?admin=1 in URL, show button
  if (!params.has('admin')) {
    revealGenderBtn.classList.add('hidden');
  }

  // Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  const votesRef = db.ref(`rooms/${roomId}/votes`);
  const revealRef = db.ref(`rooms/${roomId}/reveal`);

  let votes = [];

  // Listen for votes
  votesRef.on('value', (snapshot) => {
    votes = [];
    let boy = 0, girl = 0;
    let guests = [];
    snapshot.forEach(child => {
      const v = child.val();
      votes.push(v);
      guests.push(v);
      if (v.vote === 'boy') boy++;
      if (v.vote === 'girl') girl++;
    });
    const total = boy + girl;
    boyCount.textContent = boy;
    girlCount.textContent = girl;
    boyBar.style.width = total ? `${(boy/total)*100}%` : '0%';
    girlBar.style.width = total ? `${(girl/total)*100}%` : '0%';
    // List guests
    guestList.innerHTML = guests.map(g => `<li>${g.name} <span class="${g.vote==='boy'?'text-blue-500':'text-pink-500'}">${g.vote==='boy'?'💙':'💖'}</span></li>`).join('');
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
    // Show who guessed right/wrong
    let right = votes.filter(v => v.vote === data.actual);
    let wrong = votes.filter(v => v.vote !== data.actual);
    winnerEmojis.innerHTML = `${right.length} guessed right! 🎉<br>${wrong.length} guessed wrong! 😅`;
    rightList.innerHTML = right.length ? `Right: ${right.map(v=>v.name).join(', ')}` : '';
    wrongList.innerHTML = wrong.length ? `Wrong: ${wrong.map(v=>v.name).join(', ')}` : '';
    setTimeout(() => { winnerEmojis.innerHTML += `<div>${confetti}</div>`; }, 500);
  });
}); 