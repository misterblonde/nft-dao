pragma solidity 0.8.6;


library ArrayUtils {
    // function deleteItem(uint256[] storage self, uint256 item) internal returns (bool) {
    //     uint256 length = self.length;
    //     for (uint256 i = 0; i < length; i++) {
    //         if (self[i] == item) {
    //             uint256 newLength = self.length - 1;
    //             if (i != newLength) {
    //                 self[i] = self[newLength];
    //             }

    //             delete self[newLength];
    //             self.length = newLength;

    //             return true;
    //         }
    //     }
    //     return false;
    // }

function removeItem(uint256[] memory array, uint256 item) internal  {

// returns(uint[] storage) {
    uint256[] memory arr;
    uint256 len = array.length;
    uint256 idx =0;
    for (uint i = 0; i<len; i++){
        if (array[i] != item ){
            arr[idx] = array[i];
            idx++;
        }
    }
    for (uint i = 0; i <arr.length; i++){
        array[i] = arr[i];
    }

    // return array;
}
    //  function remove(uint256[] array, uint256 item)  returns(uint[]) {
    //     // if (index >= array.length) return;
    //     uint256[] backup = array; 
    //     uint startIdx; 
    //     for (uint i = 0; i<array.length; i++){
    //         if (item == array[i]){
    //             startIdx = i; 
    //         }
    //         if (!array[i+1]){
    //             backup[startIdx] = array[i+1];
    //         }
    //     }
    //     // delete array[array.length-1];
    //     array.length--;
    //     return array;
    // }

    function contains(uint256[] storage self, uint256 item) internal returns (bool) {
        for (uint256 i = 0; i < self.length; i++) {
            if (self[i] == item) {
                return true;
            }
        }
        return false;
    }
}
