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
const API_KEY = "AIzaSyC46Kjd5nHJ2_fADQZT_HZtfxvVw4GyyKc";

// Inisialisasi GoogleGenerativeAI dengan API key
const genAI = new GoogleGenerativeAI(API_KEY);

// Gunakan model Gemini 1.5 Flash
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Variabel untuk kontrol animasi mengetik
let isTyping = false;
let typingInterval = null;
let shouldStopTyping = false;

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

// Fungsi untuk mengirim pesan ke Gemini
async function sendMessageToGemini(message) {
  try {
    setLoadingState(true);

    // Kirim pesan ke Gemini
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    // Tambahkan respons Gemini ke chat dengan efek mengetik
    addAIMessageWithTypingEffect(text);
  } catch (error) {
    console.error("Error:", error);
    addAIMessageWithTypingEffect("Maaf, terjadi kesalahan. Silakan coba lagi.");
  } finally {
    setLoadingState(false);
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
