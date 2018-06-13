import React, { Component } from 'react';
import _ from 'lodash';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import TextField from '@material-ui/core/TextField';
import   AddIcon from '@material-ui/icons/Add';
import    Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import    Switch from '@material-ui/core/Switch';

import Peer from './Peer'

import './App.css';

export default connect({
          peers: state`peers`,
      showwidth: state`showwidth`,
       showwork: state`showwork`,
  shownewspaper: state`shownewspaper`,
    showpublish: state`showpublish`,
      hashwidth: state`hashwidth`,
        hashalg: state`hashalg`,
   updateHashInfo: signal`updateHashInfo`,
  updateHashWidth: signal`updateHashWidth`,
    toggleHashAlg: signal`toggleHashAlg`,
      toggleWidth: signal`toggleWidth`,
       toggleWork: signal`toggleWork`,
  toggleNewspaper: signal`toggleNewspaper`,
    togglePublish: signal`togglePublish`,
          addPeer: signal`addPeer`,
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

          <div className='header-button' onClick={() => props.toggleWidth()}>
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

          <div className='header-button' onClick={() => props.toggleHashAlg()}>
            Switch to {props.hashalg === 'SHA-256' ? 'SumHash' : 'SHA-256'}
          </div>

          <div className={'header-button ' + (props.shownewspaper ? 'header-button-down' : '')}
            onClick={() => props.toggleNewspaper()}
          >
            News
          </div>

          <div className={'header-button ' + (props.showpublish ? 'header-button-down' : '')}
            onClick={() => props.togglePublish() }
          >
            Publish
          </div>
          
          <div className={'header-button ' + (props.showwork ? 'header-button-down' : '')}
            onClick={() => props.toggleWork()}
          >
            Work
          </div>

        </div>

        { /* Render all the peers now: */ }
        {_.map(props.peers, (peer,peerindex) => <Peer peerindex={peerindex} key={'p'+peerindex} />) }

        <Button variant='fab' color='primary' aria-label='Add Peer'
          onClick={() => props.addPeer()}
        >
          <AddIcon/>
        </Button>

      </div>
    );
  }
});
