precision highp float;
precision highp int;

uniform vec4 vAmbientColor;
uniform vec4 vDiffuseColor;
uniform vec4 vSpecularColor;
uniform vec4 vEmissionColor;

uniform int iLightType[NUM_LIGHTS];
uniform float fLightSpecularExponent[NUM_LIGHTS];

uniform sampler2D sTex;
uniform float fTexAmbientInfluence;
uniform float fTexDiffuseInfluence;
uniform float fTexSpecularInfluence;

uniform float fVertexAmbientInfluence;
uniform float fVertexDiffuseInfluence;
uniform float fVertexSpecularInfluence;

varying vec4 vAmbientComponent[NUM_LIGHTS];
varying vec4 vDiffuseComponent[NUM_LIGHTS];
varying vec4 vSpecularComponent[NUM_LIGHTS];
varying vec3 vIncident[NUM_LIGHTS];

varying vec2 vUV;
varying vec4 vSmoothColor;
varying vec3 vSmoothNormal;
varying vec3 vViewer;

void main(void) {
	vec4 frag = vec4(0.0);
	vec4 ambc, difc, spec;
	vec4 samp = texture2D(sTex, vUV);

	float diff, spef;
	float costheta[NUM_LIGHTS];

	ambc = vAmbientColor + (fVertexAmbientInfluence * vSmoothColor) + (fTexAmbientInfluence * samp);
	for(int lidx = 0; lidx < NUM_LIGHTS; lidx++) {
		if(iLightType[lidx] == 1) {
			frag += ambc * vAmbientComponent[lidx];
		}
	}

	difc = vDiffuseColor + (fVertexDiffuseInfluence * vSmoothColor) + (fTexDiffuseInfluence * samp);
	for(int lidx = 0; lidx < NUM_LIGHTS; lidx++) {
		if(iLightType[lidx] == 1) {
			costheta[lidx] = dot(vSmoothNormal, vIncident[lidx]);
			diff = max(0.0, costheta[lidx]);
			frag += difc * vDiffuseComponent[lidx] * diff;
		}
	}

	spec = vSpecularColor + (fVertexSpecularInfluence * vSmoothColor) + (fTexSpecularInfluence * samp);
	for(int lidx = 0; lidx < NUM_LIGHTS; lidx++) {
		if(iLightType[lidx] == 1) {
			spef = pow(max(dot(normalize(2.0 * costheta[lidx] * vSmoothNormal - vIncident[lidx]), vViewer), 0.0), fLightSpecularExponent[lidx]);
			frag += spec * vSpecularComponent[lidx] * spef * floor(0.5 * (sign(costheta[lidx]) + 1.0));
		}
	}

	frag = clamp(frag + vEmissionColor, 0.0, 1.0);

	gl_FragColor = frag;
}
