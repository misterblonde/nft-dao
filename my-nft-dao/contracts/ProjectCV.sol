
pragma solidity 0.8.6; 

//^0.4.24;

import "./lib/TimeHelpers.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "./Math.sol";
import "./ArrayUtils.sol";



interface IERC721 {
     function balanceOf(address account) external view returns (uint256);
}

interface IStakeNftToken {
    function totalSupply() external view returns (uint256);
    function releaseFunds(address _receiver,uint256 _amount ) external;
}

contract ConvictionVoting {
    using SafeMath for uint256;
    // using SafeMath64 for uint64;
    // using ArrayUtils for uint256[];


enum ProposalStatus {
        Active,              // A vote that has been reported to Agreements
        Paused,              // A vote that is being challenged by Agreements
        Cancelled,           // A vote that has been cancelled
        Executed             // A vote that has been executed
    }

    struct Proposal {
        uint256 requestedAmount;
        bool stableRequestAmount;
        address beneficiary;
        uint256 stakedTokens;
        uint256 convictionLast;
        uint64 blockLast;
        // uint256 agreementActionId;
        ProposalStatus proposalStatus;
        mapping(address => uint256) voterStake;
        address submitter;
    }
    
    address public stakeToken;
    address public requestToken;
    address public stableToken;
    // IPriceOracle public stableTokenOracle;
    // FundsManager public fundsManager;
    address public fundsManager; 
    uint256 public decay;
    uint256 public maxRatio;
    uint256 public weight;
    uint256 public minThresholdStakePercentage;
    uint256 public proposalCounter;
    uint256 public totalStaked;
    bool public contractPaused;


    mapping(uint256 => Proposal) internal proposals;
    mapping(address => uint256) internal totalVoterStake;
    mapping(address => uint256[]) internal voterStakedProposals;


    uint256 public constant D = 10000000;
    uint256 public constant ONE_HUNDRED_PERCENT = 1e18;
    uint256 private constant TWO_128 = 0x100000000000000000000000000000000; // 2^128
    uint256 private constant TWO_127 = 0x80000000000000000000000000000000; // 2^127
    uint256 private constant TWO_64 = 0x10000000000000000; // 2^64
    uint256 public constant ABSTAIN_PROPOSAL_ID = 1;
    uint64 public constant MAX_STAKED_PROPOSALS = 10;

    string private constant ERROR_CONTRACT_PAUSED = "CV_CONTRACT_PAUSED";
    string private constant ERROR_PROPOSAL_DOES_NOT_EXIST = "CV_PROPOSAL_DOES_NOT_EXIST";
    string private constant ERROR_REQUESTED_AMOUNT_ZERO = "CV_REQUESTED_AMOUNT_ZERO";
    string private constant ERROR_NO_BENEFICIARY = "CV_NO_BENEFICIARY";
    string private constant ERROR_STAKING_ALREADY_STAKED = "CV_STAKING_ALREADY_STAKED";
    string private constant ERROR_PROPOSAL_NOT_ACTIVE = "CV_PROPOSAL_NOT_ACTIVE";
    string private constant ERROR_CANNOT_EXECUTE_ABSTAIN_PROPOSAL = "CV_CANNOT_EXECUTE_ABSTAIN_PROPOSAL";
    string private constant ERROR_CANNOT_EXECUTE_ZERO_VALUE_PROPOSAL = "CV_CANNOT_EXECUTE_ZERO_VALUE_PROPOSAL";
    string private constant ERROR_INSUFFICIENT_CONVICION = "CV_INSUFFICIENT_CONVICION";
    string private constant ERROR_SENDER_CANNOT_CANCEL = "CV_SENDER_CANNOT_CANCEL";
    string private constant ERROR_CANNOT_CANCEL_ABSTAIN_PROPOSAL = "CV_CANNOT_CANCEL_ABSTAIN_PROPOSAL";
    string private constant ERROR_AMOUNT_OVER_MAX_RATIO = "CV_AMOUNT_OVER_MAX_RATIO";
    string private constant ERROR_INCORRECT_TOKEN_MANAGER_HOOK = "CV_INCORRECT_TOKEN_MANAGER_HOOK";
    string private constant ERROR_AMOUNT_CAN_NOT_BE_ZERO = "CV_AMOUNT_CAN_NOT_BE_ZERO";
    string private constant ERROR_INCORRECT_PROPOSAL_STATUS = "CV_INCORRECT_PROPOSAL_STATUS";
    string private constant ERROR_STAKING_MORE_THAN_AVAILABLE = "CV_STAKING_MORE_THAN_AVAILABLE";
    string private constant ERROR_MAX_PROPOSALS_REACHED = "CV_MAX_PROPOSALS_REACHED";
    string private constant ERROR_WITHDRAW_MORE_THAN_STAKED = "CV_WITHDRAW_MORE_THAN_STAKED";
    string private constant ERROR_NO_TOKEN_MANAGER_SET = "CV_NO_TOKEN_MANAGER_SET";

    // event FundsManagerChanged(FundsManager fundsManager);
    event ConvictionSettingsChanged(uint256 decay, uint256 maxRatio, uint256 weight, uint256 minThresholdStakePercentage);
    event ProposalAdded(address indexed entity, uint256 indexed id, string title, bytes link, uint256 amount, bool stable, address beneficiary);
    event StakeAdded(address indexed entity, uint256 indexed id, uint256  amount, uint256 tokensStaked, uint256 totalTokensStaked, uint256 conviction);
    event StakeWithdrawn(address entity, uint256 indexed id, uint256 amount, uint256 tokensStaked, uint256 totalTokensStaked, uint256 conviction);
    event ProposalExecuted(uint256 indexed id, uint256 conviction);
    event ProposalPaused(uint256 indexed proposalId, uint256 indexed challengeId);
    event ProposalResumed(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);

    constructor(address _stakedToken, address _tokenAddress){
        stakeToken = _stakedToken;
        fundsManager = _tokenAddress; // has the monies
    }

    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId == 1 || proposals[_proposalId].submitter != address(0), ERROR_PROPOSAL_DOES_NOT_EXIST);
        _;
    }

    modifier notPaused() {
        require(!contractPaused, ERROR_CONTRACT_PAUSED);
        _;
    }

    function initialize(
        address _stakeToken,
        address _requestToken,
        address _stableToken,
        // IPriceOracle _stableTokenOracle,
        // FundsManager _fundsManager,
        address _fundsManager,
        uint256 _decay,
        uint256 _maxRatio,
        uint256 _weight,
        uint256 _minThresholdStakePercentage
    )
        external
    {
        proposalCounter = 2; // First proposal should be #2, #1 is reserved for abstain proposal, #0 is not used for better UX.
        stakeToken = _stakeToken;
        requestToken = _requestToken;
        stableToken = _stableToken;
        // stableTokenOracle = _stableTokenOracle;
        // fundsManager = _fundsManager;
        address fundsPool; 
        decay = _decay;
        maxRatio = _maxRatio;
        weight = _weight;
        minThresholdStakePercentage = _minThresholdStakePercentage;

        Proposal storage newProposal = proposals[ABSTAIN_PROPOSAL_ID] ;

        newProposal.requestedAmount = 0;
        newProposal.stableRequestAmount = false;
        newProposal.beneficiary = address(0);
        newProposal.stakedTokens = 0;
        newProposal.convictionLast = 0;
        newProposal.blockLast = 0;
        newProposal.proposalStatus = ProposalStatus.Active;
        // newProposal.voterStake = 0;
        newProposal.submitter = address(0);
    

        //     uint256 requestedAmount;
        // bool stableRequestAmount;
        // address beneficiary;
        // uint256 stakedTokens;
        // uint256 convictionLast;
        // uint64 blockLast;
        // // uint256 agreementActionId;
        // ProposalStatus proposalStatus;
        // mapping(address => uint256) voterStake;
        // address submitter;
        // proposals[ABSTAIN_PROPOSAL_ID] = new Proposal(
            // 0,
            // false,
            // 0x0,
            // 0,
            // 0,
            // 0,
            // 0,
            // ProposalStatus.Active,
            // 0x0
        // );
        // event ProposalAdded(address indexed entity, uint256 indexed id, string title, bytes link, uint256 amount, bool stable, address beneficiary);
        emit ProposalAdded(address(0), ABSTAIN_PROPOSAL_ID, "", "", 0, false, address(0));

        // initialized();
    }


