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
    IERC20 public usdt;
    IERC20 public usdc;
    address public arbiter;
    
    enum TxState {
        OPEN, PAID, CONFIRMING, COMPLETED, REFUNDED
    }
    TxState public state;

    struct Tx {
        address seller;
        address buyer;
        uint256 amountOfUSDT;
        bool buyerPaid;
        TxState state;
    }

    // Mappings
    mapping (uint => Tx) public CurrentTrades;

    // Events
    event OpenedListing(address indexed seller, uint256 amountOfUSDT, uint TxID);
    event BuyerDeposited(address indexed buyer);
    event Confirmed(address indexed party);
    event ListingCompleted(address indexed seller, address indexed buyer, uint256 amountOfUSDT);

    uint256[50] private __gap;

    // Modifiers
    modifier onlySeller(uint _TxID) {
        require(CurrentTrades[_TxID].seller == msg.sender, "You are not the seller!");
        _;
    }

    modifier onlyBuyer(uint _TxID) {
        require(CurrentTrades[_TxID].buyer == msg.sender, "You are not the buyer!");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "You are not the arbiter!");
        _;
    }


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _usdtAddress, address _usdcAddress) public initializer {
        __Ownable_init(msg.sender);
        usdt = IERC20(_usdtAddress);
        usdc = IERC20(_usdcAddress);
        arbiter = msg.sender;
    }

    // Functions

    // Upgrader
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner() {
    }
}