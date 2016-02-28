// Implementations of quaternions based on MV

// Elements of a quaternion array: [real, i, j, k]
function quat(a0, a1, a2, a3) {
	if(Array.isArray(a0)) {
		if(a0.length == 4) {
			// Four-element array quaternion
			return a0;
		}
		if(a0.length == 3) {
			if(a1 == undefined) {
				// vec3 point constructor
				return [0, a0[0], a0[1], a0[2]];
			} else {
				// Axis, angle / R3 point constructor
				c = Math.sin(a1 / 2.0);
				return [Math.cos(a1 / 2.0), c*a0[0], c*a0[1], c*a0[2]];
			}
		}
		throw "Bad quat array size: "+a0.length;
	}
	if(a0 == undefined) {
		// Empty constructor, give a unit quaternion
		return [1, 0, 0, 0];
	}
	// Assume a flat set of components
	return [a0, a1, a2, a3];
}

function quatInv(q) {
	return quat(q[0], -q[1], -q[2], -q[3]);
}

function quatMul(q1, q2) {
	return quat(
		q1[0]*q2[0] - q1[1]*q2[1] - q1[2]*q2[2] - q1[3]*q2[3],
		q1[0]*q2[1] + q1[1]*q2[0] + q1[2]*q2[3] - q1[3]*q2[2],
		q1[0]*q2[2] - q1[1]*q2[3] + q1[2]*q2[0] + q1[3]*q2[1],
		q1[0]*q2[3] + q1[1]*q2[2] - q1[2]*q2[1] + q1[3]*q2[0]
	);
}

function quatRot(q, v) {
	return quatMul(quatMul(q, quat(v)), quatInv(q));
}

function quatMat(q) {
	return mat4( 1 - 2*q[2]*q[2] - 2*q[3]*q[3], 2*(q[1]*q[2] - q[3]*q[0]), 2*(q[1]*q[3] + q[2]*q[0]), 0, 2*(q[1]*q[2] + q[3]*q[0]), 1 - 2*q[1]*q[1] - 2*q[3]*q[3], 2*(q[2]*q[3] - q[1]*q[0]), 0, 2*(q[1]*q[3] - q[2]*q[0]), 2*(q[2]*q[3] + q[1]*q[0]), 1 - 2*q[1]*q[1] - 2*q[2]*q[2], 0, 0, 0, 0, 1);
}
