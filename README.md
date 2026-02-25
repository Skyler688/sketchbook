### Sketchbook

## Controls

- **DRAW** left click + mouse move.
- **MOVE** [shift] + left click + mouse move.
- **ZOOM** [shift] + scroll wheel.

## TODO

- (DONE) Add sub menu toggle and resizing.
- (DONE) Start experementing with the canvas drawing lines and shapes/ free draw.
- (DONE) Save the drawing data object to the browser each time a line is created.
- (DONE) Draw a circle on the start and end of the lines, this will make them look smother and create a dot if simply clicking.
- (DONE) Create a a virtual space that the drawing exists in and use the camera object to render that space in the canvas, (this will be needed later for the move/zoom feature).
- (DONE) On refresh of the canvas component render and draw the drawing using the saved data.
- Create a css color pallet that the hole app uses, this will help unify the colors across components and allow for the addition of multiple themes.
- Add the logout function and a user/settings submenu
- (DONE) Add the translate and scale functions to allow for the move/zoom feature. ([shift] + mouse)
- Add a clear drawing feature.
- Add cmd + z, and cmd + [shift] + z, undo and redo.
- If time look into line selection, allowing for deleting, moving, and editing any line. (Make new branch if doing this).

## BUGS

- (FIXED) There is a slight line jump that happens on the first rerender of the line. For whatever reason the drawn line dose not redraw perfectly.
- (FIXED) Zoom dose not work well with touch pad.

## NOTES

- Should probably move all the current key events to the [Canvas] component so the key events are not global. It would be best to deligate key press events in the Main component
