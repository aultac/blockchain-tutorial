import uuid from 'uuid';

const shortUUID = () => uuid.v4().replace(/-/g,'').substr(0,5);
const mediumUUID = () => uuid.v4().replace(/-/g,'').substr(0,20);

const sites = [
  'produce.com',
  'peaches.com',
  'fruit.com',
  'treefruit.com',
  'berries.com',
];

const products = [
  'peaches',
  'grapes',
  'strawberries',
  'blueberries',
  'lettuce'
];

const countries = [
  'Mexico',
  'USA',
  'Colombia',
  'Spain'
];

const randomItem = arr => arr[Math.floor(Math.random() * arr.length)];

const randomLabel = () => {
  return 'GTIN: ' + Math.floor(Math.random() * 100000000)                 + '\n'
        +'CountryOfOrigin: '+randomItem(countries)                        + '\n'
        +'Product: '+ randomItem(products)                                + '\n'
        +'trellis://'+ randomItem(sites)+'/resources/'+shortUUID()        + '\n'
        +'trellis-hash: '+mediumUUID();
}
export default randomLabel;
