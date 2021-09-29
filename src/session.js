import React from 'react';
import Peer from 'peerjs';
import Chats from './chatroom';
import Videoframe from './videoFrame';
import * as util from './utils';

var dataTypes = {
    message: 0,
    requestConnect: 1,
    face: 2,
    debug: 4,
    ping: 5,
    cursor: 6
}

//atm UI control and peerjs API control are mixed up
//TODO separate those two

class Session extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            inputMessage: "",
            peer: generateNewPeer(),
            chats: [{ message: "hello", timestamp: 0, type: "system" }],
            callList: [],
            connectors: 0,
            audioEnabled: true
        }
        this.getMessage = this.generateChatMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.handleTextboxChange = this.handleTextboxChange.bind(this);
        this.addItemToChatStack = this.addItemToChatStack.bind(this);
        this.handleTextboxChange = this.handleTextboxChange.bind(this);
        this.handleTextboxEnter = this.handleTextboxEnter.bind(this);
        this.setChatContentRef = this.setChatContentRef.bind(this);
        this.checkScrollState = this.checkScrollState.bind(this);
        this.requestConnect = this.requestConnect.bind(this);
        this.dataConnectionHandlers = this.handleDataConnection.bind(this);
        this.handleStreamInput = this.handleStreamInput.bind(this);
        this.activateCapture = this.activateCapture.bind(this);

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
            this.state.peer.disconnect();
            return true;
        });
    }

    // reactjs want me to do this shit
    setChatContentRef(child) {
        this.chatContent = child
    }

    componentDidMount() {
        this.activateMedia();

        this.state.peer.on('open', (id) => {
            this.generateChatMessage(`session ID: ${id}`, "system", Date.now())
            //if is connecting to other session
            if (this.props.session !== "") {
                console.log("attempting to connect to :", this.props.session);
                this.requestConnect(this.props.session);
            }
        });
        this.state.peer.on("connection", (conn) => {
            this.generateChatMessage(`${conn.metadata.name} has connected to this session`, "system", Date.now());
            this.handleDataConnection(conn);
        })

        this.state.peer.on('error', ((msgHandler) => {
            return (err) => {
                msgHandler(err.message, "system error");
                console.log(err);
            }
        })(this.generateChatMessage))

        this.state.peer.on('call', (call) => {
            console.log("call in:", call);
            call.answer(this.stream);
            this.handleStreamInput(call);
        });
    }

    //activate the A/V stream
    //TODO: separate audio and video and make it toggable
    activateMedia() {
        this.userMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        this.userMedia({ video: true, audio: true }, (stream) => {
            this.stream = stream;
        }, (err) => {
            console.log("mediastream error:", err);
        })
    }

    //  WIP
    //  activate the WEBGL capture stream
    activateCapture() {
        var capture = navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
        capture.then((s) => {
            this.stream = s;
        });
    }

    // requesting connection to other session ID
    requestConnect(session) {
        var conn = this.state.peer.connect(session, { metadata: { name: this.props.name } });

        var call = this.state.peer.call(session, this.stream);
        console.log("call out:", call);

        //connect handlers
        this.handleDataConnection(conn);
        this.handleStreamInput(call);


    }


    // handles individual connector's calling input
    // WIP need to be able to tell apart types of call (audio/video/capture/others)
    handleStreamInput(call) {
        console.log("handling call")
        call.on('stream', (remoteStream) => {
            console.log("adding steram", remoteStream);
            var callerSnapshot = this.state.callList;
            var isUnique = true;
            //for some reason it runs twice so need to make sure it only runs once;
            for (var i = 0; i < this.state.callList.length; i++) {
                if (this.state.callList[i].id === remoteStream.id) {
                    isUnique = false;
                    break;
                }
            }
            if (isUnique) {
                callerSnapshot.push(remoteStream);
            }
            this.setState({
                callList: callerSnapshot
            });

        });

    }


    // handles individual connector's data input
    handleDataConnection(conn) {


        conn.on("open", () => {
            if (conn.peer === this.props.session) { this.generateChatMessage("connected to host", "system", Date.now()); }
            conn.send(util.generatePayload("hi", dataTypes.debug));
            if (this.props.session === "") { //if this instance is host
                console.log("sending conn info", this.connList);
                conn.send(util.generatePayload(this.connList.map(x => x.peer), dataTypes.requestConnect));
            }
            this.setState({
                connectors: this.state.connectors + 1
            });
        })
        conn.on("close", () => {
            if (conn.peer === this.props.session) {
                this.generateChatMessage("host session ended", "system", Date.now());
                this.state.peer.disconnect();
            } else {
                this.generateChatMessage(`${conn.metadata.name} has left this session`, "system", Date.now());
            }
            this.connList.splice(this.connList.indexOf(conn), 1);
        });
        conn.on("data", (data) => {
            console.log("data", data);
            switch (data.type) {
                case (dataTypes.requestConnect):
                    console.log("conn", data.content);
                    data.content.forEach(id => {
                        if (id !== this.state.peer.id) {
                            this.requestConnect(id);

                        }
                    });
                    break;
                case (dataTypes.message):
                    this.generateChatMessage(data.content, "other", data.timestamp, data.sender);
                    break;
                case (dataTypes.debug):
                    console.log(util.timeConverter(data.timestamp), data.content, conn.metadata);
                    break;
                case (dataTypes.cursor):

                    break;
                default:
                    console.log("NO TYPE", data);
                    break;
            }

        })

        this.connList.push(conn);
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
        this.connList.forEach(conn => {
            conn.send(util.generatePayload(this.state.inputMessage, dataTypes.message, this.props.name));
        })

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



    render() {
        return (
            <div className="container">
                <Videoframe screenShareInvoker={this.activateCapture} callers={this.state.callList} />
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