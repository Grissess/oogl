Graham Northup
2016-02-16


This assignment is an example animation of an octagon (textured with a bitmap
of a stop sign), controlled by user inputs. The shape has a position and
rotation, as well as first derivatives of those (a speed vector and angular
velocity). The inputs are as follows:
- W, A, S, and D change the direction of the speed vector.
- The buttons "Increase Speed" and "Decrease Speed" change the magnitude of
  the speed vector.
- The buttons "Start Rotation and Stop Rotation" set the magnitude of the
  angular velocity vector.
- Clicking anywhere on the canvas immediately sets the position to the
  location clicked.

This assignment also represents one of the first uses of oogl.js, a library I
have developed from the skeleton of previous assignments and experiments to
accelerate the development of WebGL demonstrations and applications. Feel free
to use it, I will likely release it after this class is done under a
permissive license, such as the Apache License.

Please note that this application must be run under a bona fide HTTP server in
order to load its image resource (the stop sign) properly. Additionally, this
HTTP server must have access to the Common directory, which must be a sibling
to the directory in which this lab is extracted. Opening this demonstration as
only a file will deny load access to the image due to the cross-origin policy,
which is quite restrictive in the file:// URI. If the texture cannot load the
image, its default pixel data is a 1x1 magenta pixel, and so the octagon will
render magenta.

The application was tested in Vivaldi 1.0.365.3 dev. Please let me know if
some parts of the input functionality do not work in your setup, and I will
adjust further examples accordingly.
