import React from 'react';
import _ from 'lodash';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

import './SignatureInputs.css'

export default connect({
       privkey: state`privkey`,
        pubkey: state`pubkey`,
  savedPubkeys: state`savedPubkeys`,
  randomizePrivateKey: signal`randomizePrivateKey`,
    generatePublicKey: signal`generatePublicKey`,
     updatePrivateKey: signal`updatePrivateKey`,
           savePubkey: signal`savePubkey`,
}, function SignatureInputs(props) {
  return (
    <div className='signatureinputs'>
      <div className='signatureinputs-container'>
        <TextField style={{flexGrow:1, marginRight: '10px'}} value={props.privkey} 
          label='Private Key'
          onChange={evt => props.updatePrivateKey({ val: evt.target.value })} 
        />
        <Button variant='contained' color='primary' onClick={() => props.randomizePrivateKey()}>
          Randomize
        </Button>
      </div>
      <div className='signatureinputs-container'>
        <div className='signatureinputs-pubkey'>
          Computed Public Key: { props.pubkey }
        </div>
        <Button variant='contained' color='primary' onClick={() => props.savePubkey()}>
          Save
        </Button>
      </div>
      <div className='signatureinputs-container'>
        <div className='signatureinputs-savedkeyscontainer'>
          {_.map(props.savedPubkeys, (s,i) => <div className='signatureinputs-savedkey' key={`sbks${i}`}>Known Public Key #{i+1}: {s}</div>)}
        </div>
      </div>
    </div>
  );
});
