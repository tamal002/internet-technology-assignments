// Initialize Socket.IO
const socket = io();

// Global variables
let currentUsername = localStorage.getItem("username");
let currentPhotoId = null;
let currentFilter = "all";

// Check if user is logged in
if (!currentUsername) {
  window.location.href = "/";
}

// Display current username
document.getElementById("currentUsername").textContent = currentUsername;

// Join the server
socket.emit("join", currentUsername);

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("username");
  window.location.href = "/";
});

// Photo upload
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const photoInput = document.getElementById("photoInput");
  const captionInput = document.getElementById("captionInput");
  const groupSelect = document.getElementById("groupSelect");

  if (!photoInput.files[0]) {
    alert("Please select a photo");
    return;
  }

  const formData = new FormData();
  formData.append("photo", photoInput.files[0]);
  formData.append("username", currentUsername);
  formData.append("caption", captionInput.value);
  formData.append("group", groupSelect.value);

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      photoInput.value = "";
      captionInput.value = "";
      showNotification("Photo uploaded successfully!");
    } else {
      alert("Upload failed: " + data.error);
    }
  } catch (error) {
    console.error("Upload error:", error);
    alert("Failed to upload photo");
  }
});

// Create group
document.getElementById("createGroupBtn").addEventListener("click", () => {
  const groupInput = document.getElementById("newGroupInput");
  const groupName = groupInput.value.trim();

  if (groupName) {
    socket.emit("create-group", groupName);
    groupInput.value = "";
  }
});

// Load existing photos
socket.on("load-photos", (photos) => {
  photos.forEach((photo) => addPhotoToGrid(photo));
  updateNoPhotosMessage();
});

// New photo received
socket.on("new-photo", (photo) => {
  addPhotoToGrid(photo);
  updateNoPhotosMessage();
  showNotification(`${photo.username} shared a new photo`);
});

// Add photo to grid
function addPhotoToGrid(photo) {
  const photoGrid = document.getElementById("photoGrid");

  const photoCard = document.createElement("div");
  photoCard.className = "photo-card";
  photoCard.dataset.photoId = photo.id;
  photoCard.dataset.group = photo.group;

  photoCard.innerHTML = `
        <img src="${photo.path}" alt="${photo.caption}" loading="lazy">
        <div class="photo-overlay">
            <div class="photo-meta">
                <strong>${photo.username}</strong>
                ${photo.group !== "all" ? `<span class="group-badge">${photo.group}</span>` : ""}
            </div>
            ${photo.caption ? `<p class="photo-caption">${photo.caption}</p>` : ""}
            <div class="photo-actions">
                <span>💬 ${photo.comments.length} comments</span>
                <span>${formatTime(photo.timestamp)}</span>
            </div>
        </div>
    `;

  photoCard.addEventListener("click", () => openPhotoModal(photo));

  photoGrid.insertBefore(photoCard, photoGrid.firstChild);
}

// Open photo modal
function openPhotoModal(photo) {
  currentPhotoId = photo.id;

  const modal = document.getElementById("photoModal");
  document.getElementById("modalImage").src = photo.path;
  document.getElementById("modalUsername").textContent = photo.username;
  document.getElementById("modalTime").textContent = formatTime(
    photo.timestamp,
  );
  document.getElementById("modalCaption").textContent =
    photo.caption || "No caption";

  // Load comments
  const commentsList = document.getElementById("commentsList");
  commentsList.innerHTML = "";
  photo.comments.forEach((comment) => addCommentToList(comment));

  modal.style.display = "flex";
}

// Close modal
document.querySelector(".close").addEventListener("click", () => {
  document.getElementById("photoModal").style.display = "none";
  currentPhotoId = null;
});

window.addEventListener("click", (e) => {
  const modal = document.getElementById("photoModal");
  if (e.target === modal) {
    modal.style.display = "none";
    currentPhotoId = null;
  }
});

