# Server.js Code Breakdown - Step by Step

This document provides a detailed explanation of every part of the `server.js` file for the Photo Sharing Application.

---

## Table of Contents

1. [Initial Setup & Dependencies](#1-initial-setup--dependencies)
2. [Server Configuration](#2-server-configuration)
3. [File Upload Configuration](#3-file-upload-configuration)
4. [Data Storage](#4-data-storage)
5. [Routes](#5-routes)
6. [Photo Upload Endpoint](#6-photo-upload-endpoint)
7. [WebSocket Connection Handling](#7-websocket-connection-handling)
8. [Server Start](#8-server-start)

---

## 1. Initial Setup & Dependencies

```javascript
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
```

**What's happening:**

- **express**: Web framework for Node.js - handles HTTP requests, routing, and middleware
- **http**: Built-in Node.js module to create an HTTP server
- **socketIO**: Enables real-time, bidirectional communication between server and clients (WebSocket)
- **multer**: Middleware for handling file uploads (multipart/form-data)
- **path**: Built-in Node.js module for working with file and directory paths
- **fs**: Built-in Node.js module for file system operations (read/write files)

---

## 2. Server Configuration

```javascript
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;
```

**What's happening:**

- `app = express()`: Creates an Express application instance
- `server = http.createServer(app)`: Wraps Express app in an HTTP server (needed for Socket.io)
- `io = socketIO(server)`: Attaches Socket.io to the HTTP server for real-time communication
- `PORT = process.env.PORT || 3000`: Server will run on port from environment variable or default to 3000

---

### Setting Up View Engine

```javascript
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
```

**What's happening:**

- **EJS (Embedded JavaScript)** is set as the template engine
- Templates are stored in the `views/` folder
- EJS allows embedding JavaScript code in HTML files
- `__dirname` is the current directory path

---

### Middleware Setup

```javascript
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**What's happening:**

- `express.static("public")`: Serves static files (CSS, JS, images) from the `public/` folder
- `express.json()`: Parses incoming JSON data in request body
- `express.urlencoded({ extended: true })`: Parses URL-encoded form data (like from HTML forms)

---

## 3. File Upload Configuration

```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
```

**What's happening:**

- `multer.diskStorage()`: Configures how and where files are stored on disk
- **destination**: Function that sets upload folder to `public/uploads/`
- **filename**: Function that generates unique filename:
  - `Date.now()`: Current timestamp in milliseconds
  - `Math.round(Math.random() * 1e9)`: Random number (0-1,000,000,000)
  - `path.extname(file.originalname)`: Gets original file extension (e.g., `.jpg`)
  - Example result: `1706428800000-234567890.jpg`

---

### File Upload Restrictions

```javascript
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});
```

**What's happening:**

- **storage**: Uses the disk storage configuration from above
- **limits**: Maximum file size is 5MB (5 × 1024 × 1024 bytes)
- **fileFilter**: Validates uploaded files:
  - Checks if MIME type is `image/jpeg`, `image/jpg`, `image/png`, or `image/gif`
  - Checks if file extension is `.jpeg`, `.jpg`, `.png`, or `.gif`
  - Both checks must pass; otherwise, returns error
  - `cb(null, true)`: Accept the file
  - `cb(new Error(...))`: Reject the file with error message

---

## 4. Data Storage

```javascript
const users = new Map(); // socketId -> {username, groups}
const groups = new Map(); // groupName -> {members: Set, photos: Array}
const photos = []; // Array of all shared photos
```

**What's happening:**

- **In-memory storage** (data lost when server restarts)
- **users Map**:
  - Key: Socket ID (unique identifier for each connected client)
  - Value: Object with `username` and `groups` (Set of group names user joined)
- **groups Map**:
  - Key: Group name (e.g., "Friends", "Family")
  - Value: Object with `members` (Set of socket IDs) and `photos` (Array of photo objects)
- **photos Array**: Stores all photo objects with metadata

---

## 5. Routes

### Home Page Route

```javascript
app.get("/", (req, res) => {
  res.render("index");
});
```

**What's happening:**

- Handles GET requests to the root URL (`http://localhost:3000/`)
- `res.render("index")`: Renders `views/index.ejs` template
- This is the **login page**

---

### App Page Route

```javascript
app.get("/app", (req, res) => {
  res.render("app");
});
```

**What's happening:**

- Handles GET requests to `/app` URL
- `res.render("app")`: Renders `views/app.ejs` template
- This is the **main application page** (photo sharing interface)

---

## 6. Photo Upload Endpoint

```javascript
app.post("/upload", upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
```

**What's happening:**

- Handles POST requests to `/upload`
- `upload.single("photo")`: Multer middleware processes single file with field name "photo"
- After multer processes, file info is in `req.file`
- If no file uploaded, return 400 error with JSON message

---

### Creating Photo Object

```javascript
const photoData = {
  id: Date.now(),
  filename: req.file.filename,
  path: `/uploads/${req.file.filename}`,
  username: req.body.username,
  group: req.body.group || "all",
  caption: req.body.caption || "",
  timestamp: new Date().toISOString(),
  comments: [],
};

photos.push(photoData);
```

**What's happening:**

- Creates a photo object with metadata:
  - **id**: Unique identifier using timestamp
  - **filename**: Generated unique filename from multer
  - **path**: URL path to access the image (e.g., `/uploads/1234567890.jpg`)
  - **username**: Who uploaded it (from form data)
  - **group**: Which group it belongs to (default: "all")
  - **caption**: Optional photo description
  - **timestamp**: ISO format date/time (e.g., "2026-01-28T10:30:00.000Z")
  - **comments**: Empty array to store comments later
- Adds photo to global `photos` array

---

### Broadcasting Photo to Users

```javascript
  // Emit to specific group or all users
  if (photoData.group === "all") {
    io.emit("new-photo", photoData);
  } else if (groups.has(photoData.group)) {
    const group = groups.get(photoData.group);
    group.photos.push(photoData);
    // Emit only to group members
    group.members.forEach((socketId) => {
      io.to(socketId).emit("new-photo", photoData);
    });
  }

  res.json({ success: true, photo: photoData });
});
```

**What's happening:**

- **If group is "all"**: Broadcast photo to ALL connected users using `io.emit()`
- **If specific group**:
  - Add photo to group's photos array
  - Loop through group members' socket IDs
  - Send photo only to those members using `io.to(socketId).emit()`
- **Response**: Send JSON success message back to uploader
- This is **real-time communication** - photo appears instantly for other users!

---

## 7. WebSocket Connection Handling

### New Connection

```javascript
io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);
```

**What's happening:**

- `io.on("connection", ...)`: Listens for new WebSocket connections
- `socket`: Represents the individual connected client
- `socket.id`: Unique identifier automatically assigned by Socket.io
- Logs connection to server console

---

### User Join Event

```javascript
socket.on("join", (username) => {
  users.set(socket.id, { username, groups: new Set() });
  socket.username = username;

  // Send existing photos to new user
  socket.emit("load-photos", photos);

  // Notify others
  socket.broadcast.emit("user-joined", { username, userId: socket.id });

  // Send current users list
  const usersList = Array.from(users.entries()).map(([id, data]) => ({
    id,
    username: data.username,
  }));
  io.emit("users-list", usersList);

  // Send groups list
  const groupsList = Array.from(groups.keys());
  io.emit("groups-list", groupsList);
});
```

**What's happening:**

1. **Store user data**: Add user to `users` Map with empty groups Set
2. **Attach username to socket**: For easy access later
3. **Send all photos**: `socket.emit("load-photos", photos)` sends photos ONLY to this new user
4. **Notify others**: `socket.broadcast.emit()` sends to EVERYONE except this user
5. **Update users list**: Convert Map to array and send to ALL users
6. **Send groups list**: Extract group names and send to ALL users

**Key difference:**

- `socket.emit()`: Send to THIS user only
- `socket.broadcast.emit()`: Send to ALL users EXCEPT this one
- `io.emit()`: Send to ALL users INCLUDING this one

---

### Create Group Event

```javascript
socket.on("create-group", (groupName) => {
  if (!groups.has(groupName)) {
    groups.set(groupName, {
      members: new Set([socket.id]),
      photos: [],
    });

    const user = users.get(socket.id);
    if (user) {
      user.groups.add(groupName);
    }

    socket.join(groupName);
    io.emit("group-created", { groupName, creator: socket.username });

    const groupsList = Array.from(groups.keys());
    io.emit("groups-list", groupsList);
  } else {
    socket.emit("error", "Group already exists");
  }
});
```

**What's happening:**

1. **Check if group exists**: `groups.has(groupName)` - prevent duplicates
2. **Create group**:
   - Add to `groups` Map
   - Initialize with creator's socket ID in members Set
   - Start with empty photos array
3. **Update user data**: Add group name to user's groups Set
4. **Join Socket.io room**: `socket.join(groupName)` - enables room-based broadcasting
5. **Notify everyone**: Send "group-created" event to all users
6. **Update groups list**: Send updated list to all users
7. **Handle error**: If group exists, send error only to requesting user

**Socket.io Rooms**: Special feature that allows grouping sockets together for targeted broadcasting

---

### Join Group Event

```javascript
socket.on("join-group", (groupName) => {
  if (groups.has(groupName)) {
    const group = groups.get(groupName);
    group.members.add(socket.id);

    const user = users.get(socket.id);
    if (user) {
      user.groups.add(groupName);
    }

    socket.join(groupName);

    // Send group photos to the user
    socket.emit("load-group-photos", { groupName, photos: group.photos });

    // Notify group members
    socket.to(groupName).emit("user-joined-group", {
      groupName,
      username: socket.username,
    });
  }
});
```

**What's happening:**

1. **Verify group exists**: Check if group is in `groups` Map
2. **Add user to group**:
   - Add socket ID to group's members Set
   - Add group name to user's groups Set
3. **Join Socket.io room**: Enables room-specific broadcasts
4. **Send group photos**: Send only this group's photos to joining user
5. **Notify group members**: `socket.to(groupName)` sends to ONLY users in that room
   - Different from `io.to(groupName)` which includes the sender

---

### Add Comment Event

```javascript
socket.on("add-comment", (data) => {
  const { photoId, comment } = data;
  const photo = photos.find((p) => p.id === photoId);

  if (photo) {
    const commentData = {
      username: socket.username,
      comment,
      timestamp: new Date().toISOString(),
    };

    photo.comments.push(commentData);

    // Emit to appropriate audience
    if (photo.group === "all") {
      io.emit("new-comment", { photoId, comment: commentData });
    } else if (groups.has(photo.group)) {
      const group = groups.get(photo.group);
      group.members.forEach((socketId) => {
        io.to(socketId).emit("new-comment", {
          photoId,
          comment: commentData,
        });
      });
    }
  }
});
```

**What's happening:**

1. **Extract data**: Get photoId and comment text from client
2. **Find photo**: Search photos array for matching ID
3. **Create comment object**:
   - Include username, comment text, and timestamp
4. **Add to photo**: Push comment to photo's comments array
5. **Broadcast comment**:
   - If photo is in "all" group: Send to everyone
   - If photo is in specific group: Send only to group members
6. **Targeted emission**: Loop through group members and send individually

---

### Disconnect Event

```javascript
socket.on("disconnect", () => {
  const user = users.get(socket.id);

  if (user) {
    // Remove user from groups
    user.groups.forEach((groupName) => {
      if (groups.has(groupName)) {
        groups.get(groupName).members.delete(socket.id);
      }
    });

    socket.broadcast.emit("user-left", {
      username: user.username,
      userId: socket.id,
    });

    users.delete(socket.id);

    // Update users list
    const usersList = Array.from(users.entries()).map(([id, data]) => ({
      id,
      username: data.username,
    }));
    io.emit("users-list", usersList);
  }

  console.log("User disconnected:", socket.id);
});
```

**What's happening:**

1. **Get user data**: Retrieve user info from Map before deleting
2. **Clean up groups**:
   - Loop through all groups user was in
   - Remove user's socket ID from each group's members Set
3. **Notify others**: Broadcast "user-left" event (not to disconnected user obviously!)
4. **Remove user**: Delete user from `users` Map
5. **Update users list**: Create fresh list and send to all remaining users
6. **Log disconnect**: Console message for server admin

**Why cleanup is important**: Prevents memory leaks and ensures accurate member counts in groups

---

## 8. Server Start

```javascript
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

**What's happening:**

- `server.listen(PORT, callback)`: Starts the HTTP server on specified port
- **Callback function**: Runs once server successfully starts
- Logs server URL to console for easy access
- Server now listens for incoming connections on `http://localhost:3000`

---

## Key Concepts Summary

### 1. **Socket.io vs HTTP**

- **HTTP**: Request-response model (client asks, server responds)
- **Socket.io**: Persistent connection, bidirectional (both can send anytime)
- Perfect for real-time features like chat, notifications, live updates

### 2. **Event-Driven Architecture**

- Server listens for events: `socket.on("event-name", callback)`
- Server emits events: `socket.emit("event-name", data)`
- Client does the same on their side

### 3. **Broadcasting Patterns**

| Method                    | Who Receives                                   |
| ------------------------- | ---------------------------------------------- |
| `socket.emit()`           | Only the sender                                |
| `socket.broadcast.emit()` | Everyone except sender                         |
| `io.emit()`               | Everyone including sender                      |
| `socket.to(room).emit()`  | Only users in specific room (not sender)       |
| `io.to(room).emit()`      | Only users in specific room (including sender) |

### 4. **Data Persistence**

- Current implementation: **In-memory** (data lost on restart)
- Production alternative: Use database (MongoDB, PostgreSQL, etc.)
- Files are saved to disk (`public/uploads/`) so they persist

### 5. **Security Considerations**

- File upload validation (type, size)
- Input sanitization needed for comments
- Authentication/authorization not implemented (add JWT for production)
- HTTPS recommended for production

---

## Flow Diagram

```
User Login → WebSocket Connection → Server assigns socket.id
                                         ↓
                                    Send existing data
                                         ↓
                            ┌────────────┴────────────┐
                            ↓                         ↓
                    Upload Photo              Create/Join Group
                            ↓                         ↓
                    Store in array             Store in Map
                            ↓                         ↓
                    Broadcast to users     Add to Socket.io room
                            ↓                         ↓
                    Real-time update         Group-specific updates
```

---

## Next Steps for Learning

1. **Add Database**: Replace in-memory storage with MongoDB/PostgreSQL
2. **Add Authentication**: Implement user registration and JWT tokens
3. **Add Photo Likes**: Track who liked which photos
4. **Add Direct Messages**: Private messaging between users
5. **Add Photo Deletion**: Allow users to remove their photos
6. **Add User Profiles**: Store additional user information
7. **Deploy to Cloud**: Host on Heroku, AWS, or similar platform

---

**Happy Coding! 🚀**
