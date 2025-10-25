// Configuration object
const defaultConfig = {
  clock_title: "Digital Clock",
  timer_label: "Timer",
  alarm_label: "Alarm",
  stopwatch_label: "Stopwatch"
};

let config = { ...defaultConfig
};

// Main application logic wrapped in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

  // --- State Variables ---
  let clockInterval;
  let alarms = [];
  let lapCount = 0;

  // Improved timer state
  let timerState = {
    interval: null,
    remainingSeconds: 0,
    running: false,
    endTime: 0
  };

  // Improved stopwatch state
  let stopwatchState = {
    interval: null,
    startTime: 0,
    elapsedTime: 0, // Stored in milliseconds
    running: false
  };

  // --- DOM Element Caching ---
  // Cache all frequently used DOM elements
  const elements = {
    currentTime: document.getElementById('currentTime'),
    currentDate: document.getElementById('currentDate'),

    // Timer
    timerDisplay: document.getElementById('timerDisplay'),
    timerHours: document.getElementById('timerHours'),
    timerMinutes: document.getElementById('timerMinutes'),
    timerSeconds: document.getElementById('timerSeconds'),
    startTimer: document.getElementById('startTimer'),
    pauseTimer: document.getElementById('pauseTimer'),
    resetTimer: document.getElementById('resetTimer'),

    // Alarm
    alarmTime: document.getElementById('alarmTime'),
    addAlarm: document.getElementById('addAlarm'),
    alarmList: document.getElementById('alarmList'),

    // Stopwatch
    stopwatchDisplay: document.getElementById('stopwatchDisplay'),
    startStopwatch: document.getElementById('startStopwatch'),
    pauseStopwatch: document.getElementById('pauseStopwatch'),
    lapStopwatch: document.getElementById('lapStopwatch'),
    resetStopwatch: document.getElementById('resetStopwatch'),
    lapTimes: document.getElementById('lapTimes'),

    // Notification
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),

    // Configurable labels
    clockTitle: document.getElementById('clockTitle'),
    timerTabLabel: document.getElementById('timerTabLabel'),
    alarmTabLabel: document.getElementById('alarmTabLabel'),
    stopwatchTabLabel: document.getElementById('stopwatchTabLabel')
  };


  // --- Utility Functions ---

  function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    elements.currentTime.textContent = timeString;
    elements.currentDate.textContent = dateString;

    checkAlarms(now);
  }

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function showNotification(message) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');

    setTimeout(() => {
      elements.notification.classList.remove('show');
    }, 3000);
  }

  // --- NEW ---
  // Asks user for permission to send pop-up notifications
  async function checkNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      return true;
    }
    // Check if permission was denied
    if (Notification.permission === 'denied') {
      showNotification('Notification permission was denied. Please enable it in browser settings.');
      return false;
    }
    // If permission is 'default' (not yet asked), request it
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // --- NEW ---
  // Sends the actual browser pop-up notification
  function sendBrowserNotification(title, body) {
    if (Notification.permission === 'granted') {
      // You can add an icon for a nice touch
      const iconUrl = 'https://img.icons8.com/color/96/alarm-clock.png';
      new Notification(title, {
        body: body,
        icon: iconUrl
      });
    }
  }


  // --- Timer Functionality (Refactored for Accuracy) ---

  // --- MODIFIED --- (Added call to sendBrowserNotification)
  function updateTimer() {
    const remainingMs = timerState.endTime - Date.now();

    if (remainingMs <= 0) {
      clearInterval(timerState.interval);
      timerState.running = false;
      timerState.remainingSeconds = 0;
      elements.timerDisplay.textContent = formatTime(0);

      showNotification('Timer finished!');
      // --- NEW ---
      sendBrowserNotification('Timer Finished!', 'Your countdown has ended.');
      // --- END NEW ---

      elements.startTimer.classList.remove('d-none');
      elements.pauseTimer.classList.add('d-none');
    } else {
      // Use Math.ceil to ensure it shows "00:00:01" instead of "00:00:00" for the last second
      timerState.remainingSeconds = Math.ceil(remainingMs / 1000);
      elements.timerDisplay.textContent = formatTime(timerState.remainingSeconds);
    }
  }

  // --- MODIFIED --- (Added 'async' and 'await checkNotificationPermission()')
  async function startTimer() {
    if (timerState.running) return;

    // --- NEW ---
    // Request permission when the user tries to start a timer
    await checkNotificationPermission();
    // --- END NEW ---

    // If starting fresh (not resuming), get time from inputs
    if (timerState.remainingSeconds === 0) {
      const hours = parseInt(elements.timerHours.value) || 0;
      const minutes = parseInt(elements.timerMinutes.value) || 0;
      const seconds = parseInt(elements.timerSeconds.value) || 0;
      timerState.remainingSeconds = hours * 3600 + minutes * 60 + seconds;
    }

    if (timerState.remainingSeconds <= 0) {
      showNotification('Please set a valid timer duration');
      return;
    }

    timerState.running = true;
    timerState.endTime = Date.now() + timerState.remainingSeconds * 1000;

    // Run immediately to update display, then set interval
    updateTimer();
    timerState.interval = setInterval(updateTimer, 500); // Check twice a second for responsiveness

    elements.startTimer.classList.add('d-none');
    elements.pauseTimer.classList.remove('d-none');
  }

  function pauseTimer() {
    if (!timerState.running) return;

    clearInterval(timerState.interval);
    timerState.running = false;
    // Recalculate remaining seconds based on when pause was hit
    timerState.remainingSeconds = Math.ceil((timerState.endTime - Date.now()) / 1000);

    if (timerState.remainingSeconds < 0) timerState.remainingSeconds = 0;

    elements.timerDisplay.textContent = formatTime(timerState.remainingSeconds);
    elements.startTimer.classList.remove('d-none');
    elements.pauseTimer.classList.add('d-none');
  }

  function resetTimer() {
    clearInterval(timerState.interval);
    timerState.running = false;
    timerState.remainingSeconds = 0;
    timerState.endTime = 0;

    elements.timerDisplay.textContent = '00:00:00';
    elements.startTimer.classList.remove('d-none');
    elements.pauseTimer.classList.add('d-none');

    elements.timerHours.value = 0;
    elements.timerMinutes.value = 5;
    elements.timerSeconds.value = 0;
  }

  // --- Alarm Functionality (Refactored for secure event listeners) ---

  // --- MODIFIED --- (Added 'async' and 'await checkNotificationPermission()')
  async function addAlarm() {
    const alarmTimeValue = elements.alarmTime.value;
    if (!alarmTimeValue) {
      showNotification('Please select a time for the alarm');
      return;
    }

    // --- NEW ---
    // Request permission when the user tries to add an alarm
    await checkNotificationPermission();
    // --- END NEW ---

    const alarm = {
      id: Date.now(),
      time: alarmTimeValue,
      active: true
    };

    alarms.push(alarm);
    renderAlarms();
    elements.alarmTime.value = '';
    showNotification('Alarm added successfully');
  }

  function renderAlarms() {
    elements.alarmList.innerHTML = ''; // Clear existing list

    alarms.forEach(alarm => {
      const alarmDiv = document.createElement('div');
      alarmDiv.className = 'alarm-item';

      const statusClass = alarm.active ? 'status-active' : 'status-inactive';
      const statusText = alarm.active ? 'Active' : 'Inactive';
      const toggleIcon = alarm.active ? 'fa-pause' : 'fa-play';

      alarmDiv.innerHTML = `
        <div>
          <div class="alarm-time">${alarm.time}</div>
          <span class="status-indicator ${statusClass}">
            ${statusText}
          </span>
        </div>
        <div>
          <button class="btn btn-sm btn-custom me-2 btn-toggle" aria-label="Toggle alarm">
            <i class="fas ${toggleIcon}"></i>
          </button>
          <button class="btn btn-sm btn-danger-custom btn-delete" aria-label="Delete alarm">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      // Securely attach event listeners
      alarmDiv.querySelector('.btn-toggle').addEventListener('click', () => toggleAlarm(alarm.id));
      alarmDiv.querySelector('.btn-delete').addEventListener('click', () => deleteAlarm(alarm.id));

      elements.alarmList.appendChild(alarmDiv);
    });
  }

  function toggleAlarm(id) {
    const alarm = alarms.find(a => a.id === id);
    if (alarm) {
      alarm.active = !alarm.active;
      renderAlarms();
    }
  }

  function deleteAlarm(id) {
    alarms = alarms.filter(a => a.id !== id);
    renderAlarms();
    showNotification('Alarm deleted');
  }

  // --- MODIFIED --- (Added call to sendBrowserNotification)
  function checkAlarms(now) {
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    alarms.forEach(alarm => {
      // Check if alarm is active and time matches
      // Also check if it hasn't been triggered in the last 60s to prevent multi-triggers
      if (alarm.active && alarm.time === currentTime && (!alarm.lastTriggered || (now.getTime() - alarm.lastTriggered > 60000))) {
        
        showNotification(`Alarm: ${alarm.time}`);
        // --- NEW ---
        sendBrowserNotification('Alarm!', `It's time for your ${alarm.time} alarm.`);
        // --- END NEW ---
        
        alarm.active = false; // Deactivate after ringing
        alarm.lastTriggered = now.getTime(); // Add a timestamp to prevent re-triggering
        renderAlarms();
      }
    });
  }

  // --- Stopwatch Functionality (Refactored for Accuracy) ---

  function updateStopwatch() {
    if (!stopwatchState.running) return;

    stopwatchState.elapsedTime = Date.now() - stopwatchState.startTime;
    const displaySeconds = Math.floor(stopwatchState.elapsedTime / 1000);
    elements.stopwatchDisplay.textContent = formatTime(displaySeconds);
  }

  function startStopwatch() {
    if (stopwatchState.running) return;

    stopwatchState.running = true;
    // If resuming, subtract the already elapsed time from the new start time
    stopwatchState.startTime = Date.now() - stopwatchState.elapsedTime;

    // Update every 50ms for a smoother-feeling (though display is seconds)
    stopwatchState.interval = setInterval(updateStopwatch, 50);

    elements.startStopwatch.classList.add('d-none');
    elements.pauseStopwatch.classList.remove('d-none');
    elements.lapStopwatch.classList.remove('d-none');
  }

  function pauseStopwatch() {
    if (!stopwatchState.running) return;

    clearInterval(stopwatchState.interval);
    stopwatchState.running = false;
    // elapsed time is already calculated in the interval, but one last update ensures precision
    stopwatchState.elapsedTime = Date.now() - stopwatchState.startTime;

    elements.startStopwatch.classList.remove('d-none');
    elements.pauseStopwatch.classList.add('d-none');
    elements.lapStopwatch.classList.add('d-none');
  }

  function resetStopwatch() {
    clearInterval(stopwatchState.interval);
    stopwatchState.running = false;
    stopwatchState.elapsedTime = 0;
    stopwatchState.startTime = 0;
    lapCount = 0;

    elements.stopwatchDisplay.textContent = '00:00:00';
    elements.lapTimes.innerHTML = '';

    elements.startStopwatch.classList.remove('d-none');
    elements.pauseStopwatch.classList.add('d-none');
    elements.lapStopwatch.classList.add('d-none');
  }

  function addLap() {
    if (!stopwatchState.running && stopwatchState.elapsedTime === 0) return;

    lapCount++;
    // Get the most current elapsed time
    const currentElapsedTime = stopwatchState.running ? (Date.now() - stopwatchState.startTime) : stopwatchState.elapsedTime;
    const displaySeconds = Math.floor(currentElapsedTime / 1000);
    const lapTime = formatTime(displaySeconds);

    const lapDiv = document.createElement('div');
    lapDiv.className = 'alarm-item';
    lapDiv.innerHTML = `
      <span>Lap ${lapCount}</span>
      <span class="alarm-time">${lapTime}</span>
    `;
    // Prepend new laps to the top
    elements.lapTimes.prepend(lapDiv);
  }

  // --- Element SDK (Unchanged) ---
  async function onConfigChange(newConfig) {
    config = { ...config,
      ...newConfig
    };

    // Update UI elements based on config
    elements.clockTitle.textContent = config.clock_title || defaultConfig.clock_title;
    elements.timerTabLabel.textContent = config.timer_label || defaultConfig.timer_label;
    elements.alarmTabLabel.textContent = config.alarm_label || defaultConfig.alarm_label;
    elements.stopwatchTabLabel.textContent = config.stopwatch_label || defaultConfig.stopwatch_label;
  }

  function mapToCapabilities(config) {
    return {
      recolorables: [],
      borderables: [],
      fontEditable: undefined,
      fontSizeable: undefined
    };
  }

  function mapToEditPanelValues(config) {
    return new Map([
      ["clock_title", config.clock_title || defaultConfig.clock_title],
      ["timer_label", config.timer_label || defaultConfig.timer_label],
      ["alarm_label", config.alarm_label || defaultConfig.alarm_label],
      ["stopwatch_label", config.stopwatch_label || defaultConfig.stopwatch_label]
    ]);
  }

  // --- Initialization ---
  function init() {
    // Start the clock
    clockInterval = setInterval(updateClock, 1000);
    updateClock();

    // Attach all event listeners
    elements.startTimer.addEventListener('click', startTimer);
    elements.pauseTimer.addEventListener('click', pauseTimer);
    elements.resetTimer.addEventListener('click', resetTimer);

    elements.addAlarm.addEventListener('click', addAlarm);

    elements.startStopwatch.addEventListener('click', startStopwatch);
    elements.pauseStopwatch.addEventListener('click', pauseStopwatch);
    elements.resetStopwatch.addEventListener('click', resetStopwatch);
    elements.lapStopwatch.addEventListener('click', addLap);

    // Initialize Element SDK if available
    if (window.elementSdk) {
      window.elementSdk.init({
        defaultConfig,
        onConfigChange,
        mapToCapabilities,
        mapToEditPanelValues
      });
    }
  }

  // Start the application
  init();

});