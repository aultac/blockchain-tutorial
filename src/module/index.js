import { Module } from 'cerebral';

import * as signals from './sequences';

export default Module({
  signals,
  state: { 
    hashalg: 'SumHash', // SumHash or SHA-256
    hashwidth: '10',
    showwidth: false,
    showwork: false,
    shownewspaper: false,
    showpublish: false,
    peers: [
      {
        blocks: [
          {
            mainstr: 'GTIN: 1234567\nCountryOfOrigin: USA\nProduct: peaches',
            hashstr: '',
            nonce: 0,
            hashinfo: {
              sblocks: [],  // each row is row of original chars
              nblocks: [],  // each row is numeric equivalent of original chars
              hashnum: '',  // full "bigint" of sum in base 10
              blocknum: '', // sum from just blocks, prior to nonce
            },
          },
        ],
      },
    ],
  },
});

