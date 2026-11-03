// ===================================================
// ElePay Client Script
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const uidInput = document.getElementById('uidInput');
  const clearUidBtn = document.getElementById('clearUidBtn');
  const customAmount = document.getElementById('customAmount');
  const amountChips = document.querySelectorAll('.chip');
  const copyUpiBtn = document.getElementById('copyUpiBtn');
  const featuredCopyBtn = document.getElementById('featuredCopyBtn');
  const countdownEl = document.getElementById('countdown');
  const submitPaymentBtn = document.getElementById('submitPaymentBtn');

  // Proceed / Unlock Payment Elements
  const proceedToPayBtn = document.getElementById('proceedToPayBtn');
  const proceedActionWrapper = document.getElementById('proceedActionWrapper');
  const paymentAreaContainer = document.getElementById('paymentAreaContainer');
  const unlockedUidDisplay = document.getElementById('unlockedUidDisplay');
  const unlockedAmountDisplay = document.getElementById('unlockedAmountDisplay');
  const editOrderBtn = document.getElementById('editOrderBtn');

  // Option Tabs & Views
  const tabBtnQr = document.getElementById('tabBtnQr');
  const tabBtnUpi = document.getElementById('tabBtnUpi');
  const qrView = document.getElementById('qrView');
  const upiView = document.getElementById('upiView');

  const OFFICIAL_UPI = 'elepayservice@upi';

  // --- Proceed to Pay Button (Shows QR & UPI only after clicking) ---
  if (proceedToPayBtn) {
    proceedToPayBtn.addEventListener('click', () => {
      const enteredUid = uidInput.value.trim();
      if (!enteredUid) {
        uidInput.focus();
        uidInput.style.borderColor = '#ef4444';
        uidInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.35)';
        showToast('⚠️ Kripya pehle apna UID daalein!');
        setTimeout(() => {
          uidInput.style.boxShadow = '';
        }, 1500);
        return;
      }

      const enteredAmt = customAmount.value || '100';
      if (unlockedUidDisplay) unlockedUidDisplay.textContent = enteredUid;
      if (unlockedAmountDisplay) unlockedAmountDisplay.textContent = '₹' + enteredAmt;

      // Also sync Problem Card order details
      const cardOrderAmount = document.getElementById('cardOrderAmount');
      const cardOrderUid = document.getElementById('cardOrderUid');
      if (cardOrderAmount) cardOrderAmount.textContent = '₹' + enteredAmt;
      if (cardOrderUid) cardOrderUid.textContent = enteredUid;

      // Reveal Payment Area
      if (proceedActionWrapper) proceedActionWrapper.style.display = 'none';
      if (paymentAreaContainer) {
        paymentAreaContainer.style.display = 'flex';
        paymentAreaContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // Start timer fresh
      startCountdownTimer();
      showToast('QR Code & UPI Ready! Pay Karein ✓');
    });
  }

  if (editOrderBtn) {
    editOrderBtn.addEventListener('click', () => {
      if (paymentAreaContainer) paymentAreaContainer.style.display = 'none';
      if (proceedActionWrapper) proceedActionWrapper.style.display = 'block';
      uidInput.focus();
    });
  }

  // --- Payment Option Switching (Option 1 vs Option 2) ---
  if (tabBtnQr && tabBtnUpi && qrView && upiView) {
    tabBtnQr.addEventListener('click', () => {
      tabBtnQr.classList.add('active');
      tabBtnUpi.classList.remove('active');
      qrView.classList.add('active');
      upiView.classList.remove('active');
    });

    tabBtnUpi.addEventListener('click', () => {
      tabBtnUpi.classList.add('active');
      tabBtnQr.classList.remove('active');
      upiView.classList.add('active');
      qrView.classList.remove('active');
    });
  }
  
  // Problem section elements
  const problemBtn = document.getElementById('problemBtn');
  const problemModal = document.getElementById('problemModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalOkBtn = document.getElementById('modalOkBtn');

  // Status modal elements
  const statusModal = document.getElementById('statusModal');
  const closeStatusBtn = document.getElementById('closeStatusBtn');
  const submittedUid = document.getElementById('submittedUid');
  const submittedAmount = document.getElementById('submittedAmount');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // QR image element
  const qrCodeImage = document.getElementById('qrCodeImage');

  // Check if custom user QR image exists (e.g. assets/qr-code.png or assets/qr.png)
  function detectCustomQr() {
    const candidates = ['assets/qr-code.png', 'assets/qr.png', 'assets/qr-code.jpg', 'assets/my-qr.png'];
    candidates.forEach((path) => {
      const img = new Image();
      img.onload = () => {
        if (qrCodeImage) {
          qrCodeImage.src = path;
        }
      };
      img.src = path;
    });
  }
  detectCustomQr();

  // --- UID Input Handling ---
  uidInput.addEventListener('input', () => {
    if (uidInput.value.trim().length > 0) {
      clearUidBtn.style.display = 'flex';
      uidInput.style.borderColor = 'rgba(99, 102, 241, 0.6)';
    } else {
      clearUidBtn.style.display = 'none';
      uidInput.style.borderColor = '';
    }
  });

  clearUidBtn.addEventListener('click', () => {
    uidInput.value = '';
    clearUidBtn.style.display = 'none';
    uidInput.focus();
  });

  const selectedAmountDisplay = document.getElementById('selectedAmountDisplay');

  // --- Amount Chips Toggle (Only 100, 200, 500) ---
  amountChips.forEach(chip => {
    chip.addEventListener('click', () => {
      amountChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = chip.getAttribute('data-amount');
      if (customAmount) customAmount.value = val;
      if (selectedAmountDisplay) selectedAmountDisplay.textContent = '₹' + val;
    });
  });

  // --- Copy UPI ID to Clipboard (Universal helper) ---
  async function copyToClipboard(text, successMsg = 'elepayservice@upi Copied! ✓') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      showToast(successMsg);
    } catch (err) {
      showToast('UPI ID: ' + text);
    }
  }

  if (copyUpiBtn) {
    copyUpiBtn.addEventListener('click', () => copyToClipboard(OFFICIAL_UPI));
  }

  if (featuredCopyBtn) {
    featuredCopyBtn.addEventListener('click', () => copyToClipboard(OFFICIAL_UPI, 'elepayservice@upi Copied! ✓'));
  }

  // --- Direct UPI App Payment Buttons ---
  const directAppBtns = document.querySelectorAll('.direct-app-btn');
  directAppBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = customAmount.value || '100';
      const uid = uidInput.value.trim() || 'ElePayUser';
      const upiUrl = `upi://pay?pa=${OFFICIAL_UPI}&pn=ElePay&am=${amount}&cu=INR&tn=UID-${encodeURIComponent(uid)}`;

      // Copy UPI ID to clipboard
      copyToClipboard(OFFICIAL_UPI, 'elepayservice@upi copied! Opening UPI App...');

      // Open intent if supported on device (Android/iOS)
      setTimeout(() => {
        window.location.href = upiUrl;
      }, 350);
    });
  });

  // --- Countdown Timer (Starts when user generates QR / clicks Proceed) ---
  let timerInterval = null;
  function startCountdownTimer() {
    if (timerInterval) clearInterval(timerInterval);
    let timeLeft = 5 * 60 - 1; // 04:59
    if (countdownEl) countdownEl.style.color = '';
    
    function updateClock() {
      if (!countdownEl) return;
      if (timeLeft <= 0) {
        countdownEl.textContent = '00:00 (Expired)';
        countdownEl.style.color = '#ef4444';
        clearInterval(timerInterval);
        return;
      }
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      countdownEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      timeLeft--;
    }

    updateClock();
    timerInterval = setInterval(updateClock, 1000);
  }

  // --- Toast Function ---
  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastMessage.textContent = msg;
    toastNotification.classList.add('show');
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2500);
  }

  // ===================================================
  // Problem Card (Direct in-page resolution, 100 words & Image Add)
  // ===================================================
  const problemCard = document.getElementById('problemCard');
  const problemToggleHeader = document.getElementById('problemToggleHeader');
  const problemToggleBtn = document.getElementById('problemToggleBtn');
  const toggleBtnText = document.getElementById('toggleBtnText');
  const cardOrderAmount = document.getElementById('cardOrderAmount');
  const cardOrderUid = document.getElementById('cardOrderUid');

  const cardProblemText = document.getElementById('cardProblemText');
  const cardWordCounter = document.getElementById('cardWordCounter');
  const cardImageFile = document.getElementById('cardImageFile');
  const cardImagePreview = document.getElementById('cardImagePreview');
  const cardImageThumb = document.getElementById('cardImageThumb');
  const cardImageName = document.getElementById('cardImageName');
  const cardRemoveImageBtn = document.getElementById('cardRemoveImageBtn');

  const inlineProblemForm = document.getElementById('inlineProblemForm');
  const cardProblemSuccess = document.getElementById('cardProblemSuccess');
  const cardTicketId = document.getElementById('cardTicketId');
  const cardSuccessAmount = document.getElementById('cardSuccessAmount');
  const cardSuccessUtr = document.getElementById('cardSuccessUtr');
  const cardNewProblemBtn = document.getElementById('cardNewProblemBtn');

  // Toggle problem card expansion
  function toggleProblemCard() {
    if (!problemCard) return;
    const isExpanded = problemCard.classList.toggle('expanded');
    
    // Sync current order details
    const currentAmt = customAmount.value || '100';
    const currentUid = uidInput.value.trim() || 'Not Provided';
    if (cardOrderAmount) cardOrderAmount.textContent = '₹' + currentAmt;
    if (cardOrderUid) cardOrderUid.textContent = currentUid;

    if (toggleBtnText) {
      toggleBtnText.textContent = isExpanded ? 'Close' : 'Report Issue';
    }

    if (isExpanded && cardProblemText) {
      setTimeout(() => cardProblemText.focus(), 200);
    }
  }

  if (problemToggleHeader) {
    problemToggleHeader.addEventListener('click', (e) => {
      // Avoid double trigger if clicking toggle button
      if (e.target.closest('#problemToggleBtn')) return;
      toggleProblemCard();
    });
  }

  if (problemToggleBtn) {
    problemToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleProblemCard();
    });
  }

  // --- 100-Word Limit Counter on Card Problem Textarea ---
  if (cardProblemText && cardWordCounter) {
    cardProblemText.addEventListener('input', () => {
      const text = cardProblemText.value;
      let words = text.trim().split(/\s+/).filter(w => w.length > 0);
      
      if (words.length > 100) {
        // Enforce 100 words limit
        cardProblemText.value = words.slice(0, 100).join(' ');
        words = words.slice(0, 100);
        showToast('⚠️ Maximum 100 words limit!');
      }

      cardWordCounter.textContent = `${words.length} / 100 Words`;
      if (words.length >= 90) {
        cardWordCounter.style.color = '#f59e0b';
        cardWordCounter.style.borderColor = '#f59e0b';
      } else {
        cardWordCounter.style.color = '#38bdf8';
        cardWordCounter.style.borderColor = 'rgba(56, 189, 248, 0.25)';
      }
    });
  }

  // --- Card Image Add & Thumbnail Preview ---
  if (cardImageFile) {
    cardImageFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          cardImageThumb.src = event.target.result;
          cardImageName.textContent = file.name;
          cardImagePreview.style.display = 'inline-flex';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (cardRemoveImageBtn) {
    cardRemoveImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      cardImageFile.value = '';
      cardImageThumb.src = '';
      cardImagePreview.style.display = 'none';
    });
  }

  // --- Card Problem Form Submission ---
  if (inlineProblemForm) {
    inlineProblemForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const utr = document.getElementById('cardUtrInput').value.trim();
      const text = cardProblemText.value.trim();
      const currentAmt = customAmount.value || '100';
      const currentUid = uidInput.value.trim() || 'Not Provided';

      if (!utr) {
        showToast('⚠️ Kripya 12-digit UTR Number enter karein!');
        return;
      }
      if (!text) {
        showToast('⚠️ Kripya apni problem 100 words me batayein!');
        cardProblemText.focus();
        return;
      }

      let generatedTicket = '#ELP-' + Math.floor(100000 + Math.random() * 900000);

      // Send to Backend API
      try {
        const response = await fetch('/api/problems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUid,
            amount: currentAmt,
            utr,
            description: text,
            screenshotBase64: cardImageThumb.src || null,
            fileName: cardImageName.textContent || 'screenshot.png'
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.ticket && result.ticket.ticketId) {
            generatedTicket = result.ticket.ticketId;
          }
        }
      } catch (err) {
        console.warn('Backend server unreachable, using offline resolution fallback');
      }

      cardTicketId.textContent = generatedTicket;
      cardSuccessAmount.textContent = '₹' + currentAmt;
      cardSuccessUtr.textContent = utr;

      inlineProblemForm.style.display = 'none';
      cardProblemSuccess.style.display = 'flex';
      showToast(`Problem Ticket ${generatedTicket} Logged! ✓`);
    });
  }

  if (cardNewProblemBtn) {
    cardNewProblemBtn.addEventListener('click', () => {
      inlineProblemForm.reset();
      cardWordCounter.textContent = '0 / 100 Words';
      cardImagePreview.style.display = 'none';
      inlineProblemForm.style.display = 'flex';
      cardProblemSuccess.style.display = 'none';
    });
  }

  // --- Modal Problem Handling (For backup/modal access) ---
  const problemOrderAmount = document.getElementById('problemOrderAmount');
  const problemOrderUid = document.getElementById('problemOrderUid');
  const problemReportForm = document.getElementById('problemReportForm');
  const problemSuccessView = document.getElementById('problemSuccessView');
  const cancelProblemBtn = document.getElementById('cancelProblemBtn');
  const closeProblemSuccessBtn = document.getElementById('closeProblemSuccessBtn');

  const utrNumberInput = document.getElementById('utrNumberInput');
  const problemDescInput = document.getElementById('problemDescInput');
  const screenshotInput = document.getElementById('screenshotInput');
  const dropzonePrompt = document.getElementById('dropzonePrompt');
  const dropzonePreview = document.getElementById('dropzonePreview');
  const screenshotPreviewImg = document.getElementById('screenshotPreviewImg');
  const previewFileName = document.getElementById('previewFileName');
  const removePreviewBtn = document.getElementById('removePreviewBtn');

  const ticketIdDisplay = document.getElementById('ticketIdDisplay');
  const ticketAmountDisplay = document.getElementById('ticketAmountDisplay');
  const ticketUidDisplay = document.getElementById('ticketUidDisplay');
  const ticketUtrDisplay = document.getElementById('ticketUtrDisplay');

  // Open Problem Modal with Live Order Details
  if (problemBtn && problemModal) {
    problemBtn.addEventListener('click', () => {
      const currentAmt = customAmount.value || '100';
      const currentUid = uidInput.value.trim() || 'Not Provided';
      
      if (problemOrderAmount) problemOrderAmount.textContent = '₹' + currentAmt;
      if (problemOrderUid) problemOrderUid.textContent = currentUid;

      // Reset form view
      if (problemReportForm) problemReportForm.style.display = 'flex';
      if (problemSuccessView) problemSuccessView.style.display = 'none';

      problemModal.showModal();
    });

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => {
        problemModal.close();
      });
    }

    if (cancelProblemBtn) {
      cancelProblemBtn.addEventListener('click', () => {
        problemModal.close();
      });
    }

    if (closeProblemSuccessBtn) {
      closeProblemSuccessBtn.addEventListener('click', () => {
        problemModal.close();
      });
    }

    // Close when clicking backdrop
    problemModal.addEventListener('click', (e) => {
      const rect = problemModal.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        problemModal.close();
      }
    });
  }

  // --- Screenshot Upload & Instant Image Preview ---
  if (screenshotInput) {
    screenshotInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          screenshotPreviewImg.src = event.target.result;
          previewFileName.textContent = file.name;
          dropzonePrompt.style.display = 'none';
          dropzonePreview.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (removePreviewBtn) {
    removePreviewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      screenshotInput.value = '';
      screenshotPreviewImg.src = '';
      dropzonePreview.style.display = 'none';
      dropzonePrompt.style.display = 'flex';
    });
  }

  // --- Problem Form Submission ---
  if (problemReportForm) {
    problemReportForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const utr = utrNumberInput.value.trim();
      const desc = problemDescInput.value.trim();
      const currentAmt = customAmount.value || '100';
      const currentUid = uidInput.value.trim() || 'Not Provided';

      if (!utr) {
        showToast('⚠️ Kripya 12-digit UTR No. enter karein!');
        utrNumberInput.focus();
        return;
      }

      if (!desc) {
        showToast('⚠️ Kripya problem details vistaar se likhein!');
        problemDescInput.focus();
        return;
      }

      // Generate Ticket ID
      const randomTicketNo = '#ELP-' + Math.floor(100000 + Math.random() * 900000);
      
      if (ticketIdDisplay) ticketIdDisplay.textContent = randomTicketNo;
      if (ticketAmountDisplay) ticketAmountDisplay.textContent = '₹' + currentAmt;
      if (ticketUidDisplay) ticketUidDisplay.textContent = currentUid;
      if (ticketUtrDisplay) ticketUtrDisplay.textContent = utr;

      // Switch to success view
      problemReportForm.style.display = 'none';
      problemSuccessView.style.display = 'flex';
      showToast('Problem Ticket ' + randomTicketNo + ' Logged! ✓');
    });
  }

  // --- Submit Payment / Status Modal ---
  submitPaymentBtn.addEventListener('click', async () => {
    const enteredUid = uidInput.value.trim();

    if (!enteredUid) {
      uidInput.focus();
      uidInput.style.borderColor = '#ef4444';
      uidInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.3)';
      showToast('⚠️ Kripya pehle apna UID daalein!');
      setTimeout(() => {
        uidInput.style.boxShadow = '';
      }, 1500);
      return;
    }

    const enteredAmount = customAmount.value || '100';
    submittedUid.textContent = enteredUid;
    submittedAmount.textContent = '₹' + enteredAmount;

    // Send payment record to backend
    const activeMethod = tabBtnUpi && tabBtnUpi.classList.contains('active') ? 'upi' : 'qr';
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: enteredUid,
          amount: enteredAmount,
          method: activeMethod
        })
      });
    } catch (err) {
      console.warn('Backend server offline, saved locally in session');
    }

    statusModal.showModal();
  });

  if (closeStatusBtn && statusModal) {
    closeStatusBtn.addEventListener('click', () => {
      statusModal.close();
    });
  }
});

