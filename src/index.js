const path = require("path")
const http = require('http')
const express = require("express")
const socketio = require('socket.io') // or const { Server } = require("socket.io");
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage }=require('./utils/messages')

const app = express()
const server = http.createServer(app) //express creates this in the background but we cant access the server variable so we have to manually create it to pass it to socket.io
const io = socketio(server) //or new Server(server); to create a socket.io server 

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

// use io when wanting to send to every user --//-- use socket when wanting to send to the user that made the call 
io.on('connection', (socket)=>{
    console.log('new websocket connection')

    socket.emit('message', generateMessage('Welcome!'))
    socket.broadcast.emit("message", generateMessage("A new user has joined"))

    socket.on('sendMessage', (message,acknowledgement)=>{
      const filter =new Filter()

      if(filter.isProfane(message)){
        return acknowledgement('Profanity is not allowed!')
      }

      io.emit('message', generateMessage(message))
      acknowledgement()
    })

    socket.on('sendLocation', ({longitude,latitude},acknowledgement)=>{
      io.emit('locationMessage', generateLocationMessage(`https://google.com/maps?q=${latitude},${longitude}`))
      acknowledgement()
    })

    socket.on('disconnect',()=>{
      io.emit('message', generateMessage('User has left'))
    })
})


server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
