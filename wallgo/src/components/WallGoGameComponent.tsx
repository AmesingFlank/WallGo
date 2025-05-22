import React, { Component } from 'react';
import { WallGoGame, GamePhase, GameConfig, Stone as StoneType, StonePosition, WallDirection } from '../WallGoGame';
import { Stone } from './Stone';
import './WallGoGameComponent.css';

interface WallGoGameComponentState {
    game: WallGoGame;
    hoverX: number;
    hoverY: number;
    isValidHover: boolean;
    selectedStone: StoneType | null;
    reachablePositions: StonePosition[];
}

export class WallGoGameComponent extends Component<{}, WallGoGameComponentState> {
    constructor(props: {}) {
        super(props);
        const config = new GameConfig();
        this.state = {
            game: new WallGoGame(config),
            hoverX: -1,
            hoverY: -1,
            isValidHover: false,
            selectedStone: null,
            reachablePositions: []
        };
    }

    handleStonePlaced = (row: number, col: number) => {
        try {
            this.state.game.placeStone(row, col);
            this.setState({ game: this.state.game });
        } catch (error) {
            console.error('Error placing stone:', error);
        }
    };

    handleMoveStone = (stone: any, row: number, col: number) => {
        try {
            const placableWalls = this.state.game.moveStone(stone, row, col);
            this.setState({ game: this.state.game });
        } catch (error) {
            console.error('Error moving stone:', error);
        }
    };

    handleWallPlaced = (stone: any, wall: any) => {
        try {
            const result = this.state.game.placeWallForStone(stone, wall);
            if (result) {
                console.log('Game over! Winner:', result.winner);
            }
            this.setState({ game: this.state.game });
        } catch (error) {
            console.error('Error placing wall:', error);
        }
    };

    render() {
        const boardSize = 7; // Default board size from GameConfig
        const cellSize = 500 / boardSize;
        const currentPlayer = this.state.game.getCurrentPlayer();
        const stones = this.state.game.getStones();
        const gamePhase = this.state.game.getGamePhase();

        return (
            <div className="game-container">
                <div className="game-info">
                    <p>Phase: {GamePhase[gamePhase]}</p>
                    <div className="player-indicator-container">
                        <span>Current Player: </span>
                        <div className={`player-indicator player-${currentPlayer}`} />
                    </div>
                </div>
                <div className="game-board" 
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.floor((e.clientX - rect.left) / cellSize);
                        const y = Math.floor((e.clientY - rect.top) / cellSize);
                        
                        if (gamePhase === GamePhase.PlacingStones) {
                            this.setState({
                                hoverX: x,
                                hoverY: y,
                                isValidHover: x >= 0 && x < boardSize && y >= 0 && y < boardSize && this.state.game.canPlaceStone(x, y)
                            });
                        } else if (gamePhase === GamePhase.Moving) {
                            const stones = this.state.game.getStones();
                            const stone = stones[currentPlayer].find(s => 
                                s.position.x === x && s.position.y === y
                            );
                            
                            this.setState({
                                hoverX: x,
                                hoverY: y,
                                isValidHover: stone !== undefined
                            });
                        }
                    }}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = Math.floor((e.clientX - rect.left) / cellSize);
                        const y = Math.floor((e.clientY - rect.top) / cellSize);
                        const stones = this.state.game.getStones();
                        const currentPlayer = this.state.game.getCurrentPlayer();
                        const remainingSteps = this.state.game.getRemainingStepsAllowedForCurrentPlayer();
                        
