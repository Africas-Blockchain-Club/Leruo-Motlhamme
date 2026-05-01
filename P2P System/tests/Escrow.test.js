const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

// Helpers
const usdc = (amount) => ethers.parseUnits(amount.toString(), 6);

describe("LmMarketplace", function () {
    let marketplace, mockUSDC;
    let owner, seller, buyer, arbiter, stranger;

    beforeEach(async function () {
        [owner, seller, buyer, arbiter, stranger] = await ethers.getSigners();

        // Deploy a minimal ERC20 mock for USDC (6 decimals)
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);

        // Mint USDC to seller and buyer
        await mockUSDC.mint(seller.address, usdc(10_000));
        await mockUSDC.mint(buyer.address, usdc(10_000));

        // Deploy marketplace via UUPS proxy
        const LmMarketplace = await ethers.getContractFactory("LmMarketplace");
        marketplace = await upgrades.deployProxy(LmMarketplace, [await mockUSDC.getAddress()], {
            initializer: "initialize",
            kind: "uups",
        });

        // Override arbiter to a dedicated signer (owner is arbiter by default after init)
        // For these tests owner == arbiter
    });

    // ─── createListing ────────────────────────────────────────────────────────

    describe("createListing", function () {
        it("creates a listing and pulls USDC into the contract", async function () {
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));

            await expect(marketplace.connect(seller).createListing(usdc(200)))
                .to.emit(marketplace, "OpenedListing")
                .withArgs(seller.address, usdc(200), 1n);

            const trade = await marketplace.CurrentTrades(1);
            expect(trade.txId).to.equal(1n);
            expect(trade.seller).to.equal(seller.address);
            expect(trade.buyer).to.equal(ethers.ZeroAddress);
            expect(trade.amountOfSBC).to.equal(usdc(200));
            expect(trade.state).to.equal(0); // OPEN

            expect(await mockUSDC.balanceOf(await marketplace.getAddress())).to.equal(usdc(200));
        });

        it("increments nextID for each new listing", async function () {
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(600));

            await marketplace.connect(seller).createListing(usdc(100));
            await marketplace.connect(seller).createListing(usdc(200));
            await marketplace.connect(seller).createListing(usdc(300));

            expect(await marketplace.nextID()).to.equal(3n);
        });

        it("reverts when amount is 0", async function () {
            await expect(marketplace.connect(seller).createListing(0))
                .to.be.revertedWith("Cannot list anything below 0");
        });

        it("reverts when seller has not approved the contract", async function () {
            await expect(marketplace.connect(seller).createListing(usdc(200)))
                .to.be.revertedWith("You have not given allowance");
        });

        it("reverts when seller has insufficient balance", async function () {
            const huge = usdc(999_999);
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), huge);
            await expect(marketplace.connect(seller).createListing(huge))
                .to.be.revertedWith("You do not have enough USDC to sell!");
        });
    });

    // ─── acceptListing ────────────────────────────────────────────────────────

    describe("acceptListing", function () {
        beforeEach(async function () {
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
        });

        it("buyer can accept an open listing", async function () {
            await expect(marketplace.connect(buyer).acceptListing(1))
                .to.emit(marketplace, "BuyerAccepted")
                .withArgs(buyer.address);

            const trade = await marketplace.CurrentTrades(1);
            expect(trade.buyer).to.equal(buyer.address);
            expect(trade.state).to.equal(1); // ACCEPTED
        });

        it("reverts when the seller tries to accept their own listing", async function () {
            await expect(marketplace.connect(seller).acceptListing(1))
                .to.be.revertedWith("Seller cannot buy own USDC!");
        });

        it("reverts when listing is not in OPEN state", async function () {
            await marketplace.connect(buyer).acceptListing(1);
            await expect(marketplace.connect(stranger).acceptListing(1))
                .to.be.revertedWith("Listing is not open!");
        });

        it("reverts on a non-existent listing", async function () {
            await expect(marketplace.connect(buyer).acceptListing(99))
                .to.be.revertedWith("Listing does not exist!");
        });
    });

    // ─── setAsPaid ────────────────────────────────────────────────────────────

    describe("setAsPaid", function () {
        beforeEach(async function () {
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
            await marketplace.connect(buyer).acceptListing(1);
        });

        it("buyer can mark the trade as paid", async function () {
            await expect(marketplace.connect(buyer).setAsPaid(1))
                .to.emit(marketplace, "BuyerPaid")
                .withArgs(buyer.address);

            const trade = await marketplace.CurrentTrades(1);
            expect(trade.state).to.equal(2); // PAID
        });

        it("reverts when a non-buyer calls setAsPaid", async function () {
            await expect(marketplace.connect(stranger).setAsPaid(1))
                .to.be.revertedWith("You are not the buyer!");
        });

        it("reverts when trade is not in ACCEPTED state", async function () {
            // Create a fresh listing still in OPEN state
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
            // txId 2 is OPEN, buyer is address(0)
            await expect(marketplace.connect(buyer).setAsPaid(2))
                .to.be.revertedWith("Buyer is not initialized");
        });
    });

    // ─── confirmReceipt ───────────────────────────────────────────────────────

    describe("confirmReceipt", function () {
        beforeEach(async function () {
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
            await marketplace.connect(buyer).acceptListing(1);
            await marketplace.connect(buyer).setAsPaid(1);
        });

        it("seller confirms receipt and USDC is transferred to buyer", async function () {
            const buyerBefore = await mockUSDC.balanceOf(buyer.address);

            await expect(marketplace.connect(seller).confirmReceipt(1))
                .to.emit(marketplace, "ListingCompleted")
                .withArgs(seller.address, buyer.address, usdc(200));

            expect(await mockUSDC.balanceOf(buyer.address)).to.equal(buyerBefore + usdc(200));
        });

        it("deletes the trade from storage after completion", async function () {
            await marketplace.connect(seller).confirmReceipt(1);
            const trade = await marketplace.CurrentTrades(1);
            expect(trade.seller).to.equal(ethers.ZeroAddress);
        });

        it("reverts when a non-seller calls confirmReceipt", async function () {
            await expect(marketplace.connect(buyer).confirmReceipt(1))
                .to.be.revertedWith("You are not the seller!");
        });

        it("reverts when state is not PAID", async function () {
            // Create listing and accept but don't pay
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
            await marketplace.connect(buyer).acceptListing(2);

            await expect(marketplace.connect(seller).confirmReceipt(2))
                .to.be.revertedWith("Incorrect state!");
        });
    });

    // ─── cancelListing ────────────────────────────────────────────────────────

    describe("cancelListing", function () {
        beforeEach(async function () {
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
        });

        it("seller can cancel an open listing and get USDC back", async function () {
            const sellerBefore = await mockUSDC.balanceOf(seller.address);

            await expect(marketplace.connect(seller).cancelListing(1))
                .to.emit(marketplace, "Refunded")
                .withArgs(seller.address, usdc(200));

            expect(await mockUSDC.balanceOf(seller.address)).to.equal(sellerBefore + usdc(200));
        });

        it("deletes the trade after cancellation", async function () {
            await marketplace.connect(seller).cancelListing(1);
            const trade = await marketplace.CurrentTrades(1);
            expect(trade.seller).to.equal(ethers.ZeroAddress);
        });

        it("reverts when a non-seller tries to cancel", async function () {
            await expect(marketplace.connect(stranger).cancelListing(1))
                .to.be.revertedWith("You are not the seller!");
        });

        it("reverts when listing is not in OPEN state", async function () {
            await marketplace.connect(buyer).acceptListing(1);
            await expect(marketplace.connect(seller).cancelListing(1))
                .to.be.revertedWith("Listing is not open!");
        });
    });

    // ─── openDispute ──────────────────────────────────────────────────────────

    describe("openDispute", function () {
        beforeEach(async function () {
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
            await marketplace.connect(buyer).acceptListing(1);
            await marketplace.connect(buyer).setAsPaid(1);
        });

        it("buyer can open a dispute on a PAID trade", async function () {
            await expect(marketplace.connect(buyer).openDispute(1))
                .to.emit(marketplace, "DisputeOpened")
                .withArgs(buyer.address);

            const trade = await marketplace.CurrentTrades(1);
            expect(trade.state).to.equal(3); // DISPUTED
        });

        it("seller can open a dispute on a PAID trade", async function () {
            await expect(marketplace.connect(seller).openDispute(1))
                .to.emit(marketplace, "DisputeOpened")
                .withArgs(seller.address);
        });

        it("reverts when caller is neither buyer nor seller", async function () {
            await expect(marketplace.connect(stranger).openDispute(1))
                .to.be.revertedWith("Only the buyer or seller are allowed to call this!");
        });

        it("reverts when trade is not in PAID state", async function () {
            // Trade is ACCEPTED, not PAID
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
            await marketplace.connect(buyer).acceptListing(2);

            await expect(marketplace.connect(buyer).openDispute(2))
                .to.be.revertedWith("Incorrect state!");
        });
    });

    // ─── resolveDispute ───────────────────────────────────────────────────────

    describe("resolveDispute", function () {
        beforeEach(async function () {
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));
            await marketplace.connect(buyer).acceptListing(1);
            await marketplace.connect(buyer).setAsPaid(1);
            await marketplace.connect(buyer).openDispute(1);
        });

        it("arbiter can resolve in favour of the seller (refund seller)", async function () {
            const sellerBefore = await mockUSDC.balanceOf(seller.address);

            await expect(marketplace.connect(owner).resolveDispute(1, true))
                .to.emit(marketplace, "Resolved")
                .withArgs(owner.address, true);

            expect(await mockUSDC.balanceOf(seller.address)).to.equal(sellerBefore + usdc(200));
        });

        it("arbiter can resolve in favour of the buyer (release to buyer)", async function () {
            const buyerBefore = await mockUSDC.balanceOf(buyer.address);

            await expect(marketplace.connect(owner).resolveDispute(1, false))
                .to.emit(marketplace, "Resolved")
                .withArgs(owner.address, false);

            expect(await mockUSDC.balanceOf(buyer.address)).to.equal(buyerBefore + usdc(200));
        });

        it("deletes the trade after resolution", async function () {
            await marketplace.connect(owner).resolveDispute(1, true);
            const trade = await marketplace.CurrentTrades(1);
            expect(trade.seller).to.equal(ethers.ZeroAddress);
        });

        it("reverts when a non-arbiter calls resolveDispute", async function () {
            await expect(marketplace.connect(stranger).resolveDispute(1, true))
                .to.be.revertedWith("You are not the arbiter!");
        });

        it("reverts when trade is not in DISPUTED state", async function () {
            // Fresh OPEN trade
            await mockUSDC.connect(seller).approve(await marketplace.getAddress(), usdc(200));
            await marketplace.connect(seller).createListing(usdc(200));

            await expect(marketplace.connect(owner).resolveDispute(2, true))
                .to.be.revertedWith("Incorrect state!");
        });
    });

    // ─── UUPS upgradeability ──────────────────────────────────────────────────

    describe("upgradeability", function () {
        it("owner can upgrade the contract", async function () {
            const LmMarketplaceV2 = await ethers.getContractFactory("LmMarketplace");
            await expect(
                upgrades.upgradeProxy(await marketplace.getAddress(), LmMarketplaceV2, { kind: "uups" })
            ).to.not.be.reverted;
        });

        it("non-owner cannot upgrade the contract", async function () {
            const LmMarketplaceV2 = await ethers.getContractFactory("LmMarketplace", stranger);
            await expect(
                upgrades.upgradeProxy(await marketplace.getAddress(), LmMarketplaceV2, { kind: "uups" })
            ).to.be.reverted;
        });
    });
});
