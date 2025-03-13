import { GoogleGenerativeAI } from "@google/generative-ai";

const chatBubble = document.getElementById("chatBubble");
const chatContainer = document.getElementById("chatContainer");
const closeChat = document.getElementById("closeChat");
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendMessage = document.getElementById("sendMessage");
const stopTyping = document.getElementById("stopTyping");

const API_KEY = "AIzaSyCB_DCF5-ruifp5XovApe_aO4LqjydK5gU";

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let isTyping = false;
let typingInterval = null;
let shouldStopTyping = false;

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;
let requestQueue = [];
let isProcessingQueue = false;
let rateLimitInfoTimeout = null;

chatBubble.addEventListener("click", () => {
  chatContainer.classList.add("open");
  chatBubble.style.display = "none";
});

closeChat.addEventListener("click", () => {
  chatContainer.classList.remove("open");
  setTimeout(() => {
    chatBubble.style.display = "block";
  }, 300);
});

function addUserMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "flex items-start justify-end";

  const messageBubble = document.createElement("div");
  messageBubble.className =
    "bg-blue-600 text-white rounded-lg rounded-tr-none p-3 max-w-xs md:max-w-md shadow-sm message-animation";

  const messageText = document.createElement("p");
  messageText.className = "text-sm";
  messageText.textContent = text;

  messageBubble.appendChild(messageText);
  messageDiv.appendChild(messageBubble);
  chatMessages.appendChild(messageDiv);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "flex items-center justify-center my-2";

  const messageBubble = document.createElement("div");
  messageBubble.className =
    "bg-gray-200 text-gray-600 rounded-lg px-3 py-1 text-xs system-message-animation";
  messageBubble.textContent = text;

  messageDiv.appendChild(messageBubble);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (rateLimitInfoTimeout) {
    clearTimeout(rateLimitInfoTimeout);
  }
  
  rateLimitInfoTimeout = setTimeout(() => {
    messageDiv.classList.add("fade-out");
    setTimeout(() => {
      chatMessages.removeChild(messageDiv);
    }, 500);
  }, 5000);
}

function addAIMessageWithTypingEffect(text) {
  isTyping = true;
  shouldStopTyping = false;

  sendMessage.classList.add("hidden");
  stopTyping.classList.remove("hidden");

  const messageDiv = document.createElement("div");
  messageDiv.className = "flex items-start";

  const messageBubble = document.createElement("div");
  messageBubble.className =
    "bg-blue-100 rounded-lg rounded-tl-none p-3 max-w-xs md:max-w-md shadow-sm message-animation";

  const messageText = document.createElement("p");
  messageText.className = "text-sm typing-indicator";
  messageText.innerHTML = "Mengetik...";

  messageBubble.appendChild(messageText);
  messageDiv.appendChild(messageBubble);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  setTimeout(() => {
    messageText.classList.remove("typing-indicator");
    messageText.innerHTML = "";

    let visibleText = "";
    let charIndex = 0;
    const typingSpeed = 10;

    typingInterval = setInterval(() => {
      if (charIndex < text.length && !shouldStopTyping) {
        visibleText += text.charAt(charIndex);
        messageText.innerHTML = marked.parse(visibleText);
        charIndex++;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        clearInterval(typingInterval);
        isTyping = false;
        stopTyping.classList.add("hidden");
        sendMessage.classList.remove("hidden");

        if (shouldStopTyping && charIndex < text.length) {
          messageText.innerHTML += " (dihentikan)";
        }

        processNextInQueue();
      }
    }, typingSpeed);
  }, 500);
}

stopTyping.addEventListener("click", () => {
  if (isTyping) {
    shouldStopTyping = true;
  }
});

function setLoadingState(isLoading) {
  sendMessage.disabled = isLoading;
  userInput.disabled = isLoading;

  if (isLoading) {
    sendMessage.innerHTML = `
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          `;
  } else {
    sendMessage.innerHTML = `<i class="fa-solid fa-paper-plane"></i>`;
  }
}

function canSendRequest() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  return timeSinceLastRequest >= MIN_REQUEST_INTERVAL;
}

async function processNextInQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  if (!canSendRequest()) {
    const waitTime = MIN_REQUEST_INTERVAL - (Date.now() - lastRequestTime);
    setTimeout(processNextInQueue, waitTime);
    return;
  }

  isProcessingQueue = true;
  const nextRequest = requestQueue.shift();
  
  try {
    lastRequestTime = Date.now();
    const result = await model.generateContent(nextRequest);
    const response = await result.response;
    const text = response.text();
    addAIMessageWithTypingEffect(text);
  } catch (error) {
    console.error("Error:", error);
    if (error.toString().includes("429") || error.toString().includes("RATE_LIMIT_EXCEEDED")) {
      requestQueue.unshift(nextRequest);
      addSystemMessage("Batas permintaan tercapai. Mencoba lagi dalam beberapa detik...");
      setTimeout(processNextInQueue, 5000);
    } else {
      addAIMessageWithTypingEffect("Maaf, terjadi kesalahan. Silakan coba lagi.");
      processNextInQueue();
    }
  } finally {
    isProcessingQueue = false;
    setLoadingState(false);
  }
}

function sendMessageToGemini(message) {
  setLoadingState(true);
  
  requestQueue.push(message);
  
  if (requestQueue.length === 1 && !isTyping && !isProcessingQueue) {
    processNextInQueue();
  } else if (requestQueue.length > 1) {
    addSystemMessage(`Pesan ditambahkan ke antrian (${requestQueue.length} pesan dalam antrian)`);
  }
}

sendMessage.addEventListener("click", () => {
  const message = userInput.value.trim();
  if (message) {
    addUserMessage(message);
    userInput.value = "";
    sendMessageToGemini(message);
  }
});

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage.click();
  }
});

const style = document.createElement('style');
style.textContent = `
  .system-message-animation {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  .fade-out {
    animation: fadeOut 0.5s ease-in-out;
    opacity: 0;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);