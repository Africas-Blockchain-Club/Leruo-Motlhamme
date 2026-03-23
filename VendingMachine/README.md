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
