const {
  AccountId,
  PrivateKey,
  Client,
  Hbar,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
  AccountBalanceQuery,
  TokenAssociateTransaction,
  AccountCreateTransaction,
} = require("@hashgraph/sdk");

require("dotenv").config();

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const treasuryKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);

// Generate a new account key pair
const newAccountPrivateKey = PrivateKey.generateED25519();
const newAccountPublicKey = newAccountPrivateKey.publicKey;

// Configure client with operator account details
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

// Generate a new key pair for supply key
const supplyPrivateKey = PrivateKey.generate();

async function createFirstNFT() {
  // Create a new account to hold the NFT
  const newAccount = await new AccountCreateTransaction()
    .setKey(newAccountPublicKey)
    .setInitialBalance(Hbar.fromTinybars(1000))
    .execute(client);

  // Get the account ID from the transaction receipt
  const accountId = (await newAccount.getReceipt(client)).accountId;

  console.log("The new account ID is:", accountId);

  // Create a new NFT token
  const nftCreateTx = await new TokenCreateTransaction()
    .setTokenName("SoufToken")
    .setTokenSymbol("STK")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(treasuryId)
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(300)
    .setSupplyKey(supplyPrivateKey)
    .freezeWith(client);

  // Sign the transaction with the treasury key
  const nftCreateTxSigned = await nftCreateTx.sign(treasuryKey);

  // Submit the transaction to Hedera network and get the receipt
  const nftCreateTxReceipt = await nftCreateTxSigned.execute(client).getReceipt(client);

  // Get the token ID from the receipt
  const tokenId = nftCreateTxReceipt.tokenId;

  console.log(`Created NFT with Token ID: ${tokenId}`);

  // Mint a new NFT
  const nftMintTx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .addNftMetadata({
      key: "title",
      value: "My First NFT",
    })
    .setSupplyKey(supplyPrivateKey)
    .freezeWith(client);

  // Sign the transaction with the treasury key
  const nftMintTxSigned = await nftMintTx.sign(treasuryKey);

  // Submit the transaction to Hedera network and get the receipt
  const mintReceipt = await nftMintTxSigned.execute(client).getReceipt(client);

  console.log(`Minted new NFT with serial: ${mintReceipt.serials[0]}`);

  // Transfer the NFT to Bob's account
  const bobPrivateKey = PrivateKey.generate();
  const bobPublicKey = bobPrivateKey.publicKey;

  const bobAccount = await new AccountCreateTransaction()
    .setKey(bobPublicKey)
    .setInitialBalance(Hbar.fromTinybars(0))
    .execute(client);
  const bobReceipt = await bobAccount.getReceipt(client);
// Get Bob's account ID from the receipt
const bobAccountId = bobReceipt.accountId;

// Associate Bob's account with the token
const tokenAssociateTx = await new TokenAssociateTransaction()
.setAccountId(bobAccountId)
.setTokenIds([tokenId])
.freezeWith(client);

// Sign the transaction with the treasury key
const tokenAssociateTxSigned = await tokenAssociateTx.sign(treasuryKey);

// Submit the transaction to Hedera network and get the receipt
await tokenAssociateTxSigned.execute(client).getReceipt(client);

console.log(Associated NFT with Token ID: ${tokenId} to account ID: ${bobAccountId});

// Transfer the NFT to Bob's account
const transferTx = await new TransferTransaction()
.addNftTransfer(tokenId, accountId, bobAccountId, mintReceipt.serials[0])
.freezeWith(client);

// Sign the transaction with the new account and treasury keys
const transferTxSigned = await transferTx.sign(newAccountPrivateKey, treasuryKey);

// Submit the transaction to Hedera network and get the receipt
await transferTxSigned.execute(client).getReceipt(client);

console.log(Transferred NFT with Token ID: ${tokenId} from account ID: ${accountId} to account ID: ${bobAccountId});

// Check the account balances
const accountBalances = await new AccountBalanceQuery()
.setAccountId(bobAccountId)
.execute(client);

console.log(Bob's account balance is: ${accountBalances.tokens.get(tokenId)});
}

createFirstNFT();
