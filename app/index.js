'use strict';

var DURATION_IN_SECONDS = 60 * 60; // 60 minutes

var $ = (global.$ = window.$ = global.jQuery = window.jQuery = require('jquery'));
require('jquery-ui-effects');
var ProgressBar = require('progressbar.js');
var STORAGE = {
  domainKey: key => 'time-timer/' + key,
  setObject(key, value) {
    localStorage.setItem(this.domainKey(key), JSON.stringify(value));
  },
  getObject(key) {
    var value = localStorage.getItem(this.domainKey(key));
    return value && JSON.parse(value);
  }
};

var timerType = 'countdown';
var DEFAULT_ALARM_DURATION_SECONDS = 5;
var MIN_ALARM_DURATION_SECONDS = 1;
var MAX_ALARM_DURATION_SECONDS = 30;
var timerAlarmSound = createAlarmSound();
var timerAlarmMuted = false;
var timerAlarmMenuOpen = false;
var timerAlarmTimeout = null;
var timerAlarmDurationSeconds = DEFAULT_ALARM_DURATION_SECONDS;
var timerAlarmUnlocked = false;
var timerAlarmUnlocking = false;
var timerRunning = false;
var timerWakeLock = null;
var timerWakeLockRequestPending = null;
var timerWakeLockReleaseExpected = false;
var currentTheme = 'dark';

var $timerContainer = $('#timerContainer');
var $timerMarks = $('#timerMarks');
var $timerDisk = $('#timerDisk');
var $timerBarKnob = $('#timerBarKnob');
var $timerBarEnd = $('#timerBarEnd');
var $timerTime = $('#timerTime');
var $timerDirection = $('#timerDirection');
var $timerAlarmControl = $('#timerAlarmControl');
var $timerAlarmButton = $('#timerAlarmButton');
var $timerAlarmMenu = $('#timerAlarmMenu');
var $timerAlarmMuteToggle = $('#timerAlarmMuteToggle');
var $timerAlarmDuration = $('#timerAlarmDuration');
var $timerAlarmDurationDecrease = $('#timerAlarmDurationDecrease');
var $timerAlarmDurationIncrease = $('#timerAlarmDurationIncrease');
var $digitalClock = $('#digitalClock');
var $themeToggle = $('#themeToggle');

var timerLastDegree = 0;
var timer = new ProgressBar.Circle($timerDisk.get(0), {
  color: 'inherit', // inherit to support css styling
  trailWidth: 40,
  trailColor: 'inherit', // inherit to support css styling
  strokeWidth: 40,
  duration: 1 * 1000,
  from: { color: '#c11535' },
  to: { color: '#a21630' },
  step: function (state, timer) {
    updateTimerBar(timer, state);
    updateTimerTime(timer, state);
  }
});
timer.svg.style.transform = 'scale(-1, 1)';

// restore configuration from storage
setTimerType(STORAGE.getObject('type') || 'countdown');
setTimerAlarmMuted(Boolean(STORAGE.getObject('alarmMuted')));
setTimerAlarmDuration(STORAGE.getObject('alarmDurationSeconds') || DEFAULT_ALARM_DURATION_SECONDS);
setTheme(STORAGE.getObject('theme') || 'dark');

function createAlarmSound() {
  var audio = new Audio('sounds/alarm_digital.mp3');
  audio.loop = true;
  audio.preload = 'auto';
  return audio;
}

function setTimerType(type) {
  if (type !== timerType) {
    timerLastDegree = 360.0 - timerLastDegree;
  }

  timerType = type;

  // Recreate timer marks with correct number ordering
  createTimerMarks(timerType);

  var rotate = 0.0;
  var marksRotate = 0.0;
  var directionImage = 'graphics/countdown.svg';
  if (timerType == 'countup') {
    rotate = 180.0;
    marksRotate = -180.0;
    directionImage = 'graphics/countup.svg';
  }

  $timerDirection.find('img').attr('src', directionImage);

  var animation_transform_rotateY = {
    duration: 1500,
    easing: 'easeOutBack',
    step: function (now, tween) {
      if (tween.prop === 'transform_rotateY') {
        $(this).css('transform', 'rotateY(' + now + 'deg)');
      }
    }
  };

  $timerContainer.animate({ transform_rotateY: rotate }, animation_transform_rotateY);
  $timerTime.animate({ transform_rotateY: rotate }, animation_transform_rotateY);
  $timerMarks.animate({ transform_rotateY: marksRotate }, animation_transform_rotateY);

  startTimer();
}

function toggleTimerType() {
  if (timerType == 'countdown') {
    setTimerType('countup');
  } else {
    setTimerType('countdown');
  }
}

