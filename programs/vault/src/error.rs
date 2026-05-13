use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The vault does not have enough lamports to fulfill this withdrawal.")]
    InsufficientFunds,

    #[msg("The requested amount exceeds the maximum transaction or vault limit.")]
    AmountTooMuch,
}
