// js/app.js for landing and dynamic voting/results page
// Handles: party creation, QR, and dynamic voting/results if ?roomId=xxx

// Firebase is initialized in firebaseConfig.js

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('roomId');
  const landingPage = document.getElementById('landingPage');
  const partyPanel = document.getElementById('partyPanel');
  const notFound = document.getElementById('notFound');
  const partyForm = document.getElementById('partyForm');
  const partyNameInput = document.getElementById('partyName');
  const partyError = document.getElementById('partyError');
  const startPartyBtn = document.getElementById('startPartyBtn');

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
    console.log('showPartyPanel called', { partyName, roomId, adminToken });
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
    new QRCode(panelQrCode, {
      text: guestLink,
      width: 192,
      height: 192,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
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
      // Reset wizard to step 1 and clear fields
      landingPage.classList.remove('hidden');
      if (window.resetWizard) window.resetWizard();
    };
    // Hide the landing wizard when showing the panel
    landingPage.classList.add('hidden');
    panel.classList.remove('hidden');
  }

  // Remove any duplicate partyForm submit handlers and keep only one:
  if (partyForm) {
    console.log('Registering partyForm submit handler');
    partyForm.addEventListener('submit', async (e) => {
      console.log('partyForm submit event fired');
      e.preventDefault();
      try {
        // Ensure Firebase is initialized
        if (typeof firebase === 'undefined') {
          throw new Error('Firebase is not loaded');
        }
        
        // Wait for Firebase to be properly initialized
        console.log('Waiting for Firebase to be ready...', {
          firebaseInitPromise: !!window.firebaseInitPromise,
          firebaseReady: window.firebaseReady,
          firebaseAppsLength: typeof firebase !== 'undefined' ? firebase.apps.length : 'N/A'
        });
        
        if (window.firebaseInitPromise) {
          await window.firebaseInitPromise;
          console.log('Firebase ready via promise');
        } else {
          // Fallback: wait for Firebase to be ready
          console.log('Using fallback Firebase initialization');
          let attempts = 0;
          while (!firebase.apps.length && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          if (!firebase.apps.length) {
            throw new Error('Firebase failed to initialize');
          }
          console.log('Firebase ready via fallback');
        }
        
        const db = firebase.database();
        const roomId = db.ref('parties').push().key;
        const adminToken = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 16);
        const partyName = partyNameInput.value.trim();
        const prediction = partyForm.hostPrediction.value;
        const welcomeMessage = window.getWelcomeMessage ? window.getWelcomeMessage() : '';
        console.log('Creating party:', { partyName, prediction, welcomeMessage, roomId, adminToken });
        
        const partyData = {
          partyName,
          prediction,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Only add welcomeMessage if it exists
        if (welcomeMessage) {
          partyData.welcomeMessage = welcomeMessage;
        }
        
        await db.ref(`parties/${roomId}/info`).set(partyData);
        await db.ref(`parties/${roomId}/adminToken`).set(adminToken);
        
        // Cache admin token immediately for smooth party owner experience
        localStorage.setItem(`admin_${roomId}`, adminToken);
        
        // Mark as party owner in session storage to prevent loading flash
        sessionStorage.setItem('isPartyOwner', 'true');
        
        // Redirect directly to admin mode for smooth flow
        const adminUrl = `${window.location.origin}/vote.html?roomId=${roomId}&adminToken=${adminToken}`;
        window.location.href = adminUrl;
        
        console.log('Redirecting to admin mode');
      } catch (err) {
        console.error('Error creating party:', err);
        if (partyError) {
          partyError.textContent = 'Error creating party. Please try again.';
        }
      }
    });
  }

  // Expose a resetWizard function for the modal to call
  window.resetWizard = function() {
    // Reset all wizard steps and fields
    const wizardStep1 = document.getElementById('wizardStep1');
    const wizardStep2 = document.getElementById('wizardStep2');
    const wizardStep3 = document.getElementById('wizardStep3');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const partyNameError = document.getElementById('partyNameError');
    const predictionError = document.getElementById('predictionError');
    if (wizardStep1 && wizardStep2 && wizardStep3) {
      wizardStep1.classList.remove('hidden');
      wizardStep2.classList.add('hidden');
      wizardStep3.classList.add('hidden');
    }
    if (step1 && step2 && step3) {
      step1.classList.add('step-active');
      step2.classList.remove('step-active');
      step3.classList.remove('step-active');
      step1.classList.remove('step');
      step2.classList.add('step');
      step3.classList.add('step');
    }
    if (partyNameInput) partyNameInput.value = '';
    if (partyNameError) partyNameError.textContent = '';
    if (predictionError) predictionError.textContent = '';
    const predInputs = document.querySelectorAll('input[name="hostPrediction"]');
    predInputs.forEach(input => { input.checked = false; });
    const reviewPartyName = document.getElementById('reviewPartyName');
    const reviewPrediction = document.getElementById('reviewPrediction');
    if (reviewPartyName) reviewPartyName.textContent = '';
    if (reviewPrediction) reviewPrediction.textContent = '';
  };

  // If roomId is present, show guest name input UI
  if (roomId) {
    landingPage.classList.add('hidden');
    // Firebase is already initialized at the top level
    if (typeof firebase === 'undefined') {
      console.error('Firebase is not loaded');
      return;
    }
    
    // Wait for Firebase to be properly initialized
    if (window.firebaseInitPromise) {
      await window.firebaseInitPromise;
    } else {
      // Fallback: wait for Firebase to be ready
      let attempts = 0;
      while (!firebase.apps.length && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!firebase.apps.length) {
        console.error('Firebase failed to initialize');
        return;
      }
    }
    
    const db = firebase.database();
    const infoRef = db.ref(`parties/${roomId}`);
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
  // This block is now redundant as the partyForm submit handler handles party creation.
  // Keeping it for now, but it will be removed if the partyForm is always present.
  // if (partyForm) {
  //   partyForm.addEventListener('submit', async (e) => {
  //     e.preventDefault();
  //     if (typeof firebase !== 'undefined') {
  //       const db = firebase.database();
  //       const roomId = db.ref('parties').push().key;
  //       const adminToken = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : Math.random().toString(36).substr(2, 16) + Math.random().toString(36).substr(2, 16);
  //       const partyName = partyNameInput.value.trim();
  //       const prediction = partyForm.hostPrediction.value;
  //       await db.ref(`parties/${roomId}/info`).set({
  //         partyName,
  //         prediction,
  //         createdAt: firebase.database.ServerValue.TIMESTAMP
  //       });
  //       await db.ref(`parties/${roomId}/adminToken`).set(adminToken);
  //       showPartyPanel({ partyName, roomId, adminToken });
  //     }
  //   });
  // }
}); 