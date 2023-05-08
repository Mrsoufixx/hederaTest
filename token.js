console.clear();
require("dotenv").config();
const {
  Client,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenInfoQuery,
  AccountBalanceQuery,
  PrivateKey,
  TokenMintTransaction,
  AccountCreateTransaction,
  Hbar,
  TokenBurnTransaction,
} = require("@hashgraph/sdk");
require("dotenv").config();
const adminId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const adminKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);


// Build Hedera testnet and mirror node client
const client = Client.forTestnet();

// Set the operator account ID and operator private key
client.setOperator(adminId, adminKey);

async function addAccount(){

      //Create the transaction
      const transaction = new AccountCreateTransaction()
          .setKey(PrivateKey.publicKey)
          .setInitialBalance(new Hbar(1000));
      
      //Sign the transaction with the client operator private key and submit to a Hedera network
      const txResponse = await transaction.execute(client);
      
      //Request the receipt of the transaction
      const receipt = await txResponse.getReceipt(client);
      
      //Get the account ID
      const newAccountId = receipt.accountId;
      
      console.log("The new account ID is " +newAccountId);
}
addAccount()

async function createNFT() {
  console.log("CreateNFT---------------------");
  let tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName("MyNFT")
    .setTokenSymbol("MNFT")
    .setTokenType(TokenType.NonFungibleUnique)
    .setInitialSupply(0)
    .setTreasuryAccountId(myAccountId)
    .setSupplyType(TokenSupplyType.Infinite)
    .setSupplyKey(myPrivateKey)
    .setFreezeKey(myPrivateKey)
    .setPauseKey(myPrivateKey)
    .setAdminKey(myPrivateKey)
    .setWipeKey(myPrivateKey)
    //.setKycKey(myPrivateKey)
    .freezeWith(client);

  let tokenCreateSign = await tokenCreateTx.sign(myPrivateKey);
  let tokenCreateSubmit = await tokenCreateSign.execute(client);
  let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
  let tokenId = tokenCreateRx.tokenId;
  console.log(`- Created token with ID: ${tokenId}`);
  console.log("-----------------------------------");
  return tokenId;
}

async function queryTokenInfo(tokenId) {
  console.log("QueryTokenInfo---------------------");
  const query = new TokenInfoQuery().setTokenId(tokenId);
  const tokenInfo = await query.execute(client);
  console.log(JSON.stringify(tokenInfo, null, 4));
  console.log("-----------------------------------");
}

async function queryAccountBalance(accountId) {
  console.log("QueryAccountBalance----------------");
  const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
  const accountBalance = await balanceQuery.execute(client);
  console.log(JSON.stringify(accountBalance, null, 4));
  console.log("-----------------------------------");
}

async function mintNFT(tokenId) {
  console.log("MintNFT--------------------------");

  // Mint new NFT
  let mintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .setMetadata([
      Buffer.from("ipfs://QmTzWcVfk88JRqjTpVwHzBeULRTNzHY7mnBSG42CpwHmPa"),
      Buffer.from("secondToken"),
    ])
    .execute(client);
  let mintRx = await mintTx.getReceipt(client);
  //Log the serial number
  console.log(`- Created NFT ${tokenId} with serial: ${mintRx.serials} \n`);

  console.log("-----------------------------------");
}

async function main() {
  const tokenId = await createNFT();
  await queryTokenInfo(tokenId);
  await queryAccountBalance(myAccountId);
  await mintNFT(tokenId);
  await queryAccountBalance(myAccountId);
}
main();
