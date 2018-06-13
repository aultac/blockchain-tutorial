import React from 'react';
import moment from 'moment';

import { connect } from '@cerebral/react';
import { state } from 'cerebral/tags';

import './Newspaper.css'


export default connect({
  newspaper: state`newspaper`,

}, function Newspaper(props) {
  return (
    <div className='newspaper'>
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