function updateTimerAlarmControl() {
  var iconPath = timerAlarmMuted ? 'graphics/alarm-muted.svg' : 'graphics/alarm-unmuted.svg';
  var iconAlt = timerAlarmMuted ? 'Alarm muted' : 'Alarm enabled';
  var menuStateText = timerAlarmMuted ? 'muted' : 'unmuted';

  $timerAlarmButton.find('img').attr('src', iconPath).attr('alt', iconAlt);
  $timerAlarmMuteToggle
    .text(menuStateText)
    .attr('aria-pressed', timerAlarmMuted)
    .toggleClass('is-muted', timerAlarmMuted)
    .toggleClass('is-unmuted', !timerAlarmMuted);

  $timerAlarmDuration.text(timerAlarmDurationSeconds);
}

function setTimerAlarmMenuOpen(isOpen) {
  timerAlarmMenuOpen = isOpen;
  $timerAlarmControl.toggleClass('menu-open', isOpen);
  $timerAlarmMenu.toggleClass('is-open', isOpen).attr('aria-hidden', !isOpen);
  $timerAlarmButton.attr('aria-expanded', isOpen);
}

function stopTimerAlarm() {
  clearTimeout(timerAlarmTimeout);
  timerAlarmTimeout = null;
  timerAlarmSound.pause();
  timerAlarmSound.currentTime = 0;
}

function unlockTimerAlarm() {
  if (timerAlarmUnlocked || timerAlarmUnlocking) {
    return;
  }

  timerAlarmUnlocking = true;
  timerAlarmSound.muted = true;

  var unlockPromise = timerAlarmSound.play();
  if (unlockPromise && unlockPromise.then) {
    unlockPromise
      .then(function () {
        timerAlarmUnlocked = true;
      })
      .catch(function () {})
      .finally(function () {
        timerAlarmSound.pause();
        timerAlarmSound.currentTime = 0;
        timerAlarmSound.muted = false;
        timerAlarmUnlocking = false;
      });
    return;
  }

  timerAlarmUnlocked = true;
  timerAlarmSound.pause();
  timerAlarmSound.currentTime = 0;
  timerAlarmSound.muted = false;
  timerAlarmUnlocking = false;
}

function playTimerAlarm() {
  stopTimerAlarm();
  if (timerAlarmMuted) {
    return;
  }

  var playPromise = timerAlarmSound.play();
  if (playPromise && playPromise.catch) {
    playPromise.catch(function () {});
  }

  timerAlarmTimeout = setTimeout(function () {
    stopTimerAlarm();
  }, timerAlarmDurationSeconds * 1000);
}

function setTimerAlarmMuted(muted) {
  timerAlarmMuted = muted;
  STORAGE.setObject('alarmMuted', muted);
  if (timerAlarmMuted) {
    stopTimerAlarm();
  }
  updateTimerAlarmControl();
}

function setTimerAlarmDuration(seconds) {
  timerAlarmDurationSeconds = Math.max(
    MIN_ALARM_DURATION_SECONDS,
    Math.min(MAX_ALARM_DURATION_SECONDS, parseInt(seconds, 10) || DEFAULT_ALARM_DURATION_SECONDS)
  );
  STORAGE.setObject('alarmDurationSeconds', timerAlarmDurationSeconds);
  updateTimerAlarmControl();
}

function setTheme(theme) {
  currentTheme = theme;

  var $body = $('body');
  $body.removeClass('light-mode dark-mode');
  $body.addClass(theme + '-mode');

  var themeIcon = theme === 'dark' ? 'graphics/light-mode.svg' : 'graphics/dark-mode.svg';
  $themeToggle.find('img').attr('src', themeIcon);

  STORAGE.setObject('theme', theme);
}

function supportsScreenWakeLock() {
  return navigator.wakeLock && typeof navigator.wakeLock.request === 'function';
}

function handleTimerWakeLockRelease() {
  var shouldReacquire =
    !timerWakeLockReleaseExpected && timerRunning && document.visibilityState === 'visible';

  timerWakeLock = null;
  timerWakeLockReleaseExpected = false;

  if (shouldReacquire) {
    requestTimerWakeLock();
  }
}

function requestTimerWakeLock() {
  if (!timerRunning || !supportsScreenWakeLock() || document.visibilityState !== 'visible') {
    return Promise.resolve(null);
  }

  if (timerWakeLock) {
    return Promise.resolve(timerWakeLock);
  }

  if (timerWakeLockRequestPending) {
    return timerWakeLockRequestPending;
  }

  timerWakeLockRequestPending = navigator.wakeLock
    .request('screen')
    .then(function (sentinel) {
      timerWakeLockRequestPending = null;
      timerWakeLock = sentinel;

      if (timerWakeLock && typeof timerWakeLock.addEventListener === 'function') {
        timerWakeLock.addEventListener('release', handleTimerWakeLockRelease);
      }

      if (!timerRunning || document.visibilityState !== 'visible') {
        return releaseTimerWakeLock().then(function () {
          return null;
        });
      }

      return sentinel;
    })
    .catch(function () {
      timerWakeLockRequestPending = null;
      return null;
    });

  return timerWakeLockRequestPending;
}