// Submit comment
document.getElementById("commentForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const commentInput = document.getElementById("commentInput");
  const comment = commentInput.value.trim();

  if (comment && currentPhotoId) {
    socket.emit("add-comment", {
      photoId: currentPhotoId,
      comment: comment,
    });
    commentInput.value = "";
  }
});

// New comment received
socket.on("new-comment", (data) => {
  if (currentPhotoId === data.photoId) {
    addCommentToList(data.comment);
  }

  // Update comment count in grid
  const photoCard = document.querySelector(`[data-photo-id="${data.photoId}"]`);
  if (photoCard) {
    const commentCount = photoCard.querySelector(".photo-actions span");
    const currentCount = parseInt(commentCount.textContent.match(/\d+/)[0]);
    commentCount.textContent = `💬 ${currentCount + 1} comments`;
  }
});

// Add comment to list
function addCommentToList(comment) {
  const commentsList = document.getElementById("commentsList");

  const commentDiv = document.createElement("div");
  commentDiv.className = "comment";
  commentDiv.innerHTML = `
        <strong>${comment.username}</strong>
        <p>${comment.comment}</p>
        <span class="comment-time">${formatTime(comment.timestamp)}</span>
    `;

  commentsList.appendChild(commentDiv);
}

// Users list
socket.on("users-list", (users) => {
  const usersList = document.getElementById("usersList");
  const userCount = document.getElementById("userCount");

  usersList.innerHTML = "";
  userCount.textContent = users.length;

  users.forEach((user) => {
    const userDiv = document.createElement("div");
    userDiv.className = "user-item";
    userDiv.innerHTML = `
            <span class="online-indicator"></span>
            ${user.username}
        `;
    usersList.appendChild(userDiv);
  });
});

// Groups list
socket.on("groups-list", (groups) => {
  const groupsList = document.getElementById("groupsList");
  const groupSelect = document.getElementById("groupSelect");

  groupsList.innerHTML = "";

  // Update select options
  groupSelect.innerHTML = '<option value="all">Share with Everyone</option>';

  groups.forEach((groupName) => {
    // Add to sidebar
    const groupDiv = document.createElement("div");
    groupDiv.className = "group-item";
    groupDiv.innerHTML = `
            <span>👥</span>
            ${groupName}
            <button class="btn-join" data-group="${groupName}">Join</button>
        `;
    groupsList.appendChild(groupDiv);

    // Add to select
    const option = document.createElement("option");
    option.value = groupName;
    option.textContent = groupName;
    groupSelect.appendChild(option);
  });

  // Add join functionality
  document.querySelectorAll(".btn-join").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const groupName = e.target.dataset.group;
      socket.emit("join-group", groupName);
      e.target.textContent = "Joined";
      e.target.disabled = true;
    });
  });
});

// Group created
socket.on("group-created", (data) => {
  showNotification(`Group "${data.groupName}" created by ${data.creator}`);
});

// User joined
socket.on("user-joined", (data) => {
  showNotification(`${data.username} joined the chat`);
});

// User left
socket.on("user-left", (data) => {
  showNotification(`${data.username} left the chat`);
});

// Filter photos
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");

    currentFilter = e.target.dataset.filter;
    filterPhotos();
  });
});

function filterPhotos() {
  const photoCards = document.querySelectorAll(".photo-card");

  photoCards.forEach((card) => {
    if (currentFilter === "all") {
      card.style.display = "block";
    } else if (currentFilter === "groups") {
      card.style.display = card.dataset.group !== "all" ? "block" : "none";
    }
  });

  updateNoPhotosMessage();
}

// Update no photos message
function updateNoPhotosMessage() {
  const photoGrid = document.getElementById("photoGrid");
  const noPhotos = document.getElementById("noPhotos");
  const visiblePhotos = Array.from(photoGrid.children).filter(
    (card) => card.style.display !== "none",
  );

  noPhotos.style.display = visiblePhotos.length === 0 ? "block" : "none";
}

// Format time
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Error handling
socket.on("error", (message) => {
  alert("Error: " + message);
});
