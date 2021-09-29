import React from "react";
import * as util from './utils'

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
                    <button onClick={this.props.screenShareInvoker} id="screenshare">💻</button>
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
    constructor(props) {
        super(props);
        this.videoRef = React.createRef();
    }

    componentDidMount() {
        this.videoRef.current.srcObject = this.props.stream;
        this.videoRef.current.onloadedmetadata = ((video) => {
            return (e) => {
                video.play();
            }
        })(this.videoRef.current);
        this.videoRef.current.oninactive = ((video) => {
            return (e) => {
                alert("bye");
            }
        })(this.videoRef.current);
    }

    render() {
        return (
            <div className="item">
                <video ref={this.videoRef}></video>
            </div>
        )
    }
}

export default Videoframe;