/********************************************
 * Guitar Strings Code from Google, 2012 
 * https://experiments.withgoogle.com/jam-with-chrome
 * Shim by Paul Irish
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 ********************************************/

var mouseButtonDown = false;
$(document).mousedown(function() {
  mouseButtonDown = true;
}).mouseup(function() {
  mouseButtonDown = false;  
});

window.requestAnimFrame = (function () {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

// Grab the elements from the dom
function Stage(id) {
  this.el = document.getElementById(id);

  // Find the position of the stage element
  this.position();
  // Listen for events
  this.listeners();
  // Listen for hits
  this.hitZones = [];
  return this;
}

Stage.prototype.position = function () {
  var offset = this.offset();
  this.positionTop = Math.floor(offset.left);
  this.positionLeft = Math.floor(offset.top);
};

Stage.prototype.offset = function () {
  var _x, _y,
    el = this.el;

  if (typeof el.getBoundingClientRect !== "undefined") {
    return el.getBoundingClientRect();
  } else {
    _x = 0;
    _y = 0;
    while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
      _x += el.offsetLeft;
      _y += el.offsetTop;
      el = el.offsetParent;
    }
    return { top: _y - window.scrollY, left: _x - window.scrollX };
  }
};

Stage.prototype.listeners = function () {
  var _self = this;

  _self.dragging = false;
  _self.limit = false;
  _self.isHoveringOverString = false;
  _self.hoveringString = null;

  window.addEventListener('resize', function () {
    _self.position();
  }, false);

  window.addEventListener('scroll', function () {
    _self.position();
  }, false);

  this.el.addEventListener('mousemove', function (e) {
    var x = e.clientX - _self.positionTop,
      y = e.clientY - _self.positionLeft;

    _self.isHoveringOverString = false;
    _self.hitZones.forEach(function (zone) {
      if (_self.checkPoint(x, y, zone)) {
        _self.isHoveringOverString = true;
        _self.hoveringString = zone;
      }
    });

    // console.log(_self.isHoveringOverString);
    if (_self.isHoveringOverString) {
      document.getElementById("stage").style.cursor = "pointer";
    }
    else {
      document.getElementById("stage").style.cursor = "default";
    }

    _self.dragging = true;
    if (!_self.prev) {
      _self.prev = [x, y];
    }

  }, false);

  document.addEventListener("click", function (e) {
    if (_self.isHoveringOverString && _self.hoveringString) {
      _self.hoveringString.string.strum();
      instrument.playNote(_self.hoveringString.stringnum, instrument.currentInstrument);
    }
  });


  document.addEventListener('mousemove', function (e) {
    var x, y;

    if (!_self.dragging || _self.limit) return;
    _self.limit = true;

    x = e.clientX - _self.positionTop,
      y = e.clientY - _self.positionLeft;




    _self.hitZones.forEach(function (zone) {
      _self.checkIntercept(_self.prev[0],
        _self.prev[1],
        x,
        y,
        zone);
    });

    _self.prev = [x, y];

    setInterval(function () {
      _self.limit = false;
    }, 50);
  }, false);

  document.addEventListener('mouseup', function (e) {
    var x, y;

    if (!_self.dragging) return;
    _self.dragging = false;

    x = e.clientX - _self.positionTop,
      y = e.clientY - _self.positionLeft;

    _self.hitZones.forEach(function (zone) {
      _self.checkIntercept(_self.prev[0],
        _self.prev[1],
        x,
        y,
        zone);
    });
  }, false);
};

Stage.prototype.check = function (x, y, zone) {
  if (!zone.el) return;

  if (zone.inside(x, y)) {
    zone.el.classList.add('hit');
    this.el.classList.add('active');
  } else {
    zone.el.classList.remove('hit');
    this.el.classList.remove('active');
  }
};

Stage.prototype.addRect = function (id) {
  var el = document.getElementById(id),
    rect = new Rect(el.offsetLeft,
      el.offsetTop,
      el.offsetWidth,
      el.offsetHeight
    );
  rect.el = el;

  this.hitZones.push(rect);
  return rect;
};

Stage.prototype.addString = function (rect, string) {
  rect.string = string;

  this.hitZones.push(rect);
  return rect;
};

Stage.prototype.checkPoint = function (x, y, zone) {
  if (zone.inside(x, y)) {
    // zone.string.strum();
    return true;
  }
  else {
    // console.log(zone,x,y);
    return false;
  }
};

Stage.prototype.checkIntercept = function (x1, y1, x2, y2, zone) {
  if (zone.intercept(x1, y1, x2, y2) && mouseButtonDown) {
    // console.log("Intercept Called")
    zone.string.strum();
    instrument.playNote(zone.stringnum, instrument.currentInstrument);
  }
  //  console.log(zone, x1,y1,x2,y2);
};


function Rect(i, x, y, width, height) {
  this.stringnum = i;
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;

  return this;
}

Rect.prototype.inside = function (x, y) {
  return x >= this.x && y >= (this.y - this.height * 3)
    && x <= this.x + this.width
    && y <= this.y + this.height;
};

Rect.prototype.midLine = function () {
  if (this.middle) return this.middle;

  this.middle = [
    { x: this.x, y: this.y + this.height / 2 },
    { x: this.x + this.width, y: this.y + this.height / 2 }
  ]
  return this.middle;
};

Rect.prototype.intercept = function (x1, y1, x2, y2) {
  var result = false,
    segment = this.midLine(),
    start = { x: x1, y: y1 },
    end = { x: x2, y: y2 };
  if (this.intersectLine(segment[0], segment[1], start, end)) {
    // console.log(this, segment[0], segment[1], start, end);
    // instrument.playNote(this.stringnum, instrument.currentInstrument);
  }
  if (this.inside(x1, y1)) {
    // console.log('Did not intercept, debug info:');
    // console.log(segment[0], segment[1], start, end);
    // console.log('end <--');
  }

  // console.log(this.intersectLine(segment[0], segment[1], start, end));
  return this.intersectLine(segment[0], segment[1], start, end);
};

Rect.prototype.intersectLine = function (a1, a2, b1, b2) {
  //-- http://www.kevlindev.com/gui/math/intersection/Intersection.js
  var result,
    ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
    ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
    u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

  if (u_b != 0) {
    var ua = ua_t / u_b;
    var ub = ub_t / u_b;

    if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
      result = true;
    } else {
      result = false; //--"No Intersection"
    }
  } else {
    if (ua_t == 0 || ub_t == 0) {
      result = false; //-- Coincident"
    } else {
      result = false; //-- Parallel
    }
  }
  return result;
};

