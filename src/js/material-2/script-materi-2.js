// Countdown page script
let waktuCountdown = 5; 

function initializeCountdown() {
    const countdownElement = document.getElementById("countdown");
    
    const countdownInterval = setInterval(() => {
        waktuCountdown--;
        countdownElement.innerText = waktuCountdown;

        if (waktuCountdown <= 0) {
            clearInterval(countdownInterval);
            mulaiSoal();
        }
    }, 1000);
}

function goBack() {
    window.history.back();
}

// Quiz functionality
let soalIndex = 0;
let soalData = [];
let waktuTersisa = 30;
let timer;
let skor = 0;
const nilaiPerSoal = 10; // Each question is worth 10 points
const feedbackDuration = 5; // Seconds to display feedback before moving to next question

// Sample data as fallback if fetch fails
const sampleSoalData = [
    {
        "nomor": 1,
        "pertanyaan": "Apa ibu kota Indonesia?",
        "pilihan": ["Jakarta", "Surabaya", "Bandung", "Medan"],
        "jawaban": "Jakarta"
    },
    {
        "nomor": 2,
        "pertanyaan": "Berapakah hasil dari 5 + 3?",
        "pilihan": ["6", "7", "8", "9"],
        "jawaban": "8"
    }
];

function mulaiSoal() {
    document.querySelector(".countdown").innerHTML = `
        <div class="quiz-container p-4 md:p-6 bg-gray-200/50 backdrop-blur-lg rounded-lg shadow-lg w-full max-w-md md:max-w-none mx-auto">
            <div class="flex justify-between items-center mb-4">
                <span id="soal-nomor" class="text-sm md:text-lg font-semibold">1/2</span>
                <span id="timer" class="text-sm md:text-lg font-semibold">30s</span>
            </div>
            
            <div class="h-2 bg-gray-300 rounded-lg overflow-hidden">
                <div id="progress-bar" class="h-full bg-green-500 w-full"></div>
            </div>
    
            <h2 id="pertanyaan" class="text-base md:text-xl font-bold my-4">Loading...</h2>
    
            <div id="pilihan-container" class="space-y-2"></div>
            
            <div id="feedback-container" class="my-4 p-2 md:p-3 rounded-lg hidden">
                <p id="feedback-text" class="font-medium text-sm md:text-base"></p>
                <p id="correct-answer" class="font-medium mt-2 text-sm md:text-base"></p>
                <div id="feedback-timer" class="text-xs md:text-sm mt-2 text-gray-600"></div>
            </div>
        </div>
    `;

    fetchSoal();
}

function getRandomQuestions(allQuestions, count) {
    // Create a copy of the original array to avoid modifying it
    const questionsCopy = [...allQuestions];
    
    // Shuffle the array (Fisher-Yates algorithm)
    for (let i = questionsCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsCopy[i], questionsCopy[j]] = [questionsCopy[j], questionsCopy[i]];
    }
    
    // Take only the first 'count' questions or all if there are fewer
    return questionsCopy.slice(0, Math.min(count, questionsCopy.length));
}

function fetchSoal() {
    // Attempt to fetch from both relative and absolute paths
    fetch("/src/js/material-2/pertanyaan-materi-2.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {
            // Select only 10 random questions from all available questions
            soalData = getRandomQuestions(data, 10);
            
            // Renumber the questions from 1-10
            soalData.forEach((soal, index) => {
                soal.nomor = index + 1;
            });
            
            tampilkanSoal();
        })
        .catch(error => {
            // Same fallback code as before, but selecting 10 random questions
            console.warn("Gagal mengambil data soal dari path relatif:", error);
            
            // Try with absolute path
            fetch("/src/js/material-2/pertanyaan-materi-2.json")
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(data => {
                    // Select only 10 random questions
                    soalData = getRandomQuestions(data, 10);
                    
                    // Renumber the questions from 1-10
                    soalData.forEach((soal, index) => {
                        soal.nomor = index + 1;
                    });
                    
                    tampilkanSoal();
                })
                .catch(secondError => {
                    console.warn("Gagal mengambil data soal dari path absolut:", secondError);
                    console.log("Menggunakan data contoh sebagai fallback");
                    
                    // Use sample data as fallback
                    // If there are more than 10 sample questions, select 10 random ones
                    if (sampleSoalData.length > 10) {
                        soalData = getRandomQuestions(sampleSoalData, 10);
                    } else {
                        soalData = sampleSoalData;
                    }
                    
                    // Renumber the questions
                    soalData.forEach((soal, index) => {
                        soal.nomor = index + 1;
                    });
                    
                    tampilkanSoal();
                });
        });
}

