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
            <div>
                {
                    this.props.incomingAudioList.map(e => 
                        <VideoItem className="audio" key={"au-"+util.makeid(10)} call={e} />
                    )
                }
                {
                    this.props.incomingCameraList.map(e => 
                        <VideoItem className="camera" key={"ca-"+util.makeid(10)} name={e.metadata.owner + '\'s camera'} call={e} />
                    )
                }
                {
                    this.props.incomingCaptureList.map(e => 
                        <VideoItem className="capture" key={"cp-"+util.makeid(10)} name={e.metadata.owner + '\'s capture'} call={e} />
                    )
                }
                {
                    this.props.incomingWebGLList.map(e => 
                        <VideoItem className="avatar" key={"av-"+util.makeid(10)} name={e.metadata.owner + '\'s avatar'} call={e} />
                    )
                }
            </div>
        );
    }



    controlBoard() {
        return (
            <div className="control-board">

                <div className="controller">
                    <button onClick={this.props.cameraShareInvoker} id="video">📷</button>
                    <button onClick={this.props.screenShareInvoker} id="screenshare">💻</button>
                    <button onClick={this.props.audioShareInvoker} id="mic">🎤</button>
                    <button id="hang">❌</button>
                    <button id="settings">⚙️</button>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className="video-frame">
                <div className="display">
                    {this.display()}
                </div>
                {this.controlBoard()}
            </div>
        )
    }
}


class VideoItem extends React.Component {
    constructor(props) {
        super(props);
        this.videoRef = React.createRef();
        this.state = {
            stream: null
        }
        this.prepareVideo = this.prepareVideo.bind(this);
    }

    prepareVideo(){
        // this.props.call.assignStreamCallBack((stream)=>{
        //     this.setState({
        //         stream: stream
        //     })
        //     this.videoRef.current.srcObject = stream;
        // })

        this.videoRef.current.srcObject = this.props.call.activeStream;

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
    componentDidMount() {
        this.prepareVideo();
    }

    componentDidUpdate(prevProps) {
        this.prepareVideo();
    }

    shouldComponentUpdate(nextProps, nextState){
        if(nextProps.call.activeStream === this.props.call.activeStream){
            return false;
        }else{
            return true;
        }
    }

    render() {
        return (
            <div className="item">
                <label>{this.props.name}</label>
                <video ref={this.videoRef}></video>
            </div>
        )
    }
}

export default Videoframe;