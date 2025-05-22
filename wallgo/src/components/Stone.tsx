import React from 'react';

interface StoneProps {
    player: number;
    boardSize: number;
    x: number;
    y: number;
    isMovable?: boolean;
}

export const Stone: React.FC<StoneProps> = ({ player, boardSize, x, y, isMovable = false }) => {
    const colors = ['#FF0000', '#0000FF']; // Red for player 0, Blue for player 1
    const color = colors[player];
    const cellSize = 500 / boardSize;

    return (
        <div
            className={`stone ${isMovable ? 'movable-stone' : ''}`}
            style={{
                position: 'absolute',
                left: `${x * cellSize + cellSize / 2}px`,
                top: `${y * cellSize + cellSize / 2}px`,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: color,
                transform: 'translate(-50%, -50%)'
            }}
        />
    );
};