function tampilkanSoal() {
    clearInterval(timer);
    
    // Hide feedback from previous question
    const feedbackContainer = document.getElementById("feedback-container");
    if (feedbackContainer) {
        feedbackContainer.classList.add("hidden");
    }

    if (soalIndex >= soalData.length) {
        // Calculate final score (each correct answer is worth 10 points)
        const nilaiAkhir = skor * nilaiPerSoal;
        localStorage.setItem("skorAkhir", nilaiAkhir);
        localStorage.setItem("totalSoal", soalData.length * nilaiPerSoal); // This will be 100 for 10 questions
    
        window.location.href = "/training/material-2/skor.html";
        return;
    }

    let soal = soalData[soalIndex];
    document.getElementById("soal-nomor").innerText = `${soal.nomor}/${soalData.length}`;
    document.getElementById("pertanyaan").innerText = soal.pertanyaan;
    
    let pilihanContainer = document.getElementById("pilihan-container");
    pilihanContainer.innerHTML = "";

    // Create option labels with letters (A, B, C, D)
    const letters = ['A', 'B', 'C', 'D'];
    soal.pilihan.forEach((pilihan, index) => {
        const letter = letters[index];
        let pilihanHTML = `
            <div class="pilihan-item" data-value="${pilihan}">
                <div class="block bg-white p-3 rounded-lg cursor-pointer border border-gray-300 hover:bg-blue-50 transition-colors">
                    <div class="flex items-center">
                        <span class="font-medium mr-2">${letter}.</span>
                        <span>${pilihan}</span>
                    </div>
                </div>
            </div>
        `;
        pilihanContainer.innerHTML += pilihanHTML;
    });

    // Add click event for the options
    document.querySelectorAll('.pilihan-item').forEach(item => {
        // In the click event handler for pilihan-item
        item.addEventListener('click', function() {
            if (this.classList.contains("answered")) return; // Prevent multiple selections
            
            // Mark all options as answered to prevent further selection
            document.querySelectorAll('.pilihan-item').forEach(el => {
                el.classList.add("answered");
            });
            
            // Get user's answer and correct answer, trim any whitespace
            const jawabanUser = this.dataset.value.trim();
            const jawabanBenar = soal.jawaban.trim();
            
            // Log values for debugging (you can remove this later)
            console.log("User answer:", jawabanUser);
            console.log("Correct answer:", jawabanBenar);
            console.log("Match?", jawabanUser === jawabanBenar);
            
            // Stop the timer
            clearInterval(timer);
            
            // Show feedback
            const feedbackContainer = document.getElementById("feedback-container");
            const feedbackText = document.getElementById("feedback-text");
            const correctAnswer = document.getElementById("correct-answer");
            const feedbackTimer = document.getElementById("feedback-timer");
            
            // Normalize comparison - trim whitespace and ignore case
            if (jawabanUser.toLowerCase() === jawabanBenar.toLowerCase()) {
                // Correct answer
                this.querySelector("div").classList.remove("bg-white", "border-gray-300", "hover:bg-blue-50");
                this.querySelector("div").classList.add("bg-green-500", "text-white", "border-green-600");
                
                // Make sure all feedback container classes are correct
                feedbackContainer.classList.remove("hidden", "bg-red-100", "bg-yellow-100", 
                                                    "text-red-800", "text-yellow-800", 
                                                    "border-red-300", "border-yellow-300");
                feedbackContainer.classList.add("bg-green-100", "text-green-800", "border", "border-green-300");
                feedbackText.innerText = "Jawaban benar!";
                correctAnswer.innerText = "";
                
                skor++;
                
                // Brief pause before moving to next question
                setTimeout(() => {
                    soalIndex++;
                    tampilkanSoal();
                }, 1000);
            } else {
                // Wrong answer
                this.querySelector("div").classList.remove("bg-white", "border-gray-300", "hover:bg-blue-50");
                this.querySelector("div").classList.add("bg-red-500", "text-white", "border-red-600");
                
                // Highlight correct answer
                document.querySelectorAll('.pilihan-item').forEach(el => {
                    // Compare with same normalization
                    if (el.dataset.value.trim().toLowerCase() === jawabanBenar.toLowerCase()) {
                        el.querySelector("div").classList.remove("bg-white", "border-gray-300", "hover:bg-blue-50");
                        el.querySelector("div").classList.add("bg-green-500", "text-white", "border-green-600");
                    }
                });
                
                // Make sure all feedback container classes are correct
                feedbackContainer.classList.remove("hidden", "bg-green-100", "bg-yellow-100",
                                                    "text-green-800", "text-yellow-800",
                                                    "border-green-300", "border-yellow-300");
                feedbackContainer.classList.add("bg-red-100", "text-red-800", "border", "border-red-300");
                feedbackText.innerText = "Jawaban salah.";
                // correctAnswer.innerText = "Jawaban yang benar: " + soalData[soalIndex].jawaban;
                
                // Set countdown for feedback duration
                let remainingFeedbackTime = feedbackDuration;
                feedbackTimer.innerText = `Melanjutkan dalam ${remainingFeedbackTime} detik...`;
                
                const feedbackInterval = setInterval(() => {
                    remainingFeedbackTime--;
                    feedbackTimer.innerText = `Melanjutkan dalam ${remainingFeedbackTime} detik...`;
                    
                    if (remainingFeedbackTime <= 0) {
                        clearInterval(feedbackInterval);
                        soalIndex++;
                        tampilkanSoal();
                    }
                }, 1000);
            }
        });
    });

    mulaiTimer();
}

