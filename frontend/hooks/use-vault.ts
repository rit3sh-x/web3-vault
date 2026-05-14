import { useCallback, useEffect, useMemo, useState } from "react"
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react"
import {
    buildProgram,
    deriveVaultPdas,
    type VaultStateAccount,
} from "@/lib/vault"

export function useVault() {
    const { connection } = useConnection()
    const wallet = useAnchorWallet()

    const program = useMemo(
        () => (wallet ? buildProgram(connection, wallet) : null),
        [connection, wallet]
    )

    const pdas = useMemo(
        () => (wallet ? deriveVaultPdas(wallet.publicKey) : null),
        [wallet]
    )

    const [state, setState] = useState<VaultStateAccount | null>(null)
    const [vaultBalance, setVaultBalance] = useState<number | null>(null)
    const [userBalance, setUserBalance] = useState<number | null>(null)
    const [tick, setTick] = useState(0)

    const refresh = useCallback(() => setTick((t) => t + 1), [])

    useEffect(() => {
        if (!program || !wallet || !pdas) {
            setState(null)
            setVaultBalance(null)
            setUserBalance(null)
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                const [user, vault, acct] = await Promise.all([
                    connection.getBalance(wallet.publicKey),
                    connection.getBalance(pdas.vault),
                    program.account.vaultState.fetchNullable(pdas.vaultState),
                ])
                if (cancelled) return
                setUserBalance(user)
                setVaultBalance(vault)
                setState(acct as VaultStateAccount | null)
            } catch (e) {
                if (!cancelled) console.error("vault state load failed", e)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [program, wallet, pdas, connection, tick])

    return {
        wallet,
        program,
        pdas,
        state,
        vaultBalance,
        userBalance,
        refresh,
    }
}
