// Contains nothing at the moment, we will fill this in class.

var frame = 0, frame_ind;
var gl, canvas;

var prog_yellow;
var obj_shape = {};
var tex_stop;

var speed = 0.001;
var pos = vec2(0, 0);
var direction = vec2(1, 0);
var rotating = true;
var rotation = 0;

function rotateStart() {
	rotating = true;
}
function rotateStop() {
	rotating = false;
}
function speedIncr() {
	speed *= 2;
}
function speedDecr() {
	speed /= 2;
}
function onKey(ev) {
	ev.preventDefault();
	switch(ev.code) {
		case "KeyW":
			direction = vec2(0, 1);
			break;
		case "KeyS":
			direction = vec2(0, -1);
			break;
		case "KeyA":
			direction = vec2(-1, 0);
			break;
		case "KeyD":
			direction = vec2(1, 0);
			break;
	}
}
function onClick(ev) {
	pos = mapToGL(vec2(ev.clientX, ev.clientY));
	console.log(pos);
}

function mapToGL(client) {
	return add(mult(client, vec2(2/canvas.width, -2/canvas.height)), vec2(-1, 1));
}

function initScene() {
	canvas = document.querySelector("#gl-canvas");
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	frame_ind = document.querySelector("#frame");
	gl = WebGLUtils.setupWebGL(canvas);
	if(!gl) return;  // setupWebGL already nags

	gl.clearColor(1.0, 0.0, 0.0, 1.0);

	prog_yellow = new Program({
		"VERTEX_SHADER": document.querySelector("#vert_basic_tex"),
		"FRAGMENT_SHADER": document.querySelector("#frag_tex"),
	}, {
		"attributes": ["vPosition", "vTexCoord"],
		"uniforms": ["vColor", "mTransform", "uTex"],
	});
	prog_yellow.u.vColor.set(vec4(0.3, 1.0, 0.2, 1.0));
	prog_yellow.u.mTransform.set(mat4());

	tex_stop = new Texture();
	tex_stop.load("Bob_Ross_afro.gif");

	var pts = [
		vec2(-0.5, -0.25),
		vec2(-0.25, -0.5),
		vec2(0.25, -0.5),
		vec2(0.5, -0.25),
		vec2(0.5, 0.25),
		vec2(0.25, 0.5),
		vec2(-0.25, 0.5),
		vec2(-0.5, 0.25),
	];
	obj_shape.vert = new Buffer(pts);
	obj_shape.tex = new Buffer(pts.map(function(e) {return add(vec2(0.5, 0.5), e)}));

	drawAll();
}

function update() {
	// Move in the specified direction
	pos = add(pos, mult(direction, vec2(speed, speed)));

	// Rotate if need be
	if(rotating) {
		rotation += 0.05; // rad
	}
}

function degrees(rads) {
	return rads * 180.0 / Math.PI;
}

function drawAll() {
	if(!gl) return;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT);

	update();

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	prog_yellow.u.mTransform.set(
		mult(
			translate(pos[0], pos[1], 0),
			rotate(degrees(rotation), vec3(0, 0, 1))
		)
	)
	prog_yellow.u.uTex.set(tex_stop);
	prog_yellow.a.vPosition.set(obj_shape.vert);
	prog_yellow.a.vTexCoord.set(obj_shape.tex);
	prog_yellow.draw(gl.TRIANGLE_FAN);
	
	frame += 1;
	frame_ind.textContent = frame;
	window.requestAnimFrame(drawAll);
}
