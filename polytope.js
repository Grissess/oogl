function Primitive(prim, indices) {
	this.prim = prim;
	this.indices = indices;
}

Primitive.prototype.draw = function(prog) {
	prog.drawIndexed(this.prim, this.indices);
}

function Polytope() {
	arguments = Array.apply(null, arguments);
	this.points = arguments.shift();
	this.primitives = arguments;
}

Polytope.prototype.draw = function(prog) {
	for(var i = 0; i < this.primitives.length; i++) {
		this.primitives[i].draw(prog);
	}
}

function cylinder(resolution) {
	// Point generation
	var pts = [];
	for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / resolution) {
		pts.push(vec3(Math.cos(theta), Math.sin(theta), 1));
	}
	pts = pts.concat(pts.map(function(elem) { return [elem[0], elem[1], -elem[2]]; }));
	var bhalf = pts.length / 2;
	// Face generation
	var faces = [];
	var i;
	// - Upper circle triangle strip
	for(i = 1; i < bhalf - 1; i++) {
		faces.push(0, i, i+1);
	}
	// - Lower circle
	for(i = bhalf + 1; i < pts.length - 1; i++) {
		faces.push(bhalf, i, i+1);
	}
	// - Body quads
	for(i = 0; i < bhalf -1; i++) {
		faces.push(i, i + bhalf, i + bhalf + 1, i, i + bhalf + 1, i + 1);
	}
	// - Final body quad for loop
	faces.push(bhalf - 1, pts.length - 1, bhalf, bhalf - 1, bhalf, 0);
	return new Polytope(new Buffer(pts), new Primitive(gl.TRIANGLES, new Buffer(faces, Uint16Array, gl.ELEMENT_ARRAY_BUFFER)));
}
