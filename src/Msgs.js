import React from 'react';
import _ from 'lodash';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

import './Msgs.css'

export default connect({
  msgs: state`msgs`,
}, function Msgs(props) {
  const m1 = _.reverse(_.map(props.msgs, (m,i) => { m.i = i; return m; }));
  const msgs = [
    _.slice(m1,  0, 5),
    _.slice(m1,  5,10),
    _.slice(m1, 10,15),
    _.slice(m1, 15,20),
  ];

  return (
    <div className='msgs'>
      {_.map(msgs, section => 
        <div className='msgs-container'>
          {_.map(section, m => 
            <div className={ m.type === 'good' ? 'msgs-good' : 'msgs-bad'}>
              {m.i}: {m.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
