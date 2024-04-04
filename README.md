# frames-validator

This package can be used by a frame server to validate incoming requests from a Push Chat Client and get the trustedData from it.

### Installation

```bash
npm i @pushprotocol/frames-validator
```
### Usage

```javascript
import verifyFrameMessage from "@pushprotocol/frames-validator";

const {isValid, trustedData} = await verifyFrameMessage(trustedData);   
```
### Sample Response
- Return `isValid` as `true` if the user originally made this frame interaction, otherwise return `isValid` as `false`.

```javascript
{
  isValid: true,
  trustedData: {
    url: 'frame_url',
    unixTimestamp: timestamp,
    buttonIndex: 3,
    inputText: '',
    state: '',
    transactionId: 'undefined',
    address: 'user_address',
    messageId: 'previous:v2:11bce1cdfdd3ce9c05b6aeb564be993e2176f2e823c9f16aa361aa67d8fb7883',
    chatId: 'chatid:c3ea478558ffcea3dc0d08f4d52629af1125b1577490d2c95c9f56d771c8186a',
    clientProtocol: 'push',
    env: 'staging'
  }
}
```
