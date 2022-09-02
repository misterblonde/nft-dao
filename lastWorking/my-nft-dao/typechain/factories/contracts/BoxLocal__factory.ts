/* Autogenerated file. Do not edit manually. */

/* tslint:disable */

/* eslint-disable */
import type { PromiseOrValue } from "../../common";
import type { BoxLocal, BoxLocalInterface } from "../../contracts/BoxLocal";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  PayableOverrides,
} from "ethers";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "myGovernor",
        type: "address",
      },
      {
        internalType: "address",
        name: "myGovernorHelper",
        type: "address",
      },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "gas",
        type: "uint256",
      },
    ],
    name: "Log",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "newValue",
        type: "uint256",
      },
    ],
    name: "ValueChanged",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "adminMembers",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "closeBox",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "governorHelper",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "isAdmin",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "myGlobalGov",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "myLocalGov",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "removeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "retrieve",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "setAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "localGov",
        type: "address",
      },
    ],
    name: "setLocalGov",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "newValue",
        type: "uint256",
      },
    ],
    name: "store",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040526040516107c53803806107c5833981016040819052610022916100c8565b61002b3361005c565b600180546001600160a01b039384166001600160a01b031991821617909155600280549290931691161790556100fb565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b80516001600160a01b03811681146100c357600080fd5b919050565b600080604083850312156100db57600080fd5b6100e4836100ac565b91506100f2602084016100ac565b90509250929050565b6106bb8061010a6000396000f3fe6080604052600436106100ad5760003560e01c806305bf4f35146100e25780631785f53c14610127578063218bc4321461016557806324d7806c1461019d5780632e64cec1146101d657806356e0233b146101f4578063584bae88146102145780636057361d14610229578063704b6c0214610249578063715018a6146102695780638da5cb5b1461027e57806393ef21cf14610293578063f2fde38b146102b3578063ff73aef3146102d3575b7f909c57d5c6ac08245cf2a6de3900e2b868513fa59099b92b27d8db823d92df9c5a60405190815260200160405180910390a1005b3480156100ee57600080fd5b506101126100fd366004610637565b60056020526000908152604090205460ff1681565b60405190151581526020015b60405180910390f35b34801561013357600080fd5b50610163610142366004610637565b6001600160a01b03166000908152600560205260409020805460ff19169055565b005b34801561017157600080fd5b50600154610185906001600160a01b031681565b6040516001600160a01b03909116815260200161011e565b3480156101a957600080fd5b506101126101b8366004610637565b6001600160a01b031660009081526005602052604090205460ff1690565b3480156101e257600080fd5b5060045460405190815260200161011e565b34801561020057600080fd5b50600354610185906001600160a01b031681565b34801561022057600080fd5b506101636102f3565b34801561023557600080fd5b50610163610244366004610667565b610337565b34801561025557600080fd5b50610163610264366004610637565b6103e5565b34801561027557600080fd5b5061016361046b565b34801561028a57600080fd5b5061018561047f565b34801561029f57600080fd5b50600254610185906001600160a01b031681565b3480156102bf57600080fd5b506101636102ce366004610637565b61048e565b3480156102df57600080fd5b506101636102ee366004610637565b610504565b6102fb610588565b6001546040516001600160a01b03909116904780156108fc02916000818181858888f19350505050158015610334573d6000803e3d6000fd5b50565b6001546001600160a01b031633148061035a57506003546001600160a01b031633145b8061037d575061036861047f565b6001600160a01b0316336001600160a01b0316145b6103a25760405162461bcd60e51b815260040161039990610680565b60405180910390fd5b6103aa610588565b60048190556040518181527f93fe6d397c74fdf1402a8b72e47b68512f0510d7b98a4bc4cbdf6ac7108b3c599060200160405180910390a150565b6001546001600160a01b031633148061040857506003546001600160a01b031633145b8061042b575061041661047f565b6001600160a01b0316336001600160a01b0316145b6104475760405162461bcd60e51b815260040161039990610680565b6001600160a01b03166000908152600560205260409020805460ff19166001179055565b610473610588565b61047d60006105e7565b565b6000546001600160a01b031690565b610496610588565b6001600160a01b0381166104fb5760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201526564647265737360d01b6064820152608401610399565b610334816105e7565b6001546001600160a01b031633148061052757506003546001600160a01b031633145b8061054a575061053561047f565b6001600160a01b0316336001600160a01b0316145b6105665760405162461bcd60e51b815260040161039990610680565b600380546001600160a01b0319166001600160a01b0392909216919091179055565b3361059161047f565b6001600160a01b03161461047d5760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e65726044820152606401610399565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b60006020828403121561064957600080fd5b81356001600160a01b038116811461066057600080fd5b9392505050565b60006020828403121561067957600080fd5b5035919050565b60208082526014908201527327b7363c902220a79031b0b7103ab83230ba329760611b60408201526060019056fea164736f6c6343000806000a";

type BoxLocalConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: BoxLocalConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class BoxLocal__factory extends ContractFactory {
  constructor(...args: BoxLocalConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    myGovernor: PromiseOrValue<string>,
    myGovernorHelper: PromiseOrValue<string>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<BoxLocal> {
    return super.deploy(
      myGovernor,
      myGovernorHelper,
      overrides || {}
    ) as Promise<BoxLocal>;
  }
  override getDeployTransaction(
    myGovernor: PromiseOrValue<string>,
    myGovernorHelper: PromiseOrValue<string>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      myGovernor,
      myGovernorHelper,
      overrides || {}
    );
  }
  override attach(address: string): BoxLocal {
    return super.attach(address) as BoxLocal;
  }
  override connect(signer: Signer): BoxLocal__factory {
    return super.connect(signer) as BoxLocal__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): BoxLocalInterface {
    return new utils.Interface(_abi) as BoxLocalInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): BoxLocal {
    return new Contract(address, _abi, signerOrProvider) as BoxLocal;
  }
}