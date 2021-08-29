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
      isHost: false,
      session: null,
      aaa: 555
    }
    this.getLoginInfo = this.getLoginInfo.bind(this);
  }

  getLoginInfo(name, id) {
    this.setState({
      name: name,
      id: id
    })
  }

  render() {
    return (
      <div className="App">
        {
        //this.state.id ? <ModeSelect/> : <Login getLoginInfo={this.getLoginInfo} />
        }
        <Session/>
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
  render() {
    return (
      <div className="modeSelector">
        <p>
          <button>開啟新會議</button>
        </p>
        <p>
          <input></input><button>加入現有會議</button>
        </p>
      </div>
    )
  }
}



export default App;
