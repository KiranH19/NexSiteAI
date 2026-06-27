// js/chat.js - WhatsApp-style chat builder state machine

document.addEventListener('DOMContentLoaded', () => {

  // ── DOM refs ───────────────────────────────────────────────────────────────
  const chatMessages  = document.getElementById('chat-messages');
  const chatForm      = document.getElementById('chat-form');
  const chatInput     = document.getElementById('chat-input');
  const sendBtn       = document.getElementById('send-btn');
  const typingDots    = document.getElementById('typing-indicator');
  const previewBtn    = document.getElementById('preview-btn');
  const progressFill  = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');

  // ── Conversation state ─────────────────────────────────────────────────────
  const businessData = {};
  let currentStep    = 0;
  let isProcessing   = false;

  // ── Conversation steps ─────────────────────────────────────────────────────
  const STEPS = [
    {
      key:         'businessName',
      botMsg:      "👋 Welcome to **NexSite**! I'll help you build a professional website in minutes.\n\nLet's start — what's your **business name**?",
      placeholder: 'e.g. Ravi\'s Dental Clinic',
      validate:    v => v.length >= 2 ? null : 'Business name must be at least 2 characters',
    },
    {
      key:         'category',
      botMsg:      "Great name! 🎉 What **category** does your business fall under?\n\n*(e.g. Dental Clinic, Coaching Centre, Gym, Restaurant, Agency)*",
      placeholder: 'e.g. Dental Clinic',
      validate:    v => v.length >= 2 ? null : 'Please enter a valid category',
    },
    {
      key:         'description',
      botMsg:      "Perfect. Now give me a **brief description** of your business.\n\nWhat makes you special? What do you offer?",
      placeholder: 'e.g. We are a modern dental clinic providing painless treatments...',
      validate:    v => v.length >= 10 ? null : 'Please write at least 10 characters',
    },
    {
      key:         'services',
      botMsg:      "Awesome! List your main **services** (comma-separated).\n\nExample: *Root Canal, Teeth Whitening, Braces, Implants*",
      placeholder: 'e.g. Consultation, X-Ray, Cleaning, Surgery',
      validate:    v => v.length >= 3 ? null : 'Please list at least one service',
    },
    {
      key:         'phone',
      botMsg:      "📞 What's your **WhatsApp/phone number**? This will be on your website for customers to reach you.",
      placeholder: 'e.g. +91 98765 43210',
      validate:    v => /^[+\d\s\-()]{7,}$/.test(v) ? null : 'Please enter a valid phone number',
    },
    {
      key:         'email',
      botMsg:      "📧 Your **email address**? (optional, press Enter to skip)",
      placeholder: 'e.g. info@yourbusiness.com (optional)',
      validate:    v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Please enter a valid email or leave blank',
      optional:    true
    },
    {
      key:         'address',
      botMsg:      "📍 What's your **business address**?",
      placeholder: 'e.g. 12, MG Road, Dharwad, Karnataka 580001',
      validate:    v => v.length >= 5 ? null : 'Please enter a valid address',
    },
    {
      key:         'designStyle',
      botMsg:      "🎨 What **design style** do you prefer for your website?\n\n*Modern / Classic / Bold / Minimal / Elegant*",
      placeholder: 'e.g. Modern',
      validate:    v => v.length >= 2 ? null : 'Please choose a style',
      quickReplies: ['Modern', 'Classic', 'Bold', 'Minimal', 'Elegant']
    },
    {
      key:         'logoUrl',
      botMsg:      "🖼️ Do you have a **logo URL**? (optional, press Enter to skip)\n\nYou can paste a direct image link here.",
      placeholder: 'https://... (optional)',
      validate:    () => null,
      optional:    true
    }
  ];

  const TOTAL_STEPS = STEPS.length;

  // ── Initialize chat ────────────────────────────────────────────────────────
  function init() {
    setTimeout(() => sendBotMessage(STEPS[0].botMsg, STEPS[0].quickReplies), 800);
    updateProgress();
  }

  // ── Send bot message ───────────────────────────────────────────────────────
  function sendBotMessage(text, quickReplies = null) {
    showTyping();
    const delay = Math.min(text.length * 12 + 400, 1800);

    setTimeout(() => {
      hideTyping();
      const msg = createBotBubble(parseMarkdown(text));
      chatMessages.appendChild(msg);
      if (quickReplies) {
        const qr = createQuickReplies(quickReplies);
        chatMessages.appendChild(qr);
      }
      scrollToBottom();
      chatInput.placeholder = STEPS[currentStep]?.placeholder || 'Type your message...';
      chatInput.focus();
    }, delay);
  }

  // ── Parse simple markdown in bot messages ─────────────────────────────────
  function parseMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  // ── Create bot bubble ──────────────────────────────────────────────────────
  function createBotBubble(html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-row bot-row';
    wrapper.innerHTML = `
      <div class="avatar bot-avatar">🤖</div>
      <div class="msg-bubble bot-bubble">${html}</div>
    `;
    return wrapper;
  }

  // ── Create user bubble ─────────────────────────────────────────────────────
  function createUserBubble(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-row user-row';
    wrapper.innerHTML = `
      <div class="msg-bubble user-bubble">${text}</div>
      <div class="avatar user-avatar">👤</div>
    `;
    return wrapper;
  }

  // ── Quick reply chips ──────────────────────────────────────────────────────
  function createQuickReplies(options) {
    const container = document.createElement('div');
    container.className = 'quick-replies';
    options.forEach(opt => {
      const chip = document.createElement('button');
      chip.className = 'qr-chip';
      chip.textContent = opt;
      chip.addEventListener('click', () => {
        document.querySelectorAll('.quick-replies').forEach(el => el.remove());
        chatInput.value = opt;
        handleUserInput(opt);
      });
      container.appendChild(chip);
    });
    return container;
  }

  // ── Typing indicator ───────────────────────────────────────────────────────
  function showTyping() {
    typingDots.style.display = 'flex';
    scrollToBottom();
  }
  function hideTyping() {
    typingDots.style.display = 'none';
  }

  // ── Scroll chat to bottom ──────────────────────────────────────────────────
  function scrollToBottom() {
    setTimeout(() => { chatMessages.scrollTop = chatMessages.scrollHeight; }, 50);
  }

  // ── Progress bar ───────────────────────────────────────────────────────────
  function updateProgress() {
    const pct = Math.round((currentStep / TOTAL_STEPS) * 100);
    if (progressFill)  progressFill.style.width  = `${pct}%`;
    if (progressLabel) progressLabel.textContent = `Step ${Math.min(currentStep + 1, TOTAL_STEPS)} of ${TOTAL_STEPS}`;
  }

  // ── Handle user input ──────────────────────────────────────────────────────
  function handleUserInput(value) {
    const raw = value.trim();
    if (isProcessing) return;

    const step = STEPS[currentStep];
    if (!step) return;

    // Validate
    const err = step.validate(raw);
    if (err && !(step.optional && raw === '')) {
      showToast(err, 'warning');
      return;
    }

    // Clear input
    chatInput.value = '';
    chatInput.placeholder = 'Typing...';
    document.querySelectorAll('.quick-replies').forEach(el => el.remove());

    // Add user bubble
    const displayVal = raw || '(skipped)';
    chatMessages.appendChild(createUserBubble(displayVal));
    scrollToBottom();

    // Save value
    businessData[step.key] = raw;

    // Advance
    currentStep++;
    updateProgress();

    if (currentStep < TOTAL_STEPS) {
      const next = STEPS[currentStep];
      sendBotMessage(next.botMsg, next.quickReplies);
    } else {
      // All steps done → start generation
      startGeneration();
    }
  }

  // ── Form submission ────────────────────────────────────────────────────────
  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    handleUserInput(chatInput.value);
  });

  // ── Generate website via API ───────────────────────────────────────────────
  async function startGeneration() {
    isProcessing = true;
    sendBtn.disabled = true;
    chatInput.disabled = true;

    // Summary message
    sendBotMessage(`✅ Got everything I need!\n\nHere's a quick summary:\n**Business:** ${businessData.businessName}\n**Category:** ${businessData.category}\n\nNow let me **generate your website** with AI... ⚡`);

    // Show generation loading
    setTimeout(() => {
      showTyping();
      const loadingBubble = document.createElement('div');
      loadingBubble.className = 'msg-row bot-row';
      loadingBubble.id = 'generation-loading';
      loadingBubble.innerHTML = `
        <div class="avatar bot-avatar">🤖</div>
        <div class="msg-bubble bot-bubble generation-progress">
          <div class="gen-steps">
            <div class="gen-step active" id="gs1">🧠 Analysing your business...</div>
            <div class="gen-step" id="gs2">✍️ Writing content with AI...</div>
            <div class="gen-step" id="gs3">🎨 Preparing your template...</div>
            <div class="gen-step" id="gs4">🚀 Almost ready...</div>
          </div>
        </div>
      `;
      chatMessages.appendChild(loadingBubble);
      scrollToBottom();

      // Animate gen steps
      const steps = ['gs2','gs3','gs4'];
      steps.forEach((id, i) => {
        setTimeout(() => {
          document.getElementById(id)?.classList.add('active');
        }, (i + 1) * 1200);
      });
    }, 1000);

    try {
      const result = await API.generate(businessData);

      hideTyping();
      document.getElementById('generation-loading')?.remove();

      // Save to session
      Store.set('sessionId',        result.sessionId);
      Store.set('generatedContent', result.generatedContent);
      Store.set('businessData',     result.businessData);

      // Success message
      sendBotMessage(`🎉 **Your website is ready!**\n\nI've generated professional content for **${businessData.businessName}**.\n\nClick the button below to see your live preview and publish it! 👇`);

      // Show preview button
      setTimeout(() => {
        previewBtn.style.display = 'flex';
        previewBtn.addEventListener('click', () => {
          window.location.href = 'preview.html';
        });
        scrollToBottom();
      }, 1500);

    } catch (err) {
      hideTyping();
      document.getElementById('generation-loading')?.remove();
      console.error('Generation error:', err);
      sendBotMessage(`❌ Oops! Something went wrong: *${err.message}*\n\nPlease try again or check your connection.`);
      sendBtn.disabled  = false;
      chatInput.disabled = false;
      isProcessing = false;
    }
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  init();
});
