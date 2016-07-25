var frame = 0, frame_ind;
var gl, canvas;

var poly_cyl, prog, vn_obj, fn_obj;

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

function vmult(u, v) {  // FML.
	return vec4(u.map(function(row) {
		return dot(row, v);
	}));
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

	gl.clearColor(0.0, 0.0, 0.2, 1.0);
	gl.clearDepth(1.0);

	prog = new Program({
		"VERTEX_SHADER": document.querySelector("#vert_basic"),
		"FRAGMENT_SHADER": document.querySelector("#frag_smooth"),
	}, {});
	prog.u.vEmissionColor.set(vec4(0, 0.2, 0, 1));
	console.log(prog);

	//poly_cyl = polytope.cylinder(64);
	//poly_cyl = polytope.cross(7, 0.2);
	poly_cyl = new Polytope(new Buffer(getVertices().map(function(v4) {
		return vec3(v4[0], v4[1], v4[2]);
	})), new Primitive(gl.TRIANGLES, new Buffer(getFaces(), Uint16Array, gl.ELEMENT_ARRAY_BUFFER)));
	poly_cyl = new NormalPolytope(poly_cyl);
	poly_cyl.colors = new Buffer(poly_cyl.points.data.map(function() {
		return vec4(Math.random(), Math.random(), Math.random(), 1);
	}));

	var cyl_normals = poly_cyl.primitives.map(function(prim) {
		return prim.normals.data;
	}).reduce(function(a, b) { return a.concat(b); }, []);
	var cyl_centers = poly_cyl.primitives.map(function(prim) {
		return prim.centroidsIn(poly_cyl.points.data);
	}).reduce(function(a, b) { return a.concat(b); }, []);

	var vn_lines = [];
	for(i = 0; i < poly_cyl.points.data.length; i++) {
		vn_lines.push(vec3(poly_cyl.points.data[i]), add(vec3(poly_cyl.points.data[i]), poly_cyl.normals.data[i]));
	}

	var fn_lines = [];
	for(i = 0; i < cyl_centers.length; i++) {
		fn_lines.push(cyl_centers[i], add(cyl_centers[i], cyl_normals[i]));
	}

	vn_obj = new Polytope(new Buffer(vn_lines), new Primitive(gl.LINES, polytope.enumeration(vn_lines.length)));
	fn_obj = new Polytope(new Buffer(fn_lines), new Primitive(gl.LINES, polytope.enumeration(fn_lines.length)));
	vn_obj.colors = new Buffer(vn_obj.points.data.map(function() { return vec4(0.0, 0.0, 1.0, 1.0); }));
	fn_obj.colors = new Buffer(fn_obj.points.data.map(function() { return vec4(1.0, 0.0, 0.0, 1.0); }));

	gl.enable(gl.DEPTH_TEST);
	console.log(poly_cyl);

	drawScene();
}

function drawScene() {
	if(!gl) return;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var tform = transformMatrix();
	var itform = inverse(tform);

	// Shading parameters
	prog.u.vAmbientColor.set(vec4(1, 1, 1, 1));
	prog.u.vDiffuseColor.set(vec4(1, 1, 1, 1));
	prog.u.vSpecularColor.set(vec4(1, 1, 1, 1));
	prog.u.vEyePos.set(vec3(vmult(itform, vec4(0, 0, 1))));

	// Light 1
	prog.u.iLightType[0].set(1);
	prog.u.vLightPos[0].set(vec3(vmult(itform, vec4(1, -1, -1))));
	prog.u.vLightAmbientEmission[0].set(vec4(0, 0.5, 0, 0));
	prog.u.vLightDiffuseEmission[0].set(vec4(5, 0, 0, 1));
	prog.u.vLightSpecularEmission[0].set(vec4(0, 0, 5, 1));
	prog.u.fLightSpecularExponent[0].set(2);

	// Light 2
	prog.u.iLightType[1].set(1);
	prog.u.vLightPos[1].set(vec3(vmult(itform, vec4(-1, 1, -1))));
	prog.u.vLightAmbientEmission[1].set(vec4(0, 0, 0.3, 0));
	prog.u.vLightDiffuseEmission[1].set(vec4(0, 5, 0, 1));
	prog.u.vLightSpecularEmission[1].set(vec4(5, 0, 0, 1));
	prog.u.fLightSpecularExponent[1].set(4);

	prog.u.mProjection.set(mat4());
	prog.u.mModelView.set(transformMatrix());
	prog.a.vPosition.set(poly_cyl.points);
	prog.a.vVertexColor.set(poly_cyl.colors);
	prog.a.vNormal.set(poly_cyl.normals);
	poly_cyl.draw(prog);

	//prog.a.vVertexColor.set(vn_obj.colors);
	//prog.a.vPosition.set(vn_obj.points);
	//vn_obj.draw(prog);

	//prog.a.vVertexColor.set(fn_obj.colors);
	//prog.a.vPosition.set(fn_obj.points);
	//fn_obj.draw(prog);

	frame += 1;
	frame_ind.textContent = frame;
	window.requestAnimFrame(drawScene);
}
