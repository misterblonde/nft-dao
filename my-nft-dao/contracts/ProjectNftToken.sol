// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/draft-ERC721Votes.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProjectNftToken is ERC721, Ownable, EIP712, ERC721Votes {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    address creator;
    address public initialProposer; 
    uint public constant MAX_SUPPLY = 600;
    uint256 public constant PRICE = 20000000000000000; //0.02 ETH
    event Log(uint256 gas);
    
    // uint public constant gasLimit = 0.000021 ether;
    uint public constant MAX_PER_MINT = 5;
    // NFT Jsons linK:
    string public baseTokenURI = "https://gateway.pinata.cloud/ipfs/QmR1yHJYafBkwCXMfnytoQXryiyWWiCncTotkKxsHghTGX/";

    constructor() ERC721("ProjectToken", "GT") EIP712("ProjectToken", "1") public payable {
        // EIP712( name, version)
        //setBaseURI(baseURI);
        creator = owner();
    }

    modifier restricted() {
        require((msg.sender == creator || msg.sender == owner()), "You do not have permission to use this function.");
        _;
    }

    function _baseURI() internal view virtual override
        returns (string memory) {
    return baseTokenURI;
    }

    function setBaseURI(string memory _baseTokenURI) public restricted {
        baseTokenURI = _baseTokenURI;
    }

    function safeMint(address to) public payable {
        require(msg.value >= (PRICE), "Not enough ether to purchase NFTs.");
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _tokenIdCounter.increment();
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Votes) {
        super._afterTokenTransfer(from, to, tokenId);
    }

    function _getVotingUnits(address account) internal view virtual override returns (uint256) {
        return balanceOf(account);
    }

    function setInitialProposer(address account) external {
        require(msg.sender == creator, "The proposer can only be set by the gov helper.");
        initialProposer = account;
    }

    // Fallback function must be external.
    fallback() external payable {
        emit Log(gasleft());
    }
}
