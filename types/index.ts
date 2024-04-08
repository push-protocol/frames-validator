export interface IFrameData {
  messageBytes: string;
  pgpSignature: string;
}

export interface IChatMessage {
  url: string;
  unixTimestamp: string | number;
  buttonIndex: number;
  inputText?: string;
  state?: string;
  transactionId?: string;
  address: string;
  messageId: string;
  chatId: string;
  clientProtocol: string;
  env: string;
}

export interface IVerifiedResult {
  isValid: boolean;
  trustedData: IChatMessage | string;
}
