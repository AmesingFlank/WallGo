import React from 'react';
import './App.css';
import { WallGoGameComponent } from './components/WallGoGameComponent';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>WallGo</h1>
        <WallGoGameComponent />
      </header>
    </div>
  );
}

export default App;
