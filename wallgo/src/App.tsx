import React from 'react';
import './App.css';
import { WallGoGameComponent } from './components/WallGoGameComponent';

function App() {
  document.title = 'WallGo / 墙壁围棋 / 벽바둑';
  return (
    <div className="App">
      <header className="App-header">
        <h1>WallGo / 墙壁围棋 / 벽바둑</h1>
        <WallGoGameComponent />
      </header>
    </div>
  );
}

export default App;
