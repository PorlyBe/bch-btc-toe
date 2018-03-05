import React from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import io from 'socket.io-client';

import ToggleButtonGroup from 'react-bootstrap/lib/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/lib/ToggleButton';
import Button from 'react-bootstrap/lib/Button';
import ListGroup from 'react-bootstrap/lib/ListGroup';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem';

import './index.css';

let gameSocket = null;
let game = null;

class RemotePlayers extends React.Component {
    constructor() {
        super();
        this.state = {
            rooms: null,
            clientId: null,
            endpoint: "https://bch-btc-toe-server.herokuapp.com/",
            socket: null,
            inGame: false,
            gameRoom: null,
            turn: null
        }
    }

    componentDidMount() {
        const { endpoint } = this.state;
        const socket = io(endpoint);
        
        gameSocket = socket;
        this.setState({
            socket: socket
        });
        socket.on("clientId", data => this.setState({ clientId: data }));
        socket.on("rooms", data => {
            this.setState({
                inGame: false,
                gameRoom: null,
                turn: null
            });
            data.forEach(r => {
                if (r.name === this.state.clientId && r.opponent !== null) {
                    this.setState({
                        inGame: true,
                        gameRoom: r,
                        turn: true
                    });
                }
                if(r.opponent === this.state.clientId){
                    this.setState({
                        inGame: true,
                        gameRoom: r,
                        turn: false
                    }); 
                }
            });
            this.setState({ rooms: data });
            game = this;
        });

    }

    handleJoin(player) {
        const socket = this.state.socket;
        socket.emit("join-room", player.name);

    }

    handleLeave(player) {
        const socket = this.state.socket;
        socket.emit("leave-room", player);
    }

    renderListItem(room) {
        let button;

        if (this.state.clientId === room.name) {
            if (room.opponent === null) {
                button = <Button disabled>YOU</Button>;
            } else {
                button = <Button onClick={() => this.handleLeave(room)}>LEAVE</Button>;
                game.turn = true;
            }
        } else {
            if (room.opponent === null) {
                if (!this.state.inGame) {
                    button = <Button onClick={() => this.handleJoin(room)}>JOIN</Button>;
                } else {
                    button = <Button disabled>JOIN</Button>;
                }
            } else if (room.opponent === this.state.clientId) {
                button = <Button onClick={() => this.handleLeave(room)}>LEAVE</Button>;
            } else {
                button = <Button disabled>FULL</Button>;
            }
        }

        return (
            <ListGroupItem key={room.name}>
                {room.name}
                {button}
            </ListGroupItem>
        );
    }

    render() {
        const rooms = this.state.rooms;
        let roomList = [];

        if (rooms === null) return roomList;

        for (let i = 0; i < rooms.length; i++) {
            roomList.push(this.renderListItem(rooms[i]));
        }

        return roomList;
    }
}


// builds a square for the gameboard
function Square(props) {
    return (
        <button className="square" onClick={props.onClick}>
            <ReactCSSTransitionGroup
                transitionName="fade"
                transitionAppearTimeout={300}
                transitionEnterTimeout={300}
                transitionLeaveTimeout={300}>
                {getImage(props.value)}
            </ReactCSSTransitionGroup>
        </button>

    );
}

function Opponent(props) {
    return (
        <ToggleButtonGroup name="playerSelect" type="radio" defaultValue="local">
            <ToggleButton value="local" onClick={props.onClick}>Local</ToggleButton>
            <ToggleButton value="computer" onClick={props.onClick}>Computer</ToggleButton>
            <ToggleButton value="remote" onClick={props.onClick}>Remote</ToggleButton>
        </ToggleButtonGroup>

    );
}

