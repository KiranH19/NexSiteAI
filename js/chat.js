/**
 * NexSite - Chatbot State Machine
 * Guides the user through a series of inputs to gather business details for AI generation.
 */

const questions = [
  { key: 'name', prompt: "Welcome to NexSite! Let's build your custom website. First, what is your official <b>Business Name</b>?" },
  { key: 'category', prompt: "Great! What <b>Category</b> best describes your business? (e.g., Coaching, Clinic, Gym, Restaurant, Corporate Agency)" },
  { key: 'description', prompt: "Perfect. Please write a short <b>Description</b> of your business. What products/services do you offer and what makes you unique?" },
  { key: 'services', prompt: "What are your primary <b>Services</b>? (Please list them separated by commas, e.g. Standard Consultation, Premium Strategy, SEO Auditing)" },
  { key: 'phone', prompt: "What <b>Phone Number</b> should customers use to call or WhatsApp you?" },
  { key: 'email', prompt: "What is the official <b>Email Address</b> for inquiries?" },
  { key: 'address', prompt: "What is your physical <b>Business Address</b>? (If you operate online only, type 'Online')" },
  { key: 'designStyle', prompt: "What <b>Design Vibe</b> do you prefer? (e.g. Modern, Minimal, Dark, Vibrant, Elegant)" },
  { key: 'logoUrl', prompt: "Lastly, if you have a <b>Logo URL</b> or image link, paste it below. Otherwise, just type 'None'." }
];

let currentStep = 0;
const collectedData = {};

const chatThread = document.getElementById('chat-thread');
const messageInput = document.getElementById('message-input');
const chatForm = document.getElementById('chat-form');

// Trigger start on load
window.onload = function() {
  // Pre-fill selected plan if in query params
  const urlParams = new URLSearchParams(window.location.search);
  const plan = urlParams.get('plan');
  if (plan) collectedData.plan = plan;

  initBot();
};

async function initBot() {
  await showBotTyping(1200);
  addBotMessage(questions[0].prompt);
}

/**
 * Handle sending a response message
 */
async function handleSend(event) {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  messageInput.value = '';
  addUserMessage(text);

  // Store data
  const currentKey = questions[currentStep].key;
  collectedData[currentKey] = text.toLowerCase() === 'none' ? '' : text;

  currentStep++;

  if (currentStep < questions.length) {
    // Show next question
    await showBotTyping(1000);
    addBotMessage(questions[currentStep].prompt);
  } else {
    // Start AI Generation
    await triggerAiGeneration();
  }
}

/**
 * Sends collected details to Grok API via express backend
 */
async function triggerAiGeneration() {
  await showBotTyping(1500);
  addBotMessage("Excellent! I have gathered all your details. Now, I am connecting to Grok AI to draft your copywriting, FAQ sheets, and service outlines. This might take 10-15 seconds. Please do not close this page...");

  // Add a persistent loader bubble
  const loader = addLoadingBubble();

  try {
    const response = await API.generateWebsite(collectedData);
    loader.remove();

    await showBotTyping(1000);
    addBotMessage("🎉 <b>Success!</b> Grok AI has successfully designed and generated your website copy and sections.");
    
    // Save session in localStorage as backup
    localStorage.setItem('nexsite_session_id', response.sessionId);
    localStorage.setItem('nexsite_session_data', JSON.stringify(response.generatedContent));
    localStorage.setItem('nexsite_business_meta', JSON.stringify(collectedData));

    await showBotTyping(800);
    
    // Add custom preview call-to-action button
    addLinkActionBubble("Preview & Launch Your Site", `preview.html?session_id=${response.sessionId}`);

  } catch (error) {
    loader.remove();
    console.error('Error during AI generation:', error);
    await showBotTyping(1000);
    addBotMessage("⚠️ <b>Generation failed.</b> We hit a server error or rate-limiting block. Let's try again in a few seconds.");
    
    // Retry Option
    addRetryButton();
  }
}

/* --- UI Render Helpers --- */

function addBotMessage(text) {
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble incoming';
  bubble.innerHTML = text;
  
  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = getFormattedTime();
  bubble.appendChild(time);
  
  chatThread.appendChild(bubble);
  scrollToBottom();
}

function addUserMessage(text) {
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble outgoing';
  bubble.textContent = text;
  
  const time = document.createElement('span');
  time.className = 'message-time';
  time.textContent = getFormattedTime();
  bubble.appendChild(time);
  
  chatThread.appendChild(bubble);
  scrollToBottom();
}

function addLoadingBubble() {
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble incoming';
  bubble.style.display = 'flex';
  bubble.style.alignItems = 'center';
  bubble.style.gap = '10px';
  bubble.innerHTML = `
    <ion-icon name="sync-outline" style="animation: spin 1s linear infinite; font-size: 1.2rem;"></ion-icon>
    <span>Generating website structure...</span>
  `;
  
  // Style injection for spinning
  if (!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.innerHTML = '@keyframes spin { 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  chatThread.appendChild(bubble);
  scrollToBottom();
  return bubble;
}

function addLinkActionBubble(text, url) {
  const container = document.createElement('div');
  container.style.alignSelf = 'flex-start';
  container.style.marginTop = '8px';
  container.innerHTML = `
    <a href="${url}" class="btn btn-wa" style="text-decoration:none; padding: 12px 24px; box-shadow: 0 4px 10px rgba(0,168,132,0.2);">
      <ion-icon name="eye-outline"></ion-icon> ${text}
    </a>
  `;
  chatThread.appendChild(container);
  scrollToBottom();
}

function addRetryButton() {
  const container = document.createElement('div');
  container.style.alignSelf = 'flex-start';
  container.style.marginTop = '8px';
  
  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary';
  btn.innerHTML = `<ion-icon name="refresh-outline"></ion-icon> Retry AI Generation`;
  btn.onclick = () => {
    container.remove();
    triggerAiGeneration();
  };
  
  container.appendChild(btn);
  chatThread.appendChild(container);
  scrollToBottom();
}

function showBotTyping(duration) {
  return new Promise((resolve) => {
    // Add typing bubble
    const typingBubble = document.createElement('div');
    typingBubble.className = 'message-bubble incoming typing-bubble';
    typingBubble.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    chatThread.appendChild(typingBubble);
    scrollToBottom();

    setTimeout(() => {
      typingBubble.remove();
      resolve();
    }, duration);
  });
}

function getFormattedTime() {
  const now = new Date();
  let hrs = now.getHours();
  let mins = now.getMinutes();
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12; // 12 instead of 0
  mins = mins < 10 ? '0' + mins : mins;
  return `${hrs}:${mins} ${ampm}`;
}

function scrollToBottom() {
  chatThread.scrollTop = chatThread.scrollHeight;
}
