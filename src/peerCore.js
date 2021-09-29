import Peer from "peerjs";
import * as util from "./utils";

/**
 * handles connection, host session, call, data 
 */
class PeerCore {

    constructor(name, hostSession = null) {

        this._name = name

        //TODO find a smarter way to signify a host???
        //null if is host
        this._hostSession = hostSession
        /** @type {Peer} */
        this.peer = null;
        this.started = false;
        this.connectors = 0;

        this._connList = [];

        this._messageEvList = [];
    }
    name = { get() { return this._name } }
    id = { get() { return this.peer.id; } }
    isHost = { get() { return this._hostSession !== false } }

    init() {

        // TODO setup a proper TURN server of my own
        this.peer = new Peer({
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

        // peer built-in events

        this.peer.on('open', (id) => {
            console.log("PeerCore open", id);
            //if is not host, connect to a specified session
            if (this.isHost) {

            }
        });

        this.peer.on('connection', (conn) => {
            console.log("PeerCore conn", conn);
        });

        this.peer.on('error', (err) => {
            console.log("PeerCore error", err);
        });

        this.peer.on("call", (call) => {
            console.log("PeerCore call", call);
        });
    }

    on(event, fn) {
        switch (event) {
            case "message":
                this._messageEvList.push(fn);
                break;
            default:

        }
    }

    _broadcastMessage(message,role,timestamp,owner = "unknown"){
        var scope = this || window;
        this._messageEvList.forEach((fn)=>{
            fn(message,role,timestamp,owner);
        })
    }

    requestConnect(sessionID) {
        /** @type {Peer.DataConnection} */
        var conn = this.peer.connect(sessionID, { metadata: { name: this.name } });

        //data connection handlers

    }


    // handles individual connector's data input
    handleDataConnection(conn) {


        conn.on("open", () => {
            if (conn.peer === this._hostSession) {
                //this.generateChatMessage("connected to host", "system", Date.now()); 
                this._broadcastMessage("connected to host", "system", Date.now())
            }
            conn.send(util.generatePayload("hi", dataTypes.debug));

            if (this.isHost) { //if this instance is host, send connection list to the connector
                console.log("sending conn info", this._connList);
                conn.send(util.generatePayload(this._connList.map(x => x.peer), dataTypes.requestConnect));
            }

            this.connectors++;
        })

        conn.on("close", () => {
            if (conn.peer === this._hostSession) {
                //this.generateChatMessage("host session ended", "system", Date.now());
                this._broadcastMessage("host session ended", "system", Date.now());
                this.peer.disconnect();
            } else {
                //this.generateChatMessage(`${conn.metadata.name} has left this session`, "system", Date.now());
                this._broadcastMessage(`${conn.metadata.name} has left this session`, "system", Date.now());
            }
            this._connList.splice(this._connList.indexOf(conn), 1);
        });

        conn.on("data", (data) => {
            console.log("data", data);
            switch (data.type) {
                case (dataTypes.requestConnect):
                    console.log("conn", data.content);
                    if (conn.peer === this._hostSession) {
                        data.content.forEach(id => {
                            if (id !== this.peer.id) {
                                this.requestConnect(id);
                            }
                        });
                    } else {
                        console.log("an non-host peer provided connection list???", data);
                    }

                    break;
                case (dataTypes.message):
                    //this.generateChatMessage(data.content, "other", data.timestamp, data.sender);
                    this._broadcastMessage(data.content, "other", data.timestamp, data.sender);
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

        this._connList.push(conn);
    }



}


var dataTypes = {
    message: 0,
    requestConnect: 1,
    face: 2,
    debug: 4,
    ping: 5,
    cursor: 6
}

export default PeerCore;