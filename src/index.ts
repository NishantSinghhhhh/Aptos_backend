import express, { Application } from 'express';
import dotenv from 'dotenv';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey, AccountAddress } from "@aptos-labs/ts-sdk";

dotenv.config();

const app: Application = express();
app.use(express.json());

// Load Aptos configuration and service account
const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

const privateKeyString = process.env.APTOS_SERVICE_ACCOUNT_PRIVATE_KEY!;
const privateKey = new Ed25519PrivateKey(privateKeyString);
const serviceAccount = Account.fromPrivateKey({ privateKey });

const moduleAddress = process.env.APTOS_MODULE_ADDRESS!;

app.get("/", (req, res) => {
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
      refund: "POST /refund - Refund staked tokens"
    },
    serviceAccount: serviceAccount.accountAddress.toString(),
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    network: "Aptos Devnet",
    serviceAccount: serviceAccount.accountAddress.toString()
  });
});

// Routes
app.post("/stake", async (req, res) => {
  const { prId, developerAddress, amount } = req.body;
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: serviceAccount.accountAddress,
      data: {
        function: `${moduleAddress}::pull_quest_token::stake_pr`,
        functionArguments: [AccountAddress.from(developerAddress), BigInt(prId), BigInt(amount)],
      },
    });
    const response = await aptos.signAndSubmitTransaction({
      signer: serviceAccount,
      transaction,
    });
    res.json({ success: true, transactionHash: response.hash });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/merge", async (req, res) => {
  const { prId, developerAddress } = req.body;
  try {
    const bonus = 10; // Assuming a fixed bonus of 10 for a merged PR
    const transaction = await aptos.transaction.build.simple({
      sender: serviceAccount.accountAddress,
      data: {
        function: `${moduleAddress}::pull_quest_token::merge_pr`,
        functionArguments: [BigInt(prId), AccountAddress.from(developerAddress), BigInt(bonus)],
      },
    });
    const response = await aptos.signAndSubmitTransaction({
      signer: serviceAccount,
      transaction,
    });
    res.json({ success: true, transactionHash: response.hash });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/deduct", async (req, res) => {
  const { prId, developerAddress, deductionAmount } = req.body;
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: serviceAccount.accountAddress,
      data: {
        function: `${moduleAddress}::pull_quest_token::deduct_pr`,
        functionArguments: [BigInt(prId), AccountAddress.from(developerAddress), BigInt(deductionAmount)],
      },
    });
    const response = await aptos.signAndSubmitTransaction({
      signer: serviceAccount,
      transaction,
    });
    res.json({ success: true, transactionHash: response.hash });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/refund", async (req, res) => {
  const { prId, developerAddress } = req.body;
  try {
    const transaction = await aptos.transaction.build.simple({
      sender: serviceAccount.accountAddress,
      data: {
        function: `${moduleAddress}::pull_quest_token::refund_pr`,
        functionArguments: [BigInt(prId), AccountAddress.from(developerAddress)],
      },
    });
    const response = await aptos.signAndSubmitTransaction({
      signer: serviceAccount,
      transaction,
    });
    res.json({ success: true, transactionHash: response.hash });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 Aptos service listening on port ${port}`));