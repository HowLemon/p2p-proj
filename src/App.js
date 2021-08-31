import './App.css';
import React from 'react';
import RandomNames from './randomName';
import Session from './session';


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: null,
            id: null,
            isHost: null,
            session: ""
        }
        this.getLoginInfo = this.getLoginInfo.bind(this);
        this.startNewSession = this.startNewSession.bind(this);
        this.connectToSession = this.connectToSession.bind(this);
    }

    getLoginInfo(name, id) {
        this.setState({
            name: name,
            id: id
        })
    }

    startNewSession(){
        this.setState({
            isHost : true
        })
    }

    connectToSession(session){
        this.setState({
            isHost : true,
            session: session
        })
    }

    render() {
        return (
            <div className="App">
                {
                    (() => {
                        if (this.state.isHost === null) {
                            if (this.state.id) {
                                return <ModeSelect startNewSession={this.startNewSession} connectToSession={this.connectToSession} />;
                            } else {
                                return <Login getLoginInfo={this.getLoginInfo} />;
                            }
                        }else{
                            return <Session name={this.state.name} isHost={this.state.isHost} session={this.state.session}/>
                        }

                    })()

                }
            </div>
        );
    }
}

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: RandomNames[Math.floor(Math.random() * RandomNames.length)],
            id: Math.floor(Math.random() * 1000000)
        }
        this.handleNameChange = this.handleNameChange.bind(this);
        this.submit = this.submit.bind(this);
    }

    handleNameChange(e) {
        this.setState({
            name: e.target.value
        })
    }

    submit() {
        if (this.state.name !== "") { this.props.getLoginInfo(this.state.name, this.state.id); }
        else { alert("名字不能為空!"); }
    }

    render() {
        return (
            <div className="nameInput">
                <h1>Welcome To my p2p project</h1>
                <div>
                    <label>Enter Your Name: </label>
                    <input value={this.state.name} onChange={this.handleNameChange}></input>
                    <button onClick={this.submit}>Login</button>
                </div>
            </div>
        )
    }
}

class ModeSelect extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            sessionInput : ""
        }
        this.handleInput = this.handleInput.bind(this);
        this.handleSubmitSession = this.handleSubmitSession.bind(this);
    }
    handleInput(e){
        this.setState({
            sessionInput: e.target.value
        })
    }

    handleSubmitSession(){
        if(this.state.sessionInput === "") return;
        this.props.connectToSession(this.state.sessionInput);
    }
    render() {
        return (
            <div className="modeSelector">
                <p>
                    <button onClick={this.props.startNewSession}>開啟新會議</button>
                </p>
                <p>
                    <input value={this.state.sessionInput} onChange={this.handleInput}></input><button onClick={this.handleSubmitSession}>加入現有會議</button>
                </p>
            </div>
        )
    }
}



export default App;
