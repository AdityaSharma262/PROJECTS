export const contractAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

export const contractABI = [
	{
		"inputs": [
			{
				"internalType": "uint16",
				"name": "jobId",
				"type": "uint16"
			}
		],
		"name": "acceptJob",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint16",
				"name": "jobId",
				"type": "uint16"
			}
		],
		"name": "approveSubmission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "createJob",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint16",
				"name": "jobId",
				"type": "uint16"
			}
		],
		"name": "rejectSubmission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint16",
				"name": "jobId",
				"type": "uint16"
			},
			{
				"internalType": "string",
				"name": "submission",
				"type": "string"
			}
		],
		"name": "submit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "jobCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "jobs",
		"outputs": [
			{
				"internalType": "address",
				"name": "client",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "freelancer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "enum FreelanceEscrow.jobStatus",
				"name": "status",
				"type": "uint8"
			},
			{
				"internalType": "uint16",
				"name": "rejectCount",
				"type": "uint16"
			},
			{
				"internalType": "bool",
				"name": "freelancerPaid",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]