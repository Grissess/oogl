Graham Northup
2016-02-25


This assignment demonstrates a three-dimensional polytope (a polyhedron) and
provides user controls for manipulating its transformation. The following
variables dictate its transformation:

- pos is a vec3 controlling translation.
- orient is a quat controlling orientation/rotation.
- scale is a vec3 controlling scale.

These are applied in the order [translate, rotate, scale]; this is evidenced
in lab3.js, particularly in the function transformMatrix().

The following keys/actions manipulate the transformation:

- W and S rotate 0.05rad and -0.05rad about X, respectively.
- D and A rotate 0.05rad and -0.05rad about Y, respectively.
- E and Q rotate 0.05rad and -0.05rad about Z, respectively.
- H and F scale on X by a factor of 3/2 and 2/3, respectively.
- T and G scale on Y by a factor of 3/2 and 2/3, respectively.
- Y and R scale on Z by a factor of 3/2 and 2/3, respectively.
- L and J translate on X by 0.05 and -0.05 units, respectively.
- I and K translate on Y by 0.05 and -0.05 units, respectively.
- Clicking and dragging causes rotation about Y and X by the delta in X and Y
  of screenspace/clientspace, respectively, by a factor of 0.005. The controls
  were adjusted to be intuitive, so in both cases, the factor is negated.

All rotations are performed with quaternions, which are numerically stable and
do not experience gimbal lock; the effect (alongside the transform order) is
that all rotations are essentially effected on global axes, regardless of
current orientation. Consult quat.js in the distribution for algorithms.

The polytope displayed is a cylinder, as defined in polytope.js, included in
the distribution. Colors are randomly assigned to all vertices and smoothly
interpolated.

This was tested in Firefox 44.0.2; it appears that event-handling code
(especially for keypresses) does not work in Vivaldi and other WebKit-based
browsers. If need be, this can be rectified.
