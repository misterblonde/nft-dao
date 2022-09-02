// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/draft-ERC721Votes.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNftToken is ERC721, Ownable, EIP712, ERC721Votes {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    address creator;
    uint public constant MAX_SUPPLY = 600;
    uint256 public constant PRICE = 20000000000000000; //0.08 ETH
    // uint public constant PRICE = 0.00001 ether; // change units or add gas limit?
    // uint public constant gasLimit = 0.000021 ether;
    uint public constant MAX_PER_MINT = 5;
    string public baseTokenURI = "https://gateway.pinata.cloud/ipfs/QmR1yHJYafBkwCXMfnytoQXryiyWWiCncTotkKxsHghTGX/";

    constructor() ERC721("GenesisToken", "GT") EIP712("GenesisToken", "1") {
        // EIP712( name, version)
        //setBaseURI(baseURI);
        creator = owner();
    }
    // NFT Jsons linK:
    //QmaSFfxno1hRqBave6RVgEvYvGiWzhK3Cyytyxnp4MSVod
    // https://gateway.pinata.cloud/ipfs/QmaSFfxno1hRqBave6RVgEvYvGiWzhK3Cyytyxnp4MSVod

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

    // function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    // return Strings.strConcat(
    //     baseTokenURI(),
    //     Strings.uint2str(_tokenId),
    //     ".json"
    // );
    // }

    function safeMint(address to) public payable {
        // ! current issue 
        require(msg.value >= (PRICE), "Not enough ether to purchase NFTs.");
        // require(apePrice.mul(numberOfTokens) <= msg.value, "Ether value sent is not correct");
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        _tokenIdCounter.increment();
    }

    // The following functions are overrides required by Solidity.

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
}
