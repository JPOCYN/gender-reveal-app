// js/app.js for landing and dynamic voting/results page
// Handles: party creation, QR, and dynamic voting/results if ?roomId=xxx

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  const landingPage = document.getElementById('landingPage');
  const partyPanel = document.getElementById('partyPanel');
  const notFound = document.getElementById('notFound');

  // Helper to generate a random room ID
  function generateRoomId() {
    return 'party-' + Math.random().toString(36).substr(2, 8);
  }
  // Helper to generate a secure admin token
  function generateAdminToken() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    // Fallback for browsers without crypto.randomUUID
    return Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 16);
  }

  // Show party panel modal
  function showPartyPanel({ partyName, roomId, adminToken }) {
    const panel = partyPanel;
    const panelPartyName = document.getElementById('panelPartyName');
    const panelQrCode = document.getElementById('panelQrCode');
    const panelGuestLink = document.getElementById('panelGuestLink');
    const panelAdminLink = document.getElementById('panelAdminLink');
    const copyGuestLinkBtn = document.getElementById('copyGuestLinkBtn');
    const copyAdminLinkBtn = document.getElementById('copyAdminLinkBtn');
    const openGuestLinkBtn = document.getElementById('openGuestLinkBtn');
    const openAdminLinkBtn = document.getElementById('openAdminLinkBtn');
    const closePanelBtn = document.getElementById('closePanelBtn');

    const baseUrl = window.location.origin;
    const guestLink = `${baseUrl}/vote.html?roomId=${roomId}`;
    const adminLink = `${baseUrl}/vote.html?roomId=${roomId}&adminToken=${adminToken}`;

    panelPartyName.textContent = partyName;
    panelGuestLink.textContent = guestLink;
    panelAdminLink.textContent = adminLink;
    panelQrCode.innerHTML = '';
    QRCode.toCanvas(document.createElement('canvas'), guestLink, (err, canvas) => {
      if (!err) panelQrCode.appendChild(canvas);
    });
    copyGuestLinkBtn.onclick = () => {
      navigator.clipboard.writeText(guestLink);
      copyGuestLinkBtn.textContent = 'Copied!';
      setTimeout(() => { copyGuestLinkBtn.textContent = 'Copy Guest Link'; }, 1200);
    };
    copyAdminLinkBtn.onclick = () => {
      navigator.clipboard.writeText(adminLink);
      copyAdminLinkBtn.textContent = 'Copied!';
      setTimeout(() => { copyAdminLinkBtn.textContent = 'Copy Admin Link'; }, 1200);
    };
    openGuestLinkBtn.onclick = () => {
      window.open(guestLink, '_blank');
    };
    openAdminLinkBtn.onclick = () => {
      window.open(adminLink, '_blank');
    };
    closePanelBtn.onclick = () => {
      panel.classList.add('hidden');
    };
    panel.classList.remove('hidden');
  }

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
      // This part of the code is not directly modified by the new_code,
      // so it remains as is, including the guest name logic.
      // The new_code only added the partyPanel modal and its logic.
      // The guest name input UI and its logic are kept as they were.
      const voteResultsPage = document.getElementById('voteResultsPage');
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
        try {
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
          // Redirect to /vote.html?roomId=ROOM_ID&guest=GUEST_NAME
          const encodedName = encodeURIComponent(name);
          window.location.href = `/vote.html?roomId=${roomId}&guest=${encodedName}`;
        } catch (err) {
          guestNameError.textContent = 'An error occurred. Please try again.';
          continueBtn.disabled = false;
          continueSpinner.classList.add('hidden');
        }
      });
    });
    return;
  }

  // Party creation flow
  const partyForm = document.getElementById('partyForm');
  const partyNameInput = document.getElementById('partyName');
  const partyError = document.getElementById('partyError');

  if (partyForm) {
    partyForm.addEventListener('submit', async (e) => {
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
      const newRoomId = generateRoomId();
      const adminToken = generateAdminToken();
      if (typeof firebaseConfig !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
      }
      if (typeof firebase !== 'undefined') {
        const db = firebase.database();
        await db.ref(`parties/${newRoomId}/info`).set({
          partyName,
          prediction,
          createdAt: Date.now(),
        });
        await db.ref(`parties/${newRoomId}/adminToken`).set(adminToken);
      }
      showPartyPanel({ partyName, roomId: newRoomId, adminToken });
      partyForm.querySelectorAll('input,button').forEach(el => el.disabled = false);
    });
  }
}); 