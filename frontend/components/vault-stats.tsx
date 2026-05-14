import type { PublicKey } from "@solana/web3.js"
import { lamportsToSol, type VaultStateAccount } from "@/lib/vault"
import { Stat } from "./ui"

type Props = {
    state: VaultStateAccount | null
    userBalance: number | null
    vaultBalance: number | null
    vault: PublicKey
}

export function VaultStats({ state, userBalance, vaultBalance, vault }: Props) {
    const initialized = state !== null
    const maxAmount = initialized
        ? state?.maxAmount
            ? `${lamportsToSol(state.maxAmount)} SOL`
            : "Unlimited"
        : "—"

    return (
        <section className="grid grid-cols-2 gap-4 rounded-md border border-border p-4">
            <Stat
                label="Your balance"
                value={`${lamportsToSol(userBalance)} SOL`}
            />
            <Stat
                label="Vault balance"
                value={`${lamportsToSol(vaultBalance)} SOL`}
            />
            <Stat
                label="Status"
                value={initialized ? "Initialized" : "Not initialized"}
            />
            <Stat label="Max amount" value={maxAmount} />
            <div className="col-span-2 truncate text-xs text-muted-foreground">
                vault: <code>{vault.toBase58()}</code>
            </div>
        </section>
    )
}
