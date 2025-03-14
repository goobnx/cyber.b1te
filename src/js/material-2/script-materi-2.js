
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


let soalIndex = 0;
let soalData = [];
let waktuTersisa = 30;
let timer;
let skor = 0;
const nilaiPerSoal = 10;
const feedbackDuration = 5; 


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
    
    const questionsCopy = [...allQuestions];
    
    
    for (let i = questionsCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsCopy[i], questionsCopy[j]] = [questionsCopy[j], questionsCopy[i]];
    }
    
    
    return questionsCopy.slice(0, Math.min(count, questionsCopy.length));
}

function fetchSoal() {
    
    fetch("/src/js/material-2/pertanyaan-materi-2.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then(data => {

            soalData = getRandomQuestions(data, 10);
            
            soalData.forEach((soal, index) => {
                soal.nomor = index + 1;
            });
            
            tampilkanSoal();
        })
        .catch(error => {
            console.warn("Gagal mengambil data soal dari path relatif:", error);

            fetch("/src/js/material-2/pertanyaan-materi-2.json")
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(data => {
                    soalData = getRandomQuestions(data, 10);
                    soalData.forEach((soal, index) => {
                        soal.nomor = index + 1;
                    });
                    
                    tampilkanSoal();
                })
                .catch(secondError => {
                    console.warn("Gagal mengambil data soal dari path absolut:", secondError);
                    console.log("Menggunakan data contoh sebagai fallback");
                    
                    if (sampleSoalData.length > 10) {
                        soalData = getRandomQuestions(sampleSoalData, 10);
                    } else {
                        soalData = sampleSoalData;
                    }
                    
                    soalData.forEach((soal, index) => {
                        soal.nomor = index + 1;
                    });
                    
                    tampilkanSoal();
                });
        });
}

function tampilkanSoal() {
    clearInterval(timer);
    
    const feedbackContainer = document.getElementById("feedback-container");
    if (feedbackContainer) {
        feedbackContainer.classList.add("hidden");
    }

    if (soalIndex >= soalData.length) {
        const nilaiAkhir = skor * nilaiPerSoal;
        localStorage.setItem("skorAkhir", nilaiAkhir);
        localStorage.setItem("totalSoal", soalData.length * nilaiPerSoal);
    
        window.location.href = "/training/material-2/skor.html";
        return;
    }

    let soal = soalData[soalIndex];
    document.getElementById("soal-nomor").innerText = `${soal.nomor}/${soalData.length}`;
    document.getElementById("pertanyaan").innerText = soal.pertanyaan;
    
    let pilihanContainer = document.getElementById("pilihan-container");
    pilihanContainer.innerHTML = "";

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

    document.querySelectorAll('.pilihan-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains("answered")) return;
            document.querySelectorAll('.pilihan-item').forEach(el => {
                el.classList.add("answered");
            });
            
            const jawabanUser = this.dataset.value.trim();
            const jawabanBenar = soal.jawaban.trim();
            
            console.log("User answer:", jawabanUser);
            console.log("Correct answer:", jawabanBenar);
            console.log("Match?", jawabanUser === jawabanBenar);
            
            clearInterval(timer);
            
            const feedbackContainer = document.getElementById("feedback-container");
            const feedbackText = document.getElementById("feedback-text");
            const correctAnswer = document.getElementById("correct-answer");
            const feedbackTimer = document.getElementById("feedback-timer");
            
            if (jawabanUser.toLowerCase() === jawabanBenar.toLowerCase()) {
                this.querySelector("div").classList.remove("bg-white", "border-gray-300", "hover:bg-blue-50");
                this.querySelector("div").classList.add("bg-green-500", "text-white", "border-green-600");
                
                feedbackContainer.classList.remove("hidden", "bg-red-100", "bg-yellow-100", 
                                                    "text-red-800", "text-yellow-800", 
                                                    "border-red-300", "border-yellow-300");
                feedbackContainer.classList.add("bg-green-100", "text-green-800", "border", "border-green-300");
                feedbackText.innerText = "Jawaban benar!";
                correctAnswer.innerText = "";
                
                skor++;

                setTimeout(() => {
                    soalIndex++;
                    tampilkanSoal();
                }, 1000);
            } else {
                this.querySelector("div").classList.remove("bg-white", "border-gray-300", "hover:bg-blue-50");
                this.querySelector("div").classList.add("bg-red-500", "text-white", "border-red-600");
                

                document.querySelectorAll('.pilihan-item').forEach(el => {
                    if (el.dataset.value.trim().toLowerCase() === jawabanBenar.toLowerCase()) {
                        el.querySelector("div").classList.remove("bg-white", "border-gray-300", "hover:bg-blue-50");
                        el.querySelector("div").classList.add("bg-green-500", "text-white", "border-green-600");
                    }
                });
                
                feedbackContainer.classList.remove("hidden", "bg-green-100", "bg-yellow-100",
                                                    "text-green-800", "text-yellow-800",
                                                    "border-green-300", "border-yellow-300");
                feedbackContainer.classList.add("bg-red-100", "text-red-800", "border", "border-red-300");
                feedbackText.innerText = "Jawaban salah.";

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
    progressBar.style.backgroundColor = "#10B981"; 
    document.getElementById("timer").innerText = `${waktuTersisa}s`;

    timer = setInterval(() => {
        waktuTersisa--;
        document.getElementById("timer").innerText = `${waktuTersisa}s`;
        progressBar.style.width = `${(waktuTersisa / 30) * 100}%`;

        if (waktuTersisa <= 10) {
            progressBar.style.backgroundColor = "#EF4444"; 
        } else if (waktuTersisa <= 20) {
            progressBar.style.backgroundColor = "#F59E0B"; 
        }

        if (waktuTersisa <= 0) {
            document.querySelectorAll('.pilihan-item').forEach(el => {
                el.classList.add("answered");
                if (el.dataset.value === soalData[soalIndex].jawaban) {
                    el.querySelector("div").classList.remove("bg-white", "border-gray-300");
                    el.querySelector("div").classList.add("bg-green-500", "text-white", "border-green-600");
                }
            });
            
            const feedbackContainer = document.getElementById("feedback-container");
            const feedbackText = document.getElementById("feedback-text");
            const correctAnswer = document.getElementById("correct-answer");
            const feedbackTimer = document.getElementById("feedback-timer");
            
            feedbackContainer.classList.remove("hidden");
            feedbackContainer.classList.add("bg-yellow-100", "text-yellow-800", "border", "border-yellow-300");
            feedbackText.innerText = "Waktu habis!";
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

document.addEventListener('DOMContentLoaded', function() {
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        initializeCountdown();
    }
});