import React, { useState } from 'react';
import './App.css';
import { GoBoard } from './components/GoBoard';
import { GameConfig, WallGoGame, Stone, Wall, GamePhase } from './WallGoGame';

function App() {
  const config = new GameConfig();
  const [game, setGame] = useState(new WallGoGame(config));
  const [selectedStone, setSelectedStone] = useState<Stone | null>(null);

  const handleStonePlaced = (row: number, col: number) => {
    try {
      const newGame = new WallGoGame(config);
      newGame.placeStone(row, col);
      setGame(newGame);
    } catch (error) {
      console.error('Error placing stone:', error);
    }
  };

  const handleStoneSelected = (stone: Stone) => {
    setSelectedStone(stone);
  };

  const handleMoveStone = (row: number, col: number) => {
    if (!selectedStone) return;
    try {
      const newGame = new WallGoGame(config);
      const placableWalls = newGame.moveStone(selectedStone, row, col);
      setSelectedStone(null);
      setGame(newGame);
    } catch (error) {
      console.error('Error moving stone:', error);
    }
  };

  const handleWallPlaced = (wall: Wall) => {
    try {
      const newGame = new WallGoGame(config);
      const result = newGame.placeWallAfterMovingStone(selectedStone!, wall);
      if (result) {
        // Game is over
        console.log('Game over! Winner:', result.winner);
      }
      setSelectedStone(null);
      setGame(newGame);
    } catch (error) {
      console.error('Error placing wall:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>WallGo</h1>
        <div className="game-info">
          <p>Current Phase: {GamePhase[game.getGamePhase()]}</p>
          <p>Current Player: {game.getCurrentPlayer() + 1}</p>
        </div>
        <GoBoard 
          game={game} 
          onStonePlaced={game.getGamePhase() === GamePhase.PlacingStones ? handleStonePlaced : undefined}
          onMoveStone={game.getGamePhase() === GamePhase.Moving ? handleMoveStone : undefined}
          onWallPlaced={handleWallPlaced}
        />
      </header>
    </div>
  );
}

export default App;
