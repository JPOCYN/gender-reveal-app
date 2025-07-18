// Homepage logic for Gender Reveal Party
// Handles: Start Party, QR code, navigation

document.addEventListener('DOMContentLoaded', () => {
  const homepage = document.getElementById('homepage');
  const votingPage = document.getElementById('votingPage');
  const resultsPage = document.getElementById('resultsPage');
  const startPartyBtn = document.getElementById('startPartyBtn');
  const qrSection = document.getElementById('qrSection');
  const qrCode = document.getElementById('qrCode');
  const roomLink = document.getElementById('roomLink');
  const goToResultsBtn = document.getElementById('goToResultsBtn');

  // Helper to generate a random room ID
  function generateRoomId() {
    return 'party-' + Math.random().toString(36).substr(2, 8);
  }

  // Show only the homepage
  function showHomepage() {
    homepage.classList.remove('hidden');
    votingPage.classList.add('hidden');
    resultsPage.classList.add('hidden');
  }

  // Start Party button click
  startPartyBtn.addEventListener('click', () => {
    const roomId = generateRoomId();
    const voteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&vote=1`;
    const resultsUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}&results=1`;
    qrSection.classList.remove('hidden');
    // Generate QR code for voting page
    qrCode.innerHTML = '';
    QRCode.toCanvas(document.createElement('canvas'), voteUrl, (err, canvas) => {
      if (!err) qrCode.appendChild(canvas);
    });
    roomLink.textContent = voteUrl;
    roomLink.onclick = () => { window.open(voteUrl, '_blank'); };
    // Go to results page
    goToResultsBtn.onclick = () => {
      window.location.href = resultsUrl;
    };
    // Store roomId in sessionStorage for host
    sessionStorage.setItem('hostRoomId', roomId);
  });

  // Routing based on URL params
  function route() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('room') && params.has('vote')) {
      homepage.classList.add('hidden');
      votingPage.classList.remove('hidden');
      resultsPage.classList.add('hidden');
    } else if (params.has('room') && params.has('results')) {
      homepage.classList.add('hidden');
      votingPage.classList.add('hidden');
      resultsPage.classList.remove('hidden');
    } else {
      showHomepage();
    }
  }

  route();
}); 