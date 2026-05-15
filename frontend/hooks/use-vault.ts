import { useCallback, useEffect, useMemo, useState } from "react"
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react"
import type { IdlEvents } from "@anchor-lang/core"
import type { Vault } from "@contracts/vault"
import {
    buildProgram,
    deriveVaultPdas,
    type VaultStateAccount,
} from "@/lib/vault"

type VaultEvents = IdlEvents<Vault>

export type VaultEvent = {
    [K in keyof VaultEvents]: {
        kind: K
        slot: number
        signature: string
        data: VaultEvents[K]
    }
}[keyof VaultEvents]

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
    const [history, setHistory] = useState<VaultEvent[]>([])

    const syncUserBalance = useCallback(() => {
        if (!wallet) return
        connection
            .getBalance(wallet.publicKey)
            .then(setUserBalance)
            .catch((e) => console.error("user balance fetch failed", e))
    }, [connection, wallet])

    useEffect(() => {
        if (!program || !wallet || !pdas) {
            setState(null)
            setVaultBalance(null)
            setUserBalance(null)
            setHistory([])
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
    }, [program, wallet, pdas, connection])

    useEffect(() => {
        if (!program || !wallet || !pdas) return

        const me = wallet.publicKey
        const prepend = (e: VaultEvent) =>
            setHistory((h) => [e, ...h].slice(0, 50))

        const ids = [
            program.addEventListener(
                "vaultInitialized",
                (data, slot, signature) => {
                    if (!data.user.equals(me)) return
                    setVaultBalance(0)
                    program.account.vaultState
                        .fetchNullable(pdas.vaultState)
                        .then((a) => setState(a as VaultStateAccount | null))
                        .catch(() => {})
                    syncUserBalance()
                    prepend({ kind: "vaultInitialized", slot, signature, data })
                }
            ),
            program.addEventListener("deposited", (data, slot, signature) => {
                if (!data.user.equals(me)) return
                setVaultBalance(data.newBalance.toNumber())
                syncUserBalance()
                prepend({ kind: "deposited", slot, signature, data })
            }),
            program.addEventListener("withdrawn", (data, slot, signature) => {
                if (!data.user.equals(me)) return
                setVaultBalance(data.newBalance.toNumber())
                syncUserBalance()
                prepend({ kind: "withdrawn", slot, signature, data })
            }),
            program.addEventListener("vaultClosed", (data, slot, signature) => {
                if (!data.user.equals(me)) return
                setState(null)
                setVaultBalance(0)
                syncUserBalance()
                prepend({ kind: "vaultClosed", slot, signature, data })
            }),
        ]

        return () => {
            ids.forEach((id) => program.removeEventListener(id).catch(() => {}))
        }
    }, [program, wallet, pdas, syncUserBalance])

    return {
        wallet,
        program,
        pdas,
        state,
        vaultBalance,
        userBalance,
        history,
    }
}
