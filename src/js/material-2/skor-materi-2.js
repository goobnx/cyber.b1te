document.addEventListener('DOMContentLoaded', function () {
    let skorAkhir = parseInt(localStorage.getItem("skorAkhir")) || 0; 
    let totalSoal = parseInt(localStorage.getItem("totalSoal")) || 10;
    let percentage = (skorAkhir / totalSoal) * 100;
    let message = "";

    if (percentage < 60) {
        message = "Waduh, coba lagi yuk. Kita mulai dari materi lagi ya";
    } else if (percentage < 80) {
        message = "Semangat! Ayo coba lagi, atau mau langsung lanjut nih😏";
    } else {
        message = "Hebat, ayo coba modul lainnya!";
    }

    document.getElementById("skor-akhir").innerText = skorAkhir;
    document.getElementById("result-message").innerText = message;

    let ctx = document.getElementById('scoreChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Salah', 'Benar'],
            datasets: [{
                data: [totalSoal - skorAkhir, skorAkhir],
                backgroundColor: ['#e74c3c', '#2ecc71'],
                borderWidth: 2
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: { display: false }
            }
        }
    });
});