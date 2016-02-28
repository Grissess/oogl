precision mediump float;

uniform vec4 vColor;

varying vec4 vSmoothColor;

void main(void) {
	gl_FragColor = vColor * vSmoothColor;
}