// modifier auth(UPDATE_SETTINGS_ROLE)
    function setConvictionCalculationSettings(
        uint256 _decay,
        uint256 _maxRatio,
        uint256 _weight,
        uint256 _minThresholdStakePercentage
    )
        external 
    {
        decay = _decay;
        maxRatio = _maxRatio;
        weight = _weight;
        minThresholdStakePercentage = _minThresholdStakePercentage;

        emit ConvictionSettingsChanged(_decay, _maxRatio, _weight, _minThresholdStakePercentage);
    }

    function calculateConviction(uint64 _timePassed, uint256 _lastConv, uint256 _oldAmount) public view returns(uint256) {
        uint256 t = uint256(_timePassed);
        // atTWO_128 = 2^128 * a^t
        uint256 atTWO_128 = _pow((decay << 128).div(D), t);
        // solium-disable-previous-line
        // conviction = (atTWO_128 * _lastConv + _oldAmount * D * (2^128 - atTWO_128) / (D - aD) + 2^127) / 2^128
        return (atTWO_128.mul(_lastConv).add(_oldAmount.mul(D).mul(TWO_128.sub(atTWO_128)).div(D - decay))).add(TWO_127) >> 128;
    }

// authP(CREATE_PROPOSALS_ROLE, arr(msg.sender))
    function addProposal(string memory _title, bytes memory _link, uint256 _requestedAmount, bool _stableRequestAmount, address _beneficiary)
            external
        {
            require(_requestedAmount > 0, ERROR_REQUESTED_AMOUNT_ZERO);
            require(_beneficiary != address(0), ERROR_NO_BENEFICIARY);

            _addProposal(_title, _link, _requestedAmount, _stableRequestAmount, _beneficiary);
        }


