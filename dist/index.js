"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const ts_sdk_1 = require("@aptos-labs/ts-sdk");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
console.log('🚀 Initializing PullQuest Aptos Backend...');
// Load Aptos configuration and service account
console.log('🔧 Configuring Aptos SDK...');
const config = new ts_sdk_1.AptosConfig({ network: ts_sdk_1.Network.DEVNET });
const aptos = new ts_sdk_1.Aptos(config);
console.log('✅ Aptos SDK configured for DEVNET');
console.log('🔐 Loading service account...');
const privateKeyString = process.env.APTOS_SERVICE_ACCOUNT_PRIVATE_KEY;
const privateKey = new ts_sdk_1.Ed25519PrivateKey(privateKeyString);
const serviceAccount = ts_sdk_1.Account.fromPrivateKey({ privateKey });
console.log(`✅ Service account loaded: ${serviceAccount.accountAddress.toString()}`);
console.log('📦 Loading module address...');
const moduleAddress = process.env.APTOS_MODULE_ADDRESS;
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
            refund: "POST /refund - Refund staked tokens"
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
// Routes
app.post("/stake", async (req, res) => {
    const { prId, developerAddress, amount } = req.body;
    console.log('🎯 POST /stake - Staking request received');
    console.log(`   📊 PR ID: ${prId}`);
    console.log(`   👤 Developer: ${developerAddress}`);
    console.log(`   💰 Amount: ${amount} tokens`);
    try {
        console.log('🔨 Building stake transaction...');
        const transaction = await aptos.transaction.build.simple({
            sender: serviceAccount.accountAddress,
            data: {
                function: `${moduleAddress}::pull_quest_token::stake_pr`,
                functionArguments: [ts_sdk_1.AccountAddress.from(developerAddress), BigInt(prId), BigInt(amount)],
            },
        });
        console.log('✅ Transaction built successfully');
        console.log('📝 Signing and submitting transaction...');
        const response = await aptos.signAndSubmitTransaction({
            signer: serviceAccount,
            transaction,
        });
        console.log(`🎉 Stake transaction successful! Hash: ${response.hash}`);
        res.json({ success: true, transactionHash: response.hash });
    }
    catch (error) {
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
        const transaction = await aptos.transaction.build.simple({
            sender: serviceAccount.accountAddress,
            data: {
                function: `${moduleAddress}::pull_quest_token::merge_pr`,
                functionArguments: [BigInt(prId), ts_sdk_1.AccountAddress.from(developerAddress), BigInt(bonus)],
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
    }
    catch (error) {
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
        const transaction = await aptos.transaction.build.simple({
            sender: serviceAccount.accountAddress,
            data: {
                function: `${moduleAddress}::pull_quest_token::deduct_pr`,
                functionArguments: [BigInt(prId), ts_sdk_1.AccountAddress.from(developerAddress), BigInt(deductionAmount)],
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
    }
    catch (error) {
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
        const transaction = await aptos.transaction.build.simple({
            sender: serviceAccount.accountAddress,
            data: {
                function: `${moduleAddress}::pull_quest_token::refund_pr`,
                functionArguments: [BigInt(prId), ts_sdk_1.AccountAddress.from(developerAddress)],
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
    }
    catch (error) {
        console.error('❌ Refund transaction failed:', error.message);
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
//# sourceMappingURL=index.js.map