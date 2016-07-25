function Primitive(prim, indices) {
	this.prim = prim;
	this.indices = indices;
}

Primitive.prototype.draw = function(prog) {
	prog.drawIndexed(this.prim, this.indices);
}

Primitive.prototype.mapTriangles = function(f) {
	switch(this.prim) {
		case gl.TRIANGLES:
			var ret = new Array(this.indices.data.length / 3);
			for(var i = 0; i < ret.length; i++) {
				ret[i] = f(this.indices.data[3*i], this.indices.data[3*i+1], this.indices.data[3*i+2], i);
			}
			return ret;
			break;

		case gl.TRIANGLE_FAN:
			var ret = new Array(this.indices.data.length - 2);
			var i0 = this.indices.data[0];
			for(var i = 1; i < this.indices.data.length - 1; i++) {
				ret[i - 1] = f(i0, this.indices.data[i], this.indices.data[i+1], i - 1);
			}
			return ret;
			break;

		default:
			throw new Error("Primitive "+this.prim+" does not contain triangles");
			break;
	}
}

Primitive.prototype.normalsIn = function(points) {
	if(points[0].length == 2) {
		points = points.map(function(v2) {
			return vec3(v2[0], v2[1], 0);
		});
	}
	return this.mapTriangles(function(i0, i1, i2) {
		var res = cross(subtract(points[i1], points[i0]), subtract(points[i2], points[i0]));
		return res;
	}).map(function(v) {
		var old_v = vec3(v);
		var res = normalize(v);
		return res;
	});
}

