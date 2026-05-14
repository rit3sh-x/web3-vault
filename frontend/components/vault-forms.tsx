import { useState } from "react"
import { Button, Card, Field } from "./ui"

export function InitializeForm({
    onSubmit,
    disabled,
}: {
    onSubmit: (maxAmountSol: string) => void
    disabled: boolean
}) {
    const [value, setValue] = useState("")
    return (
        <Card title="Initialize vault">
            <Field
                label="Max amount (SOL, blank = unlimited)"
                value={value}
                onChange={setValue}
                placeholder="e.g. 5"
            />
            <Button
                onClick={() => {
                    onSubmit(value)
                    setValue("")
                }}
                disabled={disabled}
            >
                Initialize
            </Button>
        </Card>
    )
}

export function AmountForm({
    title,
    action,
    onSubmit,
    disabled,
}: {
    title: string
    action: string
    onSubmit: (amountSol: string) => void
    disabled: boolean
}) {
    const [amount, setAmount] = useState("")
    return (
        <Card title={title}>
            <Field
                label="Amount (SOL)"
                value={amount}
                onChange={setAmount}
                placeholder="0.5"
            />
            <Button
                onClick={() => {
                    onSubmit(amount)
                    setAmount("")
                }}
                disabled={disabled || !amount}
            >
                {action}
            </Button>
        </Card>
    )
}

export function CloseCard({
    onClose,
    disabled,
}: {
    onClose: () => void
    disabled: boolean
}) {
    return (
        <Card title="Close vault">
            <p className="text-sm text-muted-foreground">
                Returns all funds (vault + rent) to your wallet.
            </p>
            <Button onClick={onClose} disabled={disabled} variant="destructive">
                Close
            </Button>
        </Card>
    )
}
