import { keccak256 } from "ethers/lib/utils";

describe("HASHING test", function () {
  before(async function () {
    const description = "du bist ein riesenarschloch";
    let digest = keccak256(description); //KeccakDigest(256);
    // let hash = digest.process(ascii.encode("input"));
    console.log(digest);

    // const hashed = keccak256();
  });
});
