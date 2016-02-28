attribute vec4 vPosition;
attribute vec2 vTexCoord;
attribute vec4 vVertexColor;
uniform mat4 mTransform;

varying vec2 vUV;
varying vec4 vSmoothColor;

void main(void) {
	gl_Position = mTransform * vPosition;
	vUV = vTexCoord;
	vSmoothColor = vVertexColor;
	gl_PointSize = 1.0;
}
