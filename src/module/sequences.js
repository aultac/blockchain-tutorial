import _ from 'lodash';
import BigInt from 'big-integer';
import SHA256 from 'crypto-js/sha256';
import Elliptic from 'elliptic';
import Buffer from 'buffer';

import { set, toggle } from 'cerebral/operators';
import { state,props } from 'cerebral/tags';
import { sequence } from 'cerebral';

const ec = new Elliptic.ec('secp256k1');

//-----------------------------------------------------------------
// Hashing and Mining
//-----------------------------------------------------------------

function leadingZeros(str) {
  str = ''+str;
  while (str.length < 3) str = '0'+str;
  return str;
}

function hashBlock({hashwidth,hashalg,prev,block}) {
  let mainstr = _.clone(block.mainstr);
  mainstr += prev.toString();
  mainstr += block.signature;

  if (hashalg === 'SHA-256') {
    mainstr += block.nonce.toString();
//console.log('Hash for mainstr = ', mainstr, ' = ', SHA256(mainstr).toString());
    return {
      hashinfo: {},
      hashstr: SHA256(mainstr).toString(),
    };
  }

  // Otherwise, do the sum hash: must treat nonce differently to have a prayer of mining
  if (hashwidth < 1) hashwidth = 1;
  const numrows = Math.ceil(mainstr.length / hashwidth);

  // string blocks: [ 'gijkdf', 'i20okjd', 'ifjl' ]
  const sblocks = _.map(Array(numrows), (v,i) => mainstr.substr(i*hashwidth, hashwidth));
  // Pad the last row with spaces
  if (numrows > 0) {
    while (sblocks[sblocks.length-1].length % hashwidth) sblocks[sblocks.length-1] += ' ';
  }

  // numeric blocks: [ ['034789222'], ['938888008'] ] (with zero padding for every 3 chars)
  const nblocks = _.map(sblocks, r => _.map(r, c => leadingZeros(c.charCodeAt(0))).join(''));

  // add all the rows:
  let blocksum = _.reduce(_.map(nblocks, r => BigInt(r)),
    (acc,b) => acc.add(b), 
    BigInt(0)
  );
  // lop off left-most bits
  blocksum = BigInt(blocksum.toString(10).substr(-hashwidth*3));
  // Add the nonce
  let noncesum = blocksum.add(BigInt(block.nonce));
//console.log('Adding nonce '+block.nonce);
//console.log(' to blocksum  '+blocksum.toString(10));
//console.log('    and got   '+noncesum.toString(10));
  // lop off left-most bits again
  noncesum = BigInt(noncesum.toString(10).substr(-hashwidth*3));

  const blocknum = blocksum.toString(10); // sum before adding the nonce
  const hashnum = noncesum.toString(10);  // final hash sum with nonce
  const hashinfo = {hashnum,sblocks,nblocks,blocknum};
  let hashstr = BigInt(hashnum).toString(35);
  while(hashstr.length < (hashwidth*2+1)) {
    hashstr = '0'+hashstr;  // zero-pad for fixed-length
  }
  return { hashstr, hashinfo };
}


export const updateHashInfo = sequence('updateHashInfo', [
  ({state,props}) => {
    const hashalg = state.get('hashalg');
    let hashwidth = +(state.get('hashwidth')); // force it to be a number
    if (hashwidth < 1) hashwidth = 1;

    // clone them so we can save the hashstrings as we compute from parent to child
    const peers = _.cloneDeep(state.get('peers'));
    _.each(peers, (peer,peerindex) => {
      // If peerindex is in props, only update that peer's blocks
      if (typeof props.peerindex !== 'undefined' && props.peerindex !== peerindex) return;
//console.log('--------------------------------------------------------');
//console.log('Updating peer '+peerindex);
      // always update all blocks on peer
      _.each(peer.blocks, (block,blockindex) => {
        const prev = blockindex < 1 ? '' : peer.blocks[blockindex-1].hashstr;
//console.log('Hashing block '+blockindex+': nonce = '+block.nonce+', prev = '+prev+', before_hashstr = ',block.hashstr);
        const {hashinfo,hashstr} = hashBlock({block,hashalg,hashwidth,prev});
//console.log('Done hashing block '+blockindex+': nonce = '+block.nonce+', hashstr = ', hashstr);

        block.hashstr = hashstr; // update our local copy outside of state for next loop iteration's 'prev' request
        state.set(`peers.${peerindex}.blocks.${blockindex}.hashinfo`, hashinfo);
        state.set(`peers.${peerindex}.blocks.${blockindex}.hashstr`, hashstr);
      });
    });
  },
]);

