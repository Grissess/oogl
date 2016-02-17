// Contains nothing at the moment, we will fill this in class.

var frame = 0, frame_ind;
var gl, canvas;
var prog_wavy = {};
var prog_yellow = {};
var prog_dotty = {};
var prog_blink = {};
var prog_btex = {};

var oval = {};
var polygon_a = {};
var polygon_b = {};
var bkgd = {};
var bob = {};
var bobtc = {};

var tex_bob = {};

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

	prog_yellow = new Program("vert_basic", "frag_solid", {
		"attributes": ["vPosition"],
		"uniforms": ["vColor", "mTransform"],
	});
	prog_yellow.u.vColor.set(vec4(1.0, 1.0, 0.0, 1.0));
	prog_yellow.u.mTransform.set(mat4());

	prog_wavy = new Program("vert_basic", "frag_wavy-plaid", {
		"attributes": ["vPosition"],
		"uniforms": ["mTransform", "fTime"],
	});
	prog_wavy.u.mTransform.set(mat4());
	prog_wavy.u.fTime.set(0.0);

	prog_dotty = new Program("vert_basic", "frag_dotty", {
		"attributes": ["vPosition"],
		"uniforms": ["mTransform", "fTime"],
	});
	prog_dotty.u.mTransform.set(mat4());
	prog_dotty.u.fTime.set(0.0);

	prog_blink = new Program("vert_basic", "frag_blink", {
		"attributes": ["vPosition"],
		"uniforms": ["mTransform", "fTime"],
	});
	prog_blink.u.mTransform.set(mat4());
	prog_blink.u.fTime.set(0.0);

	prog_btex = new Program("vert_btex", "frag_btex", {
		"attributes": ["vPosition", "vTexCoord"],
		"uniforms": ["mTransform", "vColor", "sTex"],
	});
	prog_btex.u.mTransform.set(mat4());
	prog_btex.u.vColor.set(vec4(1, 1, 1, 1));

	tex_bob = new Texture();
	tex_bob.load("Bob_Ross_afro.gif");
	bob = new Buffer([
		vec2(-0.5, -0.5),
		vec2(0.5, -0.5),
		vec2(0.5, 0.5),
		vec2(-0.5, 0.5),
	]);
	bobtc = new Buffer([
		vec2(0.0, 0.0),
		vec2(1.0, 0.0),
		vec2(1.0, 1.0),
		vec2(0.0, 1.0),
	]);

	var pts = [];
	for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI/60) {
		pts.push(vec2(Math.cos(theta), 0.5*Math.sin(theta)));
	}
	oval = new Buffer(pts);

	pts = [];
	for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI/6) {
		pts.push(vec2(0.5*Math.cos(theta) - 0.5, 0.5*Math.sin(theta) + 0.5));
	}
	polygon_a = new Buffer(pts);

	polygon_b = new Buffer([
		vec2(0.0, -1.0),
		vec2(1.0, -1.0),
		vec2(1.0, -0.5),
		vec2(0.5, 0.0),
		vec2(0.0, -0.5)
	]);

	bkgd = new Buffer([
		vec2(-1.0, -1.0),
		vec2(1.0, -1.0),
		vec2(1.0, 1.0),
		vec2(-1.0, 1.0)
	]);

	//window.requestAnimFrame(drawTriangle);
	drawAll();
}

function drawAll() {
	if(!gl) return;
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clear(gl.COLOR_BUFFER_BIT);

	var now = Date.now();
	prog_blink.u.fTime.set((now/300.0) % (2*Math.PI));
	prog_wavy.u.fTime.set((now/100.0) % (2*Math.PI));
	prog_dotty.u.fTime.set((now/25.0) % (2*Math.PI));
	var dot_rotation = rotate(now / -10.0, vec3(0, 0, 1));
	var wave_rotation = rotate(now / 30.0, vec3(0, 0, 1));
	var bob_rotation = rotate(now / 5.0, vec3(0, 0, 1));
	var bob_translation = translate(Math.sin(2*now / 1000), Math.sin(now / 1000), 0);
	// var rotation = mat4(1);
	// console.log(rotation);
	
	prog_blink.a.vPosition.set(bkgd);
	prog_blink.draw(gl.TRIANGLE_FAN);

	prog_wavy.a.vPosition.set(oval);
	prog_wavy.u.mTransform.set(wave_rotation);
	prog_wavy.draw(gl.LINE_LOOP);

	prog_dotty.u.mTransform.set(dot_rotation);
	prog_dotty.a.vPosition.set(polygon_a);
	prog_dotty.draw(gl.TRIANGLE_FAN);
	prog_dotty.a.vPosition.set(polygon_b);
	prog_dotty.draw(gl.TRIANGLE_FAN);

	prog_btex.a.vPosition.set(bob);
	prog_btex.a.vTexCoord.set(bobtc);
	prog_btex.u.sTex.set(tex_bob);
	prog_btex.u.mTransform.set(mult(bob_translation, bob_rotation));
	prog_btex.draw(gl.TRIANGLE_FAN);
	
	frame += 1;
	frame_ind.textContent = frame;
	window.requestAnimFrame(drawAll);
}
