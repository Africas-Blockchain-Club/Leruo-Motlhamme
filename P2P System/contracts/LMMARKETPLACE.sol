// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract LmMarketplace is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    // Storage variables
    IERC20 public usdc;
    address public arbiter;
    uint256 public nextID;
    
    enum TxState {
        OPEN, ACCEPTED, PAID, DISPUTED, COMPLETED, REFUNDED
    }

    struct Tx {
        uint256 txId;
        address seller;
        address buyer;
        uint256 amountOfSBC;
        TxState state;
    }

    // Mappings
    mapping (uint256 => Tx) public CurrentTrades;

    // Events
    event OpenedListing(address indexed seller, uint256 amountOfSBC, uint256 TxID);
    event BuyerAccepted(address indexed buyer);
    event BuyerPaid(address indexed buyer);
    event ListingCompleted(address indexed seller, address indexed buyer, uint256 amountOfUSDC);
    event DisputeOpened(address indexed party);
    event Resolved(address indexed arb, bool refundSeller);
    event Refunded(address indexed seller, uint256 amount);

    uint256[50] private __gap;

    // Modifiers
    modifier onlySeller(uint256 _TxID) {
        require(CurrentTrades[_TxID].seller == msg.sender, "You are not the seller!");
        _;
    }

    modifier onlyBuyer(uint256 _TxID) {
        require(CurrentTrades[_TxID].buyer != address(0), "Buyer is not initialized");
        require(CurrentTrades[_TxID].buyer == msg.sender, "You are not the buyer!");
        _;
    }

    modifier onlyBuyerOrSeller(uint256 _TxID){
        require(CurrentTrades[_TxID].buyer != address(0), "Buyer is not initialized");
        require(CurrentTrades[_TxID].buyer == msg.sender || CurrentTrades[_TxID].seller == msg.sender,"Only the buyer or seller are allowed to call this!");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "You are not the arbiter!");
        _;
    }

    modifier isOpenState(uint256 _TxID) {
        require(CurrentTrades[_TxID].state == TxState.OPEN, "Listing is not open!");
        _;
    }


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _usdcAddress) public initializer {
        __Ownable_init(msg.sender);
        usdc = IERC20(_usdcAddress);
        arbiter = msg.sender;
    }

    // Functions
    function createListing(uint256 _amountOfSBC) public {
        require(_amountOfSBC > 0, "Cannot list anything below 0");
        require(usdc.allowance(msg.sender, address(this)) >= _amountOfSBC, "You have not given allowance");
        require(usdc.balanceOf(msg.sender) >= _amountOfSBC, "You do not have enough USDC to sell!");
        nextID++;

        CurrentTrades[nextID] = Tx({
            txId: nextID,
            seller: msg.sender,
            buyer: address(0),
            amountOfSBC: _amountOfSBC,
            state: TxState.OPEN
        });

        usdc.safeTransferFrom(msg.sender, address(this), _amountOfSBC);

        emit OpenedListing(msg.sender, _amountOfSBC, nextID);
    }

    function acceptListing(uint256 _txId) public isOpenState(_txId) {
        Tx storage trade = CurrentTrades[_txId];

        require(msg.sender != trade.seller, "Seller cannot buy own USDC!");

        trade.state = TxState.ACCEPTED;
        trade.buyer = msg.sender;

        emit BuyerAccepted(msg.sender);

    }

    function setAsPaid(uint256 _txId) public onlyBuyer(_txId) {
        Tx storage trade = CurrentTrades[_txId];

        require(trade.state == TxState.ACCEPTED, "Accept the listing first");

        trade.state = TxState.PAID;
        
        emit BuyerPaid(msg.sender);
    }

    function confirmReceipt(uint256 _txId) public onlySeller(_txId) {
        Tx storage trade = CurrentTrades[_txId];

        require(trade.state == TxState.PAID, "Incorrect state!");

        address buyer = trade.buyer;
        address seller = trade.seller;
        uint256 amount = trade.amountOfSBC;

        delete CurrentTrades[_txId];

        usdc.safeTransfer(buyer, amount);

        emit ListingCompleted(seller, buyer, amount);
    }

    function openDispute(uint256 _txId) public onlyBuyerOrSeller(_txId) {
        Tx storage trade = CurrentTrades[_txId];

        // Dispute will only happen once a buyer 'claims' they have paid
        require(trade.state == TxState.PAID, "Incorrect state!");

        trade.state = TxState.DISPUTED;

        emit DisputeOpened(msg.sender);
    }

    function resolveDispute(uint256 _txId, bool refundSeller) public onlyArbiter() {
        Tx storage trade = CurrentTrades[_txId];

        require(trade.state == TxState.DISPUTED, "Incorrect state!");

        address buyer = trade.buyer;
        address seller = trade.seller;
        uint256 amount = trade.amountOfSBC;

        if (refundSeller == true){
            usdc.safeTransfer(seller, amount);
        }

        if (refundSeller == false){
            usdc.safeTransfer(buyer, amount);
        }

        delete CurrentTrades[_txId];

        emit Resolved(arbiter, refundSeller);
    }

    function cancelListing(uint256 _TxID) public onlySeller(_TxID) isOpenState(_TxID) {
        Tx storage trade = CurrentTrades[_TxID];
        address seller = trade.seller;
        uint256 amount = trade.amountOfSBC;

        usdc.safeTransfer(seller, amount);

        delete CurrentTrades[_TxID];

        emit Refunded(seller, amount);
    }

    // Upgrader
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner() {
    }
}