// isInitialized modifier
    function stakeToProposal(uint256 _proposalId, uint256 _amount) external {
        _stake(_proposalId, _amount, msg.sender);
    }

    /**
     * @notice Stake all my `(self.stakeToken(): address).symbol(): string` tokens on proposal #`_proposalId`
     * @param _proposalId Proposal id
     */

     // isInitialized 
    function stakeAllToProposal(uint256 _proposalId) external{
        require(totalVoterStake[msg.sender] == 0, ERROR_STAKING_ALREADY_STAKED);
        _stake(_proposalId, IERC721(stakeToken).balanceOf(msg.sender), msg.sender);
    }

    /**
     * @notice Withdraw `@tokenAmount((self.stakeToken(): address), _amount)` previously staked on proposal #`_proposalId`
     * @param _proposalId Proposal id
     * @param _amount Amount of tokens withdrawn
     */
     // isInitialized 
    function withdrawFromProposal(uint256 _proposalId, uint256 _amount) external proposalExists(_proposalId) {
        _withdrawFromProposal(_proposalId, _amount, msg.sender);
    }

    /**
     * @notice Withdraw all `(self.stakeToken(): address).symbol(): string` tokens previously staked on proposal #`_proposalId`
     * @param _proposalId Proposal id
     */
          // isInitialized 
    function withdrawAllFromProposal(uint256 _proposalId) external proposalExists(_proposalId) {
        _withdrawFromProposal(_proposalId, proposals[_proposalId].voterStake[msg.sender], msg.sender);
    }

    /**
     * @notice Withdraw all callers stake from inactive proposals
     */
          // isInitialized 
    function withdrawFromInactiveProposals() external {
        uint256 MAX_INT = 115792089237316195423570985008687907853269984665640564039457584007913129639935;
        _withdrawInactiveStakedTokens(MAX_INT, msg.sender);
    }

    function calculateThreshold(uint256 _requestedAmount) public view returns (uint256 _threshold) {
        uint256 funds = fundsManager.balance; 
        // uint256 funds = fundsManager.balance(requestToken);
        require(maxRatio.mul(funds) > _requestedAmount.mul(D), ERROR_AMOUNT_OVER_MAX_RATIO);
        // denom = maxRatio * 2 ** 64 / D  - requestedAmount * 2 ** 64 / funds
        uint256 denom = (maxRatio << 64).div(D).sub((_requestedAmount << 64).div(funds));
        // _threshold = (weight * 2 ** 128 / D) / (denom ** 2 / 2 ** 64) * totalStaked * D / 2 ** 128
        _threshold = ((weight << 128).div(D).div(denom.mul(denom) >> 64)).mul(D).div(D.sub(decay)).mul(_totalStaked()) >> 64;
    }

    function _totalStaked() internal view returns (uint256) {
        uint256 minTotalStake = ( IStakeNftToken(stakeToken).totalSupply().mul(minThresholdStakePercentage)).div(ONE_HUNDRED_PERCENT);
        return totalStaked < minTotalStake ? minTotalStake : totalStaked;
    }

    function _getRequestAmount(Proposal storage proposal) internal view returns (uint256) {
        // return proposal.stableRequestAmount ?
        //     stableTokenOracle.consult(stableToken, proposal.requestedAmount, requestToken) : proposal.requestedAmount;
        return proposal.requestedAmount;
    }

    //
    // Multiply _a by _b / 2^128.  Parameter _a should be less than or equal to
    // 2^128 and parameter _b should be less than 2^128.
    // @param _a left argument
    // @param _b right argument
    // @return _a * _b / 2^128
    //
    function _mul(uint256 _a, uint256 _b) internal pure returns (uint256 _result) {
        require(_a <= TWO_128, "_a should be less than or equal to 2^128");
        require(_b < TWO_128, "_b should be less than 2^128");
        return _a.mul(_b).add(TWO_127) >> 128;
    }

    //
    // Calculate (_a / 2^128)^_b * 2^128.  Parameter _a should be less than 2^128.
     
    // @param _a left argument
    // @param _b right argument
    // @return (_a / 2^128)^_b * 2^128
    //
    function _pow(uint256 _a, uint256 _b) internal pure returns (uint256 _result) {
        require(_a < TWO_128, "_a should be less than 2^128");
        uint256 a = _a;
        uint256 b = _b;
        _result = TWO_128;
        while (b > 0) {
            if (b & 1 == 0) {
                a = _mul(a, a);
                b >>= 1;
            } else {
                _result = _mul(_result, a);
                b -= 1;
            }
        }
    }

    function getBlockNumber() internal view returns (uint256) {
        return block.number;
    }

    /**
    * @dev Returns the current block number, converted to uint64.
    *      Using a function rather than `block.number` allows us to easily mock the block number in
    *      tests.
    */
    function getBlockNumber64() internal view returns (uint64) {
        return getBlockNumber64();
    }

    /**
     * @dev Calculate conviction and store it on the proposal
     * @param _proposal Proposal
     * @param _oldStaked Amount of tokens staked on a proposal until now
     */
    function _calculateAndSetConviction(Proposal storage _proposal, uint256 _oldStaked) internal {
        uint64 blockNumber = getBlockNumber64();
        //getBlockNumber64();
        assert(_proposal.blockLast <= blockNumber);
        if (_proposal.blockLast == blockNumber) {
            return; // Conviction already stored
        }
        // calculateConviction and store it
        uint256 conviction = calculateConviction(
            blockNumber - _proposal.blockLast, // we assert it doesn't overflow above
            _proposal.convictionLast,
            _oldStaked
        );
        _proposal.blockLast = blockNumber;
        _proposal.convictionLast = conviction;
    }

    function _addProposal(string memory _title, bytes memory _link, uint256 _requestedAmount, bool _stableRequestAmount, address _beneficiary)
        internal notPaused
    {
        // uint256 agreementActionId = _registerDisputableAction(proposalCounter, _link, msg.sender);

        Proposal storage newProposal = proposals[proposalCounter] ;

        newProposal.requestedAmount = _requestedAmount;
        newProposal.stableRequestAmount = _stableRequestAmount;
        newProposal.beneficiary = _beneficiary;
        newProposal.stakedTokens = 0;
        newProposal.convictionLast = 0;
        newProposal.blockLast = 0;
        newProposal.proposalStatus = ProposalStatus.Active;
        // newProposal.voterStake = 0;
        newProposal.submitter = msg.sender;
 // removed: agreementActionId, 
        emit ProposalAdded(msg.sender, proposalCounter, _title, _link, _requestedAmount, _stableRequestAmount, _beneficiary);
        proposalCounter++;
    }

    /**
     * @dev Stake an amount of tokens on a proposal
     * @param _proposalId Proposal id
     * @param _amount Amount of staked tokens
     * @param _from Account from which we stake
     */
    function _stake(uint256 _proposalId, uint256 _amount, address _from) internal notPaused proposalExists(_proposalId) {
        // require(getTokenManager() != address(0), ERROR_NO_TOKEN_MANAGER_SET);

        Proposal storage proposal = proposals[_proposalId];
        require(_amount > 0, ERROR_AMOUNT_CAN_NOT_BE_ZERO);
        require(proposal.proposalStatus == ProposalStatus.Active || proposal.proposalStatus == ProposalStatus.Paused,
            ERROR_INCORRECT_PROPOSAL_STATUS);

        uint256 unstakedAmount = IERC721(stakeToken).balanceOf(_from).sub(totalVoterStake[_from]);
        if (_amount > unstakedAmount) {
            _withdrawInactiveStakedTokens(_amount.sub(unstakedAmount), _from);
        }

        require(totalVoterStake[_from].add(_amount) <= IERC721(stakeToken).balanceOf(_from), ERROR_STAKING_MORE_THAN_AVAILABLE);

        uint256 previousStake = proposal.stakedTokens;
        proposal.stakedTokens = proposal.stakedTokens.add(_amount);
        proposal.voterStake[_from] = proposal.voterStake[_from].add(_amount);
        totalVoterStake[_from] = totalVoterStake[_from].add(_amount);
        totalStaked = totalStaked.add(_amount);

        if (proposal.blockLast == 0) {
            proposal.blockLast = getBlockNumber64();
        } else {
            _calculateAndSetConviction(proposal, previousStake);
        }

        _updateVoterStakedProposals(_proposalId, _from);

        emit StakeAdded(_from, _proposalId, _amount, proposal.voterStake[_from], proposal.stakedTokens, proposal.convictionLast);
    }

    function _updateVoterStakedProposals(uint256 _proposalId, address _submitter) internal {
        uint256[] storage voterStakedProposalsArray = voterStakedProposals[_submitter];

        bool containsElem = false;
            
        for (uint i=0; i < voterStakedProposalsArray.length; i++) {
            if (_proposalId == voterStakedProposalsArray[i]) {
                containsElem = true;
                break;
            }
        }

        if (!containsElem) {
            require(voterStakedProposalsArray.length < MAX_STAKED_PROPOSALS, ERROR_MAX_PROPOSALS_REACHED);
            voterStakedProposalsArray.push(_proposalId);
        }
    }



    /**
     * @dev Withdraw staked tokens from executed proposals until a target amount is reached.
     * @param _targetAmount Target at which to stop withdrawing tokens
     * @param _from Account to withdraw from
     */
    function _withdrawInactiveStakedTokens(uint256 _targetAmount, address _from) internal {
        uint256 i = 0;
        uint256 toWithdraw;
        uint256 withdrawnAmount = 0;
        uint256[] memory voterStakedProposalsCopy = voterStakedProposals[_from];

        while (i < voterStakedProposalsCopy.length && withdrawnAmount < _targetAmount) {
            uint256 proposalId = voterStakedProposalsCopy[i];
            Proposal storage proposal = proposals[proposalId];

            if (proposal.proposalStatus == ProposalStatus.Executed || proposal.proposalStatus == ProposalStatus.Cancelled) {
                toWithdraw = proposal.voterStake[_from];
                if (toWithdraw > 0) {
                    _withdrawFromProposal(proposalId, toWithdraw, _from);
                    withdrawnAmount = withdrawnAmount.add(toWithdraw);
                }
            }
            i++;
        }
    }

    /**
     * @dev Withdraw staked tokens from active proposals until a target amount is reached.
     *      Assumes there are no inactive staked proposals, to save gas.
     * @param _targetAmount Target at which to stop withdrawing tokens
     * @param _from Account to withdraw from
     */
    function _withdrawActiveStakedTokens(uint256 _targetAmount, address _from) internal {
        uint256 i = 0;
        uint256 toWithdraw;
        uint256 withdrawnAmount = 0;
        // uint256[] voterStakedProposalsCopy = voterStakedProposals[_from];

        bool containsElem = false;
        for (uint i=0; i < voterStakedProposals[_from].length; i++) {
            if (ABSTAIN_PROPOSAL_ID == voterStakedProposals[_from][i]) {
                containsElem = true;
                break;
            }
        }
        if (!containsElem) {
            toWithdraw = Math.min256(_targetAmount, proposals[ABSTAIN_PROPOSAL_ID].voterStake[_from]);
            if (toWithdraw > 0) {
                _withdrawFromProposal(ABSTAIN_PROPOSAL_ID, toWithdraw, _from);
                withdrawnAmount = withdrawnAmount.add(toWithdraw);
            }
        }

        // We reset this variable as _withdrawFromProposal can update voterStakedProposals
        uint256[] memory voterStakedProposalsCopy = voterStakedProposals[_from];

        while (i < voterStakedProposalsCopy.length && withdrawnAmount < _targetAmount) {
            uint256 proposalId = voterStakedProposalsCopy[i];
            Proposal storage proposal = proposals[proposalId];

            // For active proposals, we only subtract the needed amount to reach the target
            toWithdraw = Math.min256(_targetAmount.sub(withdrawnAmount), proposal.voterStake[_from]);
            if (toWithdraw > 0) {
                _withdrawFromProposal(proposalId, toWithdraw, _from);
                withdrawnAmount = withdrawnAmount.add(toWithdraw);
            }
            i++;
        }
    }

    /**
     * @dev Withdraw an amount of tokens from a proposal
     * @param _proposalId Proposal id
     * @param _amount Amount of withdrawn tokens
     * @param _from Account to withdraw from
     */
    function _withdrawFromProposal(uint256 _proposalId, uint256 _amount, address _from) internal {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.voterStake[_from] >= _amount, ERROR_WITHDRAW_MORE_THAN_STAKED);
        require(_amount > 0, ERROR_AMOUNT_CAN_NOT_BE_ZERO);

        uint256 previousStake = proposal.stakedTokens;
        proposal.stakedTokens = proposal.stakedTokens.sub(_amount);
        proposal.voterStake[_from] = proposal.voterStake[_from].sub(_amount);
        totalVoterStake[_from] = totalVoterStake[_from].sub(_amount);
        totalStaked = totalStaked.sub(_amount);

        if (proposal.voterStake[_from] == 0) {
            ArrayUtils.removeItem(voterStakedProposals[_from], _proposalId);
        }

        if (proposal.proposalStatus == ProposalStatus.Active || proposal.proposalStatus == ProposalStatus.Paused) {
            _calculateAndSetConviction(proposal, previousStake);
        }

        emit StakeWithdrawn(_from, _proposalId, _amount, proposal.voterStake[_from], proposal.stakedTokens, proposal.convictionLast);
    }