// Rect.prototype.update = function() {
//     this.width = window.innerWidth * 0.8;
// }

function GuitarString(rect) {
  this.x = rect.x;
  this.y = rect.y + rect.height / 2;
  this.rectangle = rect;
  this.width = rect.width;
  this._strumForce = 0;
  this.a = 0;
}

GuitarString.prototype.strum = function () {
  this._strumForce = 8;
  //   document.getElementById('audiotag1').play();
  // console.log("Strum called");
};

GuitarString.prototype.render = function (ctx, canvas) {
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(this.x, this.y);
  ctx.bezierCurveTo(
    this.x, this.y + Math.sin(this.a) * this._strumForce,
    this.x + this.width, this.y + Math.sin(this.a) * this._strumForce,
    this.x + this.width, this.y);
  ctx.stroke();

  this._strumForce *= 0.95;
  this.a += 0.5;
};


function StringInstrument(stageID, canvasID, stringNum) {
  this.strings = [];
  this.canvas = document.getElementById(canvasID);
  this.stage = new Stage(stageID);
  this.ctx = this.canvas.getContext('2d');
  this.stringNum = stringNum;
  this.create();
  this.render();

  return this;
}

StringInstrument.prototype.create = function () {
  for (var i = 0; i < this.stringNum; i++) {
    var srect = new Rect(i, 0, 90 + i * 75, window.innerWidth * 0.9, 5);
    var s = new GuitarString(srect);
    this.stage.addString(srect, s);
    this.strings.push(s);
  }
};

