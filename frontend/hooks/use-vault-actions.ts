import { useCallback, useState } from "react"
import type { Program } from "@anchor-lang/core"
import type { AnchorWallet } from "@solana/wallet-adapter-react"
import type { Vault } from "@contracts/vault"
import { solToLamports } from "@/lib/vault"

type Args = {
    program: Program<Vault> | null
    wallet: AnchorWallet | undefined
    onDone: () => void
}

export function useVaultActions({ program, wallet, onDone }: Args) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const wrap = useCallback(
        async (label: string, fn: () => Promise<unknown>) => {
            setLoading(true)
            setError(null)
            try {
                await fn()
                onDone()
            } catch (e) {
                setError(`${label}: ${String(e)}`)
            } finally {
                setLoading(false)
            }
        },
        [onDone]
    )

    const initialize = useCallback(
        (maxAmountSol: string) =>
            wrap("initialize", async () => {
                if (!program || !wallet) return
                const maxAmount = maxAmountSol.trim()
                    ? solToLamports(maxAmountSol)
                    : null
                await program.methods
                    .initialize(maxAmount)
                    .accounts({ user: wallet.publicKey })
                    .rpc()
            }),
        [wrap, program, wallet]
    )

    const deposit = useCallback(
        (amountSol: string) =>
            wrap("deposit", async () => {
                if (!program || !wallet) return
                await program.methods
                    .deposit(solToLamports(amountSol))
                    .accounts({ user: wallet.publicKey })
                    .rpc()
            }),
        [wrap, program, wallet]
    )

    const withdraw = useCallback(
        (amountSol: string) =>
            wrap("withdraw", async () => {
                if (!program || !wallet) return
                await program.methods
                    .withdraw(solToLamports(amountSol))
                    .accounts({ user: wallet.publicKey })
                    .rpc()
            }),
        [wrap, program, wallet]
    )

    const close = useCallback(
        () =>
            wrap("close", async () => {
                if (!program || !wallet) return
                await program.methods
                    .close()
                    .accounts({ user: wallet.publicKey })
                    .rpc()
            }),
        [wrap, program, wallet]
    )

    return { initialize, deposit, withdraw, close, loading, error }
}
