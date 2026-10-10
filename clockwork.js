/* Shows NPR's hourly clock for whatever the live stream is playing and turns its minute hand.
   Schedule source: http://www.npr.org/audiohelp/progstream.html */
(function () {
  'use strict';

  var STREAM_URL = 'https://npr-ice.streamguys1.com/live.mp3';
  // Seconds the stream runs behind real time. The hand and clockface follow the stream.
  var STREAM_DELAY = 10;
  var FALLBACK_FACE = 'img/regular-clock-circle-exclamation-bl-full.svg';

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
})();
