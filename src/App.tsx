import React from 'react';
import './App.scss';
import SampleChart from "./sample/SampleChart";

function App() {
  return (
    <div className="App">
      <header className="App-header">
          <SampleChart title={'Sample Chart'}
                       series={{"Period1":[95, 24, 40, 65], "Period2":[24, 40, 15, 50]}}
                       categories={["Team1", "Team2", "Team3", "Team4"]} />
      </header>
    </div>
  );
}

export default App;
