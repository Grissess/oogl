/* Simple object-oriented overlays to GL */

var BUFFER_GL_TYPES = undefined

function Buffer(data, dtype, target, drawtype) {
	if(BUFFER_GL_TYPES == undefined) {
		BUFFER_GL_TYPES = {};
		BUFFER_GL_TYPES[Uint8Array] = gl.UNSIGNED_BYTE
		BUFFER_GL_TYPES[Uint16Array] = gl.UNSIGNED_SHORT
		BUFFER_GL_TYPES[Uint32Array] = gl.UNSIGNED_INT
		BUFFER_GL_TYPES[Int8Array] = gl.BYTE
		BUFFER_GL_TYPES[Int16Array] = gl.SHORT
		BUFFER_GL_TYPES[Int32Array] = gl.INT
		BUFFER_GL_TYPES[Float32Array] = gl.FLOAT
	}
	this.object = gl.createBuffer();
	if(dtype == undefined) dtype = Float32Array;
	this.dtype = dtype;
	if(target == undefined) target = gl.ARRAY_BUFFER;
	this.target = target;
	if(data != undefined) {
		this.set(data, drawtype);
	}
}

Buffer.prototype.set = function(data, drawtype) {
	gl.bindBuffer(this.target, this.object);
	this.data = data;
	if(drawtype == undefined) {
		drawtype = gl.STATIC_DRAW;
	}
	if(Array.isArray(data)) {
		if(data.length == 0) {
			gl.bufferData(this.target, new this.dtype(), drawtype);
			return;
		}
		if(Array.isArray(data[0])) {
			this.itemSize = data[0].length;
		} else {
			this.itemSize = 1;
		}
		this.items = data.length;
		gl.bufferData(this.target, new this.dtype(flatten(data)), drawtype);
		return;
	}
	throw new Error("Unknown type to set: "+typeof(data));
};

Buffer.prototype.bind = function() {
	gl.bindBuffer(this.target, this.object);
}

Object.defineProperty(Buffer.prototype, "glType", {
	"get": function() {
		return BUFFER_GL_TYPES[this.dtype];
	}
});

function UniformVar(prog, name) {
	this.prog = prog;
	this.name = name;
	this.rebind();
}

UniformVar.prototype.rebind = function() {
	gl.useProgram(this.prog);
	this.index = gl.getUniformLocation(this.prog, this.name);
};

UniformVar.prototype.set = function(val) {
	gl.useProgram(this.prog);
	if(val.toUniValue) {
		val = val.toUniValue(this);
	}
	if(val.tex) {
		gl.uniform1i(this.index, val.unit);
		return;
	}
	if(val.matrix) {
		switch(val.length) {
			case 2:
				gl.uniformMatrix2fv(this.index, false, new Float32Array(flatten(val)));
				break;
			case 3:
				gl.uniformMatrix3fv(this.index, false, new Float32Array(flatten(val)));
				break;
			case 4:
				gl.uniformMatrix4fv(this.index, false, new Float32Array(flatten(val)));
				break;
			default:
				throw new Error("Bad matrix length: "+val.length);
				break;
		}
		return;
	}
	if(Array.isArray(val)) {
		switch(val.length) {
			case 2:
				gl.uniform2fv(this.index, new Float32Array(val));
				break;
			case 3:
				gl.uniform3fv(this.index, new Float32Array(val));
				break;
			case 4:
				gl.uniform4fv(this.index, new Float32Array(val));
				break;
			default:
				throw new Error("Bad vector length: "+val.length);
				break;
		}
		return;
	}
	if(typeof(val) == "number") {
		gl.uniform1f(this.index, val);
		return;
	}
	throw new Error("Unknown type to set: "+val);
};

function AttribVar(prog, name) {
	this.prog = prog;
	this.name = name;
	this.rebind();
}

AttribVar.prototype.rebind = function() {
	gl.useProgram(this.prog);
	this.index = gl.getAttribLocation(this.prog, this.name);
};

AttribVar.prototype.set = function(buffer, norm, stride, offset) {
	if(norm == undefined) norm = false;
	if(stride == undefined) stride = 0;
	if(offset == undefined) offset = 0;
	gl.useProgram(this.prog);
	if(buffer.target != gl.ARRAY_BUFFER) {
		throw new Error("Can't use buffer with target "+buffer.target+" for attributes");
	}
	buffer.bind();
	gl.enableVertexAttribArray(this.index);
	gl.vertexAttribPointer(this.index, buffer.itemSize, buffer.glType, norm, stride, offset);
	this.buffer = buffer;
};

