import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "ethers";

export const getExpectedContractAddress = async (
  deployer: SignerWithAddress
): Promise<string> => {
  const adminAddressTransactionCount = await deployer.getTransactionCount();
  const expectedContractAddress = ethers.utils.getContractAddress({
    from: deployer.address,
    nonce: adminAddressTransactionCount + 2,
  });

  return expectedContractAddress;
};
