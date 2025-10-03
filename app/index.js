"use strict";

var DURATION_IN_SECONDS = 60 * 60; // 60 minutes

var $ = global.$ = window.$ = global.jQuery = window.jQuery = require('jquery');
require('jquery-ui-effects');
var ProgressBar = require('progressbar.js');
var STORAGE = {
  domainKey: (key) => 'time-timer/' + key,
  setObject(key, value) {
      localStorage.setItem(this.domainKey(key), JSON.stringify(value));
  },
  getObject(key) {
      var value = localStorage.getItem(this.domainKey(key));
      return value && JSON.parse(value);
  }
}

var timerType = "countdown";
var timerAlarmSound = new Audio('sounds/alarm_digital.mp3');
var currentTheme = "dark";

var $timerContainer = $('#timerContainer');
var $timerMarks = $('#timerMarks');
var $timerDisk = $('#timerDisk');
var $timerBarKnob = $('#timerBarKnob');
var $timerBarEnd = $('#timerBarEnd');
var $timerTime = $('#timerTime');
var $timerDirection = $('#timerDirection');
var $timerAlarmSelector = $('#timerAlarmSelector');
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
  to:   { color: '#a21630' },
  step: function(state, timer) {
    updateTimerBar(timer, state);
    updateTimerTime(timer, state);
  }
});
timer.svg.style.transform= 'scale(-1, 1)';

// restore configuration from storage
setTimerType(STORAGE.getObject('type') || 'countdown');
setTimerAlarmSound(STORAGE.getObject('alarmSound') || 'digital');
setTheme(STORAGE.getObject('theme') || 'dark');

function setTimerType(type){
  if (type !== timerType) {
    timerLastDegree = 360.0 - timerLastDegree;
  }

  timerType = type;

  var rotate = 0.0;
  var marksRotate = 0.0;
  var directionImage = 'graphics/countdown.svg';
  if(timerType == "countup") {
    rotate = 180.0;
    marksRotate = -180.0;
    directionImage = 'graphics/countup.svg';
  }

  $timerDirection.find('img').attr("src", directionImage);

  var animation_transform_rotateY = {
    duration: 1500,
    easing: 'easeOutBack',
    step: function(now, tween) {
      if (tween.prop === 'transform_rotateY') {
        $(this).css('transform','rotateY(' + now +'deg)' );
      }
    }
  };

  $timerContainer.animate({ transform_rotateY: rotate }, animation_transform_rotateY);
  $timerTime.animate({ transform_rotateY: rotate }, animation_transform_rotateY);
  $timerMarks.animate({ transform_rotateY: marksRotate }, animation_transform_rotateY);

  startTimer();
}

function toggleTimerType(){
  if(timerType == "countdown") {
    setTimerType("countup")
  } else {
    setTimerType("countdown")
  }
}

function setTimerAlarmSound(sound){
  timerAlarmSound = new Audio(`sounds/alarm_${sound}.mp3`);
  STORAGE.setObject("alarmSound", sound);
}
global.setTimerAlarmSound = setTimerAlarmSound

function setTheme(theme){
  currentTheme = theme;

  var $body = $('body');
  $body.removeClass('light-mode dark-mode');
  $body.addClass(theme + '-mode');

  var themeIcon = theme === 'dark' ? 'graphics/light-mode.svg' : 'graphics/dark-mode.svg';
  $themeToggle.find('img').attr("src", themeIcon);

  STORAGE.setObject('theme', theme);
}

function toggleTheme(){
  if(currentTheme === "dark") {
    setTheme("light");
  } else {
    setTheme("dark");
  }
}

function updateTimerBar(timer, state){
  timer.path.setAttribute('stroke', state.color);

  var rotation = timer.value() * 360.0;

  // Position timer bar knob: rotate around center, then translate outward to edge (35vmin = radius)
  $timerBarKnob.css({
    transform: 'rotate(' + (-rotation) + 'deg) translateY(-35vmin)'
  });
}

function updateTimerTime(timer, state){
  var valueSeconds = Math.round(timer.value() * DURATION_IN_SECONDS);
  $timerTime.text(seconds2Date(valueSeconds).toISOString().substr(14, 5));
  timer.valueSeconds = valueSeconds;
}

function startTimer(){
  var finishValue = timerType == "countdown" ? 0.0 : 1.0;
  var valueDiff = Math.abs(finishValue - timer.value());
  var duration = DURATION_IN_SECONDS * 1000 * valueDiff;
  if(duration > 0) {
    timer.animate(finishValue, { duration });
    clearTimeout(timer.timeout);
    timer.timeout = setTimeout(function(){
      timerAlarmSound.play();
    }, duration);
  }
}