export const mineBlock = sequence('mineBlock', [
  ({state,props}) => {
    const {peerindex,blockindex} = props;
    const peer = state.get(`peers.${peerindex}`);
    const block = _.cloneDeep(peer.blocks[blockindex]);
    const hashalg = state.get('hashalg');
    let hashwidth = +(state.get('hashwidth')); // force it to be a number
    if (hashwidth < 1) hashwidth = 1;
    if (hashalg !== 'SHA-256') {
      // initialize the nonce to the right thing (negative number with first 4 values)
      const hashnum = block.hashinfo.hashnum;
      block.nonce = BigInt('-'+hashnum).subtract(1).toString(10);
    } else {
      block.nonce = '0';
    }
//console.log('++++++++++++++++++++++++++++++++++++++++++++++++++++');
//console.log('Mining block '+blockindex+', starting nonce = ', block.nonce);

    let hashstr = block.hashstr;
    const prev = blockindex < 1 ? '' : peer.blocks[blockindex-1].hashstr;
    while (hashstr.substr(0,4) !== '0000') {
      block.nonce = BigInt(block.nonce).add(1).toString(10);
      let result = hashBlock({
        hashwidth,
        hashalg,
        block,
        prev, 
      });
      hashstr = result.hashstr;
    }
//console.log('Done mining block '+blockindex+', setting nonce = '+block.nonce+', hashstr = ',hashstr);
    state.set(`peers.${peerindex}.blocks.${blockindex}.nonce`  , block.nonce);
    state.set(`peers.${peerindex}.blocks.${blockindex}.hashstr`, hashstr);
//console.log('After mining, calling updateHashInfo');
  },
  updateHashInfo,
]);


//-----------------------------------------------------------
// Signatures
//-----------------------------------------------------------

export const generatePublicKey = sequence('generatePublicKey', [
  ({props,state}) => state.set(`pubkey`, ec.keyFromPrivate(state.get(`privkey`)).getPublic('hex')),
]);

export const randomizePrivateKey = sequence('randomizePrivateKey', [
  ({state}) => state.set(`privkey`, ec.genKeyPair().getPrivate('hex')),
  generatePublicKey,
]);

// Look through all known keys to see if the signature and message
// match and verify with any of them.
function verifyBlockSignature({knownPubkeys,block}) {
  // You have to hash the mainstr to something of manageable length or the ec library won't work
  if (!block.signature || block.signature.length < 1) return false;
  const msg = SHA256(block.mainstr).toString();
  if (!knownPubkeys || knownPubkeys.length < 1) return false;
  return !!(_.find(knownPubkeys, p => p.verify(msg, block.signature))); // find one that returns true
}
function mapSavedKeys(savedPubkeys) {
  return _.map(savedPubkeys, k => ec.keyFromPublic(k, 'hex'));
}

export const verifySignature = sequence('verifySignature', [
  ({state,props}) => {
    const {peerindex,blockindex} = props;
    const knownPubkeys = mapSavedKeys(state.get(`savedPubkeys`));
    const block = state.get(`peers.${peerindex}.blocks.${blockindex}`);
    const verified = verifyBlockSignature({block,knownPubkeys});
    state.set(`peers.${peerindex}.blocks.${blockindex}.signatureValid`, verified);
  }
]);
export const verifyAllSignatures = sequence('verifyAllSignatures', [
  ({state,props}) => {
    const peers = _.cloneDeep(state.get(`peers`));
    const knownPubkeys = mapSavedKeys(state.get(`savedPubkeys`));
    _.each(peers, (peer,peerindex) => {
      _.each(peer.blocks, (block,blockindex) => {
        const verified = verifyBlockSignature({block,knownPubkeys});
        state.set(`peers.${peerindex}.blocks.${blockindex}.signatureValid`, verified);
      });
    });
  }
]);

