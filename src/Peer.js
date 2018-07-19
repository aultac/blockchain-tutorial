import React from 'react';
import _ from 'lodash';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import   AddIcon from '@material-ui/icons/Add';
import    Button from '@material-ui/core/Button';

import HashBlock from './HashBlock'

import './Peer.css';

export default connect({
        peers: state`peers`,
  showpublish: state`showpublish`,
   showreward: state`showreward`,
          addBlock: signal`addBlock`,
       publishNode: signal`publishNode`,
  togglePeerMining: signal`togglePeerMining`,
}, function Peer(props) {
  const {peerindex} = props;
  const peer = props.peers[peerindex];
  // Add up the bounty's of all the blocks we've mined
  const balance = _.reduce(peer.blocks, (sum,b) => sum + (b.winner && b.winner.peerindex === peerindex ? +(b.bounty) : 0),0);

  return (
    <div className='peernode'>
      <div className='peernode-topbar'>
        {  props.peers.length > 1 || props.showreward
         ? <div className='peernode-title'>
             Peer {peerindex} &nbsp;
             {  props.showreward 
              ? '(Public Key: ' + peer.wallet.key.pub.substr(0,5) + '...' + peer.wallet.key.pub.substr(-5) + '): ' + balance + ' btc' : '' }
           </div>
         : ''
        }
        <div style={{flexGrow:1}}></div>
        {  props.showpublish
         ? <Button variant='contained' color='primary' onClick={() => props.publishNode({ peerindex })} style={{ marginRight: '5px' }}>
             Publish
           </Button>
         : ''
        }
      </div>
      <div className='peernode-chain'>
        {_.map(peer.blocks, (block,blockindex) => 
          <HashBlock 
            peerindex={peerindex}
            blockindex={blockindex} 
            key={`shb${peerindex}${blockindex}`}
          />
        )}

        <Button variant='fab' color='primary' aria-label='Add Block'
          style={{ flexShrink: 0 }}
          onClick={() => props.addBlock({peerindex})}
        >
          <AddIcon/>
        </Button>
      </div>
    </div>
  );
});