function stopTimer(){
  clearTimeout(timer.timeout);
  timer.stop();
}

function setTimer(deg){
  var startValue = timerType == "countdown" ? 0.0 : 1.0;
  var newValue = Math.abs(startValue - (deg / 360.0));
  timer.set(newValue);
}

function seconds2Date(seconds){
  var date = new Date(null);
  date.setSeconds(seconds);
  return date;
}

var countainerMousedown = false;
$timerContainer.bind('mousedown touchstart', function(e) {
  countainerMousedown = true;
  stopTimer();
  e.originalEvent.preventDefault();
});

$(document)
  .bind('mousemove touchmove', function(e) {
    if (countainerMousedown) {
      var containerOffset = $timerContainer.offset();
      var movePos = {
        x: (e.pageX||e.originalEvent.touches[0].pageX)- containerOffset.left,
        y: (e.pageY||e.originalEvent.touches[0].pageY) - containerOffset.top
      };
      var containerRadius = $timerContainer.width() / 2;
      var atan = Math.atan2(movePos.x - containerRadius, movePos.y - containerRadius);
      var targetDeg = atan / (Math.PI / 180.0) + 180.0;

      if (timerLastDegree < 90.0 && targetDeg > 270.0 ){
        targetDeg = 0.0;
      } else if (timerLastDegree > 270.0 && targetDeg < 90.0 ){
        targetDeg = 360.0;
      }
      timerLastDegree = targetDeg;
      setTimer(targetDeg);
    }
  })
  .bind('mouseup touchend', function(e) {
    if (countainerMousedown) {
      countainerMousedown = false;
      startTimer();
    }
  });

$timerDirection.bind('click tap', toggleTimerType);
$themeToggle.bind('click tap', toggleTheme);

// Initial Time
var urlParams = new URLSearchParams(window.location.search);
if (!urlParams.has('init')) {
  urlParams.set('init', '0');
  var newUrl = window.location.pathname + '?' + urlParams.toString();
  window.history.replaceState({}, '', newUrl);
}
var initialTimerSeconds = parseInt(urlParams.get('init')) || 0
var initialTimerDeg = initialTimerSeconds / DURATION_IN_SECONDS * 360
initialTimerDeg = Math.max(initialTimerDeg, 0);
initialTimerDeg = Math.min(initialTimerDeg, 360);
if (initialTimerDeg > 0) {
  setTimer(initialTimerDeg);
  startTimer();
}

// Timer Marks and Numbers
function createTimerMarks() {
  var marksHtml = '';

  // Create 60 tick marks (one for each minute)
  for (var i = 0; i < 60; i++) {
    var angle = i * 6; // 360 / 60 = 6 degrees per minute
    var isMajor = i % 5 === 0; // Major tick every 5 minutes
    var tickClass = isMajor ? 'timer-tick-major' : 'timer-tick-minor';

    marksHtml += '<div class="timer-tick ' + tickClass + '" style="transform: rotate(' + angle + 'deg);"></div>';
  }

  // Create numbers (0, 5, 10, 15, etc.) - counter-clockwise
  for (var i = 0; i < 60; i += 5) {
    var angle = i * 6;
    var number = i;

    marksHtml += '<div class="timer-number" style="transform: rotate(' + (-angle) + 'deg) translateY(-38vmin) rotate(' + angle + 'deg);">' + number + '</div>';
  }

  $timerMarks.html(marksHtml);
}

createTimerMarks();

// Digital Clock
function updateDigitalClock() {
  var now = new Date();
  var hours = String(now.getHours()).padStart(2, '0');
  var minutes = String(now.getMinutes()).padStart(2, '0');
  var seconds = String(now.getSeconds()).padStart(2, '0');
  $digitalClock.text(hours + ':' + minutes + ':' + seconds);
}

updateDigitalClock();
setInterval(updateDigitalClock, 1000);

// Display version info
var versionInfo = require('./version.js');
var $versionDisplay = $('<div id="versionInfo"></div>');
$versionDisplay.text('v' + versionInfo.VERSION + ' (' + versionInfo.BUILD_DATE + ')');
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
    img.src = 'graphics/coffee.png';
    img.alt = 'Buy me a coffee';
    img.style.width = '32px';
    img.style.height = '32px';

    link.appendChild(img);
    container.appendChild(link);
  }
}
setupBuyMeCoffeeButton();
