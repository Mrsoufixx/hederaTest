console.clear();
require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  TopicCreateTransaction,
  TopicMessageQuery,
  TopicMessageSubmitTransaction,
  TopicDeleteTransaction,
  TopicInfoQuery,
  TopicUpdateTransaction
} = require("@hashgraph/sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Grab the OPERATOR_ID and OPERATOR_KEY from the .env file
const adminId = AccountId.fromString(process.env.MY_ACCOUNT_ID);
const adminKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const submitId= AccountId.fromString(process.env.SECOND_ACCOUNT_ID)
const submitKey = PrivateKey.fromString(process.env.SECOND_PRIVATE_KEY);

// Build Hedera testnet and mirror node client
const client = Client.forTestnet();

// Set the operator account ID and operator private key
client.setOperator(adminId, adminKey);


async function main() {
  //Create a new topic
  let txResponse = await new TopicCreateTransaction()
    .setAdminKey(adminKey)
    .setSubmitKey(submitKey)
    .setTopicMemo("this is memo")
    .execute(client);

    

  
  //Grab the newly generated topic ID
  let receipt = await txResponse.getReceipt(client);
  let topicId = receipt.topicId;
  console.log(`Your topic ID is: ${topicId}`);
  //affiche memo topic
  console.log(`Topic Memo txId: ${txResponse.transactionId.toString()} memo: ${await new TopicInfoQuery().setTopicId(topicId).execute(client).then(info => info.topicMemo)}`);

  // Wait 5 seconds between consensus topic creation and subscription creation
  await new Promise((resolve) => setTimeout(resolve, 5000));

  //Create the query
  new TopicMessageQuery()
    .setTopicId(topicId)
    .subscribe(client, null, (message) => {
      let messageAsString = Buffer.from(message.contents, "utf8").toString();
      console.log(
        `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
      );
    });

    let updateTxResponse = await new TopicUpdateTransaction()
    .setTopicId(topicId)
    .setTopicMemo("this is the new memo")
    .execute(client);
    console.log(`update Topic Memo txId: ${updateTxResponse.transactionId.toString()}  new memo: ${await new TopicInfoQuery().setTopicId(topicId).execute(client).then(info => info.topicMemo)}`);

  while (true) {
    // Send one message
    let sendResponse = await new TopicMessageSubmitTransaction({
      topicId: topicId,
      message: "Hello, World!, " + new Date(),
    }).freezeWith(client);
    const signature=await sendResponse.sign(submitKey);
    const execute= await signature.execute(client)
    const getReceipt = await execute.getReceipt(client);
    
    console.log(
      "The message transaction status: " + getReceipt.status.toString()
    );

    //wait 2 second and submit a new message
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
main();