function Texture(image, options) {
	if(options == undefined) {
		options = {};
	}
	this.tex = gl.createTexture();
	this.unit = options.unit || 0;
	this.wrap_s = options.wrap_s || gl.CLAMP_TO_EDGE;
	this.wrap_t = options.wrap_t || gl.CLAMP_TO_EDGE;
	this.min_filter = options.min_filter || gl.NEAREST;
	this.mag_filter = options.mag_filter || gl.NEAREST;
	this.flip_y = options.flip_y || true;
	this.premul = options.premul || false;
	if(image) {
		this.setImage(image);
	} else {
		this.setParameters();
	}
}

Texture.prototype.activate = function() {
	gl.activeTexture(gl.TEXTURE0 + this.unit);
	gl.bindTexture(gl.TEXTURE_2D, this.tex);
}

Texture.prototype.setParameters = function() {
	this.activate();
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.wrap_s);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.wrap_t);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.min_filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.mag_filter);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !!this.flip_y);
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !!this.premul);
}

Texture.prototype.setImage = function(image) {
	this.activate();
	this.setParameters();
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

Texture.prototype.setPixelData = function(width, height, data) {
	this.activate();
	this.setParameters();
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
}

Texture.prototype.load = function(iurl) {
	this.setPixelData(1, 1, new Uint8Array([255, 0, 255, 255]));
	_loader_start(new LoadRequest(iurl, this));
}

function LoadRequest(iurl, tex) {
	this.iurl = iurl;
	this.tex = tex;
}

LoadRequest.prototype.satisfy = function(image) {
	this.tex.setImage(image);
}

LoadRequest.prototype.initiate = function(loader) {
	loader.src = this.iurl;
}

var _loader = new Image();
var _loadqueue = [];
var _loadreq = undefined;
_loader.onload = function() {
	_loadreq.satisfy(_loader);
	_loadreq = _loadqueue.shift();
	if(_loadreq) {
		_loadreq.initiate(_loader);
	}
};

function _loader_start(req) {
	_loadqueue.push(req)
	if(!_loadreq) {
		_loadreq = _loadqueue.shift();
		_loadreq.initiate(_loader);
	}
}

function Program(sources, options) {
	var uniform_names = options.uniforms || [];
	var attribute_names = options.attributes || [];
	this.prog = gl.createProgram();
	for(shadtp in sources) {
		if(Object.prototype.hasOwnProperty.call(sources, shadtp)) {
			var value = sources[shadtp];
			if(value instanceof HTMLScriptElement) {
				if(!value.text.length) {
					var xhr = new XMLHttpRequest();
					xhr.open('GET', value.src, false);
					xhr.send(null);
					value = xhr.responseText;
				} else {
					value = value.text;
				}
			}
			shad = gl.createShader(gl[shadtp]);
			gl.shaderSource(shad, value);
			gl.compileShader(shad);
			if(!gl.getShaderParameter(shad, gl.COMPILE_STATUS)) {
				alert(gl.getShaderInfoLog(shad));
				return;
			} else {
				gl.attachShader(this.prog, shad);
			}
		}
	}
	gl.linkProgram(this.prog);
	if(!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
		alert("Couldn't link shader program");
		return;
	}
	this.use();
	this.uniforms = {};
	this.u = this.uniforms;
	this.attributes = {};
	this.a = this.attributes;
	var outer = this;
	uniform_names.forEach(function(name) {
		outer.uniforms[name] = new UniformVar(outer.prog, name);
		outer.uniforms[name].program = outer;
	});
	attribute_names.forEach(function(name) {
		outer.attributes[name] = new AttribVar(outer.prog, name);
		outer.attributes[name].program = outer;
	});
}

Program.prototype.use = function() {
	gl.useProgram(this.prog);
}

Program.prototype.draw = function(prim, start_obj, amt) {
	this.use();
	if(start_obj == undefined || (type(start_obj) == "number" && amt == undefined)) {
		amt = 0
		for(var name in this.attributes) {
			amt = Math.max(amt, this.a[name].buffer.items);
		}
	} else {
		amt = start_obj.items;
		start_obj = 0;
	}
	if(start_obj == undefined) {
		start_obj = 0;
	}
	gl.drawArrays(prim, start_obj, amt);
}

Program.prototype.drawIndexed = function(prim, indices, start, amt) {
	this.use();
	if(start == undefined) start = 0;
	if(amt == undefined) amt = indices.items;
	if(indices.target != gl.ELEMENT_ARRAY_BUFFER) {
		throw new Error("Can't use buffer with target "+buffer.target+" for indexed drawing");
	}
	indices.bind();
	gl.drawElements(prim, amt, indices.glType, start);
}