StringInstrument.prototype.render = function () {
  var _self = this;

  requestAnimFrame(function () {
    _self.render();
  });

  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  for (var i = 0; i < this.stringNum; i++) {
    this.strings[i].render(this.ctx);
    // this.strings[i].rectangle.update();
  }
};

/*************************
 * Magenta Utils and helpers
 ************************/

function getTemperature() {
  const hash = parseFloat(parseHashParameters()['temperature']) || 0.3;
  const newTemp = Math.min(1, hash);
  console.log('🧞‍♀️ temperature = ', newTemp);
  return newTemp;
}

function parseHashParameters() {
  const hash = window.location.hash.substring(1);
  const params = {}
  hash.split('&').map(hk => {
    let temp = hk.split('=');
    params[temp[0]] = temp[1]
  });
  return params;
}



//Instrument

const MAPPING_8 = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 };
const MAPPING_4 = { 0: 0, 1: 2, 2: 5, 3: 7 };
const BUTTONS_DEVICE = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

let OCTAVES = 7;
let NUM_BUTTONS = 8;
let BUTTON_MAPPING = MAPPING_8;

let completekeyWhitelist = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
  49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65,
  66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
  83, 84, 85, 86, 87];
let keyWhitelist = [0, 2, 3, 5, 7, 8, 10, 12, 14,
    15, 17, 19, 20, 22, 24, 26, 27, 29, 31,
    32, 34, 36, 38, 39, 41, 43, 44, 46, 48,
    50, 51, 53, 55, 56, 58, 60, 62, 63, 65,
    67, 68, 70, 72, 74, 75, 77, 79, 80, 82,
    84, 86, 87];
let TEMPERATURE = getTemperature();

const heldButtonToVisualData = new Map();

// Which notes the pedal is sustaining.
let sustaining = false
let sustainingNotes = [];


function Instrument() {
  //Samples from London Philaharmonic
  this.violinPlayer = new mm.Player.tone.Sampler(
    {
      "A4": "samples/violin-a4.mp3" //Unknown lol
    }
  );
  this.violinPlayer.envelope = {
    attack: 0.2,
    decay: 0.5,
    sustain: 0.5,
    release: 0.1
  }
  this.violinPlayer.volume.value = 15;

  this.violaPlayer = new mm.Player.tone.Sampler(
    {
      "B4": "samples/viola-b4.mp3" //viola_A4_15_fortissimo_arco-normal.mp3
      //"D4": "samples/viola-d4.mp3" viola_D4_05_fortissimo_arco-normal
      //"D4": "samples/viola-d4.mp3",viola_D4_05_mezzo-piano_arco-normal
      // "C3": "samples/viola-c3.mp3"//viola_C3_1_fortissimo_arco-normal
    }
  );
  this.violaPlayer.envelope = {
    attack: 0.2,
    decay: 0.5,
    sustain: 0.5,
    release: 0.1
  }
  this.violaPlayer.volume.value = 15;


  this.celloPlayer = new mm.Player.tone.Sampler(
    {
      "A3": "samples/cello-a3.mp3"//cello_A3_15_forte_arco-normal
    }
  );
  this.celloPlayer.envelope = {
    attack: 0.01,
    decay: 0.2,
    sustain: 0.2,
    release: 0.01
  }
  this.celloPlayer.volume.value = 15;

  this.bassPlayer = new mm.Player.tone.Sampler(
    {
      "D2": "samples/bass-d2.mp3", //double-bass_D2_15_forte_arco-normal
      "D3": "samples/bass-d3.mp3", //double-bass_D3_15_forte_arco-normal
      "D4": "samples/bass-d3.mp3" //double-bass_D4_15_forte_arco-normal
    }
  );
  //TODO: scales don't seem quite right
  this.violinScale = ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "A5"];
  this.violaScale = ["C3", "D3", "E3", "F3", "G3", "A4", "B4", "C4"];
  this.celloScale = ["C2", "D2", "E2", "F2", "G2", "A3", "B3", "C3"];
  this.bassScale = ["A2", "B2", "C2", "D2", "E3", "F3", "G3", "A3"];
  this.currentInstrument = "Violin";
  this.currentScale = this.violinScale;
  this.currentPlayer = this.violinPlayer;
  this.individual = false;
  this.muted = false;
  this.robotoff = true;
  // this.genie = new mm.PianoGenie(CONSTANTS.GENIE_CHECKPOINT);
  this.initialize();
  return this;
}

