import React from 'react';
import './App.scss';
import SampleChart from "./sample/SampleChart";
import { observable } from 'mobx';
import { useObserver } from 'mobx-react';

const SERIES = {"Period1":[95, 24, 40, 65], "Period2":[24, 40, 15, 50]};
const CATEGORIES = ["Team1", "Team2", "Team3", "Team4"];

const indexStore = observable({
    index: 0,

    get func() {
        return this.index;
    },

    set func(idx:number) {
        this.index = idx;
    }
});

function otherEvent() {
    return useObserver(() => (
        <div>
            {Object.keys(SERIES).map((v, i) => {
                return <span key={`v-${i}`}>{v}: {indexStore.index > -1 && (SERIES as any)[v][indexStore.index]}</span>
            })}
        </div>
    ))
}

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <h1>Component Test</h1>
            </header>
            <article>
                <SampleChart title={'Sample Chart'}
                             series={SERIES}
                             categories={CATEGORIES} handleOtherEvent={(idx)=>{indexStore.index = idx}} />
                <div className={'other-event'}>
                    <span>SELECTED VALUE</span>
                    {otherEvent()}
                </div>
            </article>
        </div>
    );
}

export default App;
