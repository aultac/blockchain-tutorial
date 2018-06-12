import React from 'react';
import _ from 'lodash';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import Typography from '@material-ui/core/Typography'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import TextField from '@material-ui/core/TextField'
import Paper from '@material-ui/core/Paper'

import './SumHashBlock.css'


function leadingSpacesTrailingSpace(str) {
  str = ''+str;
  while (str.length < 3) str = ' '+str;
  return str+' ';
}

export default connect({
      peers: state`peers`,
  hashwidth: state`hashwidth`,
   updateMainString: signal`updateMainString`,
}, function SumHashBlock(props) {
  const {peerindex,blockindex} = props;
  const peer = props.peers[peerindex];
  const block = peer.blocks[blockindex];
  const hashwidth = +(props.hashwidth);
  const {mainstr,hashinfo} = block;
  const {sblocks,nblocks,hashnum,hashstr} = hashinfo;
  return (
    <div className="sumhashblock" style={{width: (hashwidth*2.3)+'em'}}>

      <TextField style={{width: '100%', paddingLeft: '5px', backgroundColor: '#FFFFFF'}}
        multiline 
        value={mainstr}
        onChange={evt => props.updateMainString({ val: evt.target.value, blockindex, peerindex })}
      />

      <div className="sumhashblock-block">
        {_.map(sblocks, (s,i) => 
          <pre key={`shbs${i}`} className='sumhashblock-row'>
              {'  '}{ _.map(s.replace(/\n/g,'^').replace(/ /g,'_'), leadingSpacesTrailingSpace) }
          </pre>
        )}
      </div>

      <div className="sumhashblock-block">
        {_.map(nblocks, (r,i) => 
          <pre key={`htp${i}`} className='sumhashblock-row'>
            {i ? '+ ' : '  '}{r.join(' ')}
          </pre>
        )}
        <pre className='sumhashblock-row'>
          -{_.map(Array(hashwidth), h => '----')}
        </pre>
        <pre className='sumhashblock-row'>
          {'  '}{_.map(hashnum, (c,i) => (i+1)%3 ? c : (c+' '))}
        </pre>
      </div>

       <Card>
        <CardContent style={{paddingBottom: '0.5em', paddingTop: '0.5em'}}>
          <Typography component="pre" style={{ fontFamily: 'courier', textAlign: 'left' }}>
            Hash: {hashstr}
          </Typography>
        </CardContent>
      </Card>

 
    </div>
  );
});
