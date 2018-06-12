import _ from 'lodash';
import BigInt from 'big-integer';

import { set, toggle } from 'cerebral/operators';
import { state,props } from 'cerebral/tags';
import { sequence } from 'cerebral';


function leadingZeros(str) {
  str = ''+str;
  while (str.length < 3) str = '0'+str;
  return str;
}

export const updateHashInfo = sequence('updateHashInfo', [
  ({state,props}) => {
    let hashwidth = +(state.get('hashwidth')); // force it to be a number
    if (hashwidth < 1) hashwidth = 1;

    // Update all peers if no peerindex in props:
    const peers = state.get('peers');
    let peerindexes = [ props.peerindex ];
    if (typeof props.peerindex === 'undefined') peerindexes = [...Array(peerindexes.length).keys()];

    _.each(peerindexes, peerindex => {
      const peer = peers[peerindex];
      // Update all indexes if no blockindex is present in props
      let blockindexes = [ props.blockindex ];
      if (typeof props.blockindex === 'undefined') blockindexes = [...Array(peer.blocks.length).keys()];

      _.each(blockindexes, blockindex => {
        const mainstr = peer.blocks[blockindex].mainstr;

        if (hashwidth < 1) hashwidth = 1;
        const numrows = Math.ceil(mainstr.length / hashwidth);

        // string blocks: [ 'gijkdf', 'i20okjd', 'ifjl' ]
        const sblocks = _.map(Array(numrows), (v,i) => mainstr.substr(i*hashwidth, hashwidth));
        // Pad the last row with spaces
        if (numrows > 0) {
          while (sblocks[sblocks.length-1].length % hashwidth) sblocks[sblocks.length-1] += ' ';
        }
  
        // numeric blocks: [ ['034','789','222'], ['938', '888', '008'] ]
        const nblocks = _.map(sblocks, r => _.map(r, c => leadingZeros(c.charCodeAt(0))));

        const blocksum = _.reduce(
          _.map(nblocks, r => BigInt(r.join(''))),
          (acc,b) => acc.add(b)
        , BigInt(0));
        const hashnum = blocksum.toString(10).substr(-hashwidth*3); // 3 display chars per hash char
        const hashstr = BigInt(hashnum).toString(35);
        state.set(`peers.${peerindex}.blocks.${blockindex}.hashinfo`, { sblocks,nblocks,hashnum,hashstr });
      });
    });
  },
]);

export const updateMainString = sequence('updateMainString', [
  ({state,props}) => state.set(`peers.${props.peerindex}.blocks.${props.blockindex}.mainstr`, props.val),
  updateHashInfo,
]);
export const  updateHashWidth = sequence('updateHashWidth' , [
  set(state`hashwidth`, props`val`),
  updateHashInfo,
]);
export const toggleWidth = sequence('toggleWidth', [ toggle(state`showwidth`) ]);
export const toggleHashAlg = sequence('toggleHashAlg', [ 
  ({state}) => state.set(`hashalg`, state.get('hashalg') === 'SHA-256' ? 'SumHash' : 'SHA-256'),
  updateHashInfo,
]);
export const addBlock = sequence('addBlock', [
  ({state,props}) => {
    // just copy the last block:
    const blocks = state.get(`peers.${props.peerindex}.blocks`);
    state.push(`peers.${props.peerindex}.blocks`, _.cloneDeep(state.get(`peers.${props.peerindex}.blocks.${blocks.length-1}`)));
  },
]);
