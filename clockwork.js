/* Shows NPR's hourly clock for whatever the live stream is playing, turns its minute hand, and runs the stream player.
   Schedule source: http://www.npr.org/audiohelp/progstream.html */
(function () {
  'use strict';

  var STREAM_URL = 'https://npr-ice.streamguys1.com/live.mp3';
  // Seconds the stream runs behind real time. The hand and clockface follow the stream.
  var STREAM_DELAY = 10;
  var FALLBACK_FACE = 'img/regular-clock-circle-exclamation-bl-full.svg';
  var ARTWORK = [{ src: 'img/nprtoday.png', sizes: '256x256', type: 'image/png' }];

  var CLOCKS = {
    me: {
      face: 'img/me2014.svg',
      title: 'Morning Edition'
    },
    atc: {
      face: 'img/atc2014.svg',
      title: 'All Things Considered'
    },
    other: {
      face: 'img/other2014.svg',
      title: 'NPR News'
    }
  };

  // One row per Eastern hour. Each row lists [clock, number of days] runs, starting with Sunday.
  var PROGRAM = [
    [['other', 2], ['me', 5]],
    [['other', 2], ['me', 5]],
    [['other', 2], ['atc', 5]],
    [['other', 2], ['atc', 5]],
    [['other', 7]],
    [['other', 7]],
    [['other', 2], ['atc', 5]],
    [['other', 2], ['atc', 5]],
    [['other', 7]],
    [['other', 7]],
    [['other', 7]],
    [['other', 7]],
    [['other', 1], ['me', 5], ['other', 1]],
    [['other', 1], ['me', 5], ['other', 1]],
    [['other', 7]],
    [['other', 7]],
    [['other', 7]],
    [['other', 7]],
    [['other', 7]],
    [['other', 7]],
    [['other', 7]],
    [['other', 7]],
    [['other', 1], ['atc', 5], ['other', 1]],
    [['other', 1], ['atc', 5], ['other', 1]]
  ];

  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var eastern = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  var clockBox = document.getElementById('clock');
  var face = document.getElementById('clockface');
  var hand = document.getElementById('minuteHand');
  var player = document.getElementById('player');
  var toggle = document.getElementById('toggle');
  var hasMediaSession = 'mediaSession' in navigator && typeof MediaMetadata === 'function';

  var shownClock;

  /**
   * Eastern day, hour and second of the hour that the stream is playing now.
   * @returns {{day: number, hour: number, second: number}|null} null if the formatter output is unrecognized
   */
  function streamTime() {
    var parts = eastern.format(new Date(Date.now() - STREAM_DELAY * 1000)).match(/(\w+)\D+(\d+):(\d+):(\d+)/);
    var day = parts ? DAYS.indexOf(parts[1]) : -1;
    if (day < 0) return null;
    return {
      day: day,
      // Some Chrome releases format midnight as 24 when hour12 is false.
      hour: parseInt(parts[2], 10) % 24,
      second: parseInt(parts[3], 10) * 60 + parseInt(parts[4], 10)
    };
  }

  /**
   * @param {number} day 0 for Sunday
   * @param {number} hour Eastern hour, 0 to 23
   * @returns {Object|null} entry from CLOCKS, or null if the hour is not configured
   */
  function clockFor(day, hour) {
    var runs = PROGRAM[hour] || [];
    for (var i = 0; i < runs.length; i++) {
      if (day < runs[i][1]) return CLOCKS[runs[i][0]];
      day -= runs[i][1];
    }
    return null;
  }

  function showProgram(clock) {
    face.src = clock ? clock.face : FALLBACK_FACE;
    clockBox.className = clock ? '' : 'unknown';
    if (hasMediaSession) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: clock ? clock.title : 'NPR News',
        artist: 'NPR',
        album: 'NPR Today',
        artwork: ARTWORK
      });
    }
  }

  function tick() {
    var time = streamTime();
    var clock = time && clockFor(time.day, time.hour);
    if (clock !== shownClock) {
      shownClock = clock;
      showProgram(clock);
    }
    if (time) hand.setAttribute('transform', 'rotate(' + time.second / 10 + ')');
    setTimeout(tick, 1000 - Date.now() % 1000);
  }

  tick();

  // Player. Stopping drops the connection, so starting again always joins the live broadcast.

  var wantPlaying = false;
  var retryDelay = 2000;
  var retryTimer = null;

  function showState() {
    toggle.className = wantPlaying ? 'playing' : '';
    toggle.setAttribute('aria-label', wantPlaying ? 'Pause' : 'Play');
    if (hasMediaSession) navigator.mediaSession.playbackState = wantPlaying ? 'playing' : 'paused';
  }

  function start() {
    wantPlaying = true;
    clearTimeout(retryTimer);
    retryTimer = null;
    player.src = STREAM_URL;
    var promise = player.play();
    // Browsers that predate the promise return undefined.
    if (promise && promise.catch) {
      promise.catch(function (error) {
        // Autoplay was blocked. Drop the connection so it does not keep downloading.
        if (error.name === 'NotAllowedError') stop();
      });
    }
    showState();
  }

  function stop() {
    wantPlaying = false;
    clearTimeout(retryTimer);
    retryTimer = null;
    player.pause();
    player.removeAttribute('src');
    player.load();
    showState();
  }

  function scheduleRetry() {
    if (!wantPlaying || retryTimer) return;
    retryTimer = setTimeout(start, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 30000);
  }

  // Until playback starts or the button is used, a click anywhere starts it, for browsers that block autoplay.
  function onFirstClick() {
    if (!wantPlaying) start();
  }

  function disarmFirstClick() {
    document.removeEventListener('click', onFirstClick);
  }

  player.addEventListener('playing', function () {
    clearTimeout(retryTimer);
    retryTimer = null;
    retryDelay = 2000;
    disarmFirstClick();
  });
  player.addEventListener('progress', function () {
    clearTimeout(retryTimer);
    retryTimer = null;
  });
  player.addEventListener('error', scheduleRetry);
  player.addEventListener('stalled', scheduleRetry);
  player.addEventListener('ended', scheduleRetry);
  // A pause from outside the page, such as unplugged headphones, counts as a stop. The stream ending or failing also pauses, and those cases retry instead.
  player.addEventListener('pause', function () {
    if (wantPlaying && !player.ended && !player.error) stop();
  });

  // Runs before the document listener, so removing it here keeps this click from restarting playback.
  toggle.addEventListener('click', function () {
    disarmFirstClick();
    if (wantPlaying) stop();
    else start();
  });

  if (hasMediaSession) {
    var actions = { play: start, pause: stop, stop: stop };
    for (var action in actions) {
      // Browsers throw for actions they do not support.
      try {
        navigator.mediaSession.setActionHandler(action, actions[action]);
      } catch (e) {}
    }
  }

  player.removeAttribute('controls');
  player.removeAttribute('autoplay');
  toggle.hidden = false;
  document.addEventListener('click', onFirstClick);
  start();
})();
