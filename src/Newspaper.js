import React from 'react';
import moment from 'moment';

import { connect } from '@cerebral/react';
import { state } from 'cerebral/tags';

import './Newspaper.css'


export default connect({
  newspaper: state`newspaper`,
  peers: state`peers`,

}, function Newspaper(props) {

  // Check the hash on the end of peer 0: if it doesn't match published, 
  // highlight in red
  let hashValid = false;
  if (props && props.peers && props.peers[0] && props.peers[0].blocks && props.peers[0].blocks.length > 0) {
    const end = props.peers[0].blocks.length-1;
    hashValid = props.peers[0].blocks[end].hashstr === props.newspaper;
  }

  return (
    <div className={'newspaper '+ (hashValid ? 'newspaper-match' : 'newspaper-nomatch') }>
      <div className='newspaper-title'>
        Wall Street Journal
      </div>
      <div className='newspaper-date'>
        { moment().format('MMMM D, YYYY') }
      </div>
      <div className='newspaper-content'>
        {  props.newspaper.length > 0
         ? 'A hash for today is: '+props.newspaper
         : 'No news to report today!'
        }
      </div>
    </div>
  );
});
