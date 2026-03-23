import React, { useEffect, useState } from "react";
import Web3 from "web3";
import VendingMachineABI from "../../artifacts/contracts/VendingMachine.sol/VendingMachine.json";

const VendingMachine = () => {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState(1);
    const [userAddress, setUserAddress] = useState("");
    
    // New state variables for additional ABI functions
    const [ownerAddress, setOwnerAddress] = useState("");
    const [userCokeBalance, setUserCokeBalance] = useState(0);
    const [restockAmount, setRestockAmount] = useState(0);

    useEffect(() => {
        async function loadWeb3() {
            if (window.ethereum) {
                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);

                const vendingMachineContract = new web3Instance.eth.Contract(
                    VendingMachineABI.abi,
                    "0xBFF3814bc630B2fD1C1bbe2B1d5966154aB4C050"
                );
                setContract(vendingMachineContract);

                const accounts = await web3Instance.eth.requestAccounts();
                setUserAddress(accounts[0]);

                // Initial Data Fetch
                updateContractData(vendingMachineContract, accounts[0]);
            }
        }
        loadWeb3();
    }, []);

    // Helper to refresh UI data
    const updateContractData = async (contractInstance, address) => {
        const machineBalance = await contractInstance.methods.getVendingMachineBalance().call();
        const contractOwner = await contractInstance.methods.owner().call();
        const myCokes = await contractInstance.methods.cokeBalances(address).call();
        
        setBalance(machineBalance);
        setOwnerAddress(contractOwner);
        setUserCokeBalance(myCokes);
    };

    const handlePurchase = async () => {
        try {
            // Adjust the value calculation if your contract requires a specific price per item
            const ethValue = web3.utils.toWei((amount * 0.000001).toString(), "ether");
            await contract.methods.purchase(amount).send({ from: userAddress, value: ethValue });
            await updateContractData(contract, userAddress);
        } catch (error) {
            console.error("Purchase failed", error);
        }
    };

    const handleRestock = async () => {
        try {
            await contract.methods.restock(restockAmount).send({ from: userAddress });
            await updateContractData(contract, userAddress);
            setRestockAmount(0);
        } catch (error) {
            console.error("Restock failed. Are you the owner?", error);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold">Vending Machine Dapp</h1>
            
            <div className="bg-gray-100 p-4 rounded-lg shadow">
                <p><strong>Contract Owner:</strong> {ownerAddress}</p>
                <p><strong>Your Address:</strong> {userAddress}</p>
                <p><strong>Your Inventory:</strong> {userCokeBalance} Cokes</p>
                <p className="text-blue-600 font-bold">Machine Stock: {balance}</p>
            </div>

            <hr />

            {/* Purchase Section */}
            <div className="flex flex-col space-y-2">
                <h2 className="text-xl font-semibold">Buy Cokes</h2>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="border rounded p-2 w-24"
                    />
                    <button onClick={handlePurchase} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                        Purchase
                    </button>
                </div>
            </div>

            {/* Restock Section (Only visible/functional for owner) */}
            <div className="flex flex-col space-y-2 border-t pt-4">
                <h2 className="text-xl font-semibold">Admin: Restock Machine</h2>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={restockAmount}
                        onChange={(e) => setRestockAmount(e.target.value)}
                        className="border rounded p-2 w-24"
                        placeholder="Qty"
                    />
                    <button onClick={handleRestock} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
                        Restock
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VendingMachine;