//isInitialized 
    function executeProposal(uint256 _proposalId) external notPaused proposalExists(_proposalId) {
            Proposal storage proposal = proposals[_proposalId];

            require(_proposalId != ABSTAIN_PROPOSAL_ID, ERROR_CANNOT_EXECUTE_ABSTAIN_PROPOSAL);
            require(proposal.requestedAmount > 0, ERROR_CANNOT_EXECUTE_ZERO_VALUE_PROPOSAL);
            require(proposal.proposalStatus == ProposalStatus.Active, ERROR_PROPOSAL_NOT_ACTIVE);

            _calculateAndSetConviction(proposal, proposal.stakedTokens);
            uint256 requestedAmount = _getRequestAmount(proposal);
            require(proposal.convictionLast > calculateThreshold(requestedAmount), ERROR_INSUFFICIENT_CONVICION);

            proposal.proposalStatus = ProposalStatus.Executed;
            // _closeDisputableAction(proposal.agreementActionId);

            IStakeNftToken(stakeToken).releaseFunds(proposal.beneficiary, requestedAmount);
            // payable(fundsManager).transfer(requestToken, proposal.beneficiary, requestedAmount);

            emit ProposalExecuted(_proposalId, proposal.convictionLast);
        }


        function cancelProposal(uint256 _proposalId) external notPaused proposalExists(_proposalId) {
            Proposal storage proposal = proposals[_proposalId];

            // bool senderHasPermission = canPerform(msg.sender, CANCEL_PROPOSALS_ROLE, new uint256[](0));
            // require(proposal.submitter == msg.sender || senderHasPermission, ERROR_SENDER_CANNOT_CANCEL);
            // simplified to: 
            require(proposal.submitter == msg.sender, ERROR_SENDER_CANNOT_CANCEL);
            require(_proposalId != ABSTAIN_PROPOSAL_ID, ERROR_CANNOT_CANCEL_ABSTAIN_PROPOSAL);
            require(proposal.proposalStatus == ProposalStatus.Active, ERROR_PROPOSAL_NOT_ACTIVE);

            proposal.proposalStatus = ProposalStatus.Cancelled;
            // _closeDisputableAction(proposal.agreementActionId);

            emit ProposalCancelled(_proposalId);
        }
    }