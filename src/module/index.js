import { Module } from 'cerebral';

import * as signals from './sequences';

export default Module({
  signals,
  state: { 
    hashalg: 'SumHash', // SumHash or SHA-256
    hashwidth: '10',
    showwidth: false,
    peers: [
      {
        blocks: [
          {
            mainstr: 'GTIN: 1234567\nCountryOfOrigin: USA\nProduct: peaches',
            hashinfo: {
              sblocks: [], // each row is row of original chars
              nblocks: [], // each row is numeric equivalent of original chars
              hashnum: '', // full "bigint" of sum in base 10
              hashstr: '', // final hash converted to base 35 for brevity
            },
          },
        ],
      },
    ],
  },
});

