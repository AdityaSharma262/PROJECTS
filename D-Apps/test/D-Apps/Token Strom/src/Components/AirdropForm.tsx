"use client"

import { InputForm } from "@/Components/ui/InputField"
import { useState, useMemo } from "react"
import { useChainId , useConfig, useAccount} from "wagmi"
import { chainsToTSender, erc20Abi, tsenderAbi } from "@/contants"
import { readContract, writeContract } from  "@wagmi/core"
import { calculateTotal } from "@/utils/calculateTotal"
import { isAddress } from "viem"


export default function AirdropForm() {
    const[tokenAddress, setTokenAddress] = useState("")
    const[recipientAddress, setRecipientAddress] = useState("")
    const[amounts, setAmount] = useState("")
    const chainId = useChainId()
    const config = useConfig()
    const {address} = useAccount()
    const total: number = useMemo(() => calculateTotal(amounts), [amounts])
    const [txStatus, setTxStatus] = useState<string>("")
    const [isApproving, setIsApproving] = useState(false)
    const [isApproved, setIsApproved] = useState(false)
    const [error, setError] = useState<string>("")
    const [txHash, setTxHash] = useState<string>("")

     async function getApprovedAmount(TsenderAddress:string | null): Promise<number> {
       if(!TsenderAddress){
        alert("Tsender address not found")
        return 0
       }

       const result = await readContract(config,{
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, TsenderAddress],

       })

       return result as number
     }
    

    function validateInputs() {
      setError("")
      if (!tokenAddress || !recipientAddress || !amounts) {
        setError("Please fill in all fields.")
        return false
      }
      if (!isAddress(tokenAddress)) {
        setError("Invalid token address.")
        return false
      }
      const recipients = recipientAddress
        .split(/[\n,]+/)
        .map(addr => addr.trim())
        .filter(addr => addr)
      const amountsArr = amounts
        .split(/[\n,]+/)
        .map(a => a.trim())
        .filter(a => a)
      if (recipients.length !== amountsArr.length) {
        setError("Recipients and amounts count mismatch.")
        return false
      }
      for (const addr of recipients) {
        if (!isAddress(addr)) {
          setError(`Invalid recipient address: ${addr}`)
          return false
        }
      }
      for (const amt of amountsArr) {
        if (isNaN(Number(amt)) || Number(amt) <= 0) {
          setError(`Invalid amount: ${amt}`)
          return false
        }
      }
      return true
    }

    const handleAirdrop = async () => {
      setError("")
      setTxHash("")
      if (!validateInputs()) return
      const TsenderAddress = chainsToTSender[chainId]["tsender"]
      let approvedAmount = 0
      try {
        approvedAmount = await getApprovedAmount(TsenderAddress)
      } catch (err: any) {
        setError("Failed to check allowance: " + (err?.message || err))
        return
      }
      const recipients = recipientAddress
        .split(/[\n,]+/)
        .map(addr => addr.trim())
        .filter(addr => addr)
      const amountsArr = amounts
        .split(/[\n,]+/)
        .map(a => a.trim())
        .filter(a => a)
        .map(a => BigInt(a))
      if (approvedAmount < total) {
        setError("You need to approve the TSender contract to spend enough tokens.")
        return
      }
      setTxStatus("pending")
      try {
        const result = await writeContract(config, {
          address: TsenderAddress as `0x${string}`,
          abi: tsenderAbi,
          functionName: "airdropERC20",
          args: [tokenAddress, recipients, amountsArr, BigInt(total)],
        })
        setTxStatus("success")
        setTxHash(result)
        setIsApproved(false)
        setTokenAddress("")
        setRecipientAddress("")
        setAmount("")
      } catch (err: any) {
        setTxStatus("error")
        setError("Airdrop failed: " + (err?.message || err))
      }
    }

    async function handleApprove() {
      setError("")
      setTxHash("")
      if (!validateInputs()) return
      const TsenderAddress = chainsToTSender[chainId]["tsender"]
      setIsApproving(true)
      try {
        const approveTx = await writeContract(config, {
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [TsenderAddress, BigInt(total)],
        })
        setIsApproved(true)
        setTxHash(approveTx)
      } catch (err: any) {
        setIsApproved(false)
        setError("Approval failed: " + (err?.message || err))
      }
      setIsApproving(false)
    }

    return (
       <div className="flex flex-col gap-4"> 

        <InputForm  label="Token Address"  
         placeholder="0x" 
         value={tokenAddress}
         onChange={ e => setTokenAddress(e.target.value)} />

        <InputForm  label="Recipient Address (comma or new line separated)"  
         placeholder="0x123 , 0x456" 
         value={recipientAddress}
         onChange={ e => setRecipientAddress(e.target.value)}
         large = {true} />

        <InputForm  label="Amount (comma or new line separated)"  
         placeholder="0.000000000000000000" 
         value={amounts}
         onChange={ e => setAmount(e.target.value)}
         large = {true} />

        <button
          onClick={handleApprove}
          className="bg-green-500 text-white px-4 py-2 rounded-lg focus:ring-4 focus:ring-green-400/30 focus:border-green-400 focus:outline-none transition-all duration-200 hover:border-zinc-400 active:bg-green-50 hover:cursor-pointer"
          disabled={isApproving || isApproved}
        >
          {isApproving ? "Approving..." : isApproved ? "Approved" : "Approve TSender to spend tokens"}
        </button>
        <button
          onClick={handleAirdrop}
          className="mt-4 bg-blue-500 text-white px-4 py-2 shadow-xs rounded-lg focus:ring-[4px] focus:ring-blue-400/30 focus:border-blue-400 focus:outline-none  align-text-top transition-all duration-200 hover:border-zinc-400 active:bg-blue-50 hover:cursor-pointer"
          disabled={!isApproved}
        >
          AIRDROP
        </button>
         {error && <div className="text-red-600 font-medium">{error}</div>}
         {txStatus === "pending" && <div className="text-blue-500">Transaction pending...</div>}
         {txStatus === "success" && txHash && (
           <div className="text-green-600">Airdrop sent! Tx: <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{txHash.slice(0, 10)}...</a></div>
         )}
         {txStatus === "error" && <div className="text-red-600">Airdrop failed.</div>}
       </div>
    )
}