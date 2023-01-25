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
// import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/governance/utils/Votes.sol";
interface IProjectGovernor {
    function isLoyal(address account) external view returns (bool);
}

contract StakeNftToken is ERC721, ERC721Enumerable, Pausable, Ownable, EIP712, ERC721Votes {
    using Counters for Counters.Counter;
    // Counters.Counter private _tokenIdCounter;
    uint256 _tokenIdCounter = 200;
    Counters.Counter private _tokenWhitelistCounter; //numberOfAddressesWhitelisted = 0;
    address public creator;
    mapping(address => bool) public adminMembers;
    address public initialProposer; 
    uint public constant MAX_SUPPLY = 600;
    uint256 public constant PRICE = 20000000000000000; //0.02 ETH
    uint256 public constant ROYALTY = 5; // 5% royalty minimum must be, 5% of 0.02 ETH = 0.001 ETH;
    event Log(uint256 gas);
    
    // uint public constant gasLimit = 0.000021 ether;
    uint public constant MAX_PER_MINT = 5;

    // NFT Jsons linK: create two URIs. 
    //the contract will switch between these two URIs

    // dynamic
    string public aUri = "https://nftstorage.link/ipfs/bafybeihgrmaxuvbau7lp6lk2ninihqasxg7rjxix36l35giw4dakvkvkci/";

    //static
    string public bUri = "https://nftstorage.link/ipfs/bafybeiexpgwkw4wcpc6spqhtdgnuxpxpyiqgxe4tmdtvg3kwwe5gkpyreq/";
    string public baseExtension = ".json";

    address public myGov;
    address public myGlobalGov;

    struct local {
        bool whitelisted;
        uint mintAllowance;
    }
    mapping(address => local) internal whitelistedAddresses;
    uint maxNumberOfWhitelistedAddresses = 200;

    bool isWhitelistActive = true; 
    bool public whitelistPaused;

    constructor(address myLocalGovernor, address myGlobalGovernor) ERC721("ProjectToken", "PTK") EIP712("ProjectToken", "1") 
    public {
        // EIP712( name, version)
        //setBaseURI(baseURI);
        myGov = myLocalGovernor; // local Gov
        myGlobalGov = myGlobalGovernor;
        whitelistPaused = true;
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

    modifier onlyGovernor(){
        require(msg.sender == myGov, "Only the local governor can perform this action.");
        _;
    }

    function closeCollection() external {
        require(msg.sender == myGov, "Only the local governor can perform this action.");
        // send funds accumulated
        payable(myGlobalGov).transfer(address(this).balance);
        // release pausable nfts
        unpause();
    }

    // only governor
    function releaseFunds(address _receiver,uint256 _amount ) external{
        require(msg.sender == myGov, "Only the local governor can perform this action.");
        // send funds accumulated
        payable(_receiver).transfer(_amount);
        // release pausable nfts
        unpause();
    }


    function totalSupply() public view virtual override(ERC721Enumerable) returns (uint256){
        return MAX_SUPPLY; 
    }
    //the token URI function will contain the logic to determine what URI to show
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory)
    {
       
        require(
        _exists(tokenId),
        "ERC721Metadata: URI query for nonexistent token"
        );
        
        address currentOwner = ownerOf(tokenId);
        //if the block timestamp is divisible by 2 show the aURI
        if (IProjectGovernor(myGov).isLoyal(currentOwner)) {
            return bytes(aUri).length > 0
            ? string(abi.encodePacked(aUri, Strings.toString(tokenId), baseExtension))
            : "";
        }

        //if the block timestamp is NOT divisible by 2 show the bURI
        return bytes(bUri).length > 0
            ? string(abi.encodePacked(bUri, Strings.toString(tokenId), baseExtension))
            : "";
    }

    function _baseURI() internal view virtual override
        returns (string memory) {
    return bUri;
    }

    function setAdminMember(address account) public restricted adminOnly {
        adminMembers[account] = true;
    }

    function setAURI(string memory _baseTokenURI) public restricted {
        aUri = _baseTokenURI;
    }

    function setBURI(string memory _baseTokenURI) public restricted {
        bUri = _baseTokenURI;
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
        // require(whitelistPaused == false, "You cannot whitelist mint nfts at this time.");
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

    function pause() public adminOnly {
        whitelistPaused = true; 
        _pause();
    }

    function pauseLocalsOnly() public adminOnly {
        whitelistPaused = true; 
    }
    
    function unpauseLocalsOnly() public adminOnly {
        whitelistPaused = false; 
    }

    function unpause() public adminOnly {
        whitelistPaused = false;
        _unpause();
    }

    function transferFrom(address from, address to, uint256 tokenId) public override(ERC721) whenNotPaused {
        require((whitelistPaused == true && tokenId >= 200), "only non-whitelist tokens can be transferred at this time");
        payWithRoyalty(to);
        return super.transferFrom(from, to, tokenId);
    }

    function payWithRoyalty(address to) public payable {
        uint256 royaltyFee = ROYALTY * msg.value/100;
        if (royaltyFee < 1000000000000000){
            royaltyFee = 1000000000000000; 
        }
        require(msg.value >= royaltyFee, "you need to provide more ether to include royalties." );
        payable(address(this)).transfer(royaltyFee);
        uint remainder = msg.value - royaltyFee; 
        payable(to).transfer(remainder);
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
        // _getVotingUnits} (for example, make it return {ERC721-balanceOf}), and can use {_transferVotingUnits}
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