export const signBlock = sequence('signBlock', [
  ({state,props}) => {
    const {peerindex,blockindex} = props;
    const block = state.get(`peers.${peerindex}.blocks.${blockindex}`);
    const key = ec.keyFromPrivate(state.get(`privkey`));
    const msg = SHA256(block.mainstr).toString();
    const signature = key.sign(msg).toDER('hex');
    state.set(`peers.${peerindex}.blocks.${blockindex}.signature`, signature);
  },
  updateHashInfo,
  verifySignature,
]);


//-----------------------------------------------------------
// Adding peers, blocks, and publishing
//-----------------------------------------------------------

export const addBlock = sequence('addBlock', [
  ({state,props}) => {
    // just copy the last block if it exists:
    let newblock = {
      mainstr: 'GTIN: 1234567\nCountryOfOrigin: USA\nProduct: peaches',
      hashstr: '',
      nonce: 0,
      signature: '',
      signatureValid: false,
      hashinfo: {
        sblocks: [], // each row is row of original chars
        nblocks: [], // each row is numeric equivalent of original chars
        hashnum: '', // full "bigint" of sum in base 10
        blocknum: '',
      },
    };
    // If this peer already has a block, just copy the last one instead
    const blocks = state.get(`peers.${props.peerindex}.blocks`);
    if (blocks && blocks.length > 0) {
      newblock = _.cloneDeep(blocks[blocks.length-1]);
    }
    newblock.nonce = ''; // reset the nonce
    newblock.signature = '';
    newblock.signatureValid = false;
    state.push(`peers.${props.peerindex}.blocks`, newblock);
  },
  updateHashInfo,
]);

export const addPeer = sequence('addPeer', [
  ({state,props}) => {
    state.push(`peers`, { blocks: [] });
  },
  updateHashInfo,

]);

export const publishNode = sequence('publishNode', [
  ({state,props}) => {
    const peers = state.get(`peers`);
    const peer = peers[props.peerindex];
    // copy last hash to newspaper
    state.set('newspaper', peer.blocks[peer.blocks.length-1].hashstr);
    // copy blocks to all other peers
    _.each([...Array(peers.length).keys()], pi => state.set(`peers.${pi}.blocks`, _.cloneDeep(peer.blocks)));
  }
]);


//-------------------------------------------------------------
// The easy functions (toggle, update, etc.)
//-------------------------------------------------------------

export const updateMainString = sequence('updateMainString', [
  ({state,props}) => state.set(`peers.${props.peerindex}.blocks.${props.blockindex}.mainstr`, props.val),
  updateHashInfo,
  verifySignature,
]);
export const  updateHashWidth = sequence('updateHashWidth' , [
  set(state`hashwidth`, props`val`),
  updateHashInfo,
]);
export const updatePrivateKey = sequence('updatePrivateKey', [ 
  set(state`privkey`, props`val`), 
  generatePublicKey,
  verifyAllSignatures,
]);
export const savePubkey = sequence('savePubkey', [
  ({state}) => {
    const newkey = state.get(`pubkey`);
    const allkeys = state.get(`savedPubkeys`);
    if (_.find(allkeys, k => k === newkey)) return; // already have key in here
    state.push(`savedPubkeys`, state.get(`pubkey`));
  },
  verifyAllSignatures,
]);
export const toggleWidth     = sequence('toggleWidth',     [ toggle(state`showwidth`)     ]);
export const toggleWork      = sequence('toggleWork',      [ toggle(state`showwork`)      ]);
export const toggleNewspaper = sequence('toggleNewspaper', [ toggle(state`shownewspaper`) ]);
export const togglePublish   = sequence('togglePublish',   [ toggle(state`showpublish`)   ]);
export const toggleSign      = sequence('toggleSign',      [ toggle(state`showsign`)      ]);
export const toggleHashAlg   = sequence('toggleHashAlg',   [ 
  ({state}) => state.set(`hashalg`, state.get('hashalg') === 'SHA-256' ? 'SumHash' : 'SHA-256'),
  updateHashInfo,
]);

