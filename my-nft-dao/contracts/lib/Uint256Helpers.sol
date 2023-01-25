pragma solidity ^0.8.6;


library Uint256Helpers {
    uint256 private constant MAX_UINT64 = 18446744073709551615;
    // uint64(-1) max uint64

    string private constant ERROR_NUMBER_TOO_BIG = "UINT64_NUMBER_TOO_BIG";

    function toUint64(uint256 a) internal pure returns (uint64) {
        require(a <= MAX_UINT64, ERROR_NUMBER_TOO_BIG);
        return uint64(a);
    }
}