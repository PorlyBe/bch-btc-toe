import React from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import './index.css';

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
            player: ""
        };

    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();

        if (calculateWinner(squares) || squares[i]) {
            return;
        }

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

        if (this.state.player === "computer") {
            if(calculateWinner(squares)) return;

            let empty = 0;
            squares.forEach(e => {
                if (e === null) empty++;
            });

            let rand = Math.floor(Math.random() * (empty));
            empty = 0;
            squares.forEach((e, index) => {
                if (e === null) {
                    if (empty === rand) {
                        squares[index] = this.state.xIsNext ? "O" : "X";
                    }
                    empty++;
                }
            });

            this.setState({
                history: history.concat([
                    {
                        squares: squares
                    }
                ]),
                stepNumber: history.length,
                xIsNext: this.state.xIsNext
            });
        } else if (this.state.player === "other"){
            // here's where networking code goes...

        }
    }

    handlePlayers(event) {
        this.jumpTo(0);
        let player = event.target.value;
        this.setState({
            player: player
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            xIsNext: (step % 2) === 0
        });
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);

        let status = [];
        if (winner) {
            status.push(<h2 key="winner">Winner</h2>);
            status.push(getImage(winner));
            status.push(<button className="reset-button" key="reset" onClick={() => this.jumpTo(0)}>Restart</button>);
        } else if (this.state.stepNumber === 9) {
            status.push(<h2 key="losers">Both players lose!</h2>);
            status.push(<button className="reset-button" key="reset" onClick={() => this.jumpTo(0)}>Restart</button>);
        } else {
            status.push(<h2 key="nextPlayer">Next player</h2>);
            status.push(getImage(this.state.xIsNext ? "X" : "O"));
        }

        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={current.squares}
                        onClick={i => this.handleClick(i)}
                    />
                </div>
                <div className="game-info">{status}</div>

                <div className="game-players">
                    <h2 key="palyerTitle">Play Against:</h2>
                    <label htmlFor="local">Local Player</label>
                    <input type="radio" defaultChecked="true" name="multiplayer" id="local" value="local" onClick={i => this.handlePlayers(i)} />
                    <label htmlFor="computer">Computer</label>
                    <input type="radio" name="multiplayer" id="computer" value="computer" onClick={i => this.handlePlayers(i)} />
                    <label htmlFor="other">Other (TBD)</label>
                    <input type="radio" name="multiplayer" id="other" value="other" onClick={i => this.handlePlayers(i)} />
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