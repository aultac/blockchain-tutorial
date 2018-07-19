import _ from 'lodash';
import BigInt from 'big-integer';
import SHA256 from 'crypto-js/sha256';
import Elliptic from 'elliptic';
import moment from 'moment';

import { set, toggle } from 'cerebral/operators';
import { state,props } from 'cerebral/tags';
import { sequence } from 'cerebral';

import randomLabel from '../labels';

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
      // always update all blocks on peer
      _.each(peer.blocks, (block,blockindex) => {
        const prev = blockindex < 1 ? '' : peer.blocks[blockindex-1].hashstr;
        const {hashinfo,hashstr} = hashBlock({block,hashalg,hashwidth,prev});

        block.hashstr = hashstr; // update our local copy outside of state for next loop iteration's 'prev' request
        state.set(`peers.${peerindex}.blocks.${blockindex}.hashinfo`, hashinfo);
        state.set(`peers.${peerindex}.blocks.${blockindex}.hashstr`, hashstr);
      });
    });
  },
]);

// Need this global "stopAllMiningWhilePublishing" to let the publisher do it's job,
// then we'll start back up
let stopAllMiningWhilePublishing = false;
const mineOneBlock = ({props,state}) => new Promise((resolve,reject) => {
  // We need to return a promise here because we want the screen to refresh as we count
  // up the nonce.  We don't have the processing power to update on every hash.
  // We want the "animation" to reflect the amount of work being done, but in the case someone
  // has a really long running hash search, we don't want to waste so much time displaying.
  // So, we recursively keep calling our function after pushing to the end of the event queue,
  // and we'll only update after a certain number of hashes have been tried.  We'll exponentially
  // increase that "step" size as we go also, so a 271k+ hash search finishes in a few seconds.
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
    if (!block.nonce) block.nonce = '0'; // keep any previously-reached nonce
  }
  let countupStepCurrent = peer.initialPauseRate;

  let hashstr = ''; // force to run at least one hash
  const prev = blockindex < 1 ? '' : peer.blocks[blockindex-1].hashstr;
  function insideMineBlock() {
    let count = 0;
    while (hashstr.substr(0,4) !== '0000') {
      if (stopAllMiningWhilePublishing) return false;
      block.nonce = BigInt(block.nonce).add(1).toString(10);
      let result = hashBlock({
        hashwidth,
        hashalg,
        block,
        prev, 
      });
      hashstr = result.hashstr;
      if (count++ > countupStepCurrent) {
        return false;
      }
    }
    return true;
  }
  function outerMineBlock() {
    const result = insideMineBlock();
    if (stopAllMiningWhilePublishing) {
//console.log('outerMineBlock: Peer '+peerindex+': resolving early because stopAllMiningWhilePublishing');
      return resolve(); // don't finish updating this block
    }
    state.set(`peers.${peerindex}.blocks.${blockindex}.nonce`  , block.nonce);
    state.set(`peers.${peerindex}.blocks.${blockindex}.hashstr`, hashstr);
    if (!result) {
      countupStepCurrent *= 1.05;
      return setTimeout(outerMineBlock,0);
    }
    // Mined the block!!  Sign with our wallet
    const key = ec.keyFromPrivate(peer.wallet.key.priv);
    const msg = SHA256(block.mainstr).toString();
    const signature = key.sign(msg).toDER('hex');
    state.set(`peers.${peerindex}.blocks.${blockindex}.winner`, {
      peerindex,
      signature,
      key: { pub: peer.wallet.key.pub },
    });
    return resolve();
  }
  return outerMineBlock();
});
export const mineBlock = sequence('mineBlock', [
  mineOneBlock,
  updateHashInfo,
]);

