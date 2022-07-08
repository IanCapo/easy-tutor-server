const express  = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use('/', express.static('public'));

io.on('connection', (socket) => {
    socket.on('join', (roomId) => {
        io.in(roomId).allSockets()
        .then(res => {
           const numberOfClients = res.size;
        
           if(numberOfClients === 0) {
            console.log('Creating room with id: '+  roomId);
            socket.join(roomId);
            socket.emit('room_created', roomId);
        } else if (numberOfClients === 1) {
            console.log('Joining room with id: ' + roomId);
            socket.join(roomId);
            socket.emit('room_joined', roomId)
        } else {
            console.log('room full, cannot join room width id: ' + roomId);
            socket.emit('room_full', roomId);
        }})
    })

    socket.on('start_call', (roomId) => {
        console.log(roomId, 'hellooooo')
        console.log('Broadcasting start_call to peers in roomId: ' + roomId);
        socket.broadcast.to(roomId).emit('start_call', roomId);
    })
    socket.on('webrtc_offer', (e) => {
        console.log('broadcasting webrtc offer to peers in roomId: ' + e.roomId);
        socket.broadcast.to(e.roomId).emit('webrtc_offer', e.sdp);
    })
    socket.on('webrtc_answer', (e) => {
        console.log('broadcasting webrtc_answer to peers in roomId: ' + e.roomId);
        socket.broadcast.to(e.roomId).emit('webrtc_answer', e.sdp);
    })
    socket.on('webrtc_ice_candidate', (e) => {
        console.log('broascsting webrtc_ice_candidate to peers in roomId: ' + e.roomId);
        socket.broadcast.to(e.roomId).emit('webrtc_ice_candidate', e);
    })

    socket.on('disconnect', () => {
        socket.disconnect()
    } )
})

const port = process.eventNames.PORT || 5000;

server.listen(port, () => {
    console.log('Express server listening on port: ', port);
})