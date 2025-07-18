// js/app.js for landing and dynamic voting/results page
// Handles: party creation, QR, and dynamic voting/results if ?roomId=xxx

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  const landingPage = document.getElementById('landingPage');
  const voteResultsPage = document.getElementById('voteResultsPage');
  const notFound = document.getElementById('notFound');

  // If roomId is present, show guest name input UI
  if (roomId) {
    landingPage.classList.add('hidden');
    if (typeof firebaseConfig !== 'undefined') {
      firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();
    const infoRef = db.ref(`rooms/${roomId}/info`);
    infoRef.once('value').then(snap => {
      const info = snap.val();
      if (!info) {
        notFound.classList.remove('hidden');
        notFound.querySelector('h2').textContent = 'Oops! This party link is invalid or has expired.';
        return;
      }
      // Show guest name input UI
      voteResultsPage.innerHTML = `
        <div id="partyInfo" class="mb-4">
          <h1 id="partyName" class="text-2xl font-extrabold mb-1">${info.partyName || 'Gender Reveal Party'}</h1>
        </div>
        <div id="guestNameSection" class="mb-4">
          <h2 class="text-lg font-bold mb-2">Welcome to ${info.partyName || 'the Party'}'s Gender Reveal!</h2>
          <p class="mb-2 text-gray-700">Enter your name to join and cast your vote!</p>
          <input id="guestName" type="text" placeholder="Your name" class="w-full px-4 py-2 border rounded mb-2" />
          <button id="continueBtn" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center">Continue <span id="continueSpinner" class="hidden ml-2 w-4 h-4 border-2 border-white border-t-blue-400 rounded-full animate-spin"></span></button>
          <div id="guestNameError" class="text-red-500 text-sm mt-1"></div>
        </div>
      `;
      voteResultsPage.classList.remove('hidden');
      // Guest name logic
      const guestNameInput = document.getElementById('guestName');
      const continueBtn = document.getElementById('continueBtn');
      const continueSpinner = document.getElementById('continueSpinner');
      const guestNameError = document.getElementById('guestNameError');
      continueBtn.addEventListener('click', async () => {
        guestNameError.textContent = '';
        const name = guestNameInput.value.trim();
        if (!name) {
          guestNameError.textContent = 'Please enter your name.';
          guestNameInput.classList.add('border-red-500');
          return;
        }
        continueBtn.disabled = true;
        continueSpinner.classList.remove('hidden');
        // Check for duplicate name in guest list
        const guestsRef = db.ref(`rooms/${roomId}/guests`);
        const guestsSnap = await guestsRef.once('value');
        const guests = guestsSnap.val() || {};
        const lower = name.toLowerCase();
        if (Object.values(guests).some(n => n.trim().toLowerCase() === lower)) {
          guestNameError.textContent = 'This name has already joined.';
          guestNameInput.classList.add('border-red-500');
          continueBtn.disabled = false;
          continueSpinner.classList.add('hidden');
          return;
        }
        // Save name to guest list
        await guestsRef.push(name);
        // Save to localStorage for voting/results page
        localStorage.setItem(`name_${roomId}`, name);
        // Redirect to vote/results page (with roomId)
        window.location.href = `${window.location.pathname}?roomId=${roomId}`;
      });
    });
    return;
  }

  // Helper to generate a random room ID
  function generateRoomId() {
    return 'party-' + Math.random().toString(36).substr(2, 8);
  }

  const partyForm = document.getElementById('partyForm');
  const partyNameInput = document.getElementById('partyName');
  const partyError = document.getElementById('partyError');
  const qrSection = document.getElementById('qrSection');
  const qrCode = document.getElementById('qrCode');
  const roomLink = document.getElementById('roomLink');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const copyMsg = document.getElementById('copyMsg');

  // Show QR section
  function showQR(roomId) {
    qrSection.classList.remove('hidden');
    const voteUrl = `${window.location.origin}${window.location.pathname.replace('index.html','')}?roomId=${roomId}`;
    qrCode.innerHTML = '';
    QRCode.toCanvas(document.createElement('canvas'), voteUrl, (err, canvas) => {
      if (!err) qrCode.appendChild(canvas);
    });
    roomLink.textContent = voteUrl;
    roomLink.onclick = () => { window.open(voteUrl, '_blank'); };
    copyLinkBtn.onclick = () => {
      navigator.clipboard.writeText(voteUrl).then(() => {
        copyMsg.textContent = 'Link copied!';
        setTimeout(() => { copyMsg.textContent = ''; }, 1500);
      });
    };
  }

  // Firebase (optional: only if you want to save party info)
  if (typeof firebaseConfig !== 'undefined' && !roomId) {
    firebase.initializeApp(firebaseConfig);
  }

  if (partyForm) {
    partyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      partyError.textContent = '';
      const partyName = partyNameInput.value.trim();
      const prediction = partyForm.hostPrediction.value;
      if (!partyName) {
        partyError.textContent = 'Please enter a party name.';
        partyNameInput.classList.add('border-red-500');
        return;
      }
      if (!prediction) {
        partyError.textContent = 'Please select a gender prediction.';
        return;
      }
      // Generate roomId
      const newRoomId = generateRoomId();
      // Save party info to Firebase (optional)
      if (typeof firebase !== 'undefined') {
        const db = firebase.database();
        db.ref(`rooms/${newRoomId}/info`).set({
          partyName,
          prediction,
          createdAt: Date.now()
        });
      }
      // Show QR code and link
      showQR(newRoomId);
      // Optionally, disable form after start
      partyForm.querySelectorAll('input,button').forEach(el => el.disabled = true);
    });
  }
}); 