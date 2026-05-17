# Sketchbook

## Controls

- **DRAW** left click + mouse move.
- **MOVE** [shift] + left click + mouse move.
- **ZOOM** [shift] + scroll wheel.
- **SAVE** [s key].

## Overview

This app is a simple sketching app using the html canvas and appwrite as a backend service. Most all the core features are in place, excluding a way to delete drawings, and a undo redo macro. I feal the application is in a working state to be a "complete project" and further time will need to be invested in order to implement the further features i would like to add. The app in its current state is far from perfect or ideal but is a solid foundation to come back to and refine and build upon. Making a moveable, zoomable, and infanate canvas, proved a harder problem than initially expected, tacking a considerable amount of the projects time. Other than that the services and SDK provided by appwrite freed allot of development time, allowing me to pursue the infinate canvas idea.

The overall architecture of this project is a nextjs server that also servers as a middleman between appwrite and the client. Ideally i would set up a auth flow that grants the client temporary access to the appwrite services needed but for this project the development simplicity is well worth the extra bandwidth of two servers. (Also the next server is hosted on appwrite as well so the services should be fast still as they are in the same data center). The user auth is handled manualy on the next server using the tablesDB from appwrite to store the users info. Once the user is logged in they get a token granting access to the "private endpoints" witch are protected with middleware. The user at this point dose not pass any info about themselves in the request body but instead the users id is parsed out of the token if it is a valid user and passed to the endpoints via the request header. So far i have the endpoints for listing, downloading, creating, and saving the drawing files. I still need to add a delete endpoint and will do that at a later time. As for how the actual drawing is done, i am using the html canvas and drawing lines as a list of points. This object of points is stored in a useRef with a custom state bridge in the Main component called drawingBridge. This object is then compressed and decompressed on the client side and uploaded, and downloaded from an appwrite bucket.

## TODO

### Core Features

- Implement a way to delete drawings.
- Implement the redo stack, and the undo redo feature.
- Update the header to display more than just the drawing name, and add the saved status, and camera position and zoom.
- Create a user account menu with options to change password, and delete account.

### Feature Backlog

- Line selection, movement, and deletion.
- Rendering grid, used to optimize rendering by only rendering the lines that are visible.
- Forgot password email recovery.
- Create shapes and strait lines with snapping/free mode.
- Experiment with toggle based key events. (like vim)

### BUGS

- After moving the camera and drawing a new line the drawing can shift a bit. This is caused by the distance based rerendering filter, instead replace this with a time based rerender. This will also make the movement more smooth.