Primitive.prototype.centroidsIn = function(points) {
	if(points[0].length == 2) {
		points = points.map(function(v2) {
			return vec3(v2[0], v2[1], 0);
		});
	}
	return this.mapTriangles(function(i0, i1, i2) {
		var res = mult(vec3(1/3, 1/3, 1/3), add(add(points[i0], points[i1]), points[i2]));
		return res;
	});
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

function NormalPolytope(polytope) {
	this.polytope = polytope;
	this.points = polytope.points;
	this.primitives = polytope.primitives;

	for(var i = 0; i < this.primitives.length; i++) {
		var prim = this.primitives[i];
		try {
			prim.normals = new Buffer(prim.normalsIn(this.points.data));
		} catch(e) {
			// Screw it
		}
	}

	this.normals = this.points.data.map(function() { return vec3(0, 0, 0); });
	var _this = this;

	for(i = 0; i < polytope.primitives.length; i++) {
		var prim = polytope.primitives[i];
		if(prim.normals != undefined) {
			prim.mapTriangles(function (i0, i1, i2, iface) {
				_this.normals[i0] = add(_this.normals[i0], prim.normals.data[iface]);
				_this.normals[i1] = add(_this.normals[i1], prim.normals.data[iface]);
				_this.normals[i2] = add(_this.normals[i2], prim.normals.data[iface]);
			});
		}
	}

	this.normals = new Buffer(this.normals.map(function(v) { return normalize(v); }));
}

NormalPolytope.prototype.draw = Polytope.prototype.draw;

var polytope = new (function() {
	function enumeration(len, reverse, orig, stride) {
		if(reverse == undefined) reverse = false;
		if(orig == undefined) orig = 0;
		if(stride == undefined) stride = 1;
		var ret = new Array(len);
		for(var i = 0; i < len; i++) {
			ret[i] = stride * i + orig;
		}
		if(reverse) {
			ret.reverse();
		}
		return new Buffer(ret, Uint16Array, gl.ELEMENT_ARRAY_BUFFER);
	};
	this.enumeration = enumeration;

	function circle(resolution) {
		var pts = [];
		for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / resolution) {
			pts.push(vec2(Math.cos(theta), Math.sin(theta)));
		}
		return new Polytope(new Buffer(pts), new Primitive(gl.TRIANGLE_FAN, enumeration(pts.length)));
	};
	this.circle = circle;

	function cgram(resolution, ir) {
		var pts = [];
		for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / resolution) {
			pts.push(vec2(Math.cos(theta), Math.sin(theta)));
		}
		var halfang = Math.PI / resolution;
		pts = pts.concat(pts.map(function(elem) {
			return vec2(
				ir * (elem[0] * Math.cos(halfang) - elem[1] * Math.sin(halfang)),
				ir * (elem[0] * Math.sin(halfang) + elem[1] * Math.cos(halfang))
			);
		}));
		var innerorig = pts.length / 2;
		var tris = [pts.length - 1, 0, innerorig];
		for(var i = 1; i < innerorig; i++) {
			tris.push(innerorig + i , i, innerorig + i - 1);
		}
		return new Polytope(
			new Buffer(pts),
			new Primitive(gl.TRIANGLE_FAN, enumeration(innerorig, innerorig)),
			new Primitive(gl.TRIANGLES, new Buffer(tris, Uint16Array, gl.ELEMENT_ARRAY_BUFFER))
		);
	};
	this.cgram = cgram;

	function cross(arms, width) {
		var pts = [];
		for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / arms) {
			var pt = vec2(Math.cos(theta), Math.sin(theta));
			var tan = vec2(-Math.sin(theta), Math.cos(theta));
			var hwv = vec2(width/2, width/2);
			var tanoff = mult(tan, hwv);
			pts.push(
				add(pt, tanoff),
				subtract(pt, tanoff)
			);
		}
		var diag = width / (2 * Math.sin(2*Math.PI / arms));
		var rad = Math.sqrt(2 * diag * diag - 2 * diag * diag * Math.cos(180 - (2*Math.PI / arms)));
		for(var theta = Math.PI / arms; theta < 2*Math.PI; theta += 2*Math.PI / arms) {
			pts.push(vec2(rad * Math.cos(theta), rad * Math.sin(theta)));
		}
		var seg2 = arms;
		var seg3 = 2 * seg2;
		var tris = [1, seg3, 0, 1, pts.length-1, seg3];
		for(var i = 1; i < arms; i++) {
			tris.push(
				2*i+1, seg3+i, 2*i,
				2*i+1, seg3+i-1, seg3+i
			);
		}
		return new Polytope(
			new Buffer(pts),
			new Primitive(gl.TRIANGLE_FAN, enumeration(arms, true, seg3)),
			new Primitive(gl.TRIANGLES, new Buffer(tris, Uint16Array, gl.ELEMENT_ARRAY_BUFFER))
		);
	};
	this.cross = cross;

	function cylinder(resolution) {
		// Point generation
		var pts = [];
		for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / resolution) {
			pts.push(vec3(Math.cos(theta), Math.sin(theta), 1));
		}
		pts = pts.concat(pts.map(function(elem) { return vec3(elem[0], elem[1], -elem[2]); }));
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
			faces.push(bhalf, i+1, i);
		}
		// - Body quads
		for(i = 0; i < bhalf -1; i++) {
			faces.push(i, i + bhalf, i + bhalf + 1, i, i + bhalf + 1, i + 1);
		}
		// - Final body quad for loop
		faces.push(bhalf - 1, pts.length - 1, bhalf, bhalf - 1, bhalf, 0);
		return new Polytope(new Buffer(pts), new Primitive(gl.TRIANGLES, new Buffer(faces, Uint16Array, gl.ELEMENT_ARRAY_BUFFER)));
	};
	this.cylinder = cylinder;

	function cone(resolution) {
		var pts = [vec3(0, 0, 1)];
		for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / resolution) {
			pts.push(vec3(Math.cos(theta), Math.sin(theta), -1));
		}
		var faces = [];
		var i;
		for(i = 1; i < pts.length - 1; i++) {
			faces.push(0, i, i+1);
		}
		faces.push(0, pts.length - 1, 1);
		return new Polytope(
			new Buffer(pts),
			new Primitive(gl.TRIANGLES, new Buffer(faces, Uint16Array, gl.ELEMENT_ARRAY_BUFER)),
			new Primitive(gl.TRIANGLE_FAN, enumeration(pts.length - 1, false, 1))
		);
	};
	this.cone = cone;

	function dicone(resolution) {
		var pts = [vec3(0, 0, 1), vec3(0, 0, -1)];
		for(var theta = 0; theta < 2*Math.PI; theta += 2*Math.PI / resolution) {
			pts.push(vec3(Math.cos(theta), Math.sin(theta), 0));
		}
		var faces = [];
		var i;
		for(i = 2; i < pts.length - 1; i++) {
			faces.push(0, i, i+1, 1, i+1, i);
		}
		faces.push(0, pts.length - 1, 2, 1, 2, pts.length - 1);
		return new Polytope(
			new Buffer(pts),
			new Primitive(gl.TRIANGLES, new Buffer(faces, Uint16Array, gl.ELEMENT_ARRAY_BUFER)),
			new Primitive(gl.TRIANGLE_FAN, enumeration(pts.length - 1, false, 2))
		);
	};
	this.dicone = dicone;

	function cube() {
		return new Polytope(
			new Buffer([
				vec3(-1, -1, -1),
				vec3(1, -1, -1),
				vec3(1, 1, -1),
				vec3(-1, 1, -1),
				vec3(-1, -1, 1),
				vec3(1, -1, 1),
				vec3(1, 1, 1),
				vec3(-1, 1, 1)
			]),
			new Primitive(gl.TRIANGLES, new Buffer([
				0, 1, 2,
				0, 2, 3,
				4, 5, 6,
				4, 6, 7,
				0, 1, 5,
				0, 5, 4,
				1, 5, 6,
				1, 6, 2,
				3, 4, 0,
				3, 7, 4,
				2, 6, 7,
				2, 7, 3
			], Uint16Array, gl.ELEMENT_ARRAY_BUFFER))
		);
	};
	this.cube = cube;
})();
