import React from 'react';
import * as util from './utils'

class Chats extends React.Component {

    render() {
        return (
            <div className="chat-content" ref={el => { this.props.setRef(el) }}>
                {
                    this.props.items.map(
                        item => (
                            <div key={"m-" + item.timestamp} className={"item " + item.type}>
                                <div data-owner={item.owner} data-timestamp={util.timeConverter(item.timestamp)} className={`msg`}>{item.message}</div>
                            </div>
                        )
                    )
                }
            </div>
        )
    }
}

export default Chats;