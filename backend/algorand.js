import algosdk from 'algosdk';

// Connect to Algorand Testnet using public nodes (AlgoNode)
// In a production environment, you should use an API key-protected node service.
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;
const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

/**
 * Generates a new Algorand Wallet (Account)
 */
export const createAccount = () => {
  const account = algosdk.generateAccount();
  const mnemonic = algosdk.secretKeyToMnemonic(account.sk);
  console.log(`New Account Created: ${account.addr}`);
  console.log(`Mnemonic Phrase (KEEP SECRET): ${mnemonic}`);
  return { account, mnemonic };
};

/**
 * Restores an account from a mnemonic phrase
 */
export const restoreAccount = (mnemonic) => {
  return algosdk.mnemonicToSecretKey(mnemonic);
};

/**
 * Mints a new Algorand Standard Asset (ASA) representing a Carbon Credit.
 * @param {Object} creatorAccount - The wallet signing the transaction
 * @param {string} projectName - e.g., "Amazon Reserve"
 * @param {string} unitName - e.g., "CO2T" (CO2 Ton)
 * @param {number} totalIssuance - Total tons of CO2 offset
 */
export const mintCarbonCreditAsset = async (creatorAccount, projectName, unitName, totalIssuance) => {
  try {
    const params = await algodClient.getTransactionParams().do();
    
    // ASA configurations
    const defaultFrozen = false;
    const decimals = 0; // 1 whole token = 1 ton. No fractions.
    const assetName = projectName;
    const manager = creatorAccount.addr;
    const reserve = creatorAccount.addr;
    const freeze = creatorAccount.addr;
    const clawback = creatorAccount.addr;
    const url = "https://carbon-sentinel.exchange/verify"; // Where auditors can verify the real-world project

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: creatorAccount.addr,
      total: totalIssuance,
      decimals,
      assetName,
      unitName,
      assetURL: url,
      manager,
      reserve,
      freeze,
      clawback,
      defaultFrozen,
      suggestedParams: params
    });

    const signedTxn = txn.signTxn(creatorAccount.sk);
    const txId = txn.txID().toString();
    console.log(`Sending Asset Creation Transaction (TxID: ${txId})...`);

    await algodClient.sendRawTransaction(signedTxn).do();
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    console.log(`Asset Created! Asset ID: ${confirmedTxn["asset-index"]}`);
    return confirmedTxn["asset-index"];

  } catch (err) {
    console.error("Error minting asset:", err.message);
    throw err;
  }
};

/**
 * Retires a Carbon Credit by sending it to the Immutable Vault Smart Contract
 * @param {Object} senderAccount - The wallet retiring the asset
 * @param {number} assetId - The ASA ID being retired
 * @param {number} amount - Tons to retire
 * @param {number} appId - The ID of the deployed PyTeal Smart Contract
 */
export const retireCarbonCredit = async (senderAccount, assetId, amount, appId) => {
  try {
    const params = await algodClient.getTransactionParams().do();
    
    // The address of our PyTeal Smart Contract mathematically derived from its ID
    const applicationAddress = algosdk.getApplicationAddress(appId);

    // Transaction 1: Call the PyTeal Smart Contract with the "retire" argument
    const appCallTxn = algosdk.makeApplicationNoOpTxn(
      senderAccount.addr,
      params,
      appId,
      [new Uint8Array(Buffer.from("retire"))]
    );

    // Transaction 2: Transfer the ASA to the Smart Contract (Locking it permanently)
    const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      senderAccount.addr,
      applicationAddress,
      undefined,
      undefined,
      amount,
      undefined,
      assetId,
      params
    );

    // Group the transactions so they succeed or fail together (Atomic Transfer)
    algosdk.assignGroupID([appCallTxn, assetTransferTxn]);

    // Sign both transactions
    const signedAppCall = appCallTxn.signTxn(senderAccount.sk);
    const signedAssetTransfer = assetTransferTxn.signTxn(senderAccount.sk);

    console.log("Sending Atomic Transaction (Retire & Vault Lock)...");
    const { txId } = await algodClient.sendRawTransaction([signedAppCall, signedAssetTransfer]).do();
    
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log(`Carbon Credit successfully retired! TxID: ${txId}`);
    return txId;

  } catch (err) {
    console.error("Failed to retire Carbon Credit:", err.message);
    throw err;
  }
};

/**
 * Check balance of an account
 */
export const getAccountInfo = async (address) => {
    return await algodClient.accountInformation(address).do();
}
