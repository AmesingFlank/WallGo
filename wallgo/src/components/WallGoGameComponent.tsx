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
    lastMovedStone: StoneType | null;
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
            lastMovedStone: null,
            reachablePositions: []
        };
    }

    renderWallIndicators(stone: StoneType | null, keyPrefix: string, cellSize: number) {
        if (!stone) return null;

        const placableWalls = this.state.game.getPlacableWallForStone(stone);
        return placableWalls.map((wall, index) => {
            const isHorizontal = wall.direction === WallDirection.Horizontal;
            const wallThickness = 6;
            const wallHeight = isHorizontal ? wallThickness : cellSize + wallThickness;
            const wallWidth = isHorizontal ? cellSize + wallThickness : wallThickness;
            const wallPosition = isHorizontal
                ? { left: `${wall.x * cellSize - wallThickness / 2}px`, top: `${wall.y * cellSize - wallThickness / 2}px` }
                : { left: `${wall.x * cellSize - wallThickness / 2}px`, top: `${wall.y * cellSize - wallThickness / 2}px` };
            return (
                <div
                    key={`${keyPrefix}${index}`}
                    className={`wall-indicator player-${wall.player} ${isHorizontal ? 'horizontal' : 'vertical'}`}
                    style={{
                        ...wallPosition,
                        width: `${wallWidth}px`,
                        height: `${wallHeight}px`
                    }}
                    onClick={() => {
                        try {
                            const result = this.state.game.placeWallForStone(stone, wall);
                            if (result) {
                                console.log('Game over! Winner:', result.winner);
                            }
                            this.setState({
                                game: this.state.game,
                                selectedStone: null,
                                lastMovedStone: null,
                                reachablePositions: []
                            });
                        } catch (error) {
                            console.error('Error placing wall:', error);
                        }
                    }}
                />
            );
        });
    }

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
                    {gamePhase === GamePhase.Over ? (
                        <div className="player-indicator-container">
                            <span>Winner: </span>
                            <div className={`player-indicator player-${this.state.game.getCurrentPlayer()}`} />
                        </div>
                    ) : (
                        <div className="player-indicator-container">
                            <span>Current Player: </span>
                            <div className={`player-indicator player-${currentPlayer}`} />
                        </div>
                    )}
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
                        } else if (gamePhase === GamePhase.Moving && this.state.lastMovedStone === null) {
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

                            if (stone && this.state.lastMovedStone === null) {
                                const reachablePositions = this.state.game.getReachablePositionsInOneStep(stone.position);
                                this.setState({
                                    selectedStone: stone,
                                    reachablePositions
                                });
                            } else if (this.state.selectedStone && remainingSteps > 0) {
                                if (this.state.game.canMoveStoneTo(this.state.selectedStone, x, y)) {
                                    const placableWalls = this.state.game.moveStone(this.state.selectedStone, x, y);
                                    this.setState({
                                        game: this.state.game,
                                        selectedStone: this.state.selectedStone,
                                        lastMovedStone: this.state.selectedStone,
                                        reachablePositions: [],
                                        isValidHover: false
                                    });
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
                    {/* Draw permanent walls */}
                    {this.state.game.getHorizontalWalls().map((row, rowIndex) => {
                        return row.map((wall, colIndex) => {
                            if (wall) {
                                const wallThickness = 6;
                                const wallHeight = wallThickness;
                                const wallWidth = cellSize + wallThickness;
                                const wallPosition = {
                                    left: `${wall.x * cellSize - wallThickness / 2}px`,
                                    top: `${wall.y * cellSize - wallThickness / 2}px`
                                };
                                return (
                                    <div key={`h-${rowIndex}-${colIndex}`} className={`wall-permanent horizontal player-${wall.player}`} style={{
                                        ...wallPosition,
                                        width: `${wallWidth}px`,
                                        height: `${wallHeight}px`
                                    }} />
                                );
                            }
                            return null;
                        });
                    })}
                    {this.state.game.getVerticalWalls().map((row, rowIndex) => {
                        return row.map((wall, colIndex) => {
                            if (wall) {
                                const wallThickness = 6;
                                const wallHeight = cellSize + wallThickness;
                                const wallWidth = wallThickness;
                                const wallPosition = {
                                    left: `${wall.x * cellSize - wallThickness / 2}px`,
                                    top: `${wall.y * cellSize - wallThickness / 2}px`
                                };
                                return (
                                    <div key={`v-${rowIndex}-${colIndex}`} className={`wall-permanent vertical player-${wall.player}`} style={{
                                        ...wallPosition,
                                        width: `${wallWidth}px`,
                                        height: `${wallHeight}px`
                                    }} />
                                );
                            }
                            return null;
                        });
                    })}
                    {/* Render stones */}
                    {stones.map((playerStones, playerIndex) =>
                        playerStones.map((stone) => (
                            <Stone key={`${playerIndex}-${stone.index}`}
                                player={playerIndex}
                                x={stone.position.x}
                                y={stone.position.y}
                                isMovable={gamePhase === GamePhase.Moving && playerIndex === currentPlayer && (this.state.lastMovedStone === null || this.state.lastMovedStone === stone)} />
                        ))
                    )}
                    {gamePhase === GamePhase.PlacingStones && this.state.isValidHover && (
                        <div className={`cell-hover player-${currentPlayer}`} style={{
                            left: `${this.state.hoverX * cellSize + cellSize / 2}px`,
                            top: `${this.state.hoverY * cellSize + cellSize / 2}px`
                        }} />
                    )}
                    {gamePhase === GamePhase.Moving && (
                        <>
                            {/* Show reachable positions for selected stone */}
                            {this.state.selectedStone && (
                                <>
                                    {this.state.reachablePositions.map((pos, index) => (
                                        <div key={index} className={`cell-hover player-${currentPlayer}`} style={{
                                            left: `${pos.x * cellSize + cellSize / 2}px`,
                                            top: `${pos.y * cellSize + cellSize / 2}px`
                                        }} />
                                    ))}
                                </>
                            )}
                            {/* Show reachable positions for last moved stone if it's the second step */}
                            {this.state.lastMovedStone && this.state.game.getRemainingStepsAllowedForCurrentPlayer() === 1 && (
                                <>
                                    {this.state.game.getReachablePositionsInOneStep(this.state.lastMovedStone.position).map((pos, index) => (
                                        <div key={`second-step-${index}`} className={`cell-hover player-${currentPlayer}`} style={{
                                            left: `${pos.x * cellSize + cellSize / 2}px`,
                                            top: `${pos.y * cellSize + cellSize / 2}px`
                                        }} />
                                    ))}
                                </>
                            )}
                        </>
                    )}
                    {this.renderWallIndicators(this.state.selectedStone, 'wall-', cellSize)}
                    {this.renderWallIndicators(this.state.lastMovedStone, 'last-wall-', cellSize)}
                </div>
            </div>
        );
    }
}
