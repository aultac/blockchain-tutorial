import React from 'react';
import _ from 'lodash';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'

import './HashBlock.css'


function leadingSpacesTrailingSpace(str) {
  str = ''+str;
  while (str.length < 3) str = ' '+str;
  return str+' ';
}

export default connect({
       peers: state`peers`,
     hashalg: state`hashalg`,
   hashwidth: state`hashwidth`,
    showwork: state`showwork`,
    showsign: state`showsign`,
  showreward: state`showreward`,
   updateMainString: signal`updateMainString`,
        updateNonce: signal`updateNonce`,
          mineBlock: signal`mineBlock`,
          signBlock: signal`signBlock`,
}, function HashBlock(props) {
  const {peerindex,blockindex} = props;
  const hashalg = props.hashalg;
  const peer = props.peers[peerindex];
  const block = peer.blocks[blockindex];
  const {mainstr,hashstr,nonce,signature,signatureValid} = block;
  const hashinfo = block.hashinfo; // might not be there for sha
  const hashwidth = +(props.hashwidth);
  const winner = block.winner || false;
  let sblocks,nblocks,hashnum,blocknum = '';
  if (hashalg === 'SumHash') {
     sblocks = hashinfo.sblocks;
     nblocks = hashinfo.nblocks;
     hashnum = hashinfo.hashnum;
    blocknum = hashinfo.blocknum;
  }
  const hashgood = hashstr ? hashstr.substr(0,4) === '0000' : false;

  return (
    <div className={'hashblock '+(props.showwork && !hashgood ? 'hashblock-bad' : '')} 
         style={{width: (hashwidth*2.3)+'em'}}
    >

      <TextField style={{width: '100%', paddingLeft: '5px', backgroundColor: '#FFFFFF' }}
        multiline 
        value={mainstr}
        onChange={evt => props.updateMainString({ val: evt.target.value, blockindex, peerindex })}
      />

      { /* Show signature if signed */ }
      {  props.showsign
       ? <div className={'hashstr '+(signatureValid ? 'hashstr-good' : 'hashstr-bad')}>
           Signature: {signature}
         </div>
       : ''
      }

      { /* Show previous if chained together (i.e. more than 1 block) */ }
      {  blockindex < 1
       ? ''
       : <div className='hashstr'>
           Previous: {peer.blocks[blockindex-1].hashstr}
         </div>
      }

      { /* SumHash showsinternal digits and sums if enabled */ }
      {  hashalg === 'SumHash' 
       ? <div>
           <div className="hashblock-block">
             { /* Rows of characters, split up into 3-char cells */ }
             {_.map(sblocks, (s,i) => 
               <pre key={`shbs${i}`} className='hashblock-row'>
                   {'  '}{ _.map(s.replace(/\n/g,'^').replace(/ /g,'_'), leadingSpacesTrailingSpace) }
               </pre>
             )}
           </div>

           <div className="hashblock-block">
             { /* Rows of 3-digit numbers with + on front */ }
             {_.map(nblocks, (r,i) => 
               <pre key={`htp${i}`} className='hashblock-row'>
                 {i>0 ? '+ ' : '  '}{_.map(r, (c,i) => (i+1)%3 ? c : (c+' '))}
               </pre>
             )}
             { /* Row of dashes ----- prior to pre-nonce total */ }
             <pre className='hashblock-row'>
               -{_.map(Array(hashwidth), h => '----')}
             </pre>
             { /* Single row of final sum total before nonce */ }
             <pre className='hashblock-row'>
               {'  '}{_.map(blocknum, (c,i) => (i+1)%3 ? c : (c+' '))}
             </pre>
           </div>
         </div>
       : ''
      }

      { /* If work is enabled, then show the nonce  */ }
      {  !props.showwork
       ? ''
       : <div className='hashstr'>
           Guess to start hash with "0000":<br/> 
           <TextField type='number' value={nonce || 0} style={{width: '100%'}}
             onChange={evt => props.updateNonce({ val: evt.target.value, blockindex, peerindex })} 
           />
         </div>
      }

      { /* If work is enabled AND this is SumHash, show final nonce total */ }
      {  props.showwork && hashalg === 'SumHash'
       ? <div className="hashblock-block">
           <pre className='hashblock-row'>
             {'  '}{_.map(hashnum, (c,i) => (i+1)%3 ? c : (c+' '))}
           </pre>
         </div>
       : ''
      }
 
      <div className='hashstr'>
        {props.hashalg === 'SumHash' ? 'SumHash: ' : ''}{hashstr}
      </div>

      {  !props.showreward
       ? ''
       : <div className='hashstr'>
           Bounty: { block.bounty }btc
           { winner ? <div>&nbsp;&nbsp;&nbsp;Winner: Peer {winner.peerindex}</div> : '' }
           { winner ? <div>Signature: {winner.signature.substr(0,5) + '...' + winner.signature.substr(-5)}</div> : '' }
           { winner ? <div>&nbsp;&nbsp;&nbsp;PubKey:  {winner.key.pub.substr(0,5) + '...' + winner.key.pub.substr(-5)}</div> : '' }
         </div>
      }

      <div style={{display: 'flex', flexDirection: 'row', width: '100%', flexGrow: 1}}>
        {  !props.showsign
         ? ''
         : <Button color='primary' variant='contained' style={{flexGrow: 1, margin: '5px 5px 5px 5px' }}
             onClick={() => props.signBlock({peerindex, blockindex})}
           >
             Sign
           </Button>
        }
 
        {  !props.showwork
         ? ''
         : <Button color='primary' variant='contained' style={{flexGrow: 1, margin: '5px 5px 5px 5px' }}
             onClick={() => props.mineBlock({peerindex, blockindex})}
           >
             Mine
           </Button>
        }

      </div>
 
    </div>
  );
});
