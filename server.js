const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let clients = [];
let rooms = [];

io.on('connection', function (socket) {
    console.log('user connected: ' + socket.id);

    // send client it's id
    socket.emit('clientId', socket.id);

    // create rooms for clients to join
    let roomData = {
        name: socket.id,
        opponent: null
    };
    rooms.push(roomData);

    io.emit('rooms', rooms);
    

    socket.on('join-room', (data) => {

        rooms.forEach((r,i) =>{
            if(r.name === data){
                r.opponent = socket.id;
            }
        });

        removeRooms(socket.id);
        io.emit('rooms', rooms);
    });

    socket.on("move", data => {
        //data.turn = !data.turn;

        io.to(data.room.opponent).emit("turn", data);
        console.log(data);
        data.turn = !data.turn;
        io.to(data.room.name).emit("turn", data);
        console.log(data);
    })

    socket.on("reset", data=>{
        io.to(data.opponent).emit("reset", true);
        io.to(data.name).emit("reset", true);
    });

    socket.on('leave-room', data => {
        removeRooms(data.name);
        removeRooms(data.opponent);

        // create new room for client
        let roomData = {
            name: data.name,
            opponent: null
        }
        rooms.push(roomData);

        // create new room for opponent
        roomData = {
            name: data.opponent,
            opponent: null
        }

        rooms.push(roomData);

        io.emit('rooms', rooms);

    });

    socket.on('disconnect', () => {
        removeRooms(socket.id);
        console.log('user disconnected: ' + socket.id);
    });
});

function removeRooms(id) {
    let i = rooms.length;
    while (i--) {
        if (rooms[i].name === id) rooms.splice(i, 1);
    }
}

function getClients() {
    //let clients = [];

    //console.log(io.clients);

    //io.broadcast('players', clients);
    return clients;
}


http.listen(3030, function () {
    console.log('listening on *:3000');
});