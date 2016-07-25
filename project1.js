var frame = 0, frame_ind;
var gl, canvas;

var SCORE = 0;
var REMAINING = 30;
var RT_MISS_SHP = -1;
var RT_MISS_KEY = -2;
var RT_HIT = 5;
var SC_HIT = 5;
var BONUS = 1;

var NOW_LINE = -0.75;
var CHANNELS = 4;
var CT_NEG_THRES = -1;
var INTERVAL = 0.016;
var SPAWN_CHANCE = 1e-5;
var SPAWN_INC = 1e-6;
var LAST_SPAWN = Date.now();
var MIN_CT = 0.5;
var RG_CT = 1;
var ROT_VEL = -180;
var HIT_SLOP = 0.1;
var FADE_FACTOR = 3;
var KEY_DECAY = 0.05;
var KEYS = [];
for(var i = 0; i < CHANNELS; i++) {
	KEYS.push(0);
}

var CHAN_SHAPES = [];
function initChanShapes() {
	CHAN_SHAPES.push(
		// Channel 0 - a triangle
		polytope.circle(3),
		// Channel 1 - a square
		polytope.circle(4),
		// Channel 2 - a pentagram
		polytope.cgram(5, 1/3),
		// Channel 3 - a cross
		polytope.cross(7, 0.2)
	);
}

var progs = {};
function initPrograms() {
	progs.flat = new Program({
		"VERTEX_SHADER": document.querySelector("#vert_basic"),
		"FRAGMENT_SHADER": document.querySelector("#frag_solid")
	}, {
		"attributes": ["vPosition", "vTexCoord"],
		"uniforms": ["mTransform", "vColor"]
	});
}

function onKey(ev) {
	switch(ev.code) {
		case "KeyA":
			KEYS[0] = 1;
			hitEvents(0);
			ev.preventDefault();
			break;

		case "KeyS":
			KEYS[1] = 1;
			hitEvents(1);
			ev.preventDefault();
			break;

		case "KeyD":
			KEYS[2] = 1;
			hitEvents(2);
			ev.preventDefault();
			break;

		case "KeyF":
			KEYS[3] = 1;
			hitEvents(3);
			ev.preventDefault();
			break;
	}
}
function onMouseDown(ev) { }
function onMouseUp(ev) { }
function onMove(ev) { }

function Event(channel, countdown) {
	this.channel = channel;
	this.countdown = countdown;
	this.duration = countdown;
	this.hit = false;
}

Event.prototype.render = function(prog) {
	var sy = 1 / CHANNELS;
	var ty = 1 - this.channel * 2 / CHANNELS;
	var tx = mix([NOW_LINE], [sy + 1], this.countdown / this.duration)[0];
	var rz = ROT_VEL * this.countdown / this.duration;
	var shape = CHAN_SHAPES[this.channel];
	prog.a.vPosition.set(shape.points);
	if(this.hit) {
		var opacity = 1 - Math.max(0, Math.min(1, -FADE_FACTOR * this.countdown / this.duration));
		prog.u.vColor.set(vec4(1, 1, 1, opacity));
		tx = this.hitx;
		sy *= 2 - opacity;
	} else {
		prog.u.vColor.set(vec4(0, 0, 0, 1));
	}
	prog.u.mTransform.set(
		mult(
			translate(tx, ty - sy, 0),
			mult(
				rotate(rz, vec3(0, 0, 1)),
				scalem(sy, sy, 0)
			)
		)
	);
	shape.draw(prog);
	//console.log("Drawing", this, "with", shape, "at", [tx, ty], "scale", sy);
	//if(Math.random() < 0.001) {  // Probabilistic debugging
	//	throw "SHIT";
	//}
}

Event.prototype.update = function() {
	this.countdown -= INTERVAL;
}

Event.prototype.isDone = function() {
	if(true) {
		return this.countdown < CT_NEG_THRES;
	}
}

Event.prototype.checkHit = function() {
	if(Math.abs(this.countdown / this.duration) < HIT_SLOP) {
		this.hit = true;
		var sy = 1 / CHANNELS;
		this.hitx = mix([NOW_LINE], [sy + 1], this.countdown / this.duration)[0];
		return true;
	}
	return false;
}

