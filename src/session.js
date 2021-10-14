//@ts-check
import React from 'react';
import Chats from './chatroom';
import Videoframe from './videoFrame';
import PeerCore from './peerCore';
import * as util from './utils';
import { findAllByDisplayValue } from '@testing-library/dom';


//atm UI control and peerjs API control are mixed up
//TODO separate those two

class Session extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputMessage: "",
            chats: [{ message: "hello", timestamp: 0, type: "system" }],
            connectors: 0,
            audioEnabled: true,
            cameraEnabled: false,
            captureEnabled: false,
            webGLEnabled: false

        }

        /** @type {PeerCore} */
        this.core = new PeerCore(this.props.name, this.props.session);

        this.getMessage = this.generateChatMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleTextboxChange = this.handleTextboxChange.bind(this);
        this.addItemToChatStack = this.addItemToChatStack.bind(this);
        this.handleTextboxChange = this.handleTextboxChange.bind(this);
        this.handleTextboxEnter = this.handleTextboxEnter.bind(this);
        this.setChatContentRef = this.setChatContentRef.bind(this);
        this.checkScrollState = this.checkScrollState.bind(this);
        this.toggleCapture = this.toggleCapture.bind(this);
        this.toggleCamera = this.toggleCamera.bind(this);

        this.chatContent = null;
        this.hostConn = null;
        this.connList = [];

        this.userMedia = null;

        //video/audio stream output
        this.stream = null;

        //video solo stream output
        this.camStream = null;

        //audio solo stream output
        this.audioStream = null;


        //notify connector when closing the window
        //not very reliable atm
        window.addEventListener("beforeunload", (ev) => {
            ev.preventDefault();

            return true;
        });
    }

    // reactjs want me to do this shit
    setChatContentRef(child) {
        this.chatContent = child
    }

    componentDidMount() {
        this.core.init();
        this.core.onMessageReceived(
            (message, role, timestamp, owner) => { this.generateChatMessage(message, role, timestamp, owner) });

        this.core.on("call", () => {
            console.log(this, "session js:", "received calls")
            this.setState(this.state);
        })
    }



    //UI controls

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

    generateChatMessage(message, role, timestamp, owner = "unknown") {
        this.addItemToChatStack({
            message: message,
            type: role,
            timestamp: timestamp,
            owner: owner
        })
        this.checkScrollState();
    }

    sendMessage() {
        if (this.state.inputMessage === "") return;

        //add the message to local stack
        this.generateChatMessage(this.state.inputMessage, "self", Date.now(), "You");

        //send the message to other connectors
        this.core.sendTextMessage(this.state.inputMessage);

        this.setState({
            inputMessage: ""
        })

        this.checkScrollState();
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

    checkScrollState() {
        if (!this.chatContent) return;
        if (this.chatContent.scrollTop + this.chatContent.clientHeight !== this.chatContent.scrollHeight) {
            document.querySelector(".chat-content").scrollTo({ top: this.chatContent.scrollHeight, behavior: "smooth" })
        }
    }

    toggleCapture() {
        if (!this.state.captureEnabled) {
            this.core.startCaptureCall();
        } else {
            this.core.stopCaptureCall();
        }
        this.setState({
            captureEnabled: !this.state.captureEnabled
        })
    }

    toggleCamera() {
        if (!this.state.cameraEnabled) {
            this.core.startCamCall();
        } else {
            this.core.stopCamCall();
        }
        this.setState({
            cameraEnabled: !this.state.cameraEnabled
        })
    }


    render() {
        return (
            <div className="container">
                <Videoframe
                    screenShareInvoker={this.toggleCapture}
                    cameraShareInvoker={this.toggleCamera}
                    incomingAudioList={this.core._incomingAudioList}
                    incomingCameraList={this.core._incomingCameraList}
                    incomingCaptureList={this.core._incomingCaptureList}
                    incomingWebGLList={this.core._incomingWebGLList}
                />
                <div className="chat-room">
                    <div>
                        <Chats setRef={this.setChatContentRef} items={this.state.chats} />
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




//utils




export default Session;