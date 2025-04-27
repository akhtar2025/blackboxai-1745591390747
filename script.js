// Initialize variables
let video = document.getElementById('videoPlayer');
let processData = [];
let lastPauseTime = 0;

// Video upload handling
let currentVideoName = '';
document.getElementById('videoUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        currentVideoName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;
        video.load();
    }
});

// Video controls
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const continueBtn = document.getElementById('continueBtn');
const stopBtn = document.getElementById('stopBtn');
const progressBar = document.getElementById('progressBar');
const timeDisplay = document.getElementById('timeDisplay');
const speedDisplay = document.getElementById('speedDisplay');
const processModal = document.getElementById('processModal');

// Play button
playBtn.addEventListener('click', () => {
    video.play();
    playBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    continueBtn.classList.add('hidden');
});

// Pause button
pauseBtn.addEventListener('click', () => {
    video.pause();
    pauseBtn.classList.add('hidden');
    continueBtn.classList.remove('hidden');
    showProcessModal();
});

// Continue button
continueBtn.addEventListener('click', () => {
    video.play();
    continueBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
});

// Update button visibility on video events
video.addEventListener('play', () => {
    playBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    continueBtn.classList.add('hidden');
});

video.addEventListener('pause', () => {
    playBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
});

video.addEventListener('ended', () => {
    playBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    continueBtn.classList.add('hidden');
});

// Stop
let lastStopTime = 0;

stopBtn.addEventListener('click', () => {
    lastStopTime = video.currentTime;
    video.pause();
    video.currentTime = 0;
    playBtn.classList.add('hidden');
    pauseBtn.classList.add('hidden');
    continueBtn.classList.add('hidden');
    resumeBtn.classList.remove('hidden');
});

const resumeBtn = document.getElementById('resumeBtn');
resumeBtn.addEventListener('click', () => {
    video.currentTime = lastStopTime;
    video.play();
    resumeBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
});

// Speed control
document.getElementById('decreaseSpeed').addEventListener('click', () => {
    video.playbackRate = Math.max(0.1, video.playbackRate - 0.1);
    updateSpeedDisplay();
});

document.getElementById('increaseSpeed').addEventListener('click', () => {
    video.playbackRate = Math.min(10, video.playbackRate + 0.1);
    updateSpeedDisplay();
});

function updateSpeedDisplay() {
    speedDisplay.textContent = video.playbackRate.toFixed(1) + 'x';
}

// Progress bar and time display
video.addEventListener('timeupdate', () => {
    const progress = (video.currentTime / video.duration) * 100;
    progressBar.style.width = progress + '%';
    
    const currentTime = formatTime(video.currentTime);
    const duration = formatTime(video.duration);
    timeDisplay.textContent = `${currentTime} / ${duration}`;
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Process modal handling
function showProcessModal() {
    processModal.classList.remove('hidden');
    processModal.classList.add('flex');
    lastPauseTime = video.currentTime;
}

document.getElementById('cancelProcess').addEventListener('click', () => {
    processModal.classList.add('hidden');
    processModal.classList.remove('flex');
    video.play();
});

// Process form handling
document.getElementById('processForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const processDetail = document.getElementById('processDetail').value;
    const workType = document.getElementById('workType').value;
    const status = document.getElementById('status').value;
    const category = document.getElementById('category').value;

    addProcess({
        processDetail,
        workType,
        status,
        category,
        time: lastPauseTime
    });

    processModal.classList.add('hidden');
    processModal.classList.remove('flex');
    document.getElementById('processForm').reset();
    
    // Show continue button instead of automatically playing
    playBtn.classList.add('hidden');
    pauseBtn.classList.add('hidden');
    continueBtn.classList.remove('hidden');
});

// Process table handling
function addProcess(process) {
    processData.push(process);
    updateProcessTable();
}

function updateProcessTable() {
    const tbody = document.getElementById('processTableBody');
    tbody.innerHTML = '';
    
    let totalSeconds = 0;
    
    processData.forEach((process, index) => {
        const row = document.createElement('tr');
        const timeInSeconds = index === 0 ? 
            process.time : 
            process.time - processData[index - 1].time;
        
        totalSeconds += timeInSeconds;
        
        row.innerHTML = `
            <td class="p-2">${index + 1}</td>
            <td class="p-2">${process.processDetail}</td>
            <td class="p-2">${timeInSeconds.toFixed(2)}</td>
            <td class="p-2">${(timeInSeconds * 0.6).toFixed(2)}</td>
            <td class="p-2">${process.workType}</td>
            <td class="p-2">${process.status}</td>
            <td class="p-2">${process.category}</td>
        `;
        
        tbody.appendChild(row);
    });

    // Update totals
    document.getElementById('totalSeconds').textContent = totalSeconds.toFixed(2);
    document.getElementById('totalDM').textContent = (totalSeconds * 0.6).toFixed(2);
}

// Progress bar click handling
progressBar.parentElement.addEventListener('click', (e) => {
    const rect = progressBar.parentElement.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
});

// Export to Excel functionality
document.getElementById('exportBtn').addEventListener('click', () => {
    if (processData.length === 0) {
        alert('No process data to export.');
        return;
    }

    // Prepare total table data
    const totalTableData = processData.map((process, index) => {
        const timeInSeconds = index === 0 ? 
            process.time : 
            process.time - processData[index - 1].time;
        const timeInDM = timeInSeconds * 0.6;
        return {
            No: index + 1,
            'Process Detail': process.processDetail,
            'Time (s)': timeInSeconds,
            'Time (dm)': timeInDM,
            'Work Type': process.workType,
            'Status': process.status,
            'Category': process.category
        };
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add total table sheet only
    const totalTableSheet = XLSX.utils.json_to_sheet(totalTableData);
    XLSX.utils.book_append_sheet(wb, totalTableSheet, 'Process Data');

    // Export workbook with video name
    const excelFileName = currentVideoName ? `${currentVideoName}_analysis.xlsx` : 'process_analysis.xlsx';
    XLSX.writeFile(wb, excelFileName);
});
