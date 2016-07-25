Graham Northup
2016-02-25


This project is a "rhythm game"; it is a game where the challenge is to press
keys in the correct time.  Shapes represent individual channels, with A, S, D,
and F corresponding to triangle, square, pentagram, and 7-point star
respectively.  For hits, score is increased, bonus is increased, and the
remaining time goes up; for misses, the bonus is reset, and remaining time
goes down.  Remaining time is, of course, decremented regularly (in game
time). When this count reaches zero, the game ends. As the game progresses,
the spawn rate of events slowly increases, until it (in theory) overwhelms the
player.

In the Javascript file itself, many of the configuration parameters of the game
are editable, and isolated to the top of the file.

The events are generated using an exponential distribution, which gives fair
guarantees as to the spacing of events, more properly than simply choosing a
uniform distribution.

Sound was proposed to be a feature, but was never added. Similar areas for
improvement include synchronizing events to external sources, such as music
files.

This particular game uses a differentiated render/update loop; update is
called continuously at a fixed rate independent of the renderer, while render
is called on animation frames of the browser. This permits the two to run at
independent rates, depending on graphics capabilities of the host and
processor load.
