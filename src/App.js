import React, { Component } from 'react';
import _ from 'lodash';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import   AddIcon from '@material-ui/icons/Add';
import    Button from '@material-ui/core/Button';

import      Peer from './Peer'
import Newspaper from './Newspaper'
import SignatureInputs from './SignatureInputs'
import HeaderBar from './HeaderBar'
import      Msgs from './Msgs'

import './App.css';

export default connect({
          peers: state`peers`,
       showrace: state`showrace`,
      showcheat: state`showcheat`,
       raceIsOn: state`raceIsOn`,
  shownewspaper: state`shownewspaper`,
       showsign: state`showsign`,
       init: signal`init`,
    addPeer: signal`addPeer`,
  startRace: signal`startRace`,
   stopRace: signal`stopRace`,
}, class App extends Component {

  componentWillMount() {
    this.props.init();
  }

  render() {
    const props = this.props;
    return (
      <div className="App" style={{display: 'flex', flexDirection: 'column'}}>

        <HeaderBar />

        { !props.showrace ? '' :
          <Button color='primary' aria-label='Toggle Race' onClick={() => props.raceIsOn ? props.stopRace() : props.startRace()}>
            { props.raceIsOn ? 'Stop Race' : 'Start Race' }
          </Button>
        }

        { !props.showcheat ? '' :
          <Msgs />
        }

        { props.shownewspaper ? <Newspaper />       : '' }

        { props.showsign      ? <SignatureInputs /> : '' }

        { /* Render all the peers now: */ }
        {_.map(props.peers, (peer,peerindex) => <Peer peerindex={peerindex} key={'p'+peerindex} />) }

        <Button variant='fab' color='primary' aria-label='Add Peer'
          onClick={() => props.addPeer()}
        >
          <AddIcon/>
        </Button>

        <div className='footer-bar'>
          <div className='footer-bar-element'>
            License:<br/>Apache 2.0
          </div>
          <div className='footer-bar-element'>
            Github:<br/><a href='https://github.com/aultac/blockchain-tutorial'>{'https://github.com/aultac/blockchain-tutorial'}</a>
          </div>
          <div className='footer-bar-element'>
            Live:<br/> <a href='https://aultac.github.io/blockchain-tutorial'>{'https://aultac.github.io/blockchain-tutorial'}</a>
          </div>
          <div className='footer-bar-element'>
            Many thanks to Anders Brownworth for his<br/> excellent blockchain demo that inspired this one: <br/>
            <a href='https://anders.com/blockchain/'>{'https://anders.com/blockchain/'}</a>
          </div>
        </div>

      </div>
    );
  }
});
