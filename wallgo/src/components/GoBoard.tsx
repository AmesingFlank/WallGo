import React, { useState, useEffect } from 'react';
import { WallGoGame, Stone, Wall, WallDirection, GamePhase } from '../WallGoGame';

interface GoBoardProps {
    game: WallGoGame;
    onStonePlaced?: (row: number, col: number) => void;
    onMoveStone?: (row: number, col: number) => void;
    onWallPlaced?: (wall: Wall) => void;
}

export const GoBoard: React.FC<GoBoardProps> = ({ game, onStonePlaced, onMoveStone, onWallPlaced }) => {
    const boardSize = 7;
    const cellSize = 50; // pixels
    const wallSize = 4; // pixels

    const [selectedStone, setSelectedStone] = useState<Stone | null>(null);
    const [selectedWall, setSelectedWall] = useState<Wall | null>(null);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [winner, setWinner] = useState<number | null>(null);

    useEffect(() => {
        const checkGameOver = () => {
            const result = game.checkForGameCompletion();
            if (result) {
                setGameOver(true);
                setWinner(result.winner);
            }
        };
        checkGameOver();
    }, [game]);

    const getCellColor = (stone: Stone | null) => {
        if (!stone) return '#transparent';
        return stone.player === 0 ? '#007bff' : '#dc3545';
    };

    const getBorderColor = (stone: Stone | null) => {
        if (!stone) return '#transparent';
        return stone.player === 0 ? '#fff' : '#fff';
    };

    const renderStone = (stone: Stone | null) => {
        if (!stone) return null;
        return (
            <div 
                className="stone"
                style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: getCellColor(stone),
                    borderRadius: '50%',
                    border: `2px solid ${getBorderColor(stone)}`
                }}
            />
        );
    };

    const handleCellClick = (row: number, col: number) => {
        if (game.getGamePhase() === GamePhase.PlacingStones) {
            onStonePlaced?.(row, col);
        } else if (game.getGamePhase() === GamePhase.Moving) {
            const stone = game.getCells()[row][col];
            if (!stone) return;
            
            if (selectedStone) {
                // Try to move the selected stone
                if (game.canMoveStoneTo(selectedStone, row, col)) {
                    onMoveStone?.(row, col);
                }
            } else {
                setSelectedStone(stone);
            }
        }
    };

    const handleWallClick = (wall: Wall) => {
        if (selectedWall && wall.equals(selectedWall)) {
            onWallPlaced?.(wall);
            setSelectedWall(null);
        }
    };

    const renderWallIndicator = () => {
        if (!selectedWall) return null;
        return (
            <div 
                className="wall-indicator"
                style={{
                    width: selectedWall.direction === WallDirection.Horizontal ? `${cellSize}px` : `${wallSize}px`,
                    height: selectedWall.direction === WallDirection.Horizontal ? `${wallSize}px` : `${cellSize}px`,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    border: '1px solid #fff',
                    pointerEvents: 'none',
                    position: 'absolute',
                    top: selectedWall.direction === WallDirection.Horizontal ? `${selectedWall.y * cellSize}px` : `${selectedWall.x * cellSize}px`,
                    left: selectedWall.direction === WallDirection.Horizontal ? `${selectedWall.x * cellSize}px` : `${selectedWall.y * cellSize}px`
                }}
            />
        );
    };

    const renderGameOver = () => {
        if (!gameOver || !winner) return null;
        return (
            <div className="game-over-overlay">
                <div className="game-over-message">
                    <h2>Game Over!</h2>
                    <p>Player {winner + 1} wins!</p>
                </div>
            </div>
        );
    };

    return (
        <div className="go-board" style={{ 
            width: `${boardSize * cellSize}px`, 
            height: `${boardSize * cellSize}px`, 
            position: 'relative' 
        }}>
            {/* Draw walls */}
            {[...Array(boardSize + 1)].map((_, row) => (
                <div key={`hwall-${row}`} className="wall-row" style={{
                    position: 'absolute',
                    top: `${row * cellSize}px`,
                    left: '0'
                }}>
                    {[...Array(boardSize)].map((_, col) => {
                        const wall = game.getHorizontalWalls()[row][col];
                        if (wall) {
                            return (
                                <div 
                                    key={col}
                                    className="horizontal-wall"
                                    style={{
                                        width: `${cellSize}px`,
                                        height: `${wallSize}px`,
                                        backgroundColor: wall.player === 0 ? '#007bff' : '#dc3545',
                                        border: '1px solid #fff'
                                    }}
                                    onClick={() => handleWallClick(wall)}
                                />
                            );
                        }
                        return null;
                    })}
                </div>
            ))}

            {[...Array(boardSize)].map((_, row) => (
                <div key={row} className="go-row" style={{
                    position: 'absolute',
                    top: `${row * cellSize}px`,
                    left: '0'
                }}>
                    {[...Array(boardSize + 1)].map((_, col) => {
                        const wall = game.getVerticalWalls()[row][col];
                        if (wall) {
                            return (
                                <div 
                                    key={col}
                                    className="vertical-wall"
                                    style={{
                                        width: `${wallSize}px`,
                                        height: `${cellSize}px`,
                                        backgroundColor: wall.player === 0 ? '#007bff' : '#dc3545',
                                        border: '1px solid #fff'
                                    }}
                                    onClick={() => handleWallClick(wall)}
                                />
                            );
                        }
                        return null;
                    })}

                    {[...Array(boardSize)].map((_, col) => {
                        const stone = game.getCells()[row][col];
                        return (
                            <div
                                key={col}
                                className="go-cell"
                                style={{
                                    width: `${cellSize}px`,
                                    height: `${cellSize}px`,
                                    border: '1px solid #ddd',
                                    cursor: game.getGamePhase() === GamePhase.PlacingStones ? 'pointer' : 'not-allowed',
                                    position: 'absolute',
                                    left: `${col * cellSize}px`
                                }}
                                onClick={() => handleCellClick(row, col)}
                            >
                                {renderStone(stone)}
                                {/* Intersection point */}
                                <div className="intersection" style={{
                                    width: '4px',
                                    height: '4px',
                                    backgroundColor: '#000',
                                    borderRadius: '50%'
                                }}></div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {renderWallIndicator()}
            {renderGameOver()}
        </div>
    );
};
