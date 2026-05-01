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
    uint256 public _nextID;
    
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
    mapping (uint => Tx) public CurrentTrades;

    // Events
    event OpenedListing(address indexed seller, uint256 amountOfSBC, uint TxID);
    event BuyerAccepted(address indexed buyer);
    event BuyerPaid(address indexed buyer);
    event Confirmed(address indexed party);
    event ListingCompleted(address indexed seller, address indexed buyer, uint256 amountOfUSDC);
    event Refunded(address indexed seller, uint256 amount);

    uint256[50] private __gap;

    // Modifiers
    modifier onlySeller(uint _TxID) {
        require(CurrentTrades[_TxID].seller == msg.sender, "You are not the seller!");
        _;
    }

    modifier onlyBuyer(uint _TxID) {
        require(CurrentTrades[_TxID].buyer != address(0), "Buyer is not initialized");
        require(CurrentTrades[_TxID].buyer == msg.sender, "You are not the buyer!");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "You are not the arbiter!");
        _;
    }

    modifier isOpenState(uint _TxID) {
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
        _nextID++;

        CurrentTrades[_nextID] = Tx({
            txId: _nextID,
            seller: msg.sender,
            buyer: address(0),
            amountOfSBC: _amountOfSBC,
            state: TxState.OPEN
        });

        usdc.safeTransferFrom(msg.sender, address(this), _amountOfSBC);

        emit OpenedListing(msg.sender, _amountOfSBC, _nextID);
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

    function cancelListing(uint _TxID) public onlySeller(_TxID) isOpenState(_TxID) {
        Tx storage trade = CurrentTrades[_TxID];
        trade.state = TxState.REFUNDED;

        usdc.safeTransfer(trade.seller, trade.amountOfSBC);

        emit Refunded(trade.seller, trade.amountOfSBC);
    }

    // Upgrader
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner() {
    }
}