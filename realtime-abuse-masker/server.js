const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const Trie = require('./trie');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const abuseFilter = new Trie();

// 2. Read the text file synchronously BEFORE starting the server
try {
  // Read the file from the hard drive
  const fileData = fs.readFileSync('banned_words.txt', 'utf8');
  
  // Split by newline, clean up spaces, and ignore blank lines
  const bannedWords = fileData.split(/\r?\n/)
                              .map(word => word.trim())
                              .filter(word => word.length > 0);
  
  // Populate the Trie in RAM
  bannedWords.forEach(word => abuseFilter.insert(word));
  console.log(`Loaded ${bannedWords.length} banned words into the filter.`);
} catch (err) {
  console.error("Could not load banned_words.txt. Make sure the file exists.", err);
}

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// STATE: Keep track of who is connected (socket.id -> username)
const connectedUsers = {};
const roomName = 'general-chat';

io.on('connection', (socket) => {
  
  // 1. User joins with a name
  socket.on('join_chat', (username) => {
    // Save the user in our server dictionary
    connectedUsers[socket.id] = username;
    
    socket.join(roomName);

    // Announce to the room that someone joined (System message)
    io.to(roomName).emit('receive_message', {
      sender: 'System',
      text: `${username} joined the room.`
    });

    // Send the NEW list of all users to everyone in the room
    io.to(roomName).emit('update_users', Object.values(connectedUsers));
  });

  // 2. User sends a message
  socket.on('send_message', (text) => {
    // Look up the sender's name using their socket ID
    const senderName = connectedUsers[socket.id];
    
    // 4. Pass the raw text through the Trie scanner
    const sanitizedText = abuseFilter.censor(text);

    io.to(roomName).emit('receive_message', {
      sender: senderName,
      text: sanitizedText
    });
  });

  // 3. User disconnects (closes tab)
  socket.on('disconnect', () => {
    const disconnectedUser = connectedUsers[socket.id];
    
    if (disconnectedUser) {
      // Remove them from our state dictionary
      delete connectedUsers[socket.id];
      
      // Announce they left
      io.to(roomName).emit('receive_message', {
        sender: 'System',
        text: `${disconnectedUser} left the room.`
      });

      // Send the updated user list to everyone still in the room
      io.to(roomName).emit('update_users', Object.values(connectedUsers));
    }
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));