Instrument.prototype.initialize = function () {
  this.violinPlayer.toMaster();
  var vibrato1 = new mm.Player.tone.Vibrato({
    maxDelay : 0.005 ,
    frequency : 5 ,
    depth : 0.1
    }).toMaster();
  this.violinPlayer.connect(vibrato1);

  this.violaPlayer.toMaster();
  var vibrato2 = new mm.Player.tone.Vibrato({
    maxDelay : 0.001 ,
    frequency : 0.1 ,
    depth : 0.5
    }).toMaster();
  this.violaPlayer.connect(vibrato2);

  this.celloPlayer.toMaster();
  var vibrato3 = new mm.Player.tone.Vibrato({
    maxDelay : 0.001 ,
    frequency : 0.2 ,
    depth : 0.1
    }).toMaster();
  // this.celloPlayer.connect(vibrato3);

  this.bassPlayer.toMaster();
  var vibrato4 = new mm.Player.tone.Vibrato({
    maxDelay : 0.001 ,
    frequency : 1 ,
    depth : 0.01
    }).toMaster();
  // this.bassPlayer.connect(vibrato4);

  // this.genie.initialize().then(() => {
  //   console.log('🧞‍♀️ ready!');

  //   // Slow to start up, so do a fake prediction to warm up the model.
  //   const note = this.genie.nextFromKeyWhitelist(0, keyWhitelist, TEMPERATURE);
  //   this.genie.resetState();
  // });

  window.addEventListener('hashchange', () => TEMPERATURE = getTemperature());
}

Instrument.prototype.changeInstrument = function (name) {
  console.log("Changed Instrument to " + name);
  if (name == "Violin") {
    this.currentScale = this.violinScale;
    this.currentPlayer = this.violinPlayer;
    this.currentInstrument = "Violin";
    $("#clefimage").css({
      "top": "-40px",
      "height": "150%"
    });
    $("#clefimage").attr("src", "img/trebleclef.png");
  }
  else if (name == "Viola") {
    this.currentScale = this.violaScale;
    this.currentPlayer = this.violaPlayer;
    this.currentInstrument = "Viola";
    $("#clefimage").css({
      "top": "0px",
      "height": "100%"
    });
    $("#clefimage").attr("src", "img/tenorclef.png");
  }
  else if (name == "Cello") {
    this.currentScale = this.celloScale;
    this.currentPlayer = this.celloPlayer;
    this.currentInstrument = "Cello";
    $("#clefimage").css({
      "top": "0px",
      "height": "100%"
    });
    $("#clefimage").css("top", "-75px");
    $("#clefimage").attr("src", "img/tenorclef.png");
  }
  else if (name == "Bass") {
    this.currentScale = this.bassScale;
    this.currentPlayer = this.bassPlayer;
    this.currentInstrument = "Bass";
    $("#clefimage").css({
      "top": "40px",
      "height": "75%"
    });
    $("#clefimage").attr("src", "img/bassclef.png");
  }
  else {
    console.log(name + " Instrument Not Found! ");
  }
}