                        if (gamePhase === GamePhase.PlacingStones && this.state.isValidHover) {
                            try {
                                this.state.game.placeStone(this.state.hoverX, this.state.hoverY);
                                this.setState({ 
                                    game: this.state.game,
                                    hoverX: -1,
                                    hoverY: -1,
                                    isValidHover: false
                                });
                            } catch (error) {
                                console.error('Error placing stone:', error);
                            }
                        } else if (gamePhase === GamePhase.Moving) {
                            const stone = stones[currentPlayer].find(s => 
                                s.position.x === x && s.position.y === y
                            );
                            
                            if (stone && remainingSteps > 0) {
                                const reachablePositions = this.state.game.getReachablePositionsInOneStep(stone.position);
                                this.setState({
                                    selectedStone: stone,
                                    reachablePositions,
                                    hoverX: -1,
                                    hoverY: -1,
                                    isValidHover: false
                                });
                            } else if (this.state.selectedStone && remainingSteps > 0) {
                                try {
                                    const placableWalls = this.state.game.moveStone(this.state.selectedStone, x, y);
                                    this.setState({ 
                                        game: this.state.game,
                                        selectedStone: null,
                                        reachablePositions: [],
                                        hoverX: x,
                                        hoverY: y,
                                        isValidHover: true
                                    });
                                } catch (error) {
                                    console.error('Error moving stone:', error);
                                }
                            }
                        }
                    }}
                    style={{
                        position: 'relative',
                        width: '500px',
                        height: '500px',
                        border: '1px solid #000',
                        overflow: 'hidden'
                    }}>
                    {/* Draw horizontal lines */}
                    {[...Array(boardSize + 1)].map((_, rowIndex) => (
                        <div key={`h-${rowIndex}`} className="grid-line horizontal" style={{
                            top: `${rowIndex * cellSize}px`
                        }} />
                    ))}
                    {/* Draw vertical lines */}
                    {[...Array(boardSize + 1)].map((_, colIndex) => (
                        <div key={`v-${colIndex}`} className="grid-line vertical" style={{
                            left: `${colIndex * cellSize}px`
                        }} />
                    ))}
                    {/* Render stones */}
                    {stones.map((playerStones, playerIndex) => 
                        playerStones.map((stone) => (
                            <Stone key={`${playerIndex}-${stone.index}`} 
                                player={playerIndex} 
                                x={stone.position.x} 
                                y={stone.position.y}
                                isMovable={gamePhase === GamePhase.Moving && playerIndex === currentPlayer} />
                        ))
                    )}
                    {/* Add hover effect */}
                    {gamePhase === GamePhase.PlacingStones && this.state.isValidHover && (
                        <div className={`cell-hover player-${currentPlayer}`} style={{
                            left: `${this.state.hoverX * cellSize + cellSize/2}px`,
                            top: `${this.state.hoverY * cellSize + cellSize/2}px`
                        }} />
                    )}
                    {/* Show reachable positions */}
                    {gamePhase === GamePhase.Moving && this.state.selectedStone && (
                        <>
                            {this.state.reachablePositions.map((pos, index) => (
                                <div key={index} className={`cell-hover player-${currentPlayer}`} style={{
                                    left: `${pos.x * cellSize + cellSize/2}px`,
                                    top: `${pos.y * cellSize + cellSize/2}px`
                                }} />
                            ))}
                            {/* Show wall placement indicators */}
                            {this.state.game.getPlacableWallForStone(this.state.selectedStone).map((wall, index) => {
                                console.log('Wall:', wall);
                                const isHorizontal = wall.direction === WallDirection.Horizontal;
                                const wallSize = isHorizontal ? 1 : cellSize;
                                const wallLength = isHorizontal ? cellSize : 1;
                                const wallPosition = isHorizontal 
                                    ? { left: `${wall.x * cellSize}px`, top: `${wall.y * cellSize}px` }
                                    : { left: `${wall.x * cellSize}px`, top: `${wall.y * cellSize}px` };
                                return (
                                    <div 
                                        key={index}
                                        className={`wall-indicator ${isHorizontal ? 'horizontal' : 'vertical'}`}
                                        style={{
                                            ...wallPosition,
                                            width: `${wallLength}px`,
                                            height: `${wallSize}px`
                                        }}
                                    />
                                );
                            })}
                        </>
                    )}

                </div>
            </div>
        );
    }
}
