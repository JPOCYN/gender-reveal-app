// js/app.js for improved landing page
// Handles: party name, host prediction, QR code, Firebase save

document.addEventListener('DOMContentLoaded', () => {
  const partyForm = document.getElementById('partyForm');
  const partyNameInput = document.getElementById('partyName');
  const qrSection = document.getElementById('qrSection');
  const qrCode = document.getElementById('qrCode');
  const roomLink = document.getElementById('roomLink');

  // Helper to generate a random room ID
  function generateRoomId() {
    return 'party-' + Math.random().toString(36).substr(2, 8);
  }

  // Show QR section
  function showQR(roomId) {
    qrSection.classList.remove('hidden');
    const voteUrl = `${window.location.origin}${window.location.pathname.replace('index.html','vote.html')}?roomId=${roomId}`;
    qrCode.innerHTML = '';
    QRCode.toCanvas(document.createElement('canvas'), voteUrl, (err, canvas) => {
      if (!err) qrCode.appendChild(canvas);
    });
    roomLink.textContent = voteUrl;
    roomLink.onclick = () => { window.open(voteUrl, '_blank'); };
  }

  // Firebase (optional: only if you want to save party info)
  if (typeof firebaseConfig !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
  }

  partyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const partyName = partyNameInput.value.trim();
    const prediction = partyForm.hostPrediction.value;
    if (!partyName) {
      partyNameInput.classList.add('border-red-500');
      return;
    }
    // Generate roomId
    const roomId = generateRoomId();
    // Save party info to Firebase (optional)
    if (typeof firebase !== 'undefined') {
      const db = firebase.database();
      db.ref(`rooms/${roomId}/info`).set({
        partyName,
        prediction,
        createdAt: Date.now()
      });
    }
    // Show QR code and link
    showQR(roomId);
    // Optionally, disable form after start
    partyForm.querySelectorAll('input,button').forEach(el => el.disabled = true);
  });
}); 