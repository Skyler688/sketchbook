# Sketchbook

## Controls

- **DRAW** left click + mouse move.
- **MOVE** [shift] + left click + mouse move.
- **ZOOM** [shift] + scroll wheel.
- **SAVE** [s key].

## Overview

This app is a simple sketching app using the html canvas and appwrite as a backend service. Most all the core features are in place, excluding a way to delete drawings, and a undo redo macro. I feal the application is in a working state to be a "complete project" and further time will need to be invested in order to implement the further features i would like to add. The app in its current state is far from perfect or ideal but is a solid foundation to come back to and refine and build upon. Making a moveable, zoomable, and infanate canvas, proved a harder problem than initially expected, tacking a considerable amount of the projects time. Other than that the services and SDK provided by appwrite freed allot of development time, allowing me to pursue the infinate canvas idea.

### TODO

- (DONE) Add sub menu toggle and resizing.
- (DONE) Start experementing with the canvas drawing lines and shapes/ free draw.
- (DONE) Save the drawing data object to the browser each time a line is created.
- (DONE) Draw a circle on the start and end of the lines, this will make them look smother and create a dot if simply clicking.
- (DONE) Create a a virtual space that the drawing exists in and use the camera object to render that space in the canvas, (this will be needed later for the move/zoom feature).
- (DONE) On refresh of the canvas component render and draw the drawing using the saved data.
- (DONE) Add the logout function
- (DONE) Add the translate and scale functions to allow for the move/zoom feature. ([shift] + mouse)
- (DONE) Add and test drawing saving and fetching to appwrite.
- (DONE) Add a save file name to local storage/ a file info header like display component.

- (DONE) Instead of on end point that both creates and updates the drawing files, separate them so i can add a name taken filter in the create endpoint.

### BUGS

- (FIXED) There is a slight line jump that happens on the first rerender of the line. For whatever reason the drawn line dose not redraw perfectly.
- (FIXED) Zoom dose not work well with touch pad.
- (FIXED) When starting new drawing from a blank new account it fails to load and display said drawing.
- (FIXED) Update/fetch new list when creating new drawing.
- Clear local storage when logging out to prevent loading a drawing from an other account if switching.

### BACKLOG

- Come up with a method to filter out all points that are not in the current screen, also to decrease draw calls. Is currently wasting allot compute drawing the hole world space.
- Before saving a line run a point reduction filter that will remove all in between points that result in a straight line, within a given margin.
- Look into using curves in the render of the drawing to increase the performance and make the lines smoother.
- Add a clear drawing feature.
- Add cmd + z, and cmd + [shift] + z, undo and redo.
- If time look into line selection, allowing for deleting, moving, and editing any line. (Make new branch if doing this).
- Create a css color pallet that the hole app uses, this will help unify the colors across components and allow for the addition of multiple themes.
- Add a settings sub menu.
