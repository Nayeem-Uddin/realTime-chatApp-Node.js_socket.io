const path = require('path')
const express = require('express')
const app = express()
const http = require('http')
const socketio = require('socket.io')
const formatMessage = require('./utils/messages')
const {userJoin,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users')

//set static folder here
app.use(express.static(path.join(__dirname,'public')))

//connect with server by using createserver and http and collaborate with app
const server = http.createServer(app)
const io = socketio(server)


const robot = "alexa"
//run when client connects
io.on('connection',socket=>{
    // console.log('new ws connection...')


    socket.on('joinRoom',({username,room})=>{
            const user =userJoin(socket.id,username,room)

            socket.join(user.room)

    //welcome to the current user
    socket.emit('message',formatMessage(robot,'welcome to the chat app'))

    //broadcast the message for all when a user is connected to the chat app
    //for specific room we have to user to
    socket.broadcast.to(user.room).emit('message',formatMessage(robot,`${user.username} has connected to join the chat`))
    
    //send users a room info
     io.to(user.room).emit('roomUsers',{
         room:user.room,
         users:getRoomUsers(user.room)
     })


    
    })    
    
    //listen for chatMessage
    socket.on('chatMessage',msg=>{
        // console.log(msg)
        const user = getCurrentUser(socket.id)


        //back to the client and show to everybody
        io.to(user.room).emit('message',formatMessage(user.username,msg))
    })
   //runs when a user left the chat
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id)

        if(user){
            io.to(user.room).emit('message',formatMessage(robot,`${user.username} has left the chat`))
        }    

        //send users a room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        })
    })

})

const PORT = process.env.PORT || 5555
server.listen(PORT,()=>{
    console.log(`app is running on port no : ${PORT}`)
})