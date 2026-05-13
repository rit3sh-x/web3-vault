use {
    anchor_lang::{prelude::*, solana_program::instruction::Instruction},
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::Message,
    solana_signer::Signer,
    solana_transaction::Transaction,
};

const INITIAL_USER_LAMPORTS: u64 = 2_000_000_000;

pub fn setup() -> (LiteSVM, Keypair) {
    let user_authority = Keypair::new();

    let bytes = include_bytes!("../../../target/deploy/vault.so");

    let mut svm = LiteSVM::new();

    svm.add_program(vault::id(), bytes).unwrap();

    svm.airdrop(&user_authority.pubkey(), INITIAL_USER_LAMPORTS)
        .unwrap();

    (svm, user_authority)
}

pub fn send_instruction(svm: &mut LiteSVM, user_authority: &Keypair, instruction: Instruction) {
    let message = Message::new(&[instruction], Some(&user_authority.pubkey()));

    let recent_blockhash = svm.latest_blockhash();

    let transaction = Transaction::new(&[user_authority], message, recent_blockhash);

    svm.send_transaction(transaction).unwrap();
}
