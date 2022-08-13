// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/draft-ERC721Votes.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";



contract ProjectNftToken is ERC721, ERC721Enumerable, Pausable, Ownable, EIP712, ERC721Votes {
    using Counters for Counters.Counter;
    // Counters.Counter private _tokenIdCounter;
    uint256 _tokenIdCounter = 200;
    Counters.Counter private _tokenWhitelistCounter; //numberOfAddressesWhitelisted = 0;
    address public creator;
    mapping(address => bool) public adminMembers;
    address public initialProposer; 
    uint public constant MAX_SUPPLY = 600;
    uint256 public constant PRICE = 20000000000000000; //0.02 ETH
    event Log(uint256 gas);
    
    // uint public constant gasLimit = 0.000021 ether;
    uint public constant MAX_PER_MINT = 5;
    // NFT Jsons linK:
    string public baseTokenURI = "https://gateway.pinata.cloud/ipfs/QmR1yHJYafBkwCXMfnytoQXryiyWWiCncTotkKxsHghTGX/";

    struct local {
        bool whitelisted;
        uint mintAllowance;
    }
    mapping(address => local) internal whitelistedAddresses;
    uint maxNumberOfWhitelistedAddresses = 200;

    bool isWhitelistActive = true; 
    bool public whitelistPaused;

    constructor() ERC721("ProjectToken", "PTK") EIP712("ProjectToken", "1") 
    public {
        // EIP712( name, version)
        //setBaseURI(baseURI);
        creator = owner();
    }

    modifier restricted() {
        require((msg.sender == creator || msg.sender == owner()), "Proj Nft: You do not have permission to use this function.");
        _;
    }

    modifier adminOnly() {
        require((adminMembers[msg.sender] == true || msg.sender == owner()), "Proj Nft: Only DAO admin can execute this function.");
        _;
    }

    function _baseURI() internal view virtual override
        returns (string memory) {
    return baseTokenURI;
    }

    function setAdminMember(address account) public restricted adminOnly {
        adminMembers[account] = true;
    }

    function setBaseURI(string memory _baseTokenURI) public restricted {
        baseTokenURI = _baseTokenURI;
    }

    function setWhitelist(address[] calldata addresses) external adminOnly {
        // require(whitelistPaused == true, "You cannot change the whitelist whilst it is active");
        for (uint256 i = 0; i < addresses.length; i++) {
            address _addressToWhitelist = addresses[i];
            // Validate the caller is not already part of the whitelist.
            require(!whitelistedAddresses[_addressToWhitelist].whitelisted, "Error: Sender already been whitelisted");
            // Validate if the maximum number of whitelisted addresses is not reached. If not, then throw an error.
            // require(_tokenWhitelistCounter.current() < maxNumberOfWhitelistedAddresses, "Error: Whitelist Limit exceeded");
            // allow each local wallet address holder to mint 1 NFT beforehand
            whitelistedAddresses[addresses[i]].mintAllowance = 1;
            whitelistedAddresses[addresses[i]].whitelisted = true;
            // _tokenWhitelistCounter.increment();
        }
    }

    // numberOfTokens = 1
    function mintWhitelist() external payable {
        require(whitelistPaused == false, "You cannot whitelist mint nfts at this time.");
        uint256 ts = _tokenWhitelistCounter.current();
        require(isWhitelistActive, "Allow list is not active");
        require(1 <= whitelistedAddresses[msg.sender].mintAllowance, "Caller not allowed to purchase whitelist NFT");
        require(ts + 1 <= maxNumberOfWhitelistedAddresses, "Purchase would exceed max whitelist tokens");
        require(PRICE * 1 <= msg.value, "Ether value sent is not correct");

        whitelistedAddresses[msg.sender].mintAllowance -= 1;
        // for (uint256 i = 0; i < 1; i++) 
        uint256 tokenId = _tokenWhitelistCounter.current(); 
        //_tokenIdCounter; //.current();
        _safeMint(msg.sender, tokenId);
        _tokenWhitelistCounter.increment(); // += 1; //.increment();
    }

    // Is the user whitelisted?
    function isWhitelisted(address _whitelistedAddress)
        public
        view
        returns (bool)
    {
        // Verifying if the user has been whitelisted - independent of whether they have minted or not? 
        return whitelistedAddresses[_whitelistedAddress].whitelisted;
    }

    function safeMint(address to) public payable {
        require(msg.value >= (PRICE), "Not enough ether to purchase NFTs.");
        uint256 tokenId = _tokenIdCounter; //.current();
        _safeMint(to, tokenId);
        _tokenIdCounter += 1; //.increment();
    }

    function getBalance() public view returns (uint256){
        return address(this).balance;
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

    function pause() public onlyOwner {
        whitelistPaused = true; 
        _pause();
    }

    function pauseLocalsOnly() public onlyOwner {
        whitelistPaused = true; 
    }

    function unpause() public onlyOwner {
        whitelistPaused = false;
        _unpause();
    }

    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721) whenNotPaused {
        // require((whitelistPaused == false && (tokenId < 200)), "You cannot transfer whitelist nfts at this time.");
        require((whitelistPaused == true && tokenId >= 200), "only non-whitelist tokens can be transferred at this time");
        return super.transferFrom(from, to, tokenId);
    }


    function safeTransferFrom(address from, address to, uint256 tokenId) public override(ERC721) whenNotPaused {
        // require((whitelistPaused == false && (tokenId < 200)), "You cannot transfer whitelist nfts at this time.");
        require((whitelistPaused == true && tokenId >= 200), "only non-whitelist tokens can be transferred at this time");
        return super.safeTransferFrom(from, to, tokenId);
    }


    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.
    function _afterTokenTransfer(address from, address to, uint256 tokenId)
        internal
        override(ERC721, ERC721Votes)
    {
        super._afterTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view override(ERC721Enumerable) returns (uint256) {
        
        return super.tokenOfOwnerByIndex(owner, index);
    }
}
