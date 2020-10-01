const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const http = require('http')
const { emit, disconnect } = require('process')
const {generateMessage ,generateLocationMessage } =require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const port = process.env.PORT || 3000
const publicDir = path.join(__dirname,'../public')

const app = express()
const server = http.createServer(app)
const io= socketio(server)

// let count=0

app.use(express.static(publicDir))

io.on('connection' , (socket)=>{
    console.log('New WebSocket connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined.`))

        io.to(user.room).emit('roomData' ,{
            room: user.room ,
            users: getUsersInRoom(user.room)
        })
        callback()

    })

    socket.on('sendMessage' ,(msg , callback) =>{
        const user = getUser(socket.id)
        
        io.to(user.room).emit('message' , generateMessage(user.username,msg))
        callback("Delivered!!")
    })

    socket.on('sendLocation' , (coords , callback) =>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage' , generateLocationMessage(user.username,`http://google.com/maps?q=${coords.lat},${coords.long}`))
        callback()
    })

    socket.on("disconnect" , () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message' , generateMessage('Admin',`${user.username} has Left.`))
            
            io.to(user.room).emit('roomData' ,{
                room: user.room ,
                users: getUsersInRoom(user.room)
            })
        }
    })
    // socket.emit('Updated' ,count)

    // socket.on('increment' , ()=>{
    //     count++

    //     io.emit('Updated' ,count)
    // })
})

server.listen(port , ()=>{
    console.log(`Server on ${port}`)
})