// build the gameboard
class Board extends React.Component {
    renderSquare(i) {
        return (
            <Square
                key={i}
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)}
            />
        );
    }

    render() {
        let grid = [];
        let squareNumber = 0;

        for (let i = 0; i < 3; i++) {
            let squares = [];
            for (let x = 0; x < 3; x++) {
                squares.push(this.renderSquare(squareNumber));
                squareNumber++;
            }
            grid.push(<div className="board-row" key={i}>{squares}</div>);
        }

        return (
            <div>
                {grid}
            </div>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [
                {
                    squares: Array(9).fill(null)
                }
            ],
            stepNumber: 0,
            xIsNext: true,
            player: "",
        };

    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();

        if (calculateWinner(squares) || squares[i] || this.state.inPlay) {
            return;
        }

        if (this.state.player === "remote") {
            // remote players code goes here
            
            if (!game.state.inGame) return;
            if (!game.turn) return;

            squares[i] = game.isNext ? "O" : "X";

            let data = {
                room: game.state.gameRoom,
                squares: squares,
                history: history,
                isNext: !game.isNext,
                turn: game.state.turn
            }

            gameSocket.emit("move", data);

        } else if (this.state.player === "computer") {
            
            // shitty AI
            if (calculateWinner(squares)) return;
            this.setState({ inPlay: true });
            squares[i] = this.state.xIsNext ? "X" : "O";

            this.setState({
                history: history.concat([
                    {
                        squares: squares
                    }
                ]),
                stepNumber: history.length,
                xIsNext: !this.state.xIsNext
            });

            let empty = 0;
            squares.forEach(e => {
                if (e === null) empty++;
            });

            let rand = Math.floor(Math.random() * (empty));
            empty = 0;
            let move = 0;
            squares.forEach((e, index) => {
                if (e === null) {
                    if (empty === rand) {
                        move = index;
                    }
                    empty++;
                }
            });
            setTimeout(() => {
                if (calculateWinner(squares)) return;

                squares[move] = this.state.xIsNext ? "X" : "O";

                this.setState({
                    history: history.concat([
                        {
                            squares: squares
                        }
                    ]),
                    stepNumber: history.length,
                    xIsNext: !this.state.xIsNext,
                    inPlay: false
                });

            }, 1000);

        } else {
            squares[i] = this.state.xIsNext ? "X" : "O";

            this.setState({
                history: history.concat([
                    {
                        squares: squares
                    }
                ]),
                stepNumber: history.length,
                xIsNext: !this.state.xIsNext
            });
            
        }
    }

    handlePlayers(event) {
        if(event.target.value === undefined || event.target.value === this.state.player) return;

        this.jumpTo(0);

        let player = event.target.value;
        this.setState({
            player: player
        });

        // bit of a hacky way to handle sockets
        setTimeout(() => {
            if(!gameSocket) return;
            gameSocket.on("turn", data => {
                this.setState({
                    history: data.history.concat([
                        {
                            squares: data.squares
                        }
                    ]),
                    stepNumber: data.history.length,
                });
                game.turn = data.turn;
                game.isNext = data.isNext;
            });

            gameSocket.on("reset", (data)=>{
                this.setState({
                    inPlay:false,
                    stepNumber: 0,
                    xIsNext: false
                });
            })
        }, 100);
    }

    handleReset(step){
        if(this.state.player === "remote"){
            gameSocket.emit("reset", game.state.gameRoom);
            
            console.log("RESET")
        } else {
            this.jumpTo(step);
        }
    }

    jumpTo(step) {
        this.setState({
            inPlay:false,
            stepNumber: step,
            xIsNext: (step % 2) === 0
        });
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        let status = [];
        let remote = null;
        if (winner) {
            status.push(<h2 key="winner">Winner</h2>);
            status.push(getImage(winner));
            status.push(<Button key="reset" onClick={() => this.handleReset(0)}>Restart</Button>);
        } else if (this.state.stepNumber === 9) {
            status.push(<h2 key="losers">Both players lose!</h2>);
            status.push(<Button key="reset" onClick={() => this.handleReset(0)}>Restart</Button>);
        } else {
            status.push(<h2 key="nextPlayer">Next player</h2>);
            status.push(getImage(this.state.xIsNext ? "X" : "O"));
        }


        if (this.state.player === "remote") remote = <ListGroup><RemotePlayers /></ListGroup>;

        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={current.squares}
                        onClick={i => this.handleClick(i)}
                    />
                </div>
                <div className="game-info">{status}</div>
                <div className="player-select" >
                    <h2 key="palyerTitle">Opponent</h2>
                    <Opponent
                        onClick={i => this.handlePlayers(i)}
                    />
                    {remote}
                </div>

            </div>
        );
    }
}

// ========================================

ReactDOM.render(<Game />, document.getElementById("root"));

// calculates the winner
function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

// gets bch or btc image
function getImage(val) {
    let img = null;
    let btc = <img className="coin" alt="BTC" key="BTC" src={require('./assets/btc.png')} />;
    let bch = <img className="coin" alt="BCH" key="BCH" src={require('./assets/bch.png')} />;
    if (val === "X") {
        img = bch;
    } else if (val === "O") {
        img = btc;
    }

    return img;
}