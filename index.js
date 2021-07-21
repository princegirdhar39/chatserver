const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users.js");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;
const router = require("./router");

const server = http.createServer(app);
corsOptions = {
  cors: true,
  origins: ["http://localhost:3000"],
};
const io = socketio(server, corsOptions);
app.use(router);
app.use(cors()); 

io.on("connection", (socket) => {

  socket.on("join", ({ name, room }, callback) => {

    const {user,error} = addUser({ id: socket.id, name, room });

    if (error) return callback(error);
    
    //default admin messages
    // we here are emiiting events from the backwend to the frontend

    socket.emit('message', {user: 'admin',text: `${user.name}, welcome to the room ${user.room}`})
    
    socket.broadcast.to(user.room).emit('message', {user: 'admin', text : `${user.name} has joined!`});
    socket.join(user.room);
    io.to(user.room).emit('roomData', {room:user.room, users: getUsersInRoom(user.room)})
   

    callback();
  });
  //user genarated messages
  //we are expecting the event in the backend
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });


    callback();
  });

  socket.on("disconnect", () => {
      const user = removeUser(socket.id);
      if(user){
          io.to(user.room).emit('message', {user: 'admin',text: `${user.name} has left `})
      }
    console.log("user has left");
  });
});


server.listen(PORT, () => {
  console.log(`server has started on port ${PORT}`);
});


