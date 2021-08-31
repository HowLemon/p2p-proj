import React from 'react';
import Peer from 'peerjs';

var dataTypes = {
    message: 0,
    requestConnect: 1,
    face: 2,
    debug: 4,
    ping: 5
}

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

        this.chatContent = null;
        this.hostConn = null;
        this.connList = [];

        this.userMedia = null;
        this.stream = null;

        window.addEventListener("beforeunload", (ev) => {
            ev.preventDefault();
            this.state.peer.disconnect();
            return true;
        });
    }

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

    activateMedia() {
        this.userMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        this.userMedia({ video: true, audio: true }, (stream) => {
            this.stream = stream;
        }, (err) => {
            console.log("mediastream error:", err);
        })
    }

    activateCapture(){
        
    }

    requestConnect(session) {
        var conn = this.state.peer.connect(session, { metadata: { name: this.props.name } });

        var call = this.state.peer.call(session, this.stream);
        console.log("call out:", call);

        //connect handlers
        this.handleDataConnection(conn);
        this.handleStreamInput(call);


    }



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

    handleDataConnection(conn) {


        conn.on("open", () => {
            if (conn.peer === this.props.session) { this.generateChatMessage("connected to host", "system", Date.now()); }
            conn.send(generatePayload("hi", dataTypes.debug));
            if (this.props.session === "") { //if this instance is host
                console.log("sending conn info", this.connList);
                conn.send(generatePayload(this.connList.map(x => x.peer), dataTypes.requestConnect));
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
                    console.log(timeConverter(data.timestamp), data.content, conn.metadata);
                    break;
                default:
                    console.log("NO TYPE", data);
                    break;
            }

        })

        this.connList.push(conn);
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
            conn.send(generatePayload(this.state.inputMessage, dataTypes.message, this.props.name));
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
                <Videoframe callers={this.state.callList} />
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

class Chats extends React.Component {

    render() {
        return (
            <div className="chat-content" ref={el => { this.props.setRef(el) }}>
                {
                    this.props.items.map(
                        item => (
                            <div key={"m-" + item.timestamp} className={"item " + item.type}>
                                <div data-owner={item.owner} data-timestamp={timeConverter(item.timestamp)} className={`msg`}>{item.message}</div>
                            </div>
                        )
                    )
                }
            </div>
        )
    }
}

class Videoframe extends React.Component {

    constructor(props) {
        super(props);
        this.controlBoard = this.controlBoard.bind(this);
        this.display = this.display.bind(this);
    }

    display() {
        return (
            <div className="display">
                {
                    this.props.callers ? this.props.callers.map(e => (
                        <VideoItem key={e.id} stream={e} />
                    )) : "noitem"
                }
            </div>
        );
    }



    controlBoard() {
        return (
            <div className="control-board">

                <div className="controller">
                    <button id="video">📷</button>
                    <button id="screenshare">💻</button>
                    <button id="mic">🎤</button>
                    <button id="hang">❌</button>
                    <button id="settings">⚙️</button>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className="video-frame">
                {this.display()}
                {this.controlBoard()}
            </div>
        )
    }
}

class VideoItem extends React.Component {
    constructor(props){
        super(props);
        this.videoRef = React.createRef(); 
    }

    componentDidMount(){
        this.videoRef.current.srcObject = this.props.stream;
        this.videoRef.current.onloadedmetadata = ((video)=>{return (e)=>{
            video.play();
        }})(this.videoRef.current);
        this.videoRef.current.oninactive = ((video)=>{return (e)=>{
            alert("bye");
        }})(this.videoRef.current);
    }
    
    render() {
        return (
            <div className="item">
                <video ref={this.videoRef}></video>
            </div>
        )
    }
}

//utils

function timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + zerofill(hour) + ':' + zerofill(min) + ':' + zerofill(sec);
    return time;
}

function zerofill(str) {
    return ('00' + str).slice(-2);
}

function generatePayload(content, type, sender, timestamp = Date.now()) {
    return {
        content: content,
        type: type,
        timestamp: timestamp,
        sender: sender
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