### Sketchbook

## TODO

- (DONE) Add sub menu toggle and resizing.
- (DONE) Start experementing with the canvas drawing lines and shapes/ free draw.
- Save the drawing data object to the browser each time a line is created.
- (DONE) Draw a circle on the start and end of the lines, this will make them look smother and create a dot if simply clicking.
- (DONE) Create a a virtual space that the drawing exists in and use the camera object to render that space in the canvas, (this will be needed later for the move/zoom feature).
- (DONE) On refresh of the canvas component render and draw the drawing using the saved data.
- Create a css color pallet that the hole app uses, this will help unify the colors across components and allow for the addition of multiple themes.
- Add the logout function and a user/settings submenu
- Add the translate and scale functions to allow for the move/zoom feature. ([shift] + mouse)
- Add a clear drawing feature.
- Add cmd + z, and cmd + [shift] + z, undo and redo.
- If time look into line selection, allowing for deleting, moving, and editing any line.

## BUGS

- (FIXED) There is a slight line jump that happens on the first rerender of the line. For whatever reason the drawn line dose not redraw perfectly.

## NOTE

I got the camera figured out and is only set up in the render used in the loading of the drawing, i have not set it up on the drawing events yet.
