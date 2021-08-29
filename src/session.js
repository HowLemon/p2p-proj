import React from 'react';
import Peer from 'peerjs';

class Session extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputMessage: "",
            peer: generateNewPeer(),
            chats: [{ message: "hello", timestamp: 0, type: "system" }]
        }
        this.getMessage = this.getMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleTextboxChange = this.handleTextboxChange.bind(this);
        this.addItemToChatStack = this.addItemToChatStack.bind(this);
        this.handleTextboxChange = this.handleTextboxChange.bind(this);
        this.handleTextboxEnter = this.handleTextboxEnter.bind(this);
    }

    handleTextboxEnter(e) {
        if (e.key === 'Enter') {
            this.sendMessage();
        }
    }

    handleTextboxChange(e) {
        this.setState({
            inputMessage: e.target.value
        })
    }

    getMessage() {

    }

    sendMessage() {
        if (this.state.inputMessage === "") return;
        this.addItemToChatStack({
            message: this.state.inputMessage,
            type: "self",
            timestamp: Date.now()
        })
        this.setState({
            inputMessage: ""
        })
    }

    addItemToChatStack(item) {
        var chatSnapshot = this.state.chats;
        for (var i = 0; i < this.state.chats.length; i++) {
            if (this.state.chats[i].timestamp > item.timestamp) {
                chatSnapshot.splice(i, 0, item);
                this.setState({
                    chats: chatSnapshot
                })
                return;
            }
        }

        chatSnapshot.push(item);
        this.setState({
            chats: chatSnapshot
        })
    }

    render() {
        return (
            <div>
                <div className="chat-room">
                    <div>
                        <Chats items={this.state.chats} />
                        <div className="controls">
                            <input onKeyDown={this.handleTextboxEnter} value={this.state.inputMessage} placeholder="Chat now" onChange={this.handleTextboxChange}></input>
                            <button onClick={this.sendMessage}>Send</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

class Chats extends React.Component {
    render() {
        return (
            <div className="chat-content">
                {
                    this.props.items.map(
                        item => (
                            <div key={item.timestamp} className={item.type}>{item.message}</div>
                        )
                    )
                }
            </div>
        )
    }
}


function generateNewPeer() {
    return new Peer({
        config: {
            'iceServers': [
                { url: 'stun:stun.l.google.com:19302' },
                { url: 'stun:stun1.l.google.com:19302' },
                { url: 'stun:stun2.l.google.com:19302' },
                { url: 'stun:stun3.l.google.com:19302' },
                { url: 'stun:stun4.l.google.com:19302' },
                {
                    url: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
                {
                    url: 'turn:192.158.29.39:3478?transport=udp',
                    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                    username: '28224511:1379330808'
                },
                {
                    url: 'turn:192.158.29.39:3478?transport=tcp',
                    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                    username: '28224511:1379330808'
                },
                {
                    url: 'turn:turn.bistri.com:80',
                    credential: 'homeo',
                    username: 'homeo'
                },
                {
                    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    credential: 'webrtc',
                    username: 'webrtc'
                }

            ]
        }
    });
}

export default Session;