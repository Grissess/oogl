precision highp float;
precision highp int;

attribute vec3 vPosition;
attribute vec2 vTexCoord;
attribute vec4 vVertexColor;
attribute vec3 vNormal;

uniform mat4 mModelView;
uniform mat4 mProjection;

uniform vec3 vLightPos[NUM_LIGHTS];
uniform vec4 vLightAmbientEmission[NUM_LIGHTS];
uniform vec4 vLightDiffuseEmission[NUM_LIGHTS];
uniform vec4 vLightSpecularEmission[NUM_LIGHTS];
uniform int iLightType[NUM_LIGHTS];
uniform float fLightSolidAngle[NUM_LIGHTS];

uniform vec3 vEyePos;

varying vec4 vAmbientComponent[NUM_LIGHTS];
varying vec4 vDiffuseComponent[NUM_LIGHTS];
varying vec4 vSpecularComponent[NUM_LIGHTS];
varying vec3 vIncident[NUM_LIGHTS];

varying vec2 vUV;
varying vec4 vSmoothColor;
varying vec3 vSmoothNormal;
varying vec3 vViewer;

void main(void) {
	float fNorm, fIntensity;

	for(int lidx = 0; lidx < NUM_LIGHTS; lidx++) {
		if(iLightType[lidx] == 1) {
			fNorm = length(vPosition - vLightPos[lidx]);
			fIntensity = fNorm * fNorm;

			vAmbientComponent[lidx] = vLightAmbientEmission[lidx] / fIntensity;
			vDiffuseComponent[lidx] = vLightDiffuseEmission[lidx] / fIntensity;
			vSpecularComponent[lidx] = vLightSpecularEmission[lidx] / fIntensity;

			vIncident[lidx] = normalize(vLightPos[lidx] - vPosition);
		}
	}

	vSmoothNormal = vNormal;
	vSmoothColor = vVertexColor;
	vViewer = normalize(vEyePos - vPosition);

	gl_Position = mProjection * mModelView * vec4(vPosition, 1.0);
	gl_PointSize = 1.0;
}
