
# NFT DAO

This Github contains two versions of an my-nft-dao, which are made up of smart contracts (**Solidity**) and
the relevant tests in **Hardhat/TypeScript**. 

The smart contracts give rise to the NFT DAO, ie. a DAO where membership is defined by
whether or not a user owns the relevant NFT (**token-based membership**).

Furthermore, the DAO allows proposal submission, depending on the number of NFT
tokens owned by the DAO member (**voting power**). 

Once a proposal was created, the voting follows
token-based quorum voting, either with our without quadratic voting.

Smart Contracts can be found in:
```my-nft-dao/contracts/```

Hardhat unit tests can be found: 

```my-nft-dao/test/governor/```

Deployment of new DAO versions via: 

```my-nft--dao/deploy```

Another Github explores a novel voting style, conviction voting.

## Deployment Details

These smart contracts have been deployed to the Rinkeby Test network for the
ethereum blockchain using 

```yarn hardhat deploy```


## Testing Details

```yarn hardhat test```

