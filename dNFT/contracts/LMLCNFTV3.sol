// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";


contract LMLIFECLUB_NFTV3 is Initializable, ERC721Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable {

    uint256 public nextTokenId;
    string public baseURI; //Using Pinata for hosting metadata and images
    uint256 public constant MAX_VISITS = 15;



    // Mapping
    mapping (uint256 => address) public tokenOwner; // Maps an address to the token ID of the NFT they own
    mapping (uint256 => uint256) public tokensSiteVisits; // Map tokenID to siteVisits

    // Reserve slot gap
    uint256[50] private __gap;

    // Events
    event MintedNFT(uint256 tokenId, address owner);
    event PointsUpdated(uint256 tokenId, uint256 points);
    event UpdatedMetadata(uint256 tokenId);


    ///@custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory baseURI_)  public initializer{
        baseURI = baseURI_;
        __ERC721_init("LMLIFECLUB-NFT", "LMLC");
        __Ownable_init(msg.sender);
        //__UUPSUpgradeable_init();
    }

    function mint(address to) public onlyOwner {
        require(balanceOf(to) == 0, "You are only allowed to mint one NFT to user and have already minted one");
        _safeMint(to , nextTokenId);
        tokenOwner[nextTokenId] = to;
        tokensSiteVisits[nextTokenId] = 0;
        nextTokenId++;

        emit MintedNFT(nextTokenId - 1, to);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");

        // This takes your Pinata 'base URI + CID' and attaches the token ID
        // Example: https://gateway.pinata.cloud/ipfs/CID/1.json

        if (tokensSiteVisits[tokenId] < 15) {
            return string(abi.encodePacked(baseURI, "0.json"));
        } else {
            return string(abi.encodePacked(baseURI, "1.json"));
        }
    }

    function setBaseURI(string memory baseURI_) public onlyOwner {
        baseURI = baseURI_;
    }

    function updatePoints(uint256 tokenId, uint256 points) public onlyOwner {
        if (tokensSiteVisits[tokenId] + points > MAX_VISITS) {
            tokensSiteVisits[tokenId] = MAX_VISITS;
        } else {
            tokensSiteVisits[tokenId] = tokensSiteVisits[tokenId] + points;
        }

        emit PointsUpdated(tokenId, tokensSiteVisits[tokenId]);
        emit UpdatedMetadata(tokenId);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0) && to != address(0)) {
            revert("LifeClub: This NFT is Soulbound and cannot be transferred.");
        }

        return super._update(to, tokenId, auth);
    }


    function _authorizeUpgrade(address newImpl) internal override  onlyOwner {}
}