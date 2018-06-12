import React, { Component } from 'react';
import _ from 'lodash';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import TextField from '@material-ui/core/TextField';
import   AddIcon from '@material-ui/icons/Add';
import    Button from '@material-ui/core/Button';

import HashBlock from './HashBlock'

import './App.css';

export default connect({
      peers: state`peers`,
  showwidth: state`showwidth`,
  hashwidth: state`hashwidth`,
    hashalg: state`hashalg`,
   updateHashInfo: signal`updateHashInfo`,
  updateHashWidth: signal`updateHashWidth`,
    toggleHashAlg: signal`toggleHashAlg`,
      toggleWidth: signal`toggleWidth`,
         addBlock: signal`addBlock`,
}, class App extends Component {

  componentWillMount() {
    const props = this.props;
    props.updateHashInfo(); // initialize
  }

  render() {
    const props = this.props;
    return (
      <div className="App" style={{display: 'flex', flexDirection: 'column'}}>
  
        <div className="header-bar">
          <div># Hashing and Blockchain Tutorial</div>

          <div style={{flexGrow: '1'}}></div>

          { props.hashalg === 'SumHash' 
            ? <div className='header-button' onClick={() => props.toggleWidth()}>
                {props.showwidth 
                 ? <TextField 
                     type="number"
                     value={props.hashwidth} 
                     onChange={evt => props.updateHashWidth({val: evt.target.value < 0 ? 0 : evt.target.value })}
                     onBlur={() => props.toggleWidth()}
                     autoFocus
                    />
                 : 'Width'
                }
              </div>
            : ''
          }

          <div className='header-button' onClick={() => props.toggleHashAlg()}>
            Switch to {props.hashalg === 'SHA-256' ? 'SumHash' : 'SHA-256'}
          </div>

        </div>

        {_.map(props.peers, (peer,peerindex) => 
          <div key={`peer${peerindex}`} className='peernode'>
            {_.map(peer.blocks, (block,blockindex) => 
              <SumHashBlock 
                peerindex={peerindex}
                blockindex={blockindex} 
                key={`shb${peerindex}${blockindex}`}
              />
            )}

            <Button variant='fab' color='primary' aria-label='add'
              onClick={() => props.addBlock({peerindex})}
            >
              <AddIcon/>
            </Button>
          </div>
        )}

      </div>
    );
  }
});
