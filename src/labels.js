import uuid from 'uuid';

const shortUUID = () => uuid.v4().replace('-').substr(0,6);

const sites = [
  'produce.com',
  'peachesRus.com',
  'freshfruit.com',
  'treefruit.com',
  'berriesAndMore.com',
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
        +'trellis://'+ randomItem(sites)+'/resources/'+shortUUID();
}
export default randomLabel;
