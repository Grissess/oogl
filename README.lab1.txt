Graham Northup
2016-01-31


This assignment is a display of four different vertex buffers (a square
encompassing the background, an ellipse, a regular hexagon, and a pentagon)
across three programs, each of which use a fragment shader which is sensitive
to time and screen position (all of them use the sine and cosine functions),
and a vertex shader which permits passing in an arbitrary transformation
matrix, which is used to animate the scene. The background square uses the
frag_blink shader, the ellipse uses the frag_wavy-plaid shader, and the
remaining two shapes use the frag_dotty shader. For this scene, the
transformation matrix is a rotation matrix (about the origin, around the Z
axis) as a function of time.
