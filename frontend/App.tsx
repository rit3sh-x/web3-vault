import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAnchorWallet,
  useConnection,
} from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  buildProgram,
  deriveVaultPdas,
  lamportsToSol,
  solToLamports,
  SystemProgram,
} from "@/lib/vault";
import { BN } from "@anchor-lang/core";

type VaultStateAccount = {
  vaultBump: number;
  stateBump: number;
  maxAmount: BN | null;
};

export function App() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(
    () => (wallet ? buildProgram(connection, wallet) : null),
    [connection, wallet],
  );

  const pdas = useMemo(
    () => (wallet ? deriveVaultPdas(wallet.publicKey) : null),
    [wallet],
  );

  const [state, setState] = useState<VaultStateAccount | null>(null);
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!program || !wallet || !pdas) {
      setState(null);
      setVaultBalance(null);
      setUserBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const user = await connection.getBalance(wallet.publicKey);
        if (!cancelled) setUserBalance(user);

        const vault = await connection.getBalance(pdas.vault);
        if (!cancelled) setVaultBalance(vault);

        const acct = await program.account.vaultState.fetchNullable(
          pdas.vaultState,
        );
        if (!cancelled) setState(acct as VaultStateAccount | null);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [program, wallet, pdas, connection, tick]);

  const wrap = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setLoading(true);
      setError(null);
      try {
        await fn();
        refresh();
      } catch (e) {
        setError(`${label}: ${String(e)}`);
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const [maxAmountInput, setMaxAmountInput] = useState("");
  const [depositInput, setDepositInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");

  const onInitialize = () =>
    wrap("initialize", async () => {
      if (!program || !wallet || !pdas) return;
      const maxAmount = maxAmountInput.trim()
        ? solToLamports(maxAmountInput)
        : null;
      await program.methods
        .initialize(maxAmount)
        .accountsStrict({
          user: wallet.publicKey,
          vaultState: pdas.vaultState,
          vault: pdas.vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setMaxAmountInput("");
    });

  const onDeposit = () =>
    wrap("deposit", async () => {
      if (!program || !wallet || !pdas) return;
      await program.methods
        .deposit(solToLamports(depositInput))
        .accountsStrict({
          user: wallet.publicKey,
          vaultState: pdas.vaultState,
          vault: pdas.vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setDepositInput("");
    });

  const onWithdraw = () =>
    wrap("withdraw", async () => {
      if (!program || !wallet || !pdas) return;
      await program.methods
        .withdraw(solToLamports(withdrawInput))
        .accountsStrict({
          user: wallet.publicKey,
          vaultState: pdas.vaultState,
          vault: pdas.vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      setWithdrawInput("");
    });

  const onClose = () =>
    wrap("close", async () => {
      if (!program || !wallet || !pdas) return;
      await program.methods
        .close()
        .accountsStrict({
          user: wallet.publicKey,
          vaultState: pdas.vaultState,
          vault: pdas.vault,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

  const initialized = state !== null;

  return (
    <div className="bg-background text-foreground min-h-svh">
      <header className="border-border flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Vault</h1>
        <WalletMultiButton />
      </header>

      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
        {!wallet && (
          <div className="border-border rounded-md border p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Connect a wallet to manage your vault.
            </p>
          </div>
        )}

        {wallet && pdas && (
          <>
            <section className="border-border grid grid-cols-2 gap-4 rounded-md border p-4">
              <Stat label="Your balance" value={`${lamportsToSol(userBalance)} SOL`} />
              <Stat label="Vault balance" value={`${lamportsToSol(vaultBalance)} SOL`} />
              <Stat
                label="Status"
                value={initialized ? "Initialized" : "Not initialized"}
              />
              <Stat
                label="Max amount"
                value={
                  initialized
                    ? state?.maxAmount
                      ? `${lamportsToSol(state.maxAmount)} SOL`
                      : "Unlimited"
                    : "—"
                }
              />
              <div className="text-muted-foreground col-span-2 truncate text-xs">
                vault: <code>{pdas.vault.toBase58()}</code>
              </div>
            </section>

            {!initialized ? (
              <Card title="Initialize vault">
                <Field
                  label="Max amount (SOL, blank = unlimited)"
                  value={maxAmountInput}
                  onChange={setMaxAmountInput}
                  placeholder="e.g. 5"
                />
                <Button onClick={onInitialize} disabled={loading}>
                  Initialize
                </Button>
              </Card>
            ) : (
              <>
                <Card title="Deposit">
                  <Field
                    label="Amount (SOL)"
                    value={depositInput}
                    onChange={setDepositInput}
                    placeholder="0.5"
                  />
                  <Button onClick={onDeposit} disabled={loading || !depositInput}>
                    Deposit
                  </Button>
                </Card>

                <Card title="Withdraw">
                  <Field
                    label="Amount (SOL)"
                    value={withdrawInput}
                    onChange={setWithdrawInput}
                    placeholder="0.5"
                  />
                  <Button
                    onClick={onWithdraw}
                    disabled={loading || !withdrawInput}
                  >
                    Withdraw
                  </Button>
                </Card>

                <Card title="Close vault">
                  <p className="text-muted-foreground text-sm">
                    Returns all funds (vault + rent) to your wallet.
                  </p>
                  <Button onClick={onClose} disabled={loading} variant="destructive">
                    Close
                  </Button>
                </Card>
              </>
            )}

            {error && (
              <div className="border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm break-words">
                {error}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs uppercase">{label}</div>
      <div className="font-mono text-base">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-border flex flex-col gap-3 rounded-md border p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-input bg-background focus:ring-ring rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
      />
    </label>
  );
}

function Button({
  onClick,
  disabled,
  children,
  variant = "primary",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "destructive";
}) {
  const base =
    "rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  const variantClass =
    variant === "destructive"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : "bg-primary text-primary-foreground hover:bg-primary/90";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantClass}`}
    >
      {children}
    </button>
  );
}

export default App;
