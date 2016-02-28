var frame = 0, frame_ind;
var gl, canvas;

var poly_cyl, prog;

var orient = quat();
var scale = vec3(0.5, 0.5, 0.5);
var pos = vec3();

function transformMatrix() {
	return mult(
		// Translation component
		mat4(
			1, 0, 0, pos[0],
			0, 1, 0, pos[1],
			0, 0, 1, pos[2],
			0, 0, 0, 1
		),
		mult(
			// Rotation component
			quatMat(orient),
			// Scale component
			mat4(
				scale[0], 0, 0, 0,
				0, scale[1], 0, 0,
				0, 0, scale[2], 0,
				0, 0, 0, 1
			)
		)
	);
}

function onKey(ev) {
	//console.log(ev);
	ev.preventDefault();
	switch(ev.key) {
		case "a":
			orient = quatMul(quat(vec3(0, 1, 0), 0.05), orient);
			break;
		case "d":
			orient = quatMul(quat(vec3(0, 1, 0), -0.05), orient);
			break;
		case "w":
			orient = quatMul(quat(vec3(1, 0, 0), 0.05), orient);
			break;
		case "s":
			orient = quatMul(quat(vec3(1, 0, 0), -0.05), orient);
			break;
		case "q":
			orient = quatMul(quat(vec3(0, 0, 1), 0.05), orient);
			break;
		case "e":
			orient = quatMul(quat(vec3(0, 0, 1), -0.05), orient);
			break;
		case "l":
			pos[0] += 0.05;
			break;
		case "j":
			pos[0] -= 0.05;
			break;
		case "i":
			pos[1] += 0.05;
			break;
		case "k":
			pos[1] -= 0.05;
			break;
		case "f":
			scale[0] /= 1.5;
			break;
		case "h":
			scale[0] *= 1.5;
			break;
		case "g":
			scale[1] /= 1.5;
			break;
		case "t":
			scale[1] *= 1.5;
			break;
		case "r":
			scale[2] /= 1.5;
			break;
		case "y":
			scale[2] *= 1.5;
			break;
	}
}
var dragging = false;
var mousept = vec2();
function onMouseDown(ev) {
	dragging = true;
	mousept = vec2(ev.clientX, ev.clientY);
}
function onMouseUp(ev) {
	dragging = false;
}
function onMove(ev) {
	if(dragging) {
		var newpt = vec2(ev.clientX, ev.clientY);
		var delta = subtract(newpt, mousept);
		orient = quatMul(quat(vec3(0, 1, 0), -0.005*delta[0]), orient);
		orient = quatMul(quat(vec3(1, 0, 0), -0.005*delta[1]), orient);
		mousept = newpt;
	}
}

function initScene() {
	canvas = document.querySelector("#gl-canvas");
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	frame_ind = document.querySelector("#frame");
	gl = WebGLUtils.setupWebGL(canvas);
	if(!gl) return;  // setupWebGL already nags

	gl.clearColor(0.0, 0.0, 0.2, 0.0);
	gl.clearDepth(1.0);

	prog = new Program({
		"VERTEX_SHADER": document.querySelector("#vert_basic"),
		"FRAGMENT_SHADER": document.querySelector("#frag_smooth"),
	}, {
		"attributes": ["vPosition", "vTexCoord", "vVertexColor"],
		"uniforms": ["mTransform", "vColor"],
	});
	prog.u.vColor.set(vec4(1, 1, 1, 1));

	poly_cyl = cylinder(64);
	poly_cyl.colors = new Buffer(poly_cyl.points.data.map(function() {
		return vec4(Math.random(), Math.random(), Math.random(), 1);
	}));

	gl.enable(gl.DEPTH_TEST);
	console.log(poly_cyl);

	drawScene();
}

function drawScene() {
	if(!gl) return;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	prog.u.mTransform.set(transformMatrix());
	prog.a.vPosition.set(poly_cyl.points);
	prog.a.vVertexColor.set(poly_cyl.colors);
	poly_cyl.draw(prog);

	frame += 1;
	frame_ind.textContent = frame;
	window.requestAnimFrame(drawScene);
}