var events = [];

function hitEvents(chan) {
	var i;
	var registered = false;
	for(i = 0; i < events.length; i++) {
		if(events[i].channel == chan) {
			registered = events[i].checkHit();
		}
		if(registered) {
			break;
		}
	}
	if(registered) {
		SCORE += BONUS * SC_HIT;
		BONUS += 1;
		REMAINING += RT_HIT;
		SPAWN_CHANCE += SPAWN_INC;
	} else {
		REMAINING += RT_MISS_KEY;
		BONUS = 1;
	}
	return registered;
}

var remaining_elem;
var score_elem;
var bonus_elem;
var cb_id;
function update() {
	var remindices = [];
	var i;
	// Update events
	for(i = 0; i < events.length; i++) {
		events[i].update();
		if(events[i].isDone()) {
			remindices.push(i);
		}
	}
	// Remove stale events
	for(i = 0; i < remindices.length; i++) {
		if(!events[remindices[i]].hit) {
			REMAINING += RT_MISS_SHP;
			BONUS = 1;
		}
		events.splice(remindices[i], 1);
	}
	// Randomly add new events
	// if(Math.random() < SPAWN_CHANCE) {
	// 	events.push(new Event(Math.floor(CHANNELS * Math.random()), MIN_CT + Math.random()*RG_CT));
	// }
	var t = Math.exp(SPAWN_CHANCE * (Date.now() - LAST_SPAWN)) - 1;
	var s = Math.random();
	if(s < t) {
	 	events.push(new Event(Math.floor(CHANNELS * Math.random()), MIN_CT + Math.random()*RG_CT));
		LAST_SPAWN = Date.now();
	}
	// Other bookkeeping
	for(i = 0; i < CHANNELS; i++) {
		if(KEYS[i] > 0) {
			KEYS[i] = Math.max(KEYS[i] - KEY_DECAY, 0);
		}
	}
	score_elem.textContent = SCORE;
	remaining_elem.textContent = REMAINING.toFixed(2);
	bonus_elem.textContent = BONUS;
	if(REMAINING < 0) {
		clearInterval(cb_id);
		alert("GAME OVER!");
		SPAWN_INTERVAL = 0;
	}
	REMAINING -= INTERVAL;
}

var now_obj;
function initScene() {
	score_elem = document.querySelector("#score");
	remaining_elem = document.querySelector("#remaining");
	bonus_elem = document.querySelector("#bonus");

	canvas = document.querySelector("#gl-canvas");
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	frame_ind = document.querySelector("#frame");
	gl = WebGLUtils.setupWebGL(canvas);
	if(!gl) return;  // setupWebGL already nags

	gl.clearColor(0.8, 0.0, 0.0, 1.0);
	
	initChanShapes();
	initPrograms();

	now_obj = new Buffer([
		vec2(NOW_LINE, -1),
		vec2(NOW_LINE, 1)
	]);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	cb_id = setInterval(update, INTERVAL * 1000);
	drawScene();
}

function drawScene() {
	var i;
	if(!gl) return;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT);

	// Draw the now line
	progs.flat.a.vPosition.set(now_obj);
	progs.flat.u.mTransform.set(mat4());
	progs.flat.u.vColor.set(vec4(0, 0, 0, 1));
	progs.flat.draw(gl.LINES);

	// Draw "ghosts"
	for(i = 0; i < CHANNELS; i++) {
		progs.flat.u.vColor.set(vec4(KEYS[i], KEYS[i], 0, 0.5));
		progs.flat.u.mTransform.set(mult(translate(NOW_LINE, 1 - (i * 2 + 1) / CHANNELS, 0), scalem(1 / CHANNELS, 1 / CHANNELS, 0)));
		progs.flat.a.vPosition.set(CHAN_SHAPES[i].points);
		CHAN_SHAPES[i].draw(progs.flat);
	}

	// Draw the events
	for(i = 0; i < events.length; i++) {
		events[i].render(progs.flat);
	}

	frame += 1;
	frame_ind.textContent = frame;
	window.requestAnimFrame(drawScene);
}
