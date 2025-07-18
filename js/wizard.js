// js/wizard.js - Step-by-step wizard for landing page

document.addEventListener('DOMContentLoaded', () => {
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  const wizardStep1 = document.getElementById('wizardStep1');
  const wizardStep2 = document.getElementById('wizardStep2');
  const wizardStep3 = document.getElementById('wizardStep3');
  const toStep2Btn = document.getElementById('toStep2Btn');
  const toStep3Btn = document.getElementById('toStep3Btn');
  const backToStep1Btn = document.getElementById('backToStep1Btn');
  const backToStep2Btn = document.getElementById('backToStep2Btn');
  const partyNameInput = document.getElementById('partyName');
  const partyNameError = document.getElementById('partyNameError');
  const predictionError = document.getElementById('predictionError');
  const reviewPartyName = document.getElementById('reviewPartyName');
  const reviewPrediction = document.getElementById('reviewPrediction');
  const startPartyBtn = document.getElementById('startPartyBtn');
  let partyName = '';
  let prediction = '';

  function goToStep(step) {
    [wizardStep1, wizardStep2, wizardStep3].forEach((el, i) => {
      el.classList.toggle('hidden', i !== step - 1);
    });
    [step1, step2, step3].forEach((el, i) => {
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
    reviewPartyName.textContent = partyName;
    reviewPrediction.innerHTML = prediction === 'boy' ? '<span class="text-blue-500 font-bold">Boy 💙</span>' : '<span class="text-pink-500 font-bold">Girl 💖</span>';
    goToStep(3);
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

  // When Start Party is clicked, let app.js handle the actual creation
  startPartyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    partyNameInput.value = partyName;
    document.querySelector(`input[name="hostPrediction"][value="${prediction}"]`).checked = true;
    // Use native form submission
    document.getElementById('partyForm').submit();
  });
}); 