# Account abstraction and Smart Accounts

So today we started learning about a very important part in blockchain tech. Smart accounts are 
smart contracts with programmable logic and act as wallets. 

`(C) - This is a contract`

## Two main parts of EIP-4337
UserOps - this is a struct that represents exactly what the user wants to do.
EntryPoint (C) - this is what verifies transactions in the alt mempool. If not valid, you are out!

### UserOps struct
There are a few fields that are very important to understand.
- sender
- nonce
- initCode (factory) * NB (C)
- Paymaster
- Signature
- Calldata ** NB

CALLDATA NB!! These are read only, temporary functions that go are passed as arguments to functions! If this is 0, then you would just be wasting gas as you are sending no data to the sender. This is basically the brain of the contract!

Paymaster (C) - This can be an account used to pay for gas fees. The sender could also be a paymaster.

### EntryPoint interface
This verifies transactions, to check if they are valid to stay in the mempool. This checks the fields in the contract:
- sender
- nonce
- initCode
- callData
- Paymaster
- Signature

When it goes on-chain, a packed `PackedUserOperation` is sent to the EntryPoint for verfication.
Transactions are now finally in the Alt Mempool.

Once verified, the transactions will now be in the Alt Mempool where bundlers can use this to gather/bundle transactions (of the price they want). 
