import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useVault } from "./hooks/use-vault"
import { useVaultActions } from "./hooks/use-vault-actions"
import { ErrorBanner } from "./components/ui"
import { VaultStats } from "./components/vault-stats"
import { AmountForm, CloseCard, InitializeForm } from "./components/vault-forms"
import { VaultHistory } from "./components/vault-history"

export function App() {
    const { wallet, program, pdas, state, vaultBalance, userBalance, history } =
        useVault()
    const { initialize, deposit, withdraw, close, loading, error } =
        useVaultActions({ program, wallet })

    const initialized = state !== null

    return (
        <div className="min-h-svh bg-background text-foreground">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
                <h1 className="text-lg font-semibold">Vault</h1>
                <WalletMultiButton />
            </header>

            <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
                {!wallet && (
                    <div className="rounded-md border border-border p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Connect a wallet to manage your vault.
                        </p>
                    </div>
                )}

                {wallet && pdas && (
                    <>
                        <VaultStats
                            state={state}
                            userBalance={userBalance}
                            vaultBalance={vaultBalance}
                            vault={pdas.vault}
                        />

                        {!initialized ? (
                            <InitializeForm
                                onSubmit={initialize}
                                disabled={loading}
                            />
                        ) : (
                            <>
                                <AmountForm
                                    title="Deposit"
                                    action="Deposit"
                                    onSubmit={deposit}
                                    disabled={loading}
                                />
                                <AmountForm
                                    title="Withdraw"
                                    action="Withdraw"
                                    onSubmit={withdraw}
                                    disabled={loading}
                                />
                                <CloseCard onClose={close} disabled={loading} />
                            </>
                        )}

                        {error && <ErrorBanner message={error} />}

                        <VaultHistory history={history} />
                    </>
                )}
            </main>
        </div>
    )
}
