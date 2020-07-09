import React from 'react';
import './App.css';
import Chart from './components/Chart';
import Parser from './components/Parser';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>"Month" total</p>
      </header>
      <div class="column">
        <p>Income</p>
        <Parser />
      </div>
      <div class="column">
        <p>Expenditures</p>
        <Chart />
      </div>
    </div>
  );
}
export default App;
