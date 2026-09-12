"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useChainId, useConfig, useAccount } from "wagmi"
import { chainsToTSender, erc20Abi, tsenderAbi } from "@/constants"
import { readContract, writeContract, waitForTransactionReceipt } from "@wagmi/core"
import {
    parseRecipientsInput,
    formatUnitsSafe,
    mergeDuplicates,
    chunkRecipients,
    BatchInfo,
} from "@/utils/calculateTotal"
import { isAddress } from "viem"
import {
    FaCoins,
    FaFileCsv,
    FaDownload,
    FaCheckCircle,
    FaExclamationTriangle,
    FaSpinner,
    FaExternalLinkAlt,
    FaLayerGroup,
    FaBoxes,
    FaRedo,
} from "react-icons/fa"

interface TokenMeta {
    name: string
    symbol: string
    decimals: number
    balance: bigint
}

interface BatchExecutionStatus {
    status: "idle" | "pending" | "success" | "error"
    txHash?: string
    error?: string
}

export default function AirdropForm() {
    const chainId = useChainId()
    const config = useConfig()
    const { address, isConnected, chain } = useAccount()

    // Form inputs
    const [tokenAddress, setTokenAddress] = useState("")
    const [mode, setMode] = useState<"custom" | "equal">("custom")
    const [equalAmount, setEqualAmount] = useState("")
    const [rawRecipients, setRawRecipients] = useState("")
    const [batchSize, setBatchSize] = useState<number>(200)

    // Token state
    const [tokenMeta, setTokenMeta] = useState<TokenMeta | null>(null)
    const [isLoadingToken, setIsLoadingToken] = useState(false)
    const [tokenError, setTokenError] = useState("")

    // Allowance & Tx state
    const [currentAllowance, setCurrentAllowance] = useState<bigint>(0n)
    const [isCheckingAllowance, setIsCheckingAllowance] = useState(false)
    const [isApproving, setIsApproving] = useState(false)
    const [batchStatusMap, setBatchStatusMap] = useState<Record<number, BatchExecutionStatus>>({})
    const [errorMessage, setErrorMessage] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [activeExecutingBatch, setActiveExecutingBatch] = useState<number | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const activeContract = chainsToTSender[chainId]
    const tsenderAddress = activeContract?.tsender

    // Decimals to use
    const decimals = tokenMeta ? tokenMeta.decimals : 18

    // Parse recipients
    const parseResult = useMemo(() => {
        return parseRecipientsInput(rawRecipients, mode, equalAmount, decimals)
    }, [rawRecipients, mode, equalAmount, decimals])

    // Filter only valid recipients for batching
    const validRecipients = useMemo(() => {
        return parseResult.recipients.filter(r => r.isValidAddress && r.isValidAmount)
    }, [parseResult.recipients])

    // Auto-chunk valid recipients into safe batches
    const batches = useMemo(() => {
        return chunkRecipients(validRecipients, batchSize)
    }, [validRecipients, batchSize])

    // Reset batch status when recipient list or batch size changes
    useEffect(() => {
        setBatchStatusMap({})
    }, [rawRecipients, batchSize, mode, equalAmount])

    // Explorer URL helper
    const getExplorerTxUrl = (hash: string) => {
        const base = chain?.blockExplorers?.default?.url
        if (base) {
            return `${base.replace(/\/+$/, "")}/tx/${hash}`
        }
        return `https://etherscan.io/tx/${hash}`
    }

    // Auto-fetch token metadata and user balance
    useEffect(() => {
        if (!tokenAddress || !isAddress(tokenAddress)) {
            setTokenMeta(null)
            setTokenError(tokenAddress ? "Invalid ERC20 contract address format" : "")
            return
        }

        let isCancelled = false
        setIsLoadingToken(true)
        setTokenError("")

        async function fetchTokenInfo() {
            try {
                const [name, symbol, dec] = await Promise.all([
                    readContract(config, {
                        address: tokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "name",
                    }).catch(() => "Unknown Token"),
                    readContract(config, {
                        address: tokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "symbol",
                    }).catch(() => "TOKEN"),
                    readContract(config, {
                        address: tokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: "decimals",
                    }).catch(() => 18),
                ])

                let balance = 0n
                if (address) {
                    try {
                        const bal = await readContract(config, {
                            address: tokenAddress as `0x${string}`,
                            abi: erc20Abi,
                            functionName: "balanceOf",
                            args: [address],
                        })
                        balance = (bal as bigint) || 0n
                    } catch {
                        balance = 0n
                    }
                }

                if (!isCancelled) {
                    setTokenMeta({
                        name: String(name),
                        symbol: String(symbol),
                        decimals: Number(dec),
                        balance,
                    })
                }
            } catch (err: any) {
                if (!isCancelled) {
                    setTokenError("Could not read ERC20 token metadata on this network.")
                    setTokenMeta(null)
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingToken(false)
                }
            }
        }

        fetchTokenInfo()
        return () => {
            isCancelled = true
        }
    }, [tokenAddress, address, config, chainId])

    // Check Allowance
    const refreshAllowance = async () => {
        if (!tokenAddress || !isAddress(tokenAddress) || !tsenderAddress || !address) {
            setCurrentAllowance(0n)
            return
        }

        setIsCheckingAllowance(true)
        try {
            const allowance = await readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: "allowance",
                args: [address, tsenderAddress],
            })
            setCurrentAllowance((allowance as bigint) || 0n)
        } catch (err) {
            console.error("Failed to check allowance", err)
            setCurrentAllowance(0n)
        } finally {
            setIsCheckingAllowance(false)
        }
    }

    useEffect(() => {
        refreshAllowance()
    }, [tokenAddress, tsenderAddress, address, chainId])

    // Derived states
    const hasEnoughAllowance =
        parseResult.totalAmount > 0n && currentAllowance >= parseResult.totalAmount

    const hasEnoughBalance =
        tokenMeta !== null ? tokenMeta.balance >= parseResult.totalAmount : true

    // Sample CSV template download
    const handleDownloadTemplate = () => {
        const sampleData =
            mode === "custom"
                ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 10.5\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, 25.0\n0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65, 5"
                : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
        const blob = new Blob([sampleData], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `airdrop_${mode}_template.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // CSV File upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = event => {
            const content = event.target?.result as string
            if (content) {
                setRawRecipients(content.trim())
            }
        }
        reader.readAsText(file)
        e.target.value = ""
    }

    // Deduplicate recipients
    const handleMergeDuplicates = () => {
        const { mergedText } = mergeDuplicates(parseResult.recipients, decimals)
        setRawRecipients(mergedText)
    }

    // Approve TSender (Approves for the grand total of all batches at once)
    const handleApprove = async () => {
        setErrorMessage("")
        setSuccessMessage("")

        if (!isConnected) {
            setErrorMessage("Please connect your wallet first.")
            return
        }

        if (!activeContract) {
            setErrorMessage(`TSender contract is not deployed on chain ID ${chainId}.`)
            return
        }

        if (!tokenAddress || !isAddress(tokenAddress)) {
            setErrorMessage("Please enter a valid ERC20 token address.")
            return
        }

        if (parseResult.recipients.length === 0 || parseResult.totalAmount === 0n) {
            setErrorMessage("Please specify at least one valid recipient with an amount.")
            return
        }

        setIsApproving(true)

        try {
            const hash = await writeContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: "approve",
                args: [tsenderAddress, parseResult.totalAmount],
            })

            setSuccessMessage("Approval submitted! Awaiting on-chain confirmation...")

            const receipt = await waitForTransactionReceipt(config, { hash })
            if (receipt.status === "success") {
                setSuccessMessage("Approval confirmed! You can now execute your airdrop batches.")
                await refreshAllowance()
            } else {
                setErrorMessage("Approval transaction reverted on-chain.")
            }
        } catch (err: any) {
            console.error("Approve failed", err)
            setErrorMessage(err?.shortMessage || err?.message || "Approval transaction failed.")
        } finally {
            setIsApproving(false)
        }
    }

    // Execute a specific Batch
    const handleSendBatch = async (batch: BatchInfo) => {
        setErrorMessage("")
        setSuccessMessage("")

        if (!isConnected) {
            setErrorMessage("Please connect your wallet first.")
            return
        }

        if (!activeContract) {
            setErrorMessage(`TSender contract is not deployed on chain ID ${chainId}.`)
            return
        }

        if (!tokenAddress || !isAddress(tokenAddress)) {
            setErrorMessage("Please enter a valid ERC20 token address.")
            return
        }

        if (!hasEnoughAllowance) {
            setErrorMessage("Please approve the TSender contract before executing the airdrop.")
            return
        }

        setActiveExecutingBatch(batch.batchNumber)
        setBatchStatusMap(prev => ({
            ...prev,
            [batch.batchNumber]: { status: "pending" },
        }))

        try {
            const recipientsArray = batch.recipients.map(r => r.address as `0x${string}`)
            const amountsArray = batch.recipients.map(r => r.amount)

            const hash = await writeContract(config, {
                address: tsenderAddress as `0x${string}`,
                abi: tsenderAbi,
                functionName: "airdropERC20",
                args: [tokenAddress as `0x${string}`, recipientsArray, amountsArray, batch.totalAmount],
            })

            setSuccessMessage(`Batch #${batch.batchNumber} broadcasted! Awaiting block confirmation...`)

            const receipt = await waitForTransactionReceipt(config, { hash })
            if (receipt.status === "success") {
                setBatchStatusMap(prev => ({
                    ...prev,
                    [batch.batchNumber]: { status: "success", txHash: hash },
                }))
                setSuccessMessage(`Batch #${batch.batchNumber} successfully confirmed on-chain! 🎉`)
                await refreshAllowance()
            } else {
                setBatchStatusMap(prev => ({
                    ...prev,
                    [batch.batchNumber]: { status: "error", error: "Reverted on-chain" },
                }))
                setErrorMessage(`Batch #${batch.batchNumber} reverted on-chain.`)
            }
        } catch (err: any) {
            console.error(`Batch ${batch.batchNumber} failed`, err)
            const msg = err?.shortMessage || err?.message || "Transaction failed."
            setBatchStatusMap(prev => ({
                ...prev,
                [batch.batchNumber]: { status: "error", error: msg },
            }))
            setErrorMessage(`Batch #${batch.batchNumber} error: ${msg}`)
        } finally {
            setActiveExecutingBatch(null)
        }
    }

    // Determine the next batch to execute
    const nextPendingBatch = batches.find(
        b => !batchStatusMap[b.batchNumber] || batchStatusMap[b.batchNumber].status === "idle"
    )

    const completedBatchesCount = batches.filter(
        b => batchStatusMap[b.batchNumber]?.status === "success"
    ).length

    const progressPercentage =
        batches.length > 0 ? Math.round((completedBatchesCount / batches.length) * 100) : 0

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {/* Unsupported Network Banner */}
            {!activeContract && isConnected && (
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex items-start gap-3 text-amber-200">
                    <FaExclamationTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-sm">Unsupported Network (Chain ID: {chainId})</h4>
                        <p className="text-xs text-amber-300/80 mt-1">
                            TSender is not deployed on this network. Please switch to Ethereum, Base, Optimism,
                            Arbitrum, zkSync, or Sepolia.
                        </p>
                    </div>
                </div>
            )}

            {/* Main Form Card */}
            <div className="bg-zinc-900/70 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
                {/* Header Title & Mode Switch */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-800/80">
                    <div>
                        <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                            <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                                <FaCoins className="w-5 h-5" />
                            </span>
                            ERC20 Token Airdrop
                        </h2>
                        <p className="text-zinc-400 text-xs mt-1">
                            Batch send ERC20 tokens to thousands of recipients with auto-gas optimization and chunking.
                        </p>
                    </div>

                    {/* Mode Toggle Pills */}
                    <div className="inline-flex p-1 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setMode("custom")}
                            className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                mode === "custom"
                                    ? "bg-cyan-500 text-zinc-950 font-semibold shadow-md"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            Custom Amounts
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("equal")}
                            className={`px-3.5 py-1.5 rounded-lg transition-all ${
                                mode === "equal"
                                    ? "bg-cyan-500 text-zinc-950 font-semibold shadow-md"
                                    : "text-zinc-400 hover:text-white"
                            }`}
                        >
                            Equal Amount
                        </button>
                    </div>
                </div>

                {/* Step 1: Token Configuration */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                                1
                            </span>
                            ERC20 Token Address
                        </label>
                        {isLoadingToken && (
                            <span className="text-xs text-cyan-400 flex items-center gap-1.5 animate-pulse">
                                <FaSpinner className="animate-spin w-3 h-3" /> Fetching Token Details...
                            </span>
                        )}
                    </div>

                    <input
                        type="text"
                        placeholder="0x... (ERC20 Contract Address)"
                        value={tokenAddress}
                        onChange={e => setTokenAddress(e.target.value.trim())}
                        className="w-full bg-zinc-950/80 text-white placeholder:text-zinc-600 font-mono text-sm px-4 py-3 rounded-2xl border border-zinc-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all"
                    />

                    {tokenError && <div className="text-red-400 text-xs mt-1">{tokenError}</div>}

                    {/* Detected Token Details Card */}
                    {tokenMeta && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-zinc-950/50 border border-zinc-800/80 text-xs">
                            <div>
                                <span className="text-zinc-500 block">Token Name</span>
                                <span className="font-semibold text-zinc-200 truncate block">{tokenMeta.name}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block">Symbol</span>
                                <span className="font-semibold text-cyan-400">{tokenMeta.symbol}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block">Decimals</span>
                                <span className="font-semibold text-zinc-200">{tokenMeta.decimals}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 block">Your Balance</span>
                                <span className="font-semibold text-emerald-400 truncate block">
                                    {formatUnitsSafe(tokenMeta.balance, tokenMeta.decimals)} {tokenMeta.symbol}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 2: Recipients & Allocations */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                                2
                            </span>
                            Recipients & Allocation
                        </label>

                        {/* File Action Controls */}
                        <div className="flex items-center gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors"
                            >
                                <FaFileCsv className="text-emerald-400 w-3.5 h-3.5" /> Upload CSV/TXT
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt,.tsv"
                                className="hidden"
                                onChange={handleFileUpload}
                            />

                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
                            >
                                <FaDownload className="w-3 h-3" /> Template
                            </button>

                            {parseResult.duplicateCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMergeDuplicates}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center gap-1.5 border border-amber-500/30 transition-colors"
                                >
                                    <FaLayerGroup className="w-3 h-3" /> Merge {parseResult.duplicateCount} Duplicates
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Equal Amount Input */}
                    {mode === "equal" && (
                        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                            <label className="text-xs text-zinc-400 font-medium">
                                Fixed Amount per Recipient ({tokenMeta?.symbol || "Tokens"})
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. 50 or 0.25"
                                value={equalAmount}
                                onChange={e => setEqualAmount(e.target.value.trim())}
                                className="w-full bg-zinc-900 text-white placeholder:text-zinc-600 font-mono text-sm px-3.5 py-2.5 rounded-xl border border-zinc-700 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Main Recipients Text Area */}
                    <div className="relative">
                        <textarea
                            rows={6}
                            value={rawRecipients}
                            onChange={e => setRawRecipients(e.target.value)}
                            placeholder={
                                mode === "custom"
                                    ? "0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 10.5\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, 25.0\n(One recipient per line: address, amount)"
                                    : "0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n(One recipient address per line)"
                            }
                            className="w-full bg-zinc-950/80 text-white placeholder:text-zinc-600 font-mono text-xs sm:text-sm p-4 rounded-2xl border border-zinc-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-all leading-relaxed"
                        />
                    </div>

                    {/* Batch Size Selector Control */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3.5 rounded-2xl bg-zinc-950/50 border border-zinc-800/80 text-xs">
                        <div className="flex items-center gap-2 text-zinc-300">
                            <FaBoxes className="text-cyan-400 w-4 h-4" />
                            <span className="font-semibold">Batch Chunking Size:</span>
                            <span className="text-zinc-500">Max addresses per transaction (EVM safe: 200)</span>
                        </div>
                        <div className="inline-flex gap-1.5">
                            {[100, 200, 250, 400].map(sz => (
                                <button
                                    key={sz}
                                    type="button"
                                    onClick={() => setBatchSize(sz)}
                                    className={`px-2.5 py-1 rounded-lg transition-all ${
                                        batchSize === sz
                                            ? "bg-cyan-500 text-zinc-950 font-bold shadow-xs"
                                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                                    }`}
                                >
                                    {sz}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary Statistics Card */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-xs">
                        <div>
                            <span className="text-zinc-500 block">Total Recipients</span>
                            <span className="text-base font-bold text-white">
                                {parseResult.validCount}
                                {parseResult.invalidCount > 0 && (
                                    <span className="text-xs font-normal text-red-400 ml-1">
                                        ({parseResult.invalidCount} invalid)
                                    </span>
                                )}
                            </span>
                        </div>

                        <div>
                            <span className="text-zinc-500 block">Total Airdrop Amount</span>
                            <span className="text-base font-bold text-cyan-400">
                                {formatUnitsSafe(parseResult.totalAmount, decimals)} {tokenMeta?.symbol || ""}
                            </span>
                        </div>

                        <div>
                            <span className="text-zinc-500 block">Total Batches</span>
                            <span className="text-base font-bold text-white flex items-center gap-1.5">
                                {batches.length} {batches.length === 1 ? "Batch" : "Batches"}
                            </span>
                        </div>

                        <div>
                            <span className="text-zinc-500 block">Allowance Status</span>
                            <span
                                className={`text-base font-bold truncate block ${
                                    hasEnoughAllowance ? "text-emerald-400" : "text-amber-400"
                                }`}
                            >
                                {hasEnoughAllowance ? "Approved ✓" : "Needs Approval"}
                            </span>
                        </div>
                    </div>

                    {/* Balance Warning */}
                    {!hasEnoughBalance && tokenMeta && (
                        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                            <FaExclamationTriangle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>
                                You need <strong>{formatUnitsSafe(parseResult.totalAmount, decimals)}</strong>{" "}
                                {tokenMeta.symbol}, but your current wallet balance is{" "}
                                <strong>{formatUnitsSafe(tokenMeta.balance, decimals)}</strong>.
                            </span>
                        </div>
                    )}
                </div>

                {/* Step 3: Approve & Batch Dispatcher */}
                <div className="pt-2 border-t border-zinc-800/80 space-y-6">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                            3
                        </span>
                        Execution & Batch Dispatcher
                    </label>

                    {/* Step 3A: Approve Total (Only once for the whole campaign) */}
                    <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <span>1. Approve TSender Contract</span>
                                {hasEnoughAllowance && (
                                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        Approved for {formatUnitsSafe(parseResult.totalAmount, decimals)}{" "}
                                        {tokenMeta?.symbol || "Tokens"}
                                    </span>
                                )}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Single approval unlocks all {batches.length} batches automatically.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleApprove}
                            disabled={
                                isApproving ||
                                hasEnoughAllowance ||
                                parseResult.validCount === 0 ||
                                !tokenAddress ||
                                !hasEnoughBalance
                            }
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 ${
                                hasEnoughAllowance
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-extrabold shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            }`}
                        >
                            {isApproving ? (
                                <>
                                    <FaSpinner className="animate-spin w-3.5 h-3.5" /> Approving...
                                </>
                            ) : hasEnoughAllowance ? (
                                <>
                                    <FaCheckCircle className="w-3.5 h-3.5" /> Approved ✓
                                </>
                            ) : (
                                `Approve Total (${formatUnitsSafe(parseResult.totalAmount, decimals)} ${tokenMeta?.symbol || ""})`
                            )}
                        </button>
                    </div>

                    {/* Step 3B: Batch Dispatcher / Progress */}
                    {batches.length > 0 && (
                        <div className="space-y-4">
                            {/* Overall Campaign Progress Bar */}
                            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                                <div className="flex justify-between text-xs text-zinc-300">
                                    <span className="font-semibold">
                                        Airdrop Campaign Progress: {completedBatchesCount} of {batches.length} Batches Sent
                                    </span>
                                    <span className="font-bold text-cyan-400">{progressPercentage}%</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full transition-all duration-500"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Batch Cards Grid / List */}
                            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                                {batches.map(batch => {
                                    const bStatus = batchStatusMap[batch.batchNumber]?.status || "idle"
                                    const bTxHash = batchStatusMap[batch.batchNumber]?.txHash
                                    const isExecutingThis = activeExecutingBatch === batch.batchNumber

                                    return (
                                        <div
                                            key={batch.batchNumber}
                                            className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs ${
                                                bStatus === "success"
                                                    ? "bg-emerald-950/20 border-emerald-500/30"
                                                    : bStatus === "pending"
                                                    ? "bg-cyan-950/20 border-cyan-500/40"
                                                    : bStatus === "error"
                                                    ? "bg-red-950/20 border-red-500/30"
                                                    : "bg-zinc-950/40 border-zinc-800/80"
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white text-sm">
                                                        Batch #{batch.batchNumber}
                                                    </span>
                                                    <span className="text-zinc-400">
                                                        (Recipients {batch.startIndex} – {batch.endIndex})
                                                    </span>
                                                    {bStatus === "success" && (
                                                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                            Sent ✓
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-zinc-400">
                                                    Amount:{" "}
                                                    <strong className="text-zinc-200">
                                                        {formatUnitsSafe(batch.totalAmount, decimals)}{" "}
                                                        {tokenMeta?.symbol || ""}
                                                    </strong>{" "}
                                                    across {batch.recipients.length} addresses
                                                </div>
                                                {bTxHash && (
                                                    <a
                                                        href={getExplorerTxUrl(bTxHash)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-mono text-[10px] mt-1"
                                                    >
                                                        Tx: {bTxHash.slice(0, 10)}...{bTxHash.slice(-8)}
                                                        <FaExternalLinkAlt className="w-2.5 h-2.5" />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Action Button per batch */}
                                            <div>
                                                {bStatus === "success" ? (
                                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                                        <FaCheckCircle className="w-3.5 h-3.5" /> Completed
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSendBatch(batch)}
                                                        disabled={
                                                            !hasEnoughAllowance ||
                                                            isExecutingThis ||
                                                            activeExecutingBatch !== null ||
                                                            !hasEnoughBalance
                                                        }
                                                        className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                                            bStatus === "error"
                                                                ? "bg-red-500 hover:bg-red-600 text-white shadow-md"
                                                                : nextPendingBatch?.batchNumber === batch.batchNumber
                                                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-zinc-950 font-extrabold shadow-md shadow-cyan-500/20"
                                                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                                                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                    >
                                                        {isExecutingThis ? (
                                                            <>
                                                                <FaSpinner className="animate-spin w-3.5 h-3.5" /> Sending...
                                                            </>
                                                        ) : bStatus === "error" ? (
                                                            <>
                                                                <FaRedo className="w-3 h-3" /> Retry Batch #{batch.batchNumber}
                                                            </>
                                                        ) : (
                                                            `Send Batch #${batch.batchNumber}`
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications & Status Alerts */}
                {errorMessage && (
                    <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5">
                        <FaExclamationTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span className="break-all">{errorMessage}</span>
                    </div>
                )}

                {successMessage && (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                        <FaCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}
            </div>
        </div>
    )
}