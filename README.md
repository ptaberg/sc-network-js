## Usage
```sh
npm install --save @ostis/sc-network-js
```

Use in TypeScript:
```TypeScript
import { SctpClient, ScType, ScAddr } from '@ostis/sc-network';

...

function onConnect() {
  console.log('Connect to sctp server');
}

function onDisconnect() {
  console.log('Disconnect from sctp server');
}

function onError() {
  console.log('Error in Sctp connection');
}

const client = new SctpClient('http://localhost/ws', 500,
                              onConnect,
                              onDisconnect,
                              onError);

...

```


## Changelog

### v0.1.4
- Improve SetLinkContent function for a numbers

### v0.1.3
- Fix construction iterator
- Fix return values of ScAddr

### v0.1.2
- Some interfaces export fixed

### v0.1.1
- Implement common functionality for websockets support