Instrument.prototype.playNote = function (stringNumber, instrument) {
  if (this.currentPlayer.loaded) {
    var offsets = [12,7,4,0];
    var offset = 0;
    if(instrument == "Violin"){ offset += 4}
    if(instrument == "Viola"){ offset += 3}
    if(instrument == "Cello"){ offset += 1}
    if(instrument == "Bass"){ offset += 0}
    // const note = this.genie.nextFromKeyWhitelist(BUTTON_MAPPING[(Math.abs(stringNumber - 4)+ offset - 1)], keyWhitelist, TEMPERATURE);
    // const pitch = CONSTANTS.LOWEST_PIANO_KEY_MIDI_NOTE + note;
    // var noteval = mm.Player.tone.Frequency(pitch, "midi").toNote();
    if (this.robotoff) {
      if(instrument == "Violin"){ noteval = mm.Player.tone.Frequency(violinRootNode + offsets[stringNumber], "midi"); }
      if(instrument == "Viola"){ noteval = mm.Player.tone.Frequency(violaRootNode + offsets[stringNumber], "midi"); }
      if(instrument == "Cello"){ noteval = mm.Player.tone.Frequency(celloRootNode + offsets[stringNumber], "midi"); }
      if(instrument == "Bass"){ noteval = mm.Player.tone.Frequency(celloRootNode + offsets[stringNumber], "midi"); }
    }
    console.log(noteval);
    this.playNoteWithVal(noteval, instrument);
    var colors = ["#8bc34a", "#ffea59", "#ffc107", "#ff5722", 
    "#259b24", "#cddc39", "#ff9800", "#e51c23", "#3454b2", 
    "#03a9f4", "#00bcd4", "#9c27b0"];
    var colorpos = (noteval.toMidi() - 9) % 12;
    console.log(colorpos)
    this.showNote(colors[colorpos]);
  }
}
  
  Instrument.prototype.playNoteWithVal = function(noteval, instrumentName){
    if(instrumentName == "Violin"){ 
      this.violinPlayer.triggerAttackRelease(noteval, 1);
    }
    if(instrumentName == "Viola"){
      this.violaPlayer.triggerAttackRelease(noteval, 1);
      }
    if(instrumentName == "Cello"){
      this.celloPlayer.triggerAttackRelease(noteval, 1);
    }
    if(instrumentName == "Bass"){
      this.bassPlayer.triggerAttackRelease(noteval, 1);
      }
  }

  Instrument.prototype.toggleIndividual = function () {
    this.individual = !this.individual;
    if (this.individual) {
      $("#usersButtonIcon").attr("class", "fas fa-times");
      $("#usercount").text("Offline");
    }
    else {
      $("#usersButtonIcon").attr("class", "fas fa-network-wired");
      $("#usercount").text("Online");
      socket.emit('users');
    }
  }


Instrument.prototype.toggleMute = function () {
  this.muted = !this.muted;
  if (this.muted) {
    mm.Player.tone.Master.mute = true;
    console.log("Mute");
    $("#muteButtonIcon").attr("class", "fas fa-volume-mute");
  }
  else {
    mm.Player.tone.Master.mute = false;
    $("#muteButtonIcon").attr("class", "fas fa-volume-up");
  }
}

Instrument.prototype.toggleRobot = function () {
  this.robotoff = !this.robotoff;
  if (this.robotoff) {
    console.log("AI Mode off");
    $("#robotButtonIcon").attr("class", "fas fa-user");
  }
  else {
    $("#robotButtonIcon").attr("class", "fas fa-robot");
  }
}

Instrument.prototype.showNote = function (color) {
  const val = Math.floor(Math.random() * 6) + 1;
  const val2 = Math.floor(Math.random() * 8);
  var randomselection = ["&#9835;", "&#9833;", "&#9834;", "&#9836;", "&#9835;&#9833;", "&#9833;&#9834;", "&#9834;&#9835", "&#9835;&#9834",];
  var node = document.getElementsByClassName('notes')[0];
  var divnode = document.createElement('div');
  divnode.innerHTML = randomselection[val2];
  divnode.setAttribute('class', 'note' + val);
  const randomleftpos = Math.floor(Math.random() * 90);
  // var colors = ["#ED5314", "#FFB92A", "#FEEB51", "#9BCA3E", "#9013FE"];
  // const randomcolor = Math.floor(Math.random() * colors.length);
  divnode.style.left = randomleftpos + "%";
  divnode.style.bottom = 0 + "px";
  divnode.style.color = color;
  node.appendChild(divnode);
  setTimeout(function () {
    divnode.remove();
  }, 3000);
}

