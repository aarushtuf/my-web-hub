const timerDisplay = document.getElementById('timer-display');
const modeButtons = document.querySelectorAll('.mode-button');
const soundButtons = document.querySelectorAll('.sound-button');
const themeToggleButton = document.querySelector('.theme-toggle-button');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const activeSources = {};
let remainingSeconds = 25 * 60;
let timerInterval = null;

function updateTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      return;
    }
    remainingSeconds -= 1;
    updateTimerDisplay(remainingSeconds);
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  remainingSeconds = 25 * 60;
  updateTimerDisplay(remainingSeconds);
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    modeButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    remainingSeconds = Number(button.dataset.minutes) * 60;
    resetTimer();
  });
});

soundButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    await audioContext.resume();
    const soundName = button.dataset.sound;
    const isActive = button.classList.toggle('active');
    button.setAttribute('aria-pressed', String(isActive));

    if (isActive) {
      activeSources[soundName] = createAmbientSound(soundName);
    } else {
      stopAmbientSound(soundName);
    }
  });
});

if (themeToggleButton) {
  themeToggleButton.addEventListener('click', () => {
    const isLightMode = document.body.classList.toggle('light-theme');
    themeToggleButton.textContent = isLightMode ? 'Switch to Dark' : 'Switch to Light';
    themeToggleButton.setAttribute('aria-pressed', String(isLightMode));
  });
}

if (startButton) {
  startButton.addEventListener('click', startTimer);
}

if (pauseButton) {
  pauseButton.addEventListener('click', pauseTimer);
}

if (resetButton) {
  resetButton.addEventListener('click', resetTimer);
}

function createAmbientSound(name) {
  const gain = audioContext.createGain();
  gain.gain.value = 0.2;
  gain.connect(audioContext.destination);

  if (name === 'rain') {
    const bufferSize = audioContext.sampleRate * 1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1;
    noise.connect(filter).connect(gain);
    noise.start();
    return { source: noise, gain };
  }

  if (name === 'fireplace') {
    const bufferSize = audioContext.sampleRate * 1;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    let lastValue = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      lastValue = (lastValue * 0.95) + (white * 0.05);
      const decay = 1 - i / bufferSize;
      data[i] = lastValue * 0.18 * (0.9 + 0.1 * Math.sin((i / bufferSize) * Math.PI * 4));
    }
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowpass = audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 650;
    lowpass.Q.value = 0.95;

    const bandpass = audioContext.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1200;
    bandpass.Q.value = 1.2;

    noise.connect(lowpass).connect(bandpass).connect(gain);
    noise.start();
    return { source: noise, gain };
  }

  return null;
}

function stopAmbientSound(name) {
  const active = activeSources[name];
  if (!active) return;
  active.source.stop();
  active.source.disconnect();
  active.gain.disconnect();
  delete activeSources[name];
}

