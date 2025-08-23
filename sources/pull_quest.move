module pull_quest::pull_quest_token {
    use std::signer;
    use aptos_framework::coin::{Self, Coin, MintCapability, BurnCapability};
    use std::string;

    // The custom token for staking
    struct PullQuestToken has key {}

    // A struct to hold the capabilities, which must be stored on an account
    struct PullQuestCaps has key {
        mint_cap: MintCapability<PullQuestToken>,
        burn_cap: BurnCapability<PullQuestToken>,
    }

    // A resource to hold the staked tokens for a specific pull request
    struct PullRequestStake has key {
        pr_id: u64,
        staked_amount: Coin<PullQuestToken>,
        developer: address,
    }

    // Initialize the module and the custom token
    entry fun init_module(account: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<PullQuestToken>(
            account,
            string::utf8(b"Pull Quest Token"),
            string::utf8(b"PQT"),
            8, // Decimals
            false, // Don't allow freezing
        );

        // Store the capabilities on the account that deploys the module
        move_to(account, PullQuestCaps { mint_cap, burn_cap });
        // Destroy the freeze capability, not needed
        coin::destroy_freeze_cap(freeze_cap);
    }

    // Stake tokens for a pull request
    entry fun stake_pr(creator: &signer, pr_id: u64, amount: u64) acquires PullQuestCaps {
        if (!coin::is_account_registered<PullQuestToken>(signer::address_of(creator))) {
            coin::register<PullQuestToken>(creator);
        };

        let service_address = @pull_quest;
        let mint_cap = &borrow_global<PullQuestCaps>(service_address).mint_cap;

        // Mint tokens to the creator's account
        let staked_coin = coin::mint(amount, mint_cap);
        coin::deposit(signer::address_of(creator), staked_coin);

        // Withdraw and move into escrow
        let staked_coin_from_creator = coin::withdraw<PullQuestToken>(creator, amount);

        move_to(creator,
            PullRequestStake {
                pr_id,
                staked_amount: staked_coin_from_creator,
                developer: signer::address_of(creator),
            }
        );
    }

    // Reward the developer and release the stake if a PR is merged
    entry fun merge_pr(_maintainer: &signer, _pr_id: u64, developer: address, bonus: u64) acquires PullRequestStake, PullQuestCaps {
        let PullRequestStake { staked_amount: staked_coin, pr_id: _, developer: _ } = move_from<PullRequestStake>(developer);

        let staked_amount = coin::value(&staked_coin);

        let total_reward = staked_amount + bonus;
        let mint_cap = &borrow_global<PullQuestCaps>(@pull_quest).mint_cap;
        let reward_coin = coin::mint(total_reward, mint_cap);
        coin::deposit(developer, reward_coin);

        let burn_cap = &borrow_global<PullQuestCaps>(@pull_quest).burn_cap;
        coin::burn(staked_coin, burn_cap);
    }

    // Deduct a portion of the stake if a PR is rejected
    entry fun deduct_pr(_maintainer: &signer, _pr_id: u64, developer: address, deduction_amount: u64) acquires PullRequestStake, PullQuestCaps {
        let PullRequestStake { staked_amount: staked_coin, pr_id: _, developer: _ } = move_from<PullRequestStake>(developer);

        let staked_amount = coin::value(&staked_coin);
        let remaining_amount = staked_amount - deduction_amount;

        let mint_cap = &borrow_global<PullQuestCaps>(@pull_quest).mint_cap;
        let remaining_coin = coin::mint(remaining_amount, mint_cap);
        coin::deposit(developer, remaining_coin);

        let burn_cap = &borrow_global<PullQuestCaps>(@pull_quest).burn_cap;
        coin::burn(staked_coin, burn_cap);
    }

    // Refund the entire stake if the PR is not reviewed on time
    entry fun refund_pr(_maintainer: &signer, _pr_id: u64, developer: address) acquires PullRequestStake {
        let PullRequestStake { staked_amount: staked_coin, pr_id: _, developer: _ } = move_from<PullRequestStake>(developer);

        coin::deposit(developer, staked_coin);
    }
}