function releaseTimerWakeLock() {
  var wakeLock = timerWakeLock;

  if (!wakeLock || typeof wakeLock.release !== 'function') {
    timerWakeLock = null;
    timerWakeLockReleaseExpected = false;
    return Promise.resolve();
  }

  timerWakeLock = null;
  timerWakeLockReleaseExpected = true;

  return wakeLock
    .release()
    .catch(function () {})
    .then(function () {
      if (timerWakeLockReleaseExpected) {
        timerWakeLockReleaseExpected = false;
      }
    });
}

function toggleTheme() {
  if (currentTheme === 'dark') {
    setTheme('light');
  } else {
    setTheme('dark');
  }
}

function updateTimerBar(timer, state) {
  timer.path.setAttribute('stroke', state.color);

  var rotation = timer.value() * 360.0;

  // Position timer bar knob: rotate around center, then translate outward to edge
  $timerBarKnob.css({
    transform: 'rotate(' + -rotation + 'deg) translateY(calc(var(--timer-radius) * -0.875))'
  });
}

function updateTimerTime(timer, state) {
  var valueSeconds = Math.round(timer.value() * DURATION_IN_SECONDS);
  $timerTime.text(seconds2Date(valueSeconds).toISOString().substr(14, 5));
  timer.valueSeconds = valueSeconds;
}

function startTimer() {
  stopTimerAlarm();
  var finishValue = timerType == 'countdown' ? 0.0 : 1.0;
  var valueDiff = Math.abs(finishValue - timer.value());
  var duration = DURATION_IN_SECONDS * 1000 * valueDiff;
  timerRunning = duration > 0;
  if (duration > 0) {
    requestTimerWakeLock();
    timer.animate(finishValue, { duration });
    clearTimeout(timer.timeout);
    timer.timeout = setTimeout(function () {
      timerRunning = false;
      releaseTimerWakeLock();
      playTimerAlarm();
    }, duration);
  } else {
    releaseTimerWakeLock();
  }
}

function stopTimer() {
  timerRunning = false;
  clearTimeout(timer.timeout);
  stopTimerAlarm();
  releaseTimerWakeLock();
  timer.stop();
}

function snapDegreesToNearest5Seconds(deg) {
  var seconds = (deg / 360.0) * DURATION_IN_SECONDS;
  var snappedSeconds = Math.round(seconds / 5) * 5;
  var snappedDeg = (snappedSeconds / DURATION_IN_SECONDS) * 360.0;
  return Math.max(0, Math.min(360, snappedDeg));
}

function setTimer(deg) {
  var startValue = timerType == 'countdown' ? 0.0 : 1.0;
  var newValue = Math.abs(startValue - deg / 360.0);
  timer.set(newValue);
}

function seconds2Date(seconds) {
  var date = new Date(null);
  date.setSeconds(seconds);
  return date;
}

var countainerMousedown = false;
$timerContainer.bind('mousedown touchstart', function (e) {
  countainerMousedown = true;
  stopTimer();
  e.originalEvent.preventDefault();
});

$(document)
  .bind('mousemove touchmove', function (e) {
    if (countainerMousedown) {
      var containerOffset = $timerContainer.offset();
      var movePos = {
        x: (e.pageX || e.originalEvent.touches[0].pageX) - containerOffset.left,
        y: (e.pageY || e.originalEvent.touches[0].pageY) - containerOffset.top
      };
      var containerRadius = $timerContainer.width() / 2;
      var atan = Math.atan2(movePos.x - containerRadius, movePos.y - containerRadius);
      var targetDeg = atan / (Math.PI / 180.0) + 180.0;

      if (timerLastDegree < 90.0 && targetDeg > 270.0) {
        targetDeg = 0.0;
      } else if (timerLastDegree > 270.0 && targetDeg < 90.0) {
        targetDeg = 360.0;
      }
      targetDeg = snapDegreesToNearest5Seconds(targetDeg);
      timerLastDegree = targetDeg;
      setTimer(targetDeg);
    }
  })
  .bind('mouseup touchend', function (e) {
    if (countainerMousedown) {
      countainerMousedown = false;
      startTimer();
    }
  });

$timerDirection.bind('click tap', toggleTimerType);
$themeToggle.bind('click tap', toggleTheme);
$timerAlarmButton.on('click', function (event) {
  event.preventDefault();
  event.stopPropagation();
  setTimerAlarmMenuOpen(!timerAlarmMenuOpen);
});

$timerAlarmMenu.on('click', function (event) {
  event.stopPropagation();
});

$timerAlarmMuteToggle.on('click', function (event) {
  event.preventDefault();
  event.stopPropagation();
  setTimerAlarmMuted(!timerAlarmMuted);
});

$timerAlarmDurationDecrease.on('click', function (event) {
  event.preventDefault();
  event.stopPropagation();
  setTimerAlarmDuration(timerAlarmDurationSeconds - 1);
});

$timerAlarmDurationIncrease.on('click', function (event) {
  event.preventDefault();
  event.stopPropagation();
  setTimerAlarmDuration(timerAlarmDurationSeconds + 1);
});

$(document).on('click', function () {
  if (timerAlarmMenuOpen) {
    setTimerAlarmMenuOpen(false);
  }
});

$(document).on('keydown', function (event) {
  if (event.key === 'Escape' && timerAlarmMenuOpen) {
    setTimerAlarmMenuOpen(false);
  }
});

['pointerdown', 'keydown', 'touchstart', 'mousedown'].forEach(function (eventName) {
  document.addEventListener(eventName, unlockTimerAlarm, {
    capture: true,
    once: true
  });
});

['pointerdown', 'keydown', 'touchstart', 'mousedown'].forEach(function (eventName) {
  document.addEventListener(
    eventName,
    function () {
      if (timerRunning) {
        requestTimerWakeLock();
      }
    },
    {
      capture: true
    }
  );
});

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') {
    requestTimerWakeLock();
  } else {
    releaseTimerWakeLock();
  }
});

// Initial Time
var urlParams = new URLSearchParams(window.location.search);
if (!urlParams.has('init')) {
  urlParams.set('init', '0');
  var newUrl = window.location.pathname + '?' + urlParams.toString();
  window.history.replaceState({}, '', newUrl);
}
var initialTimerSeconds = parseInt(urlParams.get('init')) || 0;
var initialTimerDeg = (initialTimerSeconds / DURATION_IN_SECONDS) * 360;
initialTimerDeg = Math.max(initialTimerDeg, 0);
initialTimerDeg = Math.min(initialTimerDeg, 360);
if (initialTimerDeg > 0) {
  setTimer(initialTimerDeg);
  startTimer();
}

// Timer Marks and Numbers
function createTimerMarks(type) {
  var marksHtml = '';

  // Create 60 tick marks (one for each minute)
  for (var i = 0; i < 60; i++) {
    var angle = i * 6; // 360 / 60 = 6 degrees per minute
    var isMajor = i % 5 === 0; // Major tick every 5 minutes
    var tickClass = isMajor ? 'timer-tick-major' : 'timer-tick-minor';

    marksHtml +=
      '<div class="timer-tick ' +
      tickClass +
      '" style="transform: rotate(' +
      angle +
      'deg);"></div>';
  }

  // Create numbers (0, 5, 10, 15, etc.)
  // For countdown: clockwise (0, 5, 10, 15...)
  // For countup: counter-clockwise (0, 55, 50, 45...)
  for (var j = 0; j < 60; j += 5) {
    var labelAngle = j * 6;
    var number = j;

    // In countup mode, reverse the number positions to go counter-clockwise
    if (type === 'countup') {
      number = (60 - j) % 60;
    }

    marksHtml +=
      '<div class="timer-number" style="transform: rotate(' +
      -labelAngle +
      'deg) translateY(calc(var(--timer-radius) * -0.95)) rotate(' +
      labelAngle +
      'deg);">' +
      number +
      '</div>';
  }

  $timerMarks.html(marksHtml);
}

createTimerMarks(timerType);

// Digital Clock
function updateDigitalClock() {
  var now = new Date();
  var hours = String(now.getHours()).padStart(2, '0');
  var minutes = String(now.getMinutes()).padStart(2, '0');
  $digitalClock.text(hours + ':' + minutes);
}

updateDigitalClock();
setInterval(updateDigitalClock, 1000);

// Display version info
var versionInfo = require('./version.js');
var buildDate = new Date(versionInfo.BUILD_DATE);
var $versionDisplay = $('<div id="versionInfo"></div>');

$versionDisplay.text('v' + versionInfo.VERSION);
$versionDisplay.attr(
  'data-tooltip',
  isNaN(buildDate.getTime())
    ? versionInfo.BUILD_DATE
    : new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
        .format(buildDate)
        .replace(' ', 'T') + ' ET'
);
$('body').append($versionDisplay);

// Create Buy Me a Coffee button with custom image
function setupBuyMeCoffeeButton() {
  var container = document.getElementById('buyMeCoffee');
  if (container) {
    var link = document.createElement('a');
    link.href = 'https://buymeacoffee.com/andrew.chen';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    var img = document.createElement('img');
    img.src = 'graphics/buy-me-coffee.svg';
    img.alt = 'Buy me a coffee';

    link.appendChild(img);
    container.appendChild(link);
  }
}
setupBuyMeCoffeeButton();
