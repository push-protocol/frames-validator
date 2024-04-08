import {ethers} from "ethers";
import proto3 from "protobufjs";
import * as openpgp from "openpgp";
import {PushAPI, CONSTANTS} from "@pushprotocol/restapi";
import {IFrameData, IChatMessage, IVerifiedResult} from "./types";

export default async function verifyFrameMessage(
  trustedFrameData: IFrameData
): Promise<IVerifiedResult> {
  const {messageBytes, pgpSignature} = trustedFrameData;

  const protoDefinition: string = `
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

  const root = proto3.parse(protoDefinition);
  const ChatMessage = root.root.lookupType("ChatMessage");
  const binaryData: Uint8Array = Buffer.from(messageBytes, "hex");
  const decodedMessage: any = ChatMessage.decode(binaryData);

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
  } = decodedMessage as IChatMessage;

  try {
    const signer = ethers.Wallet.createRandom();

    const userAlice = await PushAPI.initialize(signer, {
      env: env === "staging" ? CONSTANTS.ENV.STAGING : CONSTANTS.ENV.PROD,
    });

    const pushUser = await userAlice.info({
      overrideAccount: address,
    });

    const message = await openpgp.createMessage({
      text: messageBytes,
    });
    const signature = await openpgp.readSignature({
      armoredSignature: pgpSignature,
    });
    const publicKey = await openpgp.readKey({armoredKey: pushUser.publicKey});
    const verificationResult = await openpgp.verify({
      message,
      signature,
      verificationKeys: publicKey,
    });
    if (!verificationResult.signatures[0]) {
      return {isValid: false, trustedData: "Invalid Signature"};
    }
    const {verified} = verificationResult.signatures[0];
    await verified;

    return {
      isValid: true,
      trustedData: {
        url,
        unixTimestamp: Number(unixTimestamp),
        buttonIndex,
        inputText: inputText === "undefined" ? undefined : inputText,
        state: state === "undefined" ? undefined : state,
        transactionId:
          transactionId === "undefined" ? undefined : transactionId,
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
