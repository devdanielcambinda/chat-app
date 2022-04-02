const path = require("path")
const http = require('http')
const express = require("express")
const socketio = require('socket.io') // or const { Server } = require("socket.io");
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage }=require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app) //express creates this in the background but we cant access the server variable so we have to manually create it to pass it to socket.io
const io = socketio(server) //or new Server(server); to create a socket.io server 

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

// use io when wanting to send to every user --//-- use socket when wanting to send to the user that made the call 
//socket.emit() io.emit() socket.broadcast.emit()
// io.to().emit() socket.to().broadcast.emit()
io.on('connection', (socket)=>{
    console.log('new websocket connection')

    socket.on("join", (options, acknowledgement)=>{

      const {error, user} = addUser({id:socket.id, ...options})

      if(error){
        return acknowledgement(error)
      }
      
      socket.join(user.room)

      socket.emit('message', generateMessage('SERVER','Welcome!'))
      socket.broadcast.to(user.room).emit("message", generateMessage('SERVER',`${user.originalUsername} has joined!`))

      acknowledgement()

    })

    socket.on('sendMessage', (message,acknowledgement)=>{
      
      const user = getUser(socket.id)
      io.to(user.room).emit('message', generateMessage(user.originalUsername,message))
      acknowledgement()

    })

    socket.on('sendLocation', ({longitude,latitude},acknowledgement)=>{

      const user = getUser(socket.id);
      io.to(user.room).emit('locationMessage', generateLocationMessage(user.originalUsername,`https://google.com/maps?q=${latitude},${longitude}`))
      acknowledgement()

    })

    socket.on('disconnect',()=>{
      const user = removeUser(socket.id)

      if(user){
        io.to(user.room).emit("message", generateMessage('SERVER',`${user.originalUsername} has left!`));
      }

    })
})

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