Instrument.prototype.receiveData = function (array) {
  // socket.emit('chat message', [instrument, noteVal]);
  //Red, Orange, Yellow, Green, Purple
  var colors = ["#ED5314", "#FFB92A", "#FEEB51", "#9BCA3E", "#9013FE"];
  var instrument = array[0];
  var noteVal = array[1];
  console.log("RECEIVED DATA", noteVal, instrument);
  var receivedColor;
  //individual mode turned on
  if (this.individual) {
    return;
  }
  if (instrument == "Violin") {
    receivedColor = colors[2];
  }
  else if (instrument == "Viola") {
    receivedColor = colors[3];
  }
  else if (instrument == "Cello") {
    receivedColor = colors[1];
  }
  else if (instrument == "Bass") {
    receivedColor = colors[0];
  }
  else {
    console.log(name + " Instrument Not Found! ");
    return;
  }


  this.playNoteWithVal(noteVal, instrument);
  this.showNote(receivedColor);
}

//Create new string object
var strings = new StringInstrument("stage", "strings", 4);

//Create new instrument object
var instrument = new Instrument();

//Initialize as Violin
instrument.changeInstrument("Violin");

//Temporary hack for responsive design - refresh page 
// window.onresize = function () { location.reload(); }

//check for select menu changes
$('.dropdown-item').click(function () {
  instrument.changeInstrument($(this).text());
  $("#instrument5text").text("Me (" + $(this).text() + ")");
});

//Toggle Mute
$('#muteButton').click(function () {
  instrument.toggleMute();
});

//Toggle group/individual mode
$('#usersButton').click(function () {
  instrument.toggleIndividual();
});


$( document ).ready(function() {
  $('#myModal').modal('show');
  $('#myModal').focus();
});


function resetStyle() {
  //https://cdn.dribbble.com/users/634131/screenshots/2012608/material-design-colors.png
  // background-color: #8bc34a;
  // background-color: #ffea59;
  // background-color: #ffc107;
  // background-color: #ff5722;
  // background-color: #259b24;
  // background-color: #cddc39;
  // background-color: #ff9800;
  // background-color: #e51c23;
  // background-color: #3454b2;
  // background-color: #03a9f4;
  // background-color: #00bcd4;
  // background-color: #9c27b0;
  $('#chorda').css("background-color", "#8bc34a"); 
  $('#chordas').css("background-color", "#ffea59");
  $('#chordb').css("background-color", "#ffc107");
  $('#chordc').css("background-color", "#ff5722");
  $('#chordcs').css("background-color", "#259b24");
  $('#chordd').css("background-color", "#cddc39");
  $('#chordds').css("background-color", "#ff9800");
  $('#chorde').css("background-color", "#e51c23");
  $('#chordf').css("background-color", "#3454b2");
  $('#chordfs').css("background-color", "#03a9f4");
  $('#chordg').css("background-color", "#00bcd4");
  $('#chordgs').css("background-color", "#9c27b0");
  $('.chord').css("color", "#000000");//black text
  $('.chord').css("text-decoration", "none");//normal text
};

const VIOLINROOTVAL = 69; //A4
var violinRootNode = VIOLINROOTVAL;

const VIOLAROOTVAL = 62; //D4
var violaRootNode = VIOLAROOTVAL;

const CELLOROOTVAL = 50; //D3
var celloRootNode = CELLOROOTVAL;

const BASSROOTVAL = 50; //D2
var bassRootNode = BASSROOTVAL;


$('.chord').click(function () {
  resetStyle();
  $(this).css("text-decoration", "underline");//underlined
  $(this).blur();
});

$('#chorda').click(function () {
  $("#navtitle").text("A Major Chord");
  violinRootNode = VIOLINROOTVAL + 0;
  violaRootNode = VIOLAROOTVAL - 5;
  celloRootNode = CELLOROOTVAL - 5;
  bassRootNode = BASSROOTVAL - 5;
});

$('#chordas').click(function () {
  $("#navtitle").text("A# Major Chord");
  violinRootNode = VIOLINROOTVAL + 1;
  violaRootNode = VIOLAROOTVAL  - 4;
  celloRootNode = CELLOROOTVAL - 4;
  bassRootNode = BASSROOTVAL - 4;
});


