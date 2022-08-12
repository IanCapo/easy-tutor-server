const express  = require('express');
const app = express();
const server = require('http').createServer(app);
const ioSocket = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"],
        allowedHeaders: ['*']
      }
})

app.use('/', express.static('public'));

const participantA = {
    socketID: '',
}

const participantB = {
    socketID: '',
}

ioSocket.on("connect_error", (err) => {
    console.log(`connect_error due to ${err}`);
  });
  

ioSocket.on('connection', (socket) => {
    socket.on('join', (data) => {
        const roomId = data.roomId;
        ioSocket.in(roomId).allSockets()
        .then(res => {
           const numberOfClients = res.size;
        
           switch(numberOfClients) {
                case 0:
                   socket.join(roomId);
                   participantA.socketID = data.socketId;
                   socket.emit('room_created', { roomId: data.roomId });
                   break;
                case 1:
                    socket.join(roomId);
                    participantB.socketID = data.socketId;
                    socket.emit('room_joined', { roomId: data.roomId });
                    break;
                default:
                    socket.emit('room_inaccesabible', { roomId: data.roomId })
           };
    })
})

    socket.on('starting_call', (event) => {
        console.log(event.roomId);
        console.log(`startin call in room ${event.roomId}`);
        socket.broadcast.to(event.roomId).emit('starting_call', event.roomId);
    })
    socket.on('webrtc_offer', (event) => {
        console.log('broadcasting webrtc offer: ' + event.roomId);
        socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp);
    })
    socket.on('webrtc_answer', (e) => {
        console.log('broadcasting webrtc_answer to peers in roomId: ' + e.roomId);
        socket.broadcast.to(e.roomId).emit('webrtc_answer', e.sdp);
    })
    socket.on('webrtc_ice_candidate', (e) => {
        console.log('broascsting webrtc_ice_candidate to peers in roomId: ' + e.roomId);
        socket.broadcast.to(e.roomId).emit('webrtc_ice_candidate', e);
    })

    socket.on('message', (event) => {
        console.log('message received, ', event.msg);
        if(event.socketId === participantA.socketID) {
            socket.to(participantB.socketID).emit("message", event.msg);
        } else {
            socket.to(participantA.socketID).emit("message", event.msg);
        }
       
    });

    socket.on('disconnect_socket', (event) => {
        socket.broadcast.to(event.roomId).emit('disconnect_socket');
        socket.disconnect();
    } )
})

const port = process.env.PORT;

server.listen(port, () => {
    console.log('Express server listening on port: ', port);
})