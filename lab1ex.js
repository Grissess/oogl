// Contains nothing at the moment, we will fill this in class.

var frame = 0, frame_ind;
var gl, canvas;
var prog_wavy = {};
var prog_yellow = {};
var prog_dotty = {};
var prog_blink = {};

var oval = {};
var polygon_a = {};
var polygon_b = {};
var bkgd = {};

function initScene() {
	canvas = document.querySelector("#gl-canvas");
	//alert(canvas.width); alert(canvas.height);
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	frame_ind = document.querySelector("#frame");
	gl = WebGLUtils.setupWebGL(canvas);
	if(!gl) return;  // setupWebGL already nags

	gl.clearColor(1.0, 0.0, 0.0, 1.0);

	// prog_wavy.vertex = gl.createShader(gl.VERTEX_SHADER);
	// gl.shaderSource(prog_wavy.vertex, "attribute vec2 vPosition;\n\nvoid main(void){\ngl_Position = vec4(vPosition, 1.0, 1.0);\n}");
	// gl.compileShader(prog_wavy.vertex);
	// if(!gl.getShaderParameter(prog_wavy.vertex, gl.COMPILE_STATUS)) {
	// 	alert(gl.getShaderInfoLog(prog_wavy.vertex));
	// 	return;
	// }

	// prog_wavy.fragment = gl.createShader(gl.FRAGMENT_SHADER);
	// gl.shaderSource(prog_wavy.fragment, "precision mediump float;\n\nvoid main(void) {\ngl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);\n}");
	// gl.compileShader(prog_wavy.fragment);
	// if(!gl.getShaderParameter(prog_wavy.fragment, gl.COMPILE_STATUS)) {
	// 	alert(gl.getShaderInfoLog(prog_wavy.fragment));
	// 	return;
	// }

	// prog_wavy.prog = gl.createProgram();
	// gl.attachShader(prog_wavy.prog, prog_wavy.vertex);
	// gl.attachShader(prog_wavy.prog, prog_wavy.fragment);
	// gl.linkProgram(prog_wavy.prog);
	// if(!gl.getProgramParameter(prog_wavy.prog, gl.LINK_STATUS)) {
	// alert("Could not link");
	// 	return;
	// }
	prog_yellow.prog = initShaders(gl, "vert_basic", "frag_solid");
	gl.useProgram(prog_yellow.prog);
	prog_yellow.vPosition = gl.getAttribLocation(prog_yellow.prog, "vPosition");
	gl.enableVertexAttribArray(prog_yellow.vPosition);
	prog_yellow.vColor = gl.getUniformLocation(prog_yellow.prog, "vColor");
	gl.uniform4f(prog_yellow.vColor, 1.0, 1.0, 0.0, 1.0);
	prog_yellow.mTransform = gl.getUniformLocation(prog_yellow.prog, "mTransform");
	gl.uniformMatrix4fv(prog_yellow.mTransform, false, new Float32Array(flatten(mat4())));

	prog_wavy.prog = initShaders(gl, "vert_basic", "frag_wavy-plaid");
	gl.useProgram(prog_wavy.prog);
	prog_wavy.vPosition = gl.getAttribLocation(prog_wavy.prog, "vPosition");
	gl.enableVertexAttribArray(prog_wavy.vPosition);
	prog_wavy.mTransform = gl.getUniformLocation(prog_wavy.prog, "mTransform");
	prog_wavy.fTime = gl.getUniformLocation(prog_wavy.prog, "fTime");

	prog_dotty.prog = initShaders(gl, "vert_basic", "frag_dotty");
	gl.useProgram(prog_dotty.prog);
	prog_dotty.vPosition = gl.getAttribLocation(prog_dotty.prog, "vPosition");
	gl.enableVertexAttribArray(prog_dotty.vPosition);
	prog_dotty.mTransform = gl.getUniformLocation(prog_dotty.prog, "mTransform");
	prog_dotty.fTime = gl.getUniformLocation(prog_dotty.prog, "fTime");

	prog_blink.prog = initShaders(gl, "vert_basic", "frag_blink");
	gl.useProgram(prog_blink.prog);
	prog_blink.vPosition = gl.getAttribLocation(prog_blink.prog, "vPosition");
	gl.enableVertexAttribArray(prog_blink.vPosition);
	prog_blink.mTransform = gl.getUniformLocation(prog_blink.prog, "mTransform");
	gl.uniformMatrix4fv(prog_blink.mTransform, false, new Float32Array(flatten(mat4())));
	prog_blink.fTime = gl.getUniformLocation(prog_blink.prog, "fTime");

	oval.object = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, oval.object);
	var pts = [];
	for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI/60) {
		pts.push(Math.cos(theta));
		pts.push(0.5*Math.sin(theta));
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
	oval.points = (pts.length) / 2;

	polygon_a.object = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, polygon_a.object);
	pts = [];
	for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI/6) {
		pts.push(0.5*Math.cos(theta) - 0.5);
		pts.push(0.5*Math.sin(theta) + 0.5);
	}
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
	polygon_a.points = 6;

	polygon_b.object = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, polygon_b.object);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, -1.0, 1.0, -1.0, 1.0, -0.5, 0.5, 0.0, 0.0, -0.5]), gl.STATIC_DRAW)
	polygon_b.points = 5;

	bkgd.object = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bkgd.object);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0]), gl.STATIC_DRAW);
	bkgd.points = 4;

	//window.requestAnimFrame(drawTriangle);
	drawTriangle();
}

function drawTriangle() {
	if(!gl) return;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT);

	var now = Date.now();
	gl.useProgram(prog_blink.prog);
	gl.uniform1f(prog_blink.fTime, (now/300.0) % (2*Math.PI));
	gl.useProgram(prog_wavy.prog);
	gl.uniform1f(prog_wavy.fTime, (now/100.0) % (2*Math.PI));
	gl.useProgram(prog_dotty.prog);
	gl.uniform1f(prog_dotty.fTime, (now/25.0) % (2*Math.PI));
	var dot_rotation = rotate(now / -10.0, vec3(0, 0, 1));
	var wave_rotation = rotate(now / 30.0, vec3(0, 0, 1));
	// var rotation = mat4(1);
	// console.log(rotation);
	
	gl.useProgram(prog_blink.prog);
	gl.bindBuffer(gl.ARRAY_BUFFER, bkgd.object);
	gl.vertexAttribPointer(prog_blink.vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, bkgd.points);

	gl.useProgram(prog_wavy.prog);
	gl.uniformMatrix4fv(prog_wavy.mTransform, false, new Float32Array(flatten(wave_rotation)));
	gl.bindBuffer(gl.ARRAY_BUFFER, oval.object);
	gl.vertexAttribPointer(prog_wavy.vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.LINE_LOOP, 0, oval.points);


	gl.useProgram(prog_dotty.prog);
	gl.uniformMatrix4fv(prog_dotty.mTransform, false, new Float32Array(flatten(dot_rotation)));
	gl.bindBuffer(gl.ARRAY_BUFFER, polygon_a.object);
	gl.vertexAttribPointer(prog_dotty.vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, polygon_a.points);
	gl.bindBuffer(gl.ARRAY_BUFFER, polygon_b.object);
	gl.vertexAttribPointer(prog_dotty.vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLE_FAN, 0, polygon_b.points);
	//gl.drawArrays(gl.POINTS, 0, 4);
	
	frame += 1;
	frame_ind.textContent = frame;
	window.requestAnimFrame(drawTriangle);
}
