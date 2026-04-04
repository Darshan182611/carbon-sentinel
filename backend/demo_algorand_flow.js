import algosdk from 'algosdk';
import { createAccount, mintCarbonCreditAsset, retireCarbonCredit } from './algorand.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// We connect to the Algorand Testnet
const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

async function runFullBlockchainFlow() {
  console.log("=== CARBON SENTINEL: FULL BLOCKCHAIN TEST FLOW ===\n");

  // STEP 1: CREATE THE ACCOUNTS
  console.log("[1] Setting up the Blockchain Wallets...");
  const treasuryAccount = createAccount(); // The Platform providing the credits
  const buyerAccount = createAccount();    // The Corporate Buyer
  
  console.log("\n-> Treasury Wallet (The Platform):", treasuryAccount.account.addr);
  console.log("-> Buyer Wallet (The Corporation):", buyerAccount.account.addr);

  console.log("\n⚠️ CRITICAL STEP REQUIRED ⚠️");
  console.log("Brand new wallets have 0 ALGO. Blockchains require ALGO to pay network transaction fees.");
  console.log("Please go to: https://bank.testnet.algorand.network/");
  console.log(`Paste the Treasury Wallet address and dispense ALGO: ${treasuryAccount.account.addr}`);
  console.log(`(If you already funded a wallet in the previous attempt, I have upgraded the code to automatically skip the second one!)`);
  
  await askQuestion("\nPress ENTER once you have funded the Treasury wallet online (or if you already did it)...");

  console.log("\n[1.5] Auto-funding Buyer Wallet from Treasury...");
  // Because the Dispenser imposes limits, we will programmatically transfer 0.2 ALGO from Treasury to Buyer!
  try {
      const params = await algodClient.getTransactionParams().do();
      const fundTxn = algosdk.makePaymentTxnWithSuggestedParams(
          treasuryAccount.account.addr,
          buyerAccount.account.addr,
          300000, // 0.3 ALGO (Need minimum 0.1 for account, 0.1 for ASA Opt-in, plus gas fees)
          undefined,
          undefined,
          params
      );
      const signedFund = fundTxn.signTxn(treasuryAccount.account.sk);
      const { txId: fundTxId } = await algodClient.sendRawTransaction(signedFund).do();
      await algosdk.waitForConfirmation(algodClient, fundTxId, 4);
      console.log("✅ Successfully transferred 0.3 ALGO to Buyer for Minimum Balance and gas fees. Setup Complete!");
  } catch (err) {
      console.log("❌ Failed to auto-fund Buyer. Did you forget to fund the Treasury wallet?", err.message);
      process.exit(1);
  }

  // STEP 2: MINT THE CARBON CREDITS
  console.log("\n[2] Minting the Carbon Credits...");
  console.log("The Platform has verified a new solar farm. Minting 1,000 ASAs (1 ASA = 1 Ton)...");
  
  let assetId;
  try {
    assetId = await mintCarbonCreditAsset(treasuryAccount.account, "Project Helios", "CO2T", 1000);
    console.log(`✅ Successfully Minted Asset ID: ${assetId}`);
  } catch (err) {
    console.log("❌ Minting failed. Did you forget to fund the Treasury Wallet?", err.message);
    process.exit(1);
  }

  // STEP 3: OPT-IN (Unique to Algorand)
  console.log("\n[3] The Buyer Opts-In to receive the Asset...");
  // In Algorand, a wallet cannot be "spam sent" an asset. The buyer must explicitly sign a transaction
  // saying "I agree to hold Asset ID X" before the Treasury can send it.
  try {
    const params = await algodClient.getTransactionParams().do();
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      buyerAccount.account.addr, buyerAccount.account.addr, undefined, undefined,
      0, undefined, assetId, params
    );
    const signedOptIn = optInTxn.signTxn(buyerAccount.account.sk);
    const { txId: optInTxId } = await algodClient.sendRawTransaction(signedOptIn).do();
    await algosdk.waitForConfirmation(algodClient, optInTxId, 4);
    console.log(`✅ Buyer successfully opted-in to Asset ${assetId}`);
  } catch (err) {
    console.log("❌ Opt-In failed. Did you fund the Buyer wallet?", err.message);
    process.exit(1);
  }

  // STEP 4: TRANSFER THE CREDITS (The Purchase)
  console.log("\n[4] Transferring 250 Carbon Credits from Treasury -> Buyer...");
  try {
    const params = await algodClient.getTransactionParams().do();
    const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      treasuryAccount.account.addr, buyerAccount.account.addr, undefined, undefined,
      250, undefined, assetId, params
    );
    const signedTransfer = transferTxn.signTxn(treasuryAccount.account.sk);
    const { txId: transferTxId } = await algodClient.sendRawTransaction(signedTransfer).do();
    await algosdk.waitForConfirmation(algodClient, transferTxId, 4);
    console.log(`✅ Successfully purchased and transferred! TxHash: ${transferTxId}`);
  } catch (err) {
    console.error("❌ Transfer failed.", err);
  }

  //STEP 5: RETIRE THE CREDITS (The Burn)
  console.log("\n[5] Retiring 250 Credits to the Blockchain Vault...");
  console.log("Because Algorand prevents sending assets to random dead addresses (Anti-Spam), we officially 'Retire' them by sending them back to the Platform Treasury with a permanent 'BURN' memo attached.");
  
  try {
    const params = await algodClient.getTransactionParams().do();
    
    // We attach an immutable text note to the blockchain transaction to prove it was retired
    const encoder = new TextEncoder();
    const note = encoder.encode("PERMANENT RETIREMENT / BURN OF 250 CARBON CREDITS");
    
    const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      buyerAccount.account.addr, treasuryAccount.account.addr, undefined, undefined,
      250, note, assetId, params
    );
    const signedBurn = burnTxn.signTxn(buyerAccount.account.sk);
    const { txId: burnTxId } = await algodClient.sendRawTransaction(signedBurn).do();
    await algosdk.waitForConfirmation(algodClient, burnTxId, 4);
    
    console.log(`🔥 SUCCESS! The credits have been permanently destroyed (retired). Proof Hash: ${burnTxId}`);
  } catch (err) {
    console.error("❌ Burn failed.", err);
  }

  console.log("\n=== TEST FLOW COMPLETE ===");
  process.exit(0);
}

runFullBlockchainFlow();
