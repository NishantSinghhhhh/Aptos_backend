import express, { Application } from 'express';
import dotenv from 'dotenv';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey, AccountAddress } from "@aptos-labs/ts-sdk";

dotenv.config();

const app: Application = express();
app.use(express.json());

console.log('🚀 Initializing PullQuest Aptos Backend...');

console.log('🔧 Configuring Aptos SDK...');
const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);
console.log('✅ Aptos SDK configured for DEVNET');

console.log('🔐 Loading service account...');
const privateKeyString = process.env.APTOS_SERVICE_ACCOUNT_PRIVATE_KEY!;
const privateKey = new Ed25519PrivateKey(privateKeyString);
const serviceAccount = Account.fromPrivateKey({ privateKey });
console.log(`✅ Service account loaded: ${serviceAccount.accountAddress.toString()}`);

console.log('📦 Loading module address...');
const moduleAddress = process.env.APTOS_MODULE_ADDRESS!;
console.log(`✅ Module address: ${moduleAddress}`);

app.get("/", (req, res) => {
  console.log('📝 GET / - Serving API information');
  res.json({
    message: "🚀 PullQuest Aptos Backend API",
    description: "Decentralized Pull Request Management System",
    status: "✅ Server is running smoothly",
    network: "Aptos Devnet",
    version: "v1.0.0",
    endpoints: {
      stake: "POST /stake - Stake tokens on a PR",
      merge: "POST /merge - Process PR merge with rewards",
      deduct: "POST /deduct - Deduct tokens for violations",
      refund: "POST /refund - Refund staked tokens",
      profile: "GET /profile/:developerAddress - Get developer stake info"
    },
    serviceAccount: serviceAccount.accountAddress.toString(),
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get("/health", (req, res) => {
  console.log('🏥 GET /health - Health check requested');
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    network: "Aptos Devnet",
    serviceAccount: serviceAccount.accountAddress.toString()
  });
  console.log('✅ Health check completed successfully');
});

app.post("/stake", async (req, res) => {
  const { prId, developerAddress, amount } = req.body;

  console.log('🎯 POST /stake - Staking request received');
  console.log(`   📊 PR ID: ${prId}`);
  console.log(`   👤 Developer: ${developerAddress}`);
  console.log(`   💰 Amount: ${amount} tokens`);

  try {
    console.log('🔨 Building stake transaction...');

    // The transaction payload for the simple API
    const transaction = await aptos.transaction.build.simple({
      sender: serviceAccount.accountAddress,
      data: {
        function: `${moduleAddress}::pull_quest_token::stake_pr`,
        // The arguments for the function.
        // The order has been corrected to match what the deployed contract expects,
        // based on the error message "Type mismatch for argument 0, expected 'U64'".
        // We now send the U64 `prId` first.
        functionArguments: [
          BigInt(prId),
          AccountAddress.from(developerAddress),
          BigInt(amount),
        ],
      },
    });

    console.log('✅ Transaction built successfully');

    console.log('📝 Signing and submitting transaction...');
    // Sign and submit the transaction to the blockchain.
    const response = await aptos.signAndSubmitTransaction({
      signer: serviceAccount,
      transaction,
    });

    console.log(`🎉 Stake transaction successful! Hash: ${response.hash}`);

    res.json({ success: true, transactionHash: response.hash });
  } catch (error: any) {
    // Log any errors that occur during the process.
    console.error('❌ Stake transaction failed:', error.message);
    console.error('📍 Error details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/merge", async (req, res) => {
  const { prId, developerAddress } = req.body;
  const bonus = 10; // Fixed bonus for merged PR
  
  console.log('🔀 POST /merge - Merge request received');
  console.log(`   📊 PR ID: ${prId}`);
  console.log(`   👤 Developer: ${developerAddress}`);
  console.log(`   🎁 Bonus: ${bonus} tokens`);
  
  try {
    console.log('🔨 Building merge transaction...');
    // Fixed argument order: prId (U64) first, then developerAddress, then bonus
    const transaction = await aptos.transaction.build.simple({
      sender: serviceAccount.accountAddress,
      data: {
        function: `${moduleAddress}::pull_quest_token::merge_pr`,
        functionArguments: [BigInt(prId), AccountAddress.from(developerAddress), BigInt(bonus)],
      },
    });
    console.log('✅ Transaction built successfully');
    
    console.log('📝 Signing and submitting transaction...');
    const response = await aptos.signAndSubmitTransaction({
      signer: serviceAccount,
      transaction,
    });
    console.log(`🎉 Merge transaction successful! Hash: ${response.hash}`);
    
    res.json({ success: true, transactionHash: response.hash });
  } catch (error: any) {
    console.error('❌ Merge transaction failed:', error.message);
    console.error('📍 Error details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/deduct", async (req, res) => {
  const { prId, developerAddress, deductionAmount } = req.body;
  
  console.log('⚡ POST /deduct - Deduction request received');
  console.log(`   📊 PR ID: ${prId}`);
  console.log(`   👤 Developer: ${developerAddress}`);
  console.log(`   💸 Deduction: ${deductionAmount} tokens`);
  
  try {
    console.log('🔨 Building deduction transaction...');
    // Fixed argument order: prId (U64) first, then developerAddress, then deductionAmount
    const transaction = await aptos.transaction.build.simple({
      sender: serviceAccount.accountAddress,
      data: {
        function: `${moduleAddress}::pull_quest_token::deduct_pr`,
        functionArguments: [BigInt(prId), AccountAddress.from(developerAddress), BigInt(deductionAmount)],
      },
    });
    console.log('✅ Transaction built successfully');
    
    console.log('📝 Signing and submitting transaction...');
    const response = await aptos.signAndSubmitTransaction({
      signer: serviceAccount,
      transaction,
    });
    console.log(`🎉 Deduction transaction successful! Hash: ${response.hash}`);
    
    res.json({ success: true, transactionHash: response.hash });
  } catch (error: any) {
    console.error('❌ Deduction transaction failed:', error.message);
    console.error('📍 Error details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/refund", async (req, res) => {
  const { prId, developerAddress } = req.body;
  
  console.log('💫 POST /refund - Refund request received');
  console.log(`   📊 PR ID: ${prId}`);
  console.log(`   👤 Developer: ${developerAddress}`);
  
  try {
    console.log('🔨 Building refund transaction...');
    // Fixed argument order: prId (U64) first, then developerAddress
    const transaction = await aptos.transaction.build.simple({
      sender: serviceAccount.accountAddress,
      data: {
        function: `${moduleAddress}::pull_quest_token::refund_pr`,
        functionArguments: [BigInt(prId), AccountAddress.from(developerAddress)],
      },
    });
    console.log('✅ Transaction built successfully');
    
    console.log('📝 Signing and submitting transaction...');
    const response = await aptos.signAndSubmitTransaction({
      signer: serviceAccount,
      transaction,
    });
    console.log(`🎉 Refund transaction successful! Hash: ${response.hash}`);
    
    res.json({ success: true, transactionHash: response.hash });
  } catch (error: any) {
    console.error('❌ Refund transaction failed:', error.message);
    console.error('📍 Error details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/profile/:developerAddress", async (req, res) => {
  const { developerAddress } = req.params;
  
  console.log('👤 GET /profile - Profile request received');
  console.log(`   🔍 Developer: ${developerAddress}`);
  
  try {
    console.log('🔍 Fetching stake information...');
    const payload = {
      function: `${moduleAddress}::pull_quest_token::get_stake_info` as `${string}::${string}::${string}`,
      functionArguments: [developerAddress],
    };
    const response = await aptos.view({ payload });
    console.log('📊 Stake info retrieved:', response);

    const [isStaked, prId, amount] = response;

    if (isStaked && prId != null && amount != null) {
      console.log('✅ Developer has active stake');
      res.json({
        success: true,
        data: {
          isStaked: true,
          prId: prId.toString(),
          amount: amount.toString(),
        },
      });
    } else {
      console.log('ℹ️ Developer has no active stake');
      res.json({
        success: true,
        data: {
          isStaked: false,
          prId: null,
          amount: null,
        },
      });
    }
  } catch (error: any) {
    console.error('❌ Profile fetch failed:', error.message);
    console.error('📍 Error details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const port = process.env.PORT || 4000;

console.log(`🌟 Starting server on port ${port}...`);
app.listen(port, () => {
  console.log(`🚀 PullQuest Aptos Backend is live!`);
  console.log(`📡 Server URL: http://localhost:${port}`);
  console.log(`🌐 Network: Aptos DEVNET`);
  console.log(`🔐 Service Account: ${serviceAccount.accountAddress.toString()}`);
  console.log(`📦 Module Address: ${moduleAddress}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log('✨ Ready to process PullQuest transactions!');
});