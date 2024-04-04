const openpgp = require("openpgp");
const protobuf = require("protobufjs");
const ethers = require("ethers");
const {PushAPI, CONSTANTS} = require("@pushprotocol/restapi");

async function verifyFrameMessage(trustedFrameData) {
  const {messageBytes, pgpSignature} = trustedFrameData;
  const protoDefinition = `
            syntax = "proto3";
            
            message ChatMessage {
              string url = 1;
              string unixTimestamp = 2;
              int32 buttonIndex = 3;
              string inputText = 4;
              string state = 5;
              string transactionId = 6;
              string address = 7;
              string messageId = 8;
              string chatId = 9;
              string clientProtocol = 10;
              string env = 11;
            }
        `;

  const root = protobuf.parse(protoDefinition);
  const ChatMessage = root.root.lookupType("ChatMessage");
  const binaryData = Buffer.from(messageBytes, "hex");
  const decodedMessage = ChatMessage.decode(binaryData);
  const {
    url,
    unixTimestamp,
    buttonIndex,
    inputText,
    state,
    transactionId,
    address,
    messageId,
    chatId,
    clientProtocol,
    env,
  } = decodedMessage;

  try {
    const signer = ethers.Wallet.createRandom();

    const userAlice = await PushAPI.initialize(signer, {
      env: env === "staging" ? CONSTANTS.ENV.STAGING : CONSTANTS.ENV.PROD,
    });

    const pushUser = await userAlice.info({
      overrideAccount: address,
    });

    const message = await openpgp.createMessage({text: messageBytes});
    const signature = await openpgp.readSignature({
      armoredSignature: pgpSignature,
    });
    const publicKey = await openpgp.readKey({armoredKey: pushUser.publicKey});
    const verificationResult = await openpgp.verify({
      message,
      signature,
      verificationKeys: publicKey,
    });
    const {verified} = verificationResult.signatures[0];
    await verified;

    return {
      isValid: true,
      trustedData: {
        url,
        unixTimestamp: Number(unixTimestamp),
        buttonIndex,
        inputText,
        state,
        transactionId,
        address,
        messageId,
        chatId,
        clientProtocol,
        env,
      },
    };
  } catch (e) {
    return {isValid: false, trustedData: "Invalid Values"};
  }
}

module.exports = verifyFrameMessage;