function mulaiTimer() {
    waktuTersisa = 30;
    const progressBar = document.getElementById("progress-bar");
    progressBar.style.width = "100%";
    progressBar.style.backgroundColor = "#10B981"; // Green color
    document.getElementById("timer").innerText = `${waktuTersisa}s`;

    timer = setInterval(() => {
        waktuTersisa--;
        document.getElementById("timer").innerText = `${waktuTersisa}s`;
        progressBar.style.width = `${(waktuTersisa / 30) * 100}%`;
        
        // Change color based on time remaining
        if (waktuTersisa <= 10) {
            progressBar.style.backgroundColor = "#EF4444"; // Red color
        } else if (waktuTersisa <= 20) {
            progressBar.style.backgroundColor = "#F59E0B"; // Yellow color
        }

        if (waktuTersisa <= 0) {
            // Time's up - reveal correct answer
            document.querySelectorAll('.pilihan-item').forEach(el => {
                el.classList.add("answered");
                if (el.dataset.value === soalData[soalIndex].jawaban) {
                    el.querySelector("div").classList.remove("bg-white", "border-gray-300");
                    el.querySelector("div").classList.add("bg-green-500", "text-white", "border-green-600");
                }
            });
            
            // Show feedback for timeout
            const feedbackContainer = document.getElementById("feedback-container");
            const feedbackText = document.getElementById("feedback-text");
            const correctAnswer = document.getElementById("correct-answer");
            const feedbackTimer = document.getElementById("feedback-timer");
            
            feedbackContainer.classList.remove("hidden");
            feedbackContainer.classList.add("bg-yellow-100", "text-yellow-800", "border", "border-yellow-300");
            feedbackText.innerText = "Waktu habis!";
            // correctAnswer.innerText = "Jawaban yang benar: " + soalData[soalIndex].jawaban;
            
            // Set countdown for feedback duration
            let remainingFeedbackTime = feedbackDuration;
            feedbackTimer.innerText = `Melanjutkan dalam ${remainingFeedbackTime} detik...`;
            
            const feedbackInterval = setInterval(() => {
                remainingFeedbackTime--;
                feedbackTimer.innerText = `Melanjutkan dalam ${remainingFeedbackTime} detik...`;
                
                if (remainingFeedbackTime <= 0) {
                    clearInterval(feedbackInterval);
                    soalIndex++;
                    tampilkanSoal();
                }
            }, 1000);
            
            clearInterval(timer);
        }
    }, 1000);
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        initializeCountdown();
    }
});