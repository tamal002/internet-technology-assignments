const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Set up EJS as view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

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

// Store users, groups, and messages in memory
const users = new Map(); // socketId -> {username, groups}
const groups = new Map(); // groupName -> {members: Set, photos: Array}
const photos = []; // Array of all shared photos

// Initialize default groups
groups.set("Friends", { members: new Set(), photos: [] });
groups.set("Family", { members: new Set(), photos: [] });
groups.set("Work", { members: new Set(), photos: [] });

// Routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/app", (req, res) => {
  res.render("app");
});

// Photo upload endpoint
app.post("/upload", upload.single("photo"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

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

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // User joins with username
  socket.on("join", (username) => {
    users.set(socket.id, { username, groups: new Set() });
    socket.username = username;

    // Send existing photos to new user
    socket.emit("load-photos", photos);

    // Send groups list to new user
    const groupsList = Array.from(groups.keys());
    socket.emit("groups-list", groupsList);

    // Notify others
    socket.broadcast.emit("user-joined", { username, userId: socket.id });

    // Send current users list
    const usersList = Array.from(users.entries()).map(([id, data]) => ({
      id,
      username: data.username,
    }));
    io.emit("users-list", usersList);
  });

  // Create a new group
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

  // Join a group
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

  // Add comment to photo
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
      console.log(
        "Comment added to photo:",
        photo.id,
        "Total comments:",
        photo.comments.length,
      );

      // Broadcast comment to ALL users (everyone should see all comments)
      io.emit("new-comment", { photoId, comment: commentData });
    } else {
      console.log("Photo not found for comment:", photoId);
    }
  });

  // Handle disconnect
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
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
