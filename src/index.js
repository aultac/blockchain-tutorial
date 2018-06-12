import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import { Controller } from 'cerebral';
import { Container } from '@cerebral/react';
import devtools from 'cerebral/devtools';

import App from './App';
import AppModule from './module';

const controller = Controller(AppModule, {
  devtools: process.env.NODE_ENV === 'production' ? null : devtools({host: 'localhost:8000', reconnect: true }),
});


// Render the root node:
ReactDOM.render(
  <Container controller={controller}>
    <App />
  </Container>, document.getElementById('root')
);

registerServiceWorker();

