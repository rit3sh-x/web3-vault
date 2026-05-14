import { AnchorProvider, Program, BN } from "@anchor-lang/core"
import type { AnchorWallet } from "@solana/wallet-adapter-react"
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import type { Vault } from "@contracts/vault"
import idl from "@idl/vault.json"

export type VaultStateAccount = {
    vaultBump: number
    stateBump: number
    maxAmount: BN | null
}

export const VAULT_PROGRAM_ID = new PublicKey(
    (idl as { address: string }).address
)

export function buildProgram(
    connection: Connection,
    wallet: AnchorWallet
): Program<Vault> {
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    })
    return new Program(idl as Vault, provider)
}

export function deriveVaultPdas(user: PublicKey) {
    const [vaultState] = PublicKey.findProgramAddressSync(
        [Buffer.from("state"), user.toBuffer()],
        VAULT_PROGRAM_ID
    )
    const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), vaultState.toBuffer()],
        VAULT_PROGRAM_ID
    )
    return { vaultState, vault }
}

export function solToLamports(sol: string): BN {
    const value = Number(sol)
    if (!Number.isFinite(value) || value < 0) {
        throw new Error("Invalid SOL amount")
    }
    return new BN(Math.round(value * LAMPORTS_PER_SOL))
}

export function lamportsToSol(lamports: number | BN | bigint | null): string {
    if (lamports === null || lamports === undefined) return "—"
    const n =
        typeof lamports === "number"
            ? lamports
            : typeof lamports === "bigint"
              ? Number(lamports)
              : lamports.toNumber()
    return (n / LAMPORTS_PER_SOL).toFixed(4)
}
