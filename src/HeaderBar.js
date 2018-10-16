import React from 'react';

import { connect } from '@cerebral/react';
import { state,signal } from 'cerebral/tags';

// Add TextField back in if you uncomment the hash width changer
// import TextField from '@material-ui/core/TextField';

import './HeaderBar.css';

export default connect({
      showwidth: state`showwidth`,
       showwork: state`showwork`,
  shownewspaper: state`shownewspaper`,
    showpublish: state`showpublish`,
       showsign: state`showsign`,
     showreward: state`showreward`,
       showrace: state`showrace`,
      showcheat: state`showcheat`,
      hashwidth: state`hashwidth`,
        hashalg: state`hashalg`,
  updateHashWidth: signal`updateHashWidth`,
    toggleHashAlg: signal`toggleHashAlg`,
      toggleWidth: signal`toggleWidth`,
       toggleWork: signal`toggleWork`,
  toggleNewspaper: signal`toggleNewspaper`,
    togglePublish: signal`togglePublish`,
       toggleSign: signal`toggleSign`,
     toggleVerify: signal`toggleVerify`,
     toggleReward: signal`toggleReward`,
       toggleRace: signal`toggleRace`,
      toggleCheat: signal`toggleCheat`,
}, props => 
  <div className="header-bar">

    <div className="header-bar-logo-container">
      <a href="https://oatscenter.org">
        <img className="header-bar-logo" src="logo-oats-small.png" />
      </a>
    </div>
    <div># Hashing and Blockchain Tutorial</div>

    <div style={{flexGrow: '1'}}></div>

    { /*
    <div className='header-button' onClick={() => props.toggleWidth()}>
      {props.showwidth 
       ? <TextField 
           type="number"
           value={props.hashwidth} 
           onChange={evt => props.updateHashWidth({val: evt.target.value < 0 ? 0 : evt.target.value })}
           onBlur={() => props.toggleWidth()}
           autoFocus
          />
       : 'Width'
      }
    </div>
    */ }

    <div className={'header-button ' + (props.shownewspaper ? 'header-button-down' : '')} onClick={() => props.toggleNewspaper()}>
      News
    </div>

    <div className={'header-button ' + (props.showpublish ? 'header-button-down' : '')} onClick={() => props.togglePublish() }>
      Publish
    </div>

    <div className={'header-button ' + (props.showsign ? 'header-button-down' : '')} onClick={() => props.toggleSign()}>
      Sign
    </div>

    <div className={'header-button ' + (props.showwork ? 'header-button-down' : '')} onClick={() => props.toggleWork()}>
      Work
    </div>

    <div className='header-button' onClick={() => props.toggleHashAlg()}>
      {props.hashalg}
    </div>

    <div className={'header-button ' + (props.showreward ? 'header-button-down' : '')} onClick={() => props.toggleReward()}>
      Reward
    </div>

    <div className={'header-button ' + (props.showrace ? 'header-button-down' : '')} onClick={() => props.toggleRace()}>
      Race
    </div>

    <div className={'header-button ' + (props.showcheat ? 'header-button-down' : '')} onClick={() => props.toggleCheat()}>
      Cheat
    </div>

  </div>
);
