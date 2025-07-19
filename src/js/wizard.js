// js/wizard.js - Step-by-step wizard for landing page

document.addEventListener('DOMContentLoaded', () => {
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const step4 = document.getElementById('step4');
  const wizardStep1 = document.getElementById('wizardStep1');
  const wizardStep2 = document.getElementById('wizardStep2');
  const wizardStep3 = document.getElementById('wizardStep3');
  const wizardStep4 = document.getElementById('wizardStep4');
  const toStep2Btn = document.getElementById('toStep2Btn');
  const toStep3Btn = document.getElementById('toStep3Btn');
  const toStep4Btn = document.getElementById('toStep4Btn');
  const backToStep1Btn = document.getElementById('backToStep1Btn');
  const backToStep2Btn = document.getElementById('backToStep2Btn');
  const backToStep3Btn = document.getElementById('backToStep3Btn');
  const partyNameInput = document.getElementById('partyName');
  const partyNameError = document.getElementById('partyNameError');
  const predictionError = document.getElementById('predictionError');
  const welcomeError = document.getElementById('welcomeError');
  const reviewPartyName = document.getElementById('reviewPartyName');
  const reviewPrediction = document.getElementById('reviewPrediction');
  const reviewWelcomeMessage = document.getElementById('reviewWelcomeMessage');
  const reviewWelcomeText = document.getElementById('reviewWelcomeText');
  const welcomeMessageContainer = document.getElementById('welcomeMessageContainer');
  const welcomeMessageInput = document.getElementById('welcomeMessage');
  const charCount = document.getElementById('charCount');
  let partyName = '';
  let prediction = '';
  let welcomeMessage = '';

  function goToStep(step) {
    [wizardStep1, wizardStep2, wizardStep3, wizardStep4].forEach((el, i) => {
      el.classList.toggle('hidden', i !== step - 1);
    });
    [step1, step2, step3, step4].forEach((el, i) => {
      el.classList.toggle('step-active', i === step - 1);
      el.classList.toggle('step', i !== step - 1);
    });
  }

  toStep2Btn.addEventListener('click', () => {
    partyName = partyNameInput.value.trim();
    if (!partyName) {
      partyNameError.textContent = 'Please enter a party name!';
      partyNameInput.classList.add('border-red-500');
      return;
    }
    partyNameError.textContent = '';
    partyNameInput.classList.remove('border-red-500');
    goToStep(2);
  });

  toStep3Btn.addEventListener('click', () => {
    const pred = document.querySelector('input[name="hostPrediction"]:checked');
    if (!pred) {
      predictionError.textContent = 'Please select a prediction!';
      return;
    }
    prediction = pred.value;
    predictionError.textContent = '';
    goToStep(3);
  });

  // Welcome message step logic
  toStep4Btn.addEventListener('click', () => {
    const includeWelcome = document.querySelector('input[name="includeWelcome"]:checked');
    if (!includeWelcome) {
      welcomeError.textContent = 'Please select yes or no for the welcome message.';
      return;
    }
    
    if (includeWelcome.value === 'yes') {
      welcomeMessage = welcomeMessageInput.value.trim();
      if (!welcomeMessage) {
        welcomeError.textContent = 'Please enter a welcome message or select "No".';
        return;
      }
    } else {
      welcomeMessage = '';
    }
    
    welcomeError.textContent = '';
    
    // Update review section
    reviewPartyName.textContent = partyName;
    reviewPrediction.innerHTML = prediction === 'boy' ? '<span class="text-blue-500 font-bold">Boy 💙</span>' : '<span class="text-pink-500 font-bold">Girl 💖</span>';
    
    if (welcomeMessage) {
      reviewWelcomeMessage.classList.remove('hidden');
      reviewWelcomeText.textContent = welcomeMessage.length > 50 ? welcomeMessage.substring(0, 50) + '...' : welcomeMessage;
    } else {
      reviewWelcomeMessage.classList.add('hidden');
    }
    
    console.log('Ready for submit, partyName:', partyName, 'prediction:', prediction, 'welcomeMessage:', welcomeMessage);
    goToStep(4);
  });

  // Character count for welcome message
  if (welcomeMessageInput && charCount) {
    welcomeMessageInput.addEventListener('input', () => {
      const count = welcomeMessageInput.value.length;
      charCount.textContent = count;
      charCount.style.color = count > 280 ? '#dc2626' : count > 250 ? '#f59e0b' : '#6b7280';
    });
  }

  // Show/hide welcome message textarea based on radio selection
  const includeWelcomeRadios = document.querySelectorAll('input[name="includeWelcome"]');
  includeWelcomeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'yes' && radio.checked) {
        welcomeMessageContainer.classList.remove('hidden');
        welcomeMessageInput.focus();
      } else if (radio.value === 'no' && radio.checked) {
        welcomeMessageContainer.classList.add('hidden');
        welcomeMessageInput.value = '';
        charCount.textContent = '0';
      }
    });
  });

  // Back buttons
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener('click', () => {
      goToStep(1);
    });
  }
  if (backToStep2Btn) {
    backToStep2Btn.addEventListener('click', () => {
      goToStep(2);
    });
  }
  if (backToStep3Btn) {
    backToStep3Btn.addEventListener('click', () => {
      goToStep(3);
    });
  }

  // Expose welcome message to global scope for app.js
  window.getWelcomeMessage = () => welcomeMessage;

  // Debug: log before form submit
  const partyForm = document.getElementById('partyForm');
  if (partyForm) {
    partyForm.addEventListener('submit', () => {
      console.log('[WIZARD] Form submit triggered, partyName:', partyNameInput.value, 'prediction:', document.querySelector('input[name="hostPrediction"]:checked')?.value, 'welcomeMessage:', welcomeMessage);
    });
  }
}); 