# Vault

A Solana Anchor program with a React frontend. Each wallet gets a single PDA-controlled vault: deposit SOL, withdraw it back, close the vault to reclaim rent. The vault can optionally enforce a per-vault cap (`max_amount`).

## Architecture

```mermaid
flowchart LR
    User([User])
    subgraph Browser
        UI[React UI<br/>frontend/]
        Wallet[Wallet Adapter<br/>Phantom / etc.]
    end
    RPC[(Solana RPC<br/>localnet / surfpool)]
    subgraph Chain
        Program[vault program<br/>B49Bt2...r9EA]
        StatePDA[(VaultState PDA)]
        VaultPDA[(Vault PDA<br/>holds lamports)]
    end

    User --> UI
    UI -->|sign tx| Wallet
    UI -->|sendTransaction| RPC
    Wallet -->|signed tx| RPC
    RPC --> Program
    Program -->|read / write| StatePDA
    Program -->|transfer SOL| VaultPDA
```

## Program

Instructions:

| Instruction  | Args                      | Effect                                                     |
| ------------ | ------------------------- | ---------------------------------------------------------- |
| `initialize` | `max_amount: Option<u64>` | Creates the vault state PDA and the vault PDA for `user`.  |
| `deposit`    | `amount: u64`             | Transfers `amount` lamports from `user` to the vault.      |
| `withdraw`   | `amount: u64`             | Transfers `amount` lamports from the vault back to `user`. |
| `close`      | —                         | Drains the vault into `user` and closes the state PDA.     |

PDAs:

- `vault_state` = `["state", user]`
- `vault` = `["vault", vault_state]`

```mermaid
flowchart LR
    UserPk[user pubkey]
    UserPk -- seeds: state, user --> StatePDA[vault_state PDA<br/>stores bumps + max_amount]
    StatePDA -- seeds: vault, state --> VaultPDA[vault PDA<br/>system-owned, holds SOL]
```

### Vault lifecycle

```mermaid
stateDiagram-v2
    [*] --> NotInitialized
    NotInitialized --> Initialized: initialize(max_amount)
    Initialized --> Initialized: deposit(amount)
    Initialized --> Initialized: withdraw(amount)
    Initialized --> [*]: close()
```

## Running tests

Tests use Vitest and require a running validator with the program deployed.

```sh
# Typescript tests
anchor test

# LiteSVM tests
anchor testsvm
```

### Deposit flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React UI
    participant W as Wallet
    participant RPC as RPC
    participant P as vault program
    participant V as Vault PDA

    User->>UI: enter amount, click Deposit
    UI->>UI: solToLamports(amount)
    UI->>P: methods.deposit(amount).accounts({ user }).rpc()
    Note over UI,P: Anchor auto-resolves vault_state,<br/>vault, and system_program from IDL
    UI->>W: request signature
    W-->>UI: signed tx
    UI->>RPC: sendTransaction
    RPC->>P: invoke deposit
    P->>V: system_program::transfer(user → vault, amount)
    P-->>RPC: success
    RPC-->>UI: signature
    UI->>UI: refresh() — refetch balances & state
```

## Running the frontend

1. Start a local validator (pick one):

    ```sh
    solana-test-validator
    # or
    surfpool
    ```

2. Deploy the program:

    ```sh
    anchor deploy
    ```

3. Set the RPC endpoint and run the dev server:

    ```sh
    echo 'VITE_RPC_URL=http://127.0.0.1:8899' > .env.local
    yarn dev
    ```

4. Open the printed URL, connect a wallet (Phantom etc. set to "Localnet"), and you should see your balance and the vault controls.

### Build / lint / format

```sh
yarn build
yarn typecheck
yarn lint
yarn format
yarn format:check
```
