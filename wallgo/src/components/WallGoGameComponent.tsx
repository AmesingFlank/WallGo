import React, { Component } from 'react';
import { WallGoGame, GamePhase, GameConfig, Stone as StoneType, StonePosition, WallDirection, GameResult } from '../WallGoGame';
import { Stone } from './Stone';
import './WallGoGameComponent.css';

interface WallGoGameComponentState {
    config: GameConfig;
    game: WallGoGame;
    hoverX: number;
    hoverY: number;
    isValidHover: boolean;
    selectedStone: StoneType | null;
    lastMovedStone: StoneType | null;
    reachablePositions: StonePosition[];
    result: GameResult | null;
}

export class WallGoGameComponent extends Component<{}, WallGoGameComponentState> {
    constructor(props: {}) {
        super(props);
        let config = new GameConfig();
        this.state = {
            config,
            game: new WallGoGame(config),
            hoverX: -1,
            hoverY: -1,
            isValidHover: false,
            selectedStone: null,
            lastMovedStone: null,
            reachablePositions: [],
            result: null,
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
                            this.setState({
                                game: this.state.game,
                                selectedStone: null,
                                lastMovedStone: null,
                                reachablePositions: [],
                                result: result
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
        const boardSize = this.state.game.getBoardSize();
        const cellSize = 500 / boardSize;
        const currentPlayer = this.state.game.getCurrentPlayer();
        const stones = this.state.game.getStones();
        const gamePhase = this.state.game.getGamePhase();

        return (
            <div className="game-container">
                <div className="game-info">
                    <p>Phase: {GamePhase[gamePhase]}</p>
                    <div className="board-size-selector">
                        <label>Board Size: </label>
                        <select
                            value={this.state.config.boardSize}
                            onChange={(e) => {
                                const newSize = parseInt(e.target.value);
                                const newConfig = new GameConfig();
                                newConfig.boardSize = newSize;
                                this.setState({
                                    config: newConfig,
                                    game: new WallGoGame(newConfig),
                                    hoverX: -1,
                                    hoverY: -1,
                                    isValidHover: false,
                                    selectedStone: null,
                                    lastMovedStone: null,
                                    reachablePositions: [],
                                    result: null
                                });
                            }}
                        >
                            {[5, 6, 7, 8, 9].map(size => (
                                <option key={size} value={size}>{size}x{size}</option>
                            ))}
                        </select>
                    </div>
                    {gamePhase === GamePhase.Over ? (
                        <div>
                            {this.state.result && (
                                <div>
                                    {this.state.result.winners.length === 1 ? (
                                        <div className="player-indicator-container">
                                            <span>Winner: </span>
                                            <div className={`player-indicator player-${this.state.result.winners[0]}`} />
                                        </div>
                                    ) : (
                                        <div className="player-indicator-container">
                                            <span>Draw! </span>
                                        </div>
                                    )}
                                    <div className="scores-container">
                                        {this.state.result.regions.map((region, player) => (
                                            <div key={player} className="score-item">
                                                <span className={`player-${player}`}>Player {player + 1}</span>: {region.size}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                    this.state.game.moveStone(this.state.selectedStone, x, y);
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
                    {/* Draw cell ownership indicators */}
                    {gamePhase === GamePhase.Over && this.state.result && (
                        <>
                            {[...Array(boardSize)].map((_, x) => (
                                [...Array(boardSize)].map((_, y) => {
                                    const cellOwner = this.state.result!.regions.findIndex(region =>
                                        region.cells[x][y]
                                    );
                                    return (
                                        <div
                                            key={`cell-${x}-${y}`}
                                            className={`cell-ownership ${cellOwner >= 0 ? `player-${cellOwner}` : 'unowned'}`}
                                            style={{
                                                top: `${y * cellSize}px`,
                                                left: `${x * cellSize}px`,
                                                width: `${cellSize}px`,
                                                height: `${cellSize}px`
                                            }}
                                        />
                                    );
                                })
                            ))}
                        </>
                    )}
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
                                boardSize={boardSize}
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
