const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');
const timerEl = document.getElementById('timer');
const transcriptEl = document.getElementById('transcript');
const results = document.getElementById('results');
const durationEl = document.getElementById('duration');
const wordCountEl = document.getElementById('wordCount');
const wpmEl = document.getElementById('wpm');
const fillersEl = document.getElementById('fillers');
const feedbackEl = document.getElementById('feedback');
const waveform = document.getElementById('waveform');

let mediaRecorder;
let audioChunks = [];
let startTime;
let timerInterval;
let recognition;

const fillerWords = ['um', 'uh', 'like', 'you know', 'so', 'basically', 'right', 'okay', 'alright'];

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const sec = String(elapsed % 60).padStart(2, '0');
    timerEl.textContent = `${min}:${sec}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function countFillers(text) {
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(w => fillerWords.includes(w.replace(/[.,!?]/g, ''))).length;
}

function simulateAIFeedback(transcript, duration, fillers) {
  const words = transcript.trim().split(/\s+/).length;
  const wpm = duration > 0 ? Math.round(words / (duration / 60)) : 0;

  let feedback = `You spoke for ${duration} seconds at ~${wpm} words per minute.\n\n`;

  if (fillers > 3) {
    feedback += `You used ${fillers} filler words — try to reduce them for clearer delivery.\n`;
  } else if (fillers > 0) {
    feedback += `Good job — only ${fillers} filler words detected!\n`;
  }

  if (wpm < 100) feedback += "Speaking a bit slowly — aim for 120–150 WPM.\n";
  if (wpm > 180) feedback += "Speaking quite fast — slow down for better clarity.\n";

  feedback += "\n(Simulated AI) STAR structure looks partial — try adding clear Result with numbers next time.";

  return feedback;
}

// ─── Speech Recognition (browser built-in) ────────────────────────────────
function initSpeechRecognition() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    transcriptEl.value = final + interim;
  };

  recognition.onerror = (e) => console.error('Speech recognition error:', e);
}

// ─── Main Controls ────────────────────────────────────────────────────────
startBtn.onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.start();

    startTimer();
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    status.textContent = "Recording... Speak now";
    waveform.classList.remove('hidden');

    // Start speech-to-text if supported
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      if (!recognition) initSpeechRecognition();
      recognition.start();
    } else {
      transcriptEl.value = "(Speech recognition not supported in this browser)";
    }
  } catch (err) {
    alert("Microphone access denied or not available.");
    console.error(err);
  }
};

stopBtn.onclick = () => {
  mediaRecorder.stop();
  stopTimer();
  startBtn.classList.remove('hidden');
  stopBtn.classList.add('hidden');
  resetBtn.classList.remove('hidden');
  status.textContent = "Recording stopped";
  waveform.classList.add('hidden');

  if (recognition) recognition.stop();

  mediaRecorder.onstop = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const text = transcriptEl.value.trim();

    const fillers = countFillers(text);
    const words = text.split(/\s+/).filter(Boolean).length;
    const wpm = duration > 0 ? Math.round(words / (duration / 60)) : 0;

    durationEl.textContent = duration;
    wordCountEl.textContent = words;
    wpmEl.textContent = wpm;
    fillersEl.textContent = fillers;

    feedbackEl.textContent = simulateAIFeedback(text, duration, fillers);

    results.classList.remove('hidden');
  };
};

resetBtn.onclick = () => {
  transcriptEl.value = '';
  timerEl.textContent = '00:00';
  results.classList.add('hidden');
  resetBtn.classList.add('hidden');
  status.textContent = 'Ready to record';
};
