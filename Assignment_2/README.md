# 📸 WebSocket-based Photo Sharing Application

A real-time photo sharing application built with Node.js, Express, Socket.io, and EJS. Users can share photos, create groups, and comment on photos in real-time.

## Features

- ✅ **Real-time Photo Sharing**: Share photos instantly with all users or specific groups
- ✅ **WebSocket Communication**: Powered by Socket.io for real-time updates
- ✅ **Group Management**: Create and join groups to share photos privately
- ✅ **Comments**: Add comments on photos in real-time
- ✅ **User Presence**: See who's online
- ✅ **Clean UI**: Modern and responsive design using EJS templates
- ✅ **Photo Upload**: Support for JPG, PNG, and GIF images (max 5MB)

## Technologies Used

- **Backend**: Node.js, Express.js
- **WebSocket**: Socket.io
- **Template Engine**: EJS
- **File Upload**: Multer
- **Frontend**: Vanilla JavaScript, CSS3

## Installation

1. Navigate to the Assignment_2 directory:

   ```bash
   cd Assignment_2
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

   Or for development with auto-reload:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

### Getting Started

1. **Login**: Enter a username on the login page
2. **Upload Photos**:
   - Click on the file input in the sidebar
   - Select an image (JPG, PNG, or GIF)
   - Add an optional caption
   - Choose to share with everyone or a specific group
   - Click "Upload"

3. **Create Groups**:
   - Enter a group name in the sidebar
   - Click "Create" button
   - Group will be visible to all users

4. **Join Groups**:
   - Click "Join" button next to any group in the list
   - You'll receive photos shared in that group

5. **Comment on Photos**:
   - Click on any photo to open the modal
   - View existing comments
   - Add your own comment in the input field
   - Press "Send" to post

### Features Overview

- **Photo Feed**: View all shared photos in a grid layout
- **Filter Photos**: Toggle between "All Photos" and "My Groups"
- **Online Users**: See who's currently online in the sidebar
- **Real-time Updates**: All changes appear instantly without page refresh
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

```
Assignment_2/
├── server.js                 # Main server file with WebSocket logic
├── package.json             # Dependencies and scripts
├── public/                  # Static files
│   ├── css/
│   │   └── style.css       # Application styling
│   ├── js/
│   │   └── client.js       # Client-side JavaScript
│   └── uploads/            # Uploaded photos storage
├── views/                   # EJS templates
│   ├── index.ejs           # Login page
│   └── app.ejs             # Main application page
└── README.md               # This file
```

## API Endpoints

### HTTP Routes

- `GET /` - Login page
- `GET /app` - Main application page
- `POST /upload` - Upload photo endpoint

### WebSocket Events

#### Client to Server

- `join` - User joins with username
- `create-group` - Create a new group
- `join-group` - Join an existing group
- `add-comment` - Add comment to a photo

#### Server to Client

- `load-photos` - Load existing photos
- `new-photo` - New photo shared
- `new-comment` - New comment added
- `users-list` - Updated users list
- `groups-list` - Updated groups list
- `group-created` - New group created
- `user-joined` - User joined notification
- `user-left` - User left notification

## Configuration

The application runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## File Upload Limits

- **Supported Formats**: JPEG, JPG, PNG, GIF
- **Maximum File Size**: 5MB
- **Storage**: Files are stored in `public/uploads/`

## Security Notes

⚠️ **This is a basic implementation for educational purposes**. For production use, consider:

- User authentication and authorization
- Input validation and sanitization
- File upload security (virus scanning, size limits)
- Database for persistent storage
- HTTPS/WSS for secure connections
- Rate limiting
- CSRF protection

## Future Enhancements

Potential features to add:

- User authentication (login/signup)
- Photo likes/reactions
- Photo albums
- Private messaging
- Image filters and editing
- Video support
- Database integration (MongoDB/MySQL)
- Photo search and tags

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, either:

- Stop the other application using port 3000
- Change the port: `PORT=3001 npm start`

### Photos Not Uploading

- Check that `public/uploads/` directory exists
- Verify file size is under 5MB
- Ensure file format is supported (JPG, PNG, GIF)

### WebSocket Connection Issues

- Make sure the server is running
- Check browser console for errors
- Try refreshing the page

## License

ISC

## Author

Created for Internet Technology Assignment 2