const peerMiner = ({props,state}) => {
  return new Promise((resolve,reject) => {
//console.log('peerMiner: ------------------------------------------------------------');
    const {peerindex} = props;
//console.log('peerMiner: starting peer ' + peerindex);
    const peer = state.get(`peers.${peerindex}`);
    // Find the first non-valid block and mine that.  If none, make one on the end
    let blockindex = _.findIndex(peer.blocks, b => b.hashstr.substr(0,4) !== '0000');
//console.log('peerMiner: peer ' + peerindex + ' first invalid blockindex = ' + blockindex);
    if (blockindex < 0) {
//console.log('peerMiner: peer ' + peerindex + ' no invalid block found, making a new block');
      // push a new block onto the end of this peer to begin mining
      blockindex = peer.blocks.length; // will add one
      state.push(`peers.${peerindex}.blocks`, makeNewBlock());
    }
    props.blockindex = blockindex;
//console.log('peerMiner: Peer '+peerindex+' calling mineOneBlock');
    return mineOneBlock({props,state}).then(() => {
      const block = state.get(`peers.${peerindex}.blocks.${blockindex}`);
//console.log('peerMiner: peer ' + peerindex + ' done with mineOneBlock, block.hashstr from state = ', block.hashstr);
      // Check if we successfully mined the block vs. got stopped for publishing:
      if (block.hashstr.substr(0,4) === '0000') {
//console.log('peerMiner: peer '+peerindex+': hash is valid, publishing to peers');
        // Publish this chain to other peers:
        props.blocks = state.get(`peers.${peerindex}.blocks`);
        props.publishWithValidityChecks = true;
        publishChainAction({props,state});
      }
      // Recursively call peerMiner to mine another block until stopped
      if (state.get(`raceIsOn`)) {
//console.log('peerMiner: peer '+peerindex+': recursively calling self because raceIsOn');
        return setTimeout(() => peerMiner({props,state}), 0);
      }
//console.log('peerMiner: peer '+peerindex+': resolving promise because raceIsOn = false');
      return resolve(); // not racing anymore
    });
  });
};
export const startRace = sequence('togglePeerMining', [
  // Make sure we're on SHA-256: race is pointless with sumhash
  ({state}) => {
    if (state.get(`hashalg`) !== 'SHA-256') {
      state.set(`hashalg`, 'SHA-256'); // force to SHA256
      resetAllNonces({state})
    }
  },
  set(state`raceIsOn`, true),
  ({state,props}) => {
    _.each(state.get(`peers`), (peer,peerindex) => {
      const peerprops = _.cloneDeep(props);
      peerprops.peerindex = peerindex;
//console.log('startRace: ***************************** STARTING PEER '+peerindex+' ***********************************************');
      peerMiner({state,props: peerprops});
    });
  },
]);
export const stopRace = sequence('stopRace', [
  set(state`raceIsOn`, false),
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
export const generatePeerKeypair = sequence('generatePeerKeypair', [
  ({state,props}) => {
    const pair = ec.genKeyPair();
    state.set(`peers.${props.peerindex}.wallet.key`, {
      priv: pair.getPrivate('hex'),
       pub: pair.getPublic('hex'),
    });
  },
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

const resetAllNonces = ({state}) => {
  _.each(state.get(`peers`), (peer,peerindex) => {
    _.each(peer.blocks, (block,blockindex) => {
      // force any leftover nonce's from sumhash to start at zero
      if (block.nonce < 0) state.set(`peers.${peerindex}.blocks.${blockindex}.nonce`, 0)
    });
  });
};
const makeNewBlock = () => ({
  mainstr: randomLabel(),
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
  bounty: '12.5',
});
export const addBlock = sequence('addBlock', [
  ({state,props}) => state.push(`peers.${props.peerindex}.blocks`, makeNewBlock()),
  updateHashInfo,
]);

const makeNewPeer = () => ({
  blocks: [], 
  wallet: { key: {} },
  initialPauseRate: 123,
});
export const addPeer = sequence('addPeer', [
  ({state,props}) => {
    state.push(`peers`, makeNewPeer());
    const peers = state.get('peers');
    return { peerindex: peers.length-1 }; // prime for generatePeerKeypair
  },
  generatePeerKeypair,
  updateHashInfo,
]);

// STOPPED HERE:
// Switched gears for a moment, want to add "reward" first to show pub key "Winner" on block,
// and running tally of total $ for each peer.
// Next we can add the race to show the money going up, as well as chain length.
// Want to be able to "tweak" relative processor time for a peer so I can make a bad guy with 51% power
//
//--------
// Need a "toggle" on each peer whether they are accepting outside publishes or not (call it "Crime"?)
// Need to stop the mining on other peers when a successful publish occurs to it:
//   - unset the "continueMining" flag in the state
//   - also add global object to this file that the miner can check each time to kill mining loop
// Then experiment with random vs. count-up, maybe add difficulty slider.
// XXX
// PROBLEM: setting stopAllMiningWhilePublishing to true, then to false when done publishing
// does not necessarily ever stop the miner because he probably won't get a chance to run.
// Current thoughts:
// - maintain ever-growing array of stopAllMiningWhilePublishing, each mining function tracks the
//   one they are interested in, then publish keeps adding to the end when setting to true instead of changing value
// - setTimeout in publishChain to allow miners the chance to run and therefore stop mining.  keep calling setTimeout
//   until confirmed that all miners are stopped.
// - one issue with current model is the block on the end that they are mining probably gets lost,
//   but next round of peerMiner will make one to fill the void.  Peer miner might do that in the middle of
//   publish, however.
// 
const lengthOfValidChain = blocks => _.find(blocks, b => b.hashstr.substr(0,4) !== '0000') || blocks.length;
const publishChainAction = ({props,state}) => {
  stopAllMiningWhilePublishing = true;
  const innerPublishChain  = function() {
    const peers = state.get(`peers`);
    if (!props.publishWithValidityChecks) {
      // just force it on everybody:
      _.each([...Array(peers.length).keys()], pi => state.set(`peers.${pi}.blocks`, _.cloneDeep(props.blocks)));
      stopAllMiningWhilePublishing = false;
      return;
    }
    // Otherwise, peers only accept if longest valid chain is longer than what they have
    const publishedChainLength = lengthOfValidChain(props.blocks); 
    // Compare with the longest valid length of each peer:
    _.each(peers, (p,i) => {
      if (i === props.peerindex) return; // don't need to publish to ourself
      const peerChainLength = lengthOfValidChain
      if (publishedChainLength <= peerChainLength) {
        state.push(`msgs`, { type: 'bad', time: moment(), text: `Peer ${i} rejects chain from peer ${props.peerindex}: valid chain is too short.` });
        return;
      } 
      // Otherwise, accept the new blocks for this peer
      state.push(`msgs`, { type: 'good', time: moment(), text: `Peer ${i} accepts chain from peer ${props.peerindex}.` });
      state.set(`peers.${i}.blocks`, _.cloneDeep(props.blocks));
    });
    stopAllMiningWhilePublishing = false;
  }
  // Need to wait until everybody got the "stop" message
  setTimeout(innerPublishChain, 0);
};
export const publishChain = sequence('publishChain', [ publishChainAction ]);
export const publishNode = sequence('publishNode', [
  ({state,props}) => {
    const peers = state.get(`peers`);
    const peer = peers[props.peerindex];
    // copy last hash to newspaper
    state.set('newspaper', peer.blocks[peer.blocks.length-1].hashstr);
    return { blocks: peer.blocks, publishWithValidityChecks: false }; // setup for publishChain to publish to peers
  },
  publishChain,
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
export const updateNonce = sequence('updateNonce', [
  ({state,props}) => state.set(`peers.${props.peerindex}.blocks.${props.blockindex}.nonce`, props.val),
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
export const toggleReward    = sequence('toggleReward',    [ toggle(state`showreward`)    ]);
export const toggleRace      = sequence('toggleRace',      [ toggle(state`showrace`)      ]);
export const toggleHashAlg   = sequence('toggleHashAlg',   [ 
  ({state}) => state.set(`hashalg`, state.get('hashalg') === 'SHA-256' ? 'SumHash' : 'SHA-256'),
  resetAllNonces,
  updateHashInfo,
]);
export const init = [
  set(state`peers.0.blocks.0.mainstr`, randomLabel()),
  updateHashInfo,
  randomizePrivateKey,
  () => ({peerindex: 0}),
  generatePeerKeypair,
];
