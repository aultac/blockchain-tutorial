import React from 'react';
import _ from 'lodash';
import numeral from 'numeral';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import          AddIcon from '@material-ui/icons/Add';
import           Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import           Switch from '@material-ui/core/Switch';
import        TextField from '@material-ui/core/TextField';

import HashBlock from './HashBlock'

import './Peer.css';

export default connect({
        peers: state`peers`,
  showpublish: state`showpublish`,
   showreward: state`showreward`,
     showrace: state`showrace`,
    showcheat: state`showcheat`,
               addBlock: signal`addBlock`,
            publishNode: signal`publishNode`,
       togglePeerMining: signal`togglePeerMining`,
      setPeerIsCheating: signal`setPeerIsCheating`,
  updateProcessingPower: signal`updateProcessingPower`,
}, class Peer extends React.Component {

  componentWillMount() {
    const peerindex = this.props.peerindex;
    this.chainLengthLastScrollUpdate = this.props.peers[peerindex].blocks.length || 0;
  }

  // Keep ourself scrolled to left as new blocks show up
  componentDidUpdate() {
    const peerindex = this.props.peerindex;
    const lengthNow = this.props.peers[peerindex].blocks.length;
    if (lengthNow  !== this.chainLengthLastScrollUpdate) {
      const scrollWidth = this.chainDiv.scrollWidth;
      const visibleWidth = this.chainDiv.offsetWidth;
      const diff = scrollWidth - visibleWidth;
      this.chainDiv.scrollLeft = (diff < 0 ? 0 : diff);
      this.chainLengthLastScrollUpdate = lengthNow;
    }
  }

  render() {
    const props = this.props;
    const {peerindex} = props;
    const peer = props.peers[peerindex];
    // Add up the bounty's of all the blocks we've mined
    const balance = _.reduce(peer.blocks, (sum,b) => sum + (b.winner && b.winner.peerindex === peerindex ? +(b.bounty) : 0),0);
    const lengthOfValidChain = _.findIndex(peer.blocks, b => b.hashstr.substr(0,4) !== '0000');
    const numblocks = (props.showwork || props.showrace) 
                      ? (lengthOfValidChain < 0 ? peer.blocks.length : lengthOfValidChain) // if nothing incorrect was found, entire chain is valid
                      : peer.blocks.length; // if not racing or manual work, length is just number of blocks
    const totalProcessingPower = _.reduce(props.peers, (sum,p) => sum + p.processingPower, 0);

    return (
      <div className='peernode'>
        <div className='peernode-topbar'>
          {  props.peers.length > 1 || props.showreward || props.showrace
           ? <div className='peernode-title'>
               Peer {peerindex} &nbsp;
               {  props.showreward ||  props.showrace
                ? '(Public Key: ' + peer.wallet.key.pub.substr(0,5) + '...' + peer.wallet.key.pub.substr(-5) + '): ' + balance + ' btc; ' : ': ' }
             </div>
           : ''
          }

          <div className='peernode-title'>
            Length: {numblocks} block{numblocks !== 1 ? 's' : ''}
          </div>

          <div style={{flexGrow:1}}></div>
          {  props.showpublish
           ? <Button variant='contained' color='primary' onClick={() => props.publishNode({ peerindex })} style={{ marginRight: '5px' }}>
               Publish
             </Button>
           : ''
          }

          {  props.showcheat 
           ? <FormControlLabel
               control={<Switch checked={!!peer.isCheating} onChange={evt => props.setPeerIsCheating({ peerindex, checked: evt.target.checked})} />}
               label='Cheat'
             />
           : ''
          }
          {  props.showcheat && peer.isCheating
           ? <div>
               <TextField type='number' value={peer.processingPower} 
                 label='Proc. Power'
                 onChange={evt => props.updateProcessingPower({ value: evt.target.value, peerindex})}
               />
               / {totalProcessingPower} ({numeral(peer.processingPower/totalProcessingPower).format('0%')})
             </div>
           : ''
          }
            
        </div>
        <div className='peernode-chain' ref={el => {this.chainDiv = el;}}>
          {_.map(peer.blocks, (block,blockindex) => 
            <HashBlock 
              ref={el => { if (blockindex === peer.blocks.length-1) this.lastBlockDiv = el; } }
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
  }
});
