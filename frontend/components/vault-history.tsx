import { lamportsToSol } from "@/lib/vault"
import type { VaultEvent } from "@/hooks/use-vault"

function describe(e: VaultEvent): string {
    switch (e.kind) {
        case "vaultInitialized":
            return e.data.maxAmount === null
                ? "Initialized (unlimited)"
                : `Initialized (max ${lamportsToSol(e.data.maxAmount)} SOL)`
        case "deposited":
            return `Deposited ${lamportsToSol(e.data.amount)} SOL`
        case "withdrawn":
            return `Withdrew ${lamportsToSol(e.data.amount)} SOL`
        case "vaultClosed":
            return `Closed — returned ${lamportsToSol(e.data.returned)} SOL`
    }
}

export function VaultHistory({ history }: { history: VaultEvent[] }) {
    if (history.length === 0) return null

    return (
        <section className="flex flex-col gap-3 rounded-md border border-border p-4">
            <h2 className="text-sm font-medium">Activity</h2>
            <ul className="flex flex-col gap-2">
                {history.map((e) => (
                    <li
                        key={e.signature}
                        className="flex items-center justify-between gap-3 text-sm"
                    >
                        <span>{describe(e)}</span>
                        <code className="truncate text-xs text-muted-foreground">
                            slot {e.slot} · {e.signature.slice(0, 8)}…
                        </code>
                    </li>
                ))}
            </ul>
        </section>
    )
}
