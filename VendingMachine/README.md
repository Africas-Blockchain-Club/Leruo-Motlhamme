# Vending machine Dapp

We were tasked with building a very basic Dapp for our repos. The whole purpose is to understand ABIs and what they are used for.

## What is an ABI

Firstly, it stands for Application Binary Interface. ABIs allow you to connect a front end to a back end smart contract. It is the bridge of communication between the Dapp and EVM that hosts a smart contract. Without an ABI or ABIs, the Dapp will not know what functions are in the smart contract, what args they require as well as what those functions return. 

## What does this look like?

An ABI can is normally represented as a JSON. Below is an example of how the JSON would look for a simple function that sets a number of a variable. For the following function that I just mentioned:

```
function setNumber(uint256 _num) public {
    storedNumber = _num;
}
```
The ABI for the function would be the following: 
```
{
  "inputs": [
    {
      "internalType": "uint256",
      "name": "_num",
      "type": "uint256"
    }
  ],
  "name": "setNumber",
  "outputs": [],
  "stateMutability": "nonpayable",
  "type": "function"
}
```

You then connect to a contract in either Ether.js or Web3.js using `ethers.Contract(CONTRACT_ADDRESS, ABI, signer)`.


## Where can I find the ABI?

Once compiled, the ABI is stored in `artifacts/contracts/CONTRACT_NAME.sol`. In here, you will find the JSON formed from compiling the contract.

### Deployed contract 

https://sepolia.etherscan.io/address/0xBFF3814bc630B2fD1C1bbe2B1d5966154aB4C050#code

### Completed the Dapp

I am able to restock as well as buy cokes from the vending machine!