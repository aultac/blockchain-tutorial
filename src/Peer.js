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
   addBlock: signal`addBlock`,
}, function Peer(props) {
  const {peerindex} = props;
  const peer = props.peers[peerindex];

  return (
    <div className='peernode'>
      {  peerindex > 0 
       ? <div className='peernode-title'>
           Peer {peerindex}
         </div>
       : ''
      }
      <div className='peernode-chain'>
        {_.map(peer.blocks, (block,blockindex) => 
          <HashBlock 
            peerindex={peerindex}
            blockindex={blockindex} 
            key={`shb${peerindex}${blockindex}`}
          />
        )}

        <Button variant='fab' color='primary' aria-label='Add Block'
          onClick={() => props.addBlock({peerindex})}
        >
          <AddIcon/>
        </Button>
      </div>
    </div>
  );
});
