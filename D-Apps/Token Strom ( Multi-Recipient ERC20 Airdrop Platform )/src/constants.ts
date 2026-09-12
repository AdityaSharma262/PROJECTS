export interface ContractsConfig {
    [chainId: number]: {
        name: string
        tsender: `0x${string}`
        no_check: `0x${string}` | null
    }
}

export const chainsToTSender: ContractsConfig = {
    1: {
        name: "Ethereum Mainnet",
        tsender: "0x3aD9F29AB266E4828450B33df7a9B9D7355Cd821",
        no_check: "0x7D4a746Cb398e5aE19f6cBDC08473664ADBc6da5",
    },
    10: {
        name: "Optimism",
        tsender: "0xAaf523DF9455cC7B6ca5637D01624BC00a5e9fAa",
        no_check: "0xa0c7ADA2c7c29729d12e2649BC6a0a293Ac46725",
    },
    8453: {
        name: "Base",
        tsender: "0x31801c3e09708549c1b2c9E1CFbF001399a1B9fa",
        no_check: "0x39338138414Df90EC67dC2EE046ab78BcD4F56D9",
    },
    42161: {
        name: "Arbitrum One",
        tsender: "0xA2b5aEDF7EEF6469AB9cBD99DE24a6881702Eb19",
        no_check: "0x091bAB6497F2Cc429c82c5807Df4faA34235Cccc",
    },
    324: {
        name: "zkSync Era",
        tsender: "0x7e645Ea4386deb2E9e510D805461aA12db83fb5E",
        no_check: null,
    },
    11155111: {
        name: "Sepolia Testnet",
        tsender: "0xa27c5C77DA713f410F9b15d4B0c52CAe597a973a",
        no_check: "0xa27c5C77DA713f410F9b15d4B0c52CAe597a973a",
    },
    31337: {
        name: "Anvil Local",
        tsender: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        no_check: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    },
    1337: {
        name: "Localhost",
        tsender: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        no_check: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    },
}

export const erc20Abi = [
    {
        type: "function",
        name: "name",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "symbol",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "decimals",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "balanceOf",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "allowance",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
    },
    {
        type: "function",
        name: "approve",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "transfer",
        inputs: [
            { name: "recipient", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
    },
    {
        type: "event",
        name: "Approval",
        inputs: [
            { indexed: true, name: "owner", type: "address" },
            { indexed: true, name: "spender", type: "address" },
            { indexed: false, name: "value", type: "uint256" },
        ],
    },
    {
        type: "event",
        name: "Transfer",
        inputs: [
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: false, name: "value", type: "uint256" },
        ],
    },
] as const

export const tsenderAbi = [
    {
        type: "function",
        name: "airdropERC20",
        inputs: [
            {
                name: "tokenAddress",
                type: "address",
                internalType: "address",
            },
            {
                name: "recipients",
                type: "address[]",
                internalType: "address[]",
            },
            {
                name: "amounts",
                type: "uint256[]",
                internalType: "uint256[]",
            },
            {
                name: "totalAmount",
                type: "uint256",
                internalType: "uint256",
            },
        ],
        outputs: [],
        stateMutability: "nonpayable",
    },
    {
        type: "function",
        name: "areListsValid",
        inputs: [
            {
                name: "recipients",
                type: "address[]",
                internalType: "address[]",
            },
            {
                name: "amounts",
                type: "uint256[]",
                internalType: "uint256[]",
            },
        ],
        outputs: [
            {
                name: "",
                type: "bool",
                internalType: "bool",
            },
        ],
        stateMutability: "pure",
    },
] as const
