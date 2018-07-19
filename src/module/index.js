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
    showsign: false,
    showreward: false,
    showrace: false,
    raceIsOn: false,
    newspaper: '',
    privkey: '1234567',
    pubkey: '',
    savedPubkeys: [],
    msgs: [], // for messages during racing
    peers: [
      {
        initialPauseRate: 123,
        wallet: {
          balance: 0,
          key: {
            priv: '',
            pub: '',
          },
        },
        blocks: [
          {
            mainstr: 'GTIN: 1234567\nCountryOfOrigin: USA\nProduct: peaches\ntrellis: https://produce.com/resources/938475932',
            hashstr: '',
            nonce: 0,
            signature: '',
            signatureValid: false,
            hashinfo: {
              sblocks: [],  // each row is row of original chars
              nblocks: [],  // each row is numeric equivalent of original chars
              hashnum: '',  // full "bigint" of sum in base 10
              blocknum: '', // sum from just blocks, prior to nonce
            },
            bounty: '12.5',
          },
        ],
      },
    ],
  },
});

