function mtx_perspective(left, right, bottom, top, near, far) {
	return mat4(
		(2 * near) / (right - left), 0, (right + left) / (right - left), 0,
		0, (2 * near) / (top - bottom), (top + bottom) / (top - bottom), 0,
		0, 0, - (far + near) / (far - near), (-2 * far * near) / (far - near),
		0, 0, -1, 0
	);
}

function mtx_lookat(eyepos, eyeup) {
	var eyeright = normalize(cross(eyepos, eyeup));
	var eyenpos = normalize(eyepos);
	eyeup = normalize(eyeup);
	return mat4(
		eyeright[0], eyeright[1], eyeright[2], -dot(eyeright, eyepos),
		eyeup[0], eyeup[1], eyeup[2], -dot(eyeup, eyepos),
		eyenpos[0], eyenpos[1], eyenpos[2], -dot(eyenpos, eyepos),
		0, 0, 0, 1
	);
}

function mtx_translate(v) {
	return mat4(
		1, 0, 0, v[0],
		0, 1, 0, v[1],
		0, 0, 1, v[2],
		0, 0, 0, 1,
	);
}

function mtx_scale(v) {
	return mat4(
		v[0], 0, 0, 0,
		0, v[1], 0, 0,
		0, 0, v[2], 0,
		0, 0, 0, 1
	);
}

function Transform(pos, scale, rot) {
	this.pos = pos;
	this.scale = scale;
	this.rot = rot;
}

Transform.prototype.to_mat = function() {
	return mult(
		quatMat(this.rot),
		mult(
			mtx_scale(this.scale),
			mtx_translate(this.pos)
		)
	);
}

function Entity(poly, xfm, camb, cdiff, cspec) {
	if(!camb) camb = vec4(1, 1, 1, 1);
	if(!cdiff) cdiff = vec4(1, 1, 1, 1);
	if(!cspec) cspec = vec4(1, 1, 1, 1);
	this.poly = poly;
	this.xfm = xfm;
	this.camb = camb;
	this.cdiff = cdiff;
	this.cspec = cspec;
}

Entity.prototype.render = function(group, scene) {
	group.prog.u.mModelView.set(this.xfm.to_mat());
	group.prog.u.vAmbientColor.set(this.camb);
	group.prog.u.vDiffuseColor.set(this.cdiff);
	group.prog.u.vSpecularColor.set(this.cspec);
	group.prog.a.vPosition.set(this.poly.points);
	group.prog.a.vNormal.set(this.poly.normals);
	this.poly.draw(group.prog);
}

function Group(prog) {
	this.prog = prog;
	this.entities = [];
}

Group.prototype.render = function(scene) {
	for(var i = 0; i < scene.lights.length; i++) {
		var light = scene.lights[i];
		this.prog.u.iLightType(1);
		this.prog.u.vLightPos.set(mult(inverse(scene.proj), light.pos));
		this.prog.u.vAmbientEmission.set(light.camb);
		this.prog.u.vDiffuseEmission.set(light.cdiff);
		this.prog.u.vSpecularEmission.set(light.cspec);
		this.prog.u.fLightSpecularEmission.set(light.spece);
	}
	this.prog.u.vEyePos.set(vec4());
	this.prog.u.mProjection.set(scene.proj);
	for(i = 0; i < this.entities.length; i++) {
		var entity = this.entities[i];
		entity.render(this, scene);
	}
}

function Light(pos, camb, cdiff, cspec, spece) {
	this.pos = pos;
	this.camb = camb;
	this.cdiff = cdiff;
	this.cspec = cspec;
	this.spece = spece;
}

function Scene(proj) {
	this.proj = proj;
	this.groups = [];
	this.lights = [];
}

Scene.prototype.render = function() {
	for(var i = 0; i < this.groups.length; i++) {
		this.groups[i].render(this);
	}
}

var scene, gl, canvas;

function initScene() {
	canvas = document.querySelector("#gl-canvas");
	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;
	frame_ind = document.querySelector("#frame");
	gl = WebGLUtils.setupWebGL(canvas);
	if(!gl) return;  // setupWebGL already nags

	gl.clearColor(0.0, 0.0, 0.2, 1.0);
	gl.clearDepth(1.0);

	var prog = new Program({
		"VERTEX_SHADER": document.querySelector("#vert_phong"),
		"FRAGMENT_SHADER": document.querySelector("#frag_phong"),
	}, {});
	prog.u.vEmissionColor.set(vec4(0, 0.2, 0, 1));
