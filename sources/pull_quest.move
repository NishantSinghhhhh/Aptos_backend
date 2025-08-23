module pull_quest::pull_quest_token {
    use std::signer;
    use aptos_framework::coin::{Self, Coin, MintCapability, BurnCapability};
    use aptos_std::table::{Self, Table};
    use std::string;

    // --- STRUCTS ---

    struct PullQuestToken has key {}

    struct PullQuestCaps has key {
        mint_cap: MintCapability<PullQuestToken>,
        burn_cap: BurnCapability<PullQuestToken>,
    }

    struct PullRequestStake has store {
        pr_id: u64,
        staked_amount: Coin<PullQuestToken>,
        developer: address,
    }

    struct StakeLedger has key {
        stakes: Table<address, PullRequestStake>,
    }

    // --- ERRORS ---
    const ESTAKE_ALREADY_EXISTS: u64 = 1;
    const ESTAKE_NOT_FOUND: u64 = 2;
    const EAMOUNT_TOO_HIGH: u64 = 3;

    // --- ENTRY FUNCTIONS ---

    entry fun init_module(account: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<PullQuestToken>(
            account,
            string::utf8(b"Pull Quest Token"),
            string::utf8(b"PQT"),
            8,
            false,
        );
        move_to(account, PullQuestCaps { mint_cap, burn_cap });
        coin::destroy_freeze_cap(freeze_cap);

        move_to(account, StakeLedger { stakes: table::new() });
    }

    entry fun stake_pr(creator: &signer, developer_addr: address, pr_id: u64, amount: u64) acquires PullQuestCaps, StakeLedger {
        let service_address = signer::address_of(creator);
        let mint_cap = &borrow_global<PullQuestCaps>(service_address).mint_cap;
        let ledger = borrow_global_mut<StakeLedger>(service_address);

        assert!(!table::contains(&ledger.stakes, developer_addr), ESTAKE_ALREADY_EXISTS);

        let staked_coin = coin::mint(amount, mint_cap);
        let new_stake = PullRequestStake { pr_id, staked_amount: staked_coin, developer: developer_addr };

        table::add(&mut ledger.stakes, developer_addr, new_stake);
    }

    entry fun merge_pr(maintainer: &signer, developer: address, bonus: u64) acquires PullQuestCaps, StakeLedger {
        let service_address = signer::address_of(maintainer);
        let caps = borrow_global<PullQuestCaps>(service_address);
        let ledger = borrow_global_mut<StakeLedger>(service_address);

        assert!(table::contains(&ledger.stakes, developer), ESTAKE_NOT_FOUND);
        let stake = table::remove(&mut ledger.stakes, developer);
        let PullRequestStake { staked_amount, .. } = stake;

        let total_reward = coin::value(&staked_amount) + bonus;
        coin::burn(staked_amount, &caps.burn_cap);
        let reward_coin = coin::mint(total_reward, &caps.mint_cap);

        coin::deposit(developer, reward_coin);
    }

    entry fun deduct_pr(maintainer: &signer, developer: address, deduction_amount: u64) acquires PullQuestCaps, StakeLedger {
        let service_address = signer::address_of(maintainer);
        let caps = borrow_global<PullQuestCaps>(service_address);
        let ledger = borrow_global_mut<StakeLedger>(service_address);

        assert!(table::contains(&ledger.stakes, developer), ESTAKE_NOT_FOUND);
        let stake = table::remove(&mut ledger.stakes, developer);
        let PullRequestStake { staked_amount, .. } = stake;

        let staked_value = coin::value(&staked_amount);
        assert!(staked_value >= deduction_amount, EAMOUNT_TOO_HIGH);
        let remaining_amount = staked_value - deduction_amount;
        coin::burn(staked_amount, &caps.burn_cap);

        if (remaining_amount > 0) {
            let remaining_coin = coin::mint(remaining_amount, &caps.mint_cap);
            coin::deposit(developer, remaining_coin);
        }
    }

    entry fun refund_pr(maintainer: &signer, developer: address) acquires StakeLedger {
        let service_address = signer::address_of(maintainer);
        let ledger = borrow_global_mut<StakeLedger>(service_address);

        assert!(table::contains(&ledger.stakes, developer), ESTAKE_NOT_FOUND);
        let stake = table::remove(&mut ledger.stakes, developer);
        let PullRequestStake { staked_amount, .. } = stake;

        coin::deposit(developer, staked_amount);
    }

    // --- VIEW FUNCTION ---

    // Read-only function to check a developer's stake
    // ## This #[view] attribute is the final fix ##
    #[view]
    public fun get_stake_info(ledger_owner: address, developer: address): (bool, u64, u64) acquires StakeLedger {
        if (!exists<StakeLedger>(ledger_owner)) {
            return (false, 0, 0);
        };
        let ledger = borrow_global<StakeLedger>(ledger_owner);
        if (table::contains(&ledger.stakes, developer)) {
            let stake = table::borrow(&ledger.stakes, developer);
            let amount = coin::value(&stake.staked_amount);
            (true, stake.pr_id, amount)
        } else {
            (false, 0, 0)
        }
    }
}