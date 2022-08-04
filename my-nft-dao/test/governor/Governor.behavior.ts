import { expect } from "chai";

export function getInitialNftBalance(): void {
  it("initially no NFTs have been minted", async function () {
    expect(
      (await this.token.balanceOf(this.signers.admin.address)).toNumber()
    ).to.equal(0);

    console.log(
      (await this.token.balanceOf(this.signers.admin.address)).toNumber()
    );
    (await this.token.balanceOf(this.signers.admin.address)).toNumber();
  });
}