$('#chordb').click(function () {
  $("#navtitle").text("B Major Chord");
  violinRootNode = VIOLINROOTVAL + 2;
  violaRootNode = VIOLAROOTVAL - 3;
  celloRootNode = CELLOROOTVAL - 3;
  bassRootNode = BASSROOTVAL - 3;
});

$('#chordc').click(function () {
  $("#navtitle").text("C Major Chord");
  violinRootNode = VIOLINROOTVAL + 3;
  violaRootNode = VIOLAROOTVAL - 2;
  celloRootNode = CELLOROOTVAL - 2;
  bassRootNode = BASSROOTVAL - 2;
});

$('#chordcs').click(function () {
  $("#navtitle").text("C# Major Chord");
  violinRootNode = VIOLINROOTVAL + 4;
  violaRootNode = VIOLAROOTVAL - 1;
  celloRootNode = CELLOROOTVAL - 1;
  bassRootNode = BASSROOTVAL - 1;
});

$('#chordd').click(function () {
  $("#navtitle").text("D Major Chord");
  violinRootNode = VIOLINROOTVAL + 5;
  violaRootNode = VIOLAROOTVAL + 0;
  celloRootNode = CELLOROOTVAL + 0;
  bassRootNode = BASSROOTVAL + 0;
});

$('#chordds').click(function () {
  $("#navtitle").text("D# Major Chord");
  violinRootNode = VIOLINROOTVAL + 6;
  violaRootNode = VIOLAROOTVAL + 1;
  celloRootNode = CELLOROOTVAL + 1;
  bassRootNode = BASSROOTVAL + 1;
});

$('#chorde').click(function () {
  $("#navtitle").text("E Major Chord");
  violinRootNode = VIOLINROOTVAL + 7;
  violaRootNode = VIOLAROOTVAL + 2;
  celloRootNode = CELLOROOTVAL + 2;
  bassRootNode = BASSROOTVAL + 2;
});

$('#chordf').click(function () {
  $("#navtitle").text("F Major Chord");
  violinRootNode = VIOLINROOTVAL + 8;
  violaRootNode = VIOLAROOTVAL + 3;
  celloRootNode = CELLOROOTVAL + 3;
  bassRootNode = BASSROOTVAL + 3;
});

$('#chordfs').click(function () {
  $("#navtitle").text("F# Major Chord");
  violinRootNode = VIOLINROOTVAL + 9;
  violaRootNode = VIOLAROOTVAL + 4;
  celloRootNode = CELLOROOTVAL + 4;
  bassRootNode = BASSROOTVAL + 4;
});

$('#chordg').click(function () {
  $("#navtitle").text("G Major Chord");
  violinRootNode = VIOLINROOTVAL + 10;
  violaRootNode = VIOLAROOTVAL + 5;
  celloRootNode = CELLOROOTVAL + 5;
  bassRootNode = BASSROOTVAL + 5;
});

$('#chordgs').click(function () {
  $("#navtitle").text("G# Major Chord");
  violinRootNode = VIOLINROOTVAL + 11;
  violaRootNode = VIOLAROOTVAL + 6;
  celloRootNode = CELLOROOTVAL + 6;
  bassRootNode = BASSROOTVAL + 6;
});

$(document).keypress(function(e){
  console.log(e.keyCode)
  switch(e.keyCode){
    case 49:
      $("#chorda").click();
      break;
    case 50:
      $("#chordas").click();
      break;
    case 51:
      $("#chordb").click();
      break;
    case 52:
      $("#chordc").click();
      break;
    case 53:
      $("#chordcs").click();
      break;
    case 54:
      $("#chordd").click();
      break;
    case 55:
      $("#chordds").click();
      break;
    case 56:
      $("#chorde").click();
      break;
    case 57:
      $("#chordf").click();
       break;
    case 48:
      $("#chordfs").click();
      break;
    case 45:
      $("#chordg").click();
      break;
    case 61:
      $("#chordgs").click();
      break;
  }
});