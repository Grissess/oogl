precision mediump float;

uniform vec4 vColor;
uniform sampler2D sTex;

varying vec2 vUV;

void main(void) {
	gl_FragColor = texture2D(sTex, vUV) * vColor;
}
