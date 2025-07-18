// js/app.js for landing and dynamic voting/results page
// Handles: party creation, QR, and dynamic voting/results if ?roomId=xxx

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  const landingPage = document.getElementById('landingPage');
  const voteResultsPage = document.getElementById('voteResultsPage');
  const notFound = document.getElementById('notFound');

  // If roomId is present, show voting/results UI
  if (roomId) {
    landingPage.classList.add('hidden');
    // Fetch party info to check if room exists
    if (typeof firebaseConfig !== 'undefined') {
      firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();
    const infoRef = db.ref(`rooms/${roomId}/info`);
    infoRef.once('value').then(snap => {
      const info = snap.val();
      if (!info) {
        notFound.classList.remove('hidden');
        return;
      }
      // Inject voting/results markup
      voteResultsPage.innerHTML = `
        <div id="partyInfo" class="mb-4">
          <h1 id="partyName" class="text-2xl font-extrabold mb-1"></h1>
          <div id="hostPrediction" class="text-lg font-semibold"></div>
        </div>
        <div id="nameSection" class="mb-4">
          <input id="guestName" type="text" placeholder="Enter your name" class="w-full px-4 py-2 border rounded mb-2" />
          <button id="submitNameBtn" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Continue</button>
          <div id="nameError" class="text-red-500 text-sm mt-1"></div>
        </div>
        <div id="voteSection" class="hidden">
          <p class="mb-4 font-semibold">Who do you think it is?</p>
          <div class="flex flex-col sm:flex-row justify-center gap-4 mb-6 w-full">
            <button id="voteBoyBtn" class="flex-1 bg-blue-400 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded text-lg transition-all">Boy 💙</button>
            <button id="voteGirlBtn" class="flex-1 bg-pink-400 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded text-lg transition-all">Girl 💖</button>
          </div>
          <div id="voteMsg" class="text-green-600 font-semibold"></div>
        </div>
        <div id="resultsSection" class="hidden mt-6">
          <h2 class="text-lg font-semibold mb-2">Live Results</h2>
          <div class="mb-4">
            <div class="flex items-center mb-2">
              <span class="text-blue-500 text-2xl mr-2">💙</span>
              <div class="w-full bg-blue-100 rounded h-8 flex items-center relative overflow-hidden">
                <div id="boyBar" class="bg-blue-400 h-8 rounded-l transition-all duration-700 ease-in-out absolute left-0 top-0" style="width:0%"></div>
                <span id="boyCount" class="ml-2 text-blue-700 font-bold relative z-10 pl-2"></span>
              </div>
            </div>
            <div class="max-h-24 overflow-y-auto mb-2 bg-blue-50 rounded p-2 text-left" id="boyNames"></div>
            <div class="flex items-center mb-2">
              <span class="text-pink-500 text-2xl mr-2">💖</span>
              <div class="w-full bg-pink-100 rounded h-8 flex items-center relative overflow-hidden">
                <div id="girlBar" class="bg-pink-400 h-8 rounded-l transition-all duration-700 ease-in-out absolute left-0 top-0" style="width:0%"></div>
                <span id="girlCount" class="ml-2 text-pink-700 font-bold relative z-10 pl-2"></span>
              </div>
            </div>
            <div class="max-h-24 overflow-y-auto bg-pink-50 rounded p-2 text-left" id="girlNames"></div>
          </div>
        </div>
        <div id="changePopup" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
          <div class="bg-white p-6 rounded shadow-lg text-center">
            <p class="mb-4 font-bold">You can only change your vote once. Are you sure?</p>
            <button id="confirmChangeBtn" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2">Yes, change</button>
            <button id="cancelChangeBtn" class="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancel</button>
          </div>
        </div>
      `;
      voteResultsPage.classList.remove('hidden');
      // Dynamically load voting/results logic
      const script = document.createElement('script');
      script.src = 'js/vote_results.js';
      document.body.appendChild(script);
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