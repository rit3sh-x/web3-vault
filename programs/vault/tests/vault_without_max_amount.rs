mod utils;
use {
    anchor_lang::{
        prelude::*, solana_program::instruction::Instruction,
        system_program::ID as SYSTEM_PROGRAM_ID, InstructionData, ToAccountMetas,
    },
    solana_message::Message,
    solana_pubkey::Pubkey,
    solana_signer::Signer,
    solana_transaction::Transaction,
    utils::{send_instruction, setup},
    vault::{STATE_SEED, VAULT_SEED},
};

#[test]
fn test_vault_end_to_end_flow() {
    let (mut svm, user_authority) = setup();

    let user = user_authority.pubkey();

    let user_starting_balance = svm.get_balance(&user).unwrap();
    
    let (state_pda, state_bump) =
    Pubkey::find_program_address(&[STATE_SEED, user.as_ref()], &vault::id());
    
    let (vault_pda, vault_bump) =
    Pubkey::find_program_address(&[VAULT_SEED, state_pda.as_ref()], &vault::id());
    
    let initialize_ix = Instruction {
        program_id: vault::id(),
        accounts: vault::accounts::Initialize {
            user,
            vault_state: state_pda,
            vault: vault_pda,
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: vault::instruction::Initialize { max_amount: None }.data(),
    };
    
    send_instruction(&mut svm, &user_authority, initialize_ix);
    
    let vault_state_account = svm.get_account(&state_pda).unwrap();

    let vault_state =
    vault::state::VaultState::try_deserialize(&mut vault_state_account.data.as_ref()).unwrap();
    println!("Heyhueyyuyue ❤️❤️❤️❤️❤️❤️");
    
    assert_eq!(vault_state.vault_bump, vault_bump);
    assert_eq!(vault_state.state_bump, state_bump);
    
    let user_balance_after_initialize = svm.get_balance(&user).unwrap();

    assert!(user_balance_after_initialize < user_starting_balance);

    assert!(svm.get_account(&vault_pda).is_none());

    let deposit_amount: u64 = 1_000_000_000;

    let deposit_ix = Instruction {
        program_id: vault::id(),
        accounts: vault::accounts::Deposit {
            user,
            vault_state: state_pda,
            vault: vault_pda,
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: vault::instruction::Deposit {
            amount: deposit_amount,
        }
        .data(),
    };

    send_instruction(&mut svm, &user_authority, deposit_ix);

    let vault_balance = svm.get_balance(&vault_pda).unwrap();

    assert_eq!(vault_balance, deposit_amount);

    assert!(svm.get_balance(&user).unwrap() < user_balance_after_initialize - deposit_amount);


    let withdraw_amount: u64 = 600_000_000;

    let withdraw_ix = Instruction {
        program_id: vault::id(),
        accounts: vault::accounts::Withdraw {
            user,
            vault_state: state_pda,
            vault: vault_pda,
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: vault::instruction::Withdraw {
            amount: withdraw_amount,
        }
        .data(),
    };

    send_instruction(&mut svm, &user_authority, withdraw_ix);

    let vault_balance_after_withdraw = svm.get_balance(&vault_pda).unwrap();

    let user_balance_after_withdraw = svm.get_balance(&user).unwrap();

    assert_eq!(
        vault_balance_after_withdraw,
        deposit_amount - withdraw_amount
    );

    assert!(
        user_balance_after_withdraw
            < user_balance_after_initialize - deposit_amount + withdraw_amount
    );

    let close_ix = Instruction {
        program_id: vault::id(),
        accounts: vault::accounts::Close {
            user,
            vault_state: state_pda,
            vault: vault_pda,
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: vault::instruction::Close {}.data(),
    };

    let vault_state_balance_before_close = svm.get_balance(&state_pda).unwrap();

    let vault_balance_before_close = svm.get_balance(&vault_pda).unwrap();

    send_instruction(&mut svm, &user_authority, close_ix);

    assert!(matches!(svm.get_balance(&vault_pda), None | Some(0)));

    assert!(svm.get_account(&state_pda).is_none());

    assert!(
        svm.get_balance(&user).unwrap()
            < user_balance_after_withdraw
                + vault_state_balance_before_close
                + vault_balance_before_close
    );
}

#[test]
fn test_withdraw_fails_when_vault_is_empty() {
    let (mut svm, user_authority) = setup();

    let user = user_authority.pubkey();

    let (state_pda, _) = Pubkey::find_program_address(&[STATE_SEED, user.as_ref()], &vault::id());

    let (vault_pda, _) =
        Pubkey::find_program_address(&[VAULT_SEED, state_pda.as_ref()], &vault::id());

    let initialize_ix = Instruction {
        program_id: vault::id(),
        accounts: vault::accounts::Initialize {
            user,
            vault_state: state_pda,
            vault: vault_pda,
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: vault::instruction::Initialize { max_amount: None }.data(),
    };

    send_instruction(&mut svm, &user_authority, initialize_ix);

    let failing_withdraw_ix = Instruction {
        program_id: vault::id(),
        accounts: vault::accounts::Withdraw {
            user,
            vault_state: state_pda,
            vault: vault_pda,
            system_program: SYSTEM_PROGRAM_ID,
        }
        .to_account_metas(None),
        data: vault::instruction::Withdraw { amount: 1 }.data(),
    };

    let message = Message::new(&[failing_withdraw_ix], Some(&user_authority.pubkey()));

    let recent_blockhash = svm.latest_blockhash();

    let transaction = Transaction::new(&[&user_authority], message, recent_blockhash);

    assert!(svm.send_transaction(transaction).is_err());
}
