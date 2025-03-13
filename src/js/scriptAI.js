import { GoogleGenerativeAI } from "@google/generative-ai";

// Elemen DOM
const chatBubble = document.getElementById("chatBubble");
const chatContainer = document.getElementById("chatContainer");
const closeChat = document.getElementById("closeChat");
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendMessage = document.getElementById("sendMessage");
const stopTyping = document.getElementById("stopTyping");

// API key Gemini - ganti dengan API key Anda
const API_KEY = "AIzaSyCB_DCF5-ruifp5XovApe_aO4LqjydK5gU";

// Inisialisasi GoogleGenerativeAI dengan API key
const genAI = new GoogleGenerativeAI(API_KEY);

// Gunakan model Gemini 1.5 Flash
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Variabel untuk kontrol animasi mengetik
let isTyping = false;
let typingInterval = null;
let shouldStopTyping = false;

// Variabel untuk rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 detik antara permintaan
let requestQueue = [];
let isProcessingQueue = false;
let rateLimitInfoTimeout = null;

// Toggle chat window
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

// Fungsi untuk menambahkan pesan user ke area chat
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

  // Auto scroll ke pesan terbaru
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fungsi untuk menambahkan pesan sistem
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

  // Hapus pesan sistem setelah beberapa detik
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

// Fungsi untuk menambahkan pesan AI dengan efek mengetik
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
    messageText.innerHTML = ""; // Kosongkan sebelum mulai mengetik

    let visibleText = "";
    let charIndex = 0;
    const typingSpeed = 10;

    typingInterval = setInterval(() => {
      if (charIndex < text.length && !shouldStopTyping) {
        visibleText += text.charAt(charIndex);
        messageText.innerHTML = marked.parse(visibleText); // Gunakan Marked.js
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
        
        // Proses antrian berikutnya setelah selesai mengetik
        processNextInQueue();
      }
    }, typingSpeed);
  }, 500);
}

// Handler untuk tombol stop
stopTyping.addEventListener("click", () => {
  if (isTyping) {
    shouldStopTyping = true;
  }
});

// Fungsi untuk menangani loading state
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

// Fungsi untuk memeriksa apakah kita dapat mengirim permintaan berdasarkan rate limiting
function canSendRequest() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  return timeSinceLastRequest >= MIN_REQUEST_INTERVAL;
}

// Fungsi untuk memproses antrian permintaan
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
      // Tambahkan kembali permintaan ke antrian jika error rate limit
      requestQueue.unshift(nextRequest);
      addSystemMessage("Batas permintaan tercapai. Mencoba lagi dalam beberapa detik...");
      setTimeout(processNextInQueue, 5000); // Tunggu 5 detik sebelum mencoba lagi
    } else {
      addAIMessageWithTypingEffect("Maaf, terjadi kesalahan. Silakan coba lagi.");
      processNextInQueue();
    }
  } finally {
    isProcessingQueue = false;
    setLoadingState(false);
  }
}

// Fungsi untuk mengirim pesan ke Gemini
function sendMessageToGemini(message) {
  setLoadingState(true);
  
  // Tambahkan permintaan ke antrian
  requestQueue.push(message);
  
  // Jika antrian hanya berisi satu item dan tidak sedang memproses, mulai proses
  if (requestQueue.length === 1 && !isTyping && !isProcessingQueue) {
    processNextInQueue();
  } else if (requestQueue.length > 1) {
    addSystemMessage(`Pesan ditambahkan ke antrian (${requestQueue.length} pesan dalam antrian)`);
  }
}

// Handler untuk button send
sendMessage.addEventListener("click", () => {
  const message = userInput.value.trim();
  if (message) {
    addUserMessage(message);
    userInput.value = "";
    sendMessageToGemini(message);
  }
});

// Handler untuk enter key
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage.click();
  }
});

// Tambahkan CSS untuk animasi fade-out
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