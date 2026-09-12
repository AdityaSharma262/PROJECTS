import { isAddress, parseUnits, formatUnits } from "viem"

export interface RecipientItem {
    address: string
    rawAmount: string
    amount: bigint
    isValidAddress: boolean
    isValidAmount: boolean
    isDuplicate?: boolean
}

export interface ParseResult {
    recipients: RecipientItem[]
    totalAmount: bigint
    validCount: number
    invalidCount: number
    duplicateCount: number
    hasErrors: boolean
}

/**
 * Safely parses a string number to BigInt with given token decimals.
 * Returns null if invalid or negative.
 */
export function parseUnitsSafe(val: string, decimals: number = 18): bigint | null {
    if (!val || typeof val !== "string") return null
    const cleaned = val.trim()
    if (!cleaned || isNaN(Number(cleaned)) || Number(cleaned) <= 0) return null

    try {
        // Prevent more decimals than token supports
        const parts = cleaned.split(".")
        if (parts.length > 2) return null
        if (parts[1] && parts[1].length > decimals) {
            // Trim excess decimal precision
            const truncated = `${parts[0]}.${parts[1].slice(0, decimals)}`
            return parseUnits(truncated, decimals)
        }
        return parseUnits(cleaned, decimals)
    } catch {
        return null
    }
}

/**
 * Safely formats BigInt to human readable string with token decimals.
 */
export function formatUnitsSafe(val: bigint, decimals: number = 18, maxDecimals: number = 4): string {
    try {
        const formatted = formatUnits(val, decimals)
        const [intPart, decPart] = formatted.split(".")
        if (!decPart) return intPart
        const trimmedDec = decPart.slice(0, maxDecimals).replace(/0+$/, "")
        return trimmedDec.length > 0 ? `${intPart}.${trimmedDec}` : intPart
    } catch {
        return "0"
    }
}

/**
 * Backward-compatible calculateTotal returning float number.
 */
export function calculateTotal(amounts: string): number {
    const amountArray = amounts
        .split(/[,\n]+/)
        .map(amt => amt.trim())
        .filter(amt => amt !== "")
        .map(amt => parseFloat(amt))
    if (amountArray.some(isNaN)) {
        return 0
    }
    return amountArray.reduce((acc, curr) => acc + curr, 0)
}

/**
 * Parses user input (pasted text or CSV file content) into structured recipient items.
 */
export function parseRecipientsInput(
    rawText: string,
    mode: "custom" | "equal",
    equalAmount: string,
    decimals: number = 18
): ParseResult {
    const lines = rawText
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0)

    const seenAddresses = new Map<string, number>()
    const items: RecipientItem[] = []
    let total = 0n
    let validCount = 0
    let invalidCount = 0
    let duplicateCount = 0

    // Equal mode fixed amount
    const equalBigInt = mode === "equal" ? parseUnitsSafe(equalAmount, decimals) : null

    for (const line of lines) {
        // Handle CSV/TSV/whitespace separation
        let addr = ""
        let amtStr = ""

        if (mode === "equal") {
            addr = line.replace(/[,; \t].*$/, "").trim()
            amtStr = equalAmount.trim()
        } else {
            // Split by comma, tab, semicolon, or space
            const tokens = line
                .split(/[,;\t ]+/)
                .map(t => t.trim())
                .filter(Boolean)
            if (tokens.length >= 2) {
                addr = tokens[0]
                amtStr = tokens[1]
            } else if (tokens.length === 1) {
                addr = tokens[0]
                amtStr = ""
            }
        }

        const validAddr = isAddress(addr)
        const amtBigInt = mode === "equal" ? equalBigInt : parseUnitsSafe(amtStr, decimals)
        const validAmt = amtBigInt !== null && amtBigInt > 0n

        const normalizedAddr = addr.toLowerCase()
        const count = seenAddresses.get(normalizedAddr) || 0
        seenAddresses.set(normalizedAddr, count + 1)
        const isDuplicate = count >= 1

        if (isDuplicate) {
            duplicateCount++
        }

        if (validAddr && validAmt) {
            validCount++
            total += amtBigInt!
        } else {
            invalidCount++
        }

        items.push({
            address: addr,
            rawAmount: amtStr,
            amount: amtBigInt || 0n,
            isValidAddress: validAddr,
            isValidAmount: validAmt,
            isDuplicate,
        })
    }

    return {
        recipients: items,
        totalAmount: total,
        validCount,
        invalidCount,
        duplicateCount,
        hasErrors: invalidCount > 0 || (mode === "equal" && equalBigInt === null),
    }
}

/**
 * Deduplicates recipients by combining amounts for identical addresses.
 */
export function mergeDuplicates(
    items: RecipientItem[],
    decimals: number = 18
): { merged: RecipientItem[]; mergedText: string } {
    const addressMap = new Map<string, { address: string; amount: bigint }>()

    for (const item of items) {
        if (!item.isValidAddress) continue
        const key = item.address.toLowerCase()
        const existing = addressMap.get(key)
        if (existing) {
            existing.amount += item.amount
        } else {
            addressMap.set(key, { address: item.address, amount: item.amount })
        }
    }

    const merged: RecipientItem[] = []
    const lines: string[] = []

    for (const entry of addressMap.values()) {
        const rawAmt = formatUnits(entry.amount, decimals)
        merged.push({
            address: entry.address,
            rawAmount: rawAmt,
            amount: entry.amount,
            isValidAddress: true,
            isValidAmount: entry.amount > 0n,
            isDuplicate: false,
        })
        lines.push(`${entry.address}, ${rawAmt}`)
    }

    return {
        merged,
        mergedText: lines.join("\n"),
    }
}

export interface BatchInfo {
    batchNumber: number
    startIndex: number
    endIndex: number
    recipients: RecipientItem[]
    totalAmount: bigint
    status: "idle" | "pending" | "success" | "error"
    txHash?: string
    error?: string
}

/**
 * Splits recipients into safe batches to stay well within EVM block gas limits.
 */
export function chunkRecipients(recipients: RecipientItem[], batchSize: number = 200): BatchInfo[] {
    const batches: BatchInfo[] = []
    const total = recipients.length
    if (total === 0) return batches

    const size = Math.max(1, batchSize)
    for (let i = 0; i < total; i += size) {
        const slice = recipients.slice(i, i + size)
        const batchTotal = slice.reduce((acc, curr) => acc + curr.amount, 0n)
        batches.push({
            batchNumber: Math.floor(i / size) + 1,
            startIndex: i + 1,
            endIndex: Math.min(i + size, total),
            recipients: slice,
            totalAmount: batchTotal,
            status: "idle",
        })
    }
    return batches
}