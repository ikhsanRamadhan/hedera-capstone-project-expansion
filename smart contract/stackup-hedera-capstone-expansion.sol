// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.8.9;

import "https://github.com/hashgraph/hedera-smart-contracts/blob/v0.2.0/contracts/hts-precompile/HederaResponseCodes.sol";
import "https://github.com/hashgraph/hedera-smart-contracts/blob/v0.2.0/contracts/hts-precompile/IHederaTokenService.sol";
import "https://github.com/hashgraph/hedera-smart-contracts/blob/v0.2.0/contracts/hts-precompile/HederaTokenService.sol";
import "https://github.com/hashgraph/hedera-smart-contracts/blob/v0.2.0/contracts/hts-precompile/ExpiryHelper.sol";

contract MerchantBackend is ExpiryHelper {
    event CreatedToken(address tokenAddress);
    event MintedToken(int64[] serialNumbers);
    event Response(int256 response);

    address public ftAddress;
    address public owner;

    uint256 public lockupAmount = 100000000000;

    constructor() payable {
        IHederaTokenService.HederaToken memory token;
        token.name = "Reputation Tokens";
        token.symbol = "REP";
        token.memo = "REP Tokens By: Nashki";
        token.treasury = address(this);
        token.expiry = createAutoRenewExpiry(address(this), 7000000);

        (int256 responseCode, address tokenAddress) = HederaTokenService
            .createFungibleToken(token, 1000, 0);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert();
        }

        ftAddress = tokenAddress;
        owner = msg.sender;
        emit CreatedToken(tokenAddress);
    }

    function createNFT(string memory name, string memory symbol)
        external
        payable
    {
        IHederaTokenService.TokenKey[]
            memory keys = new IHederaTokenService.TokenKey[](1);

        // Set this contract as supply
        keys[0] = getSingleKey(
            KeyType.SUPPLY,
            KeyValueType.CONTRACT_ID,
            address(this)
        );

        IHederaTokenService.HederaToken memory token;
        token.name = name;
        token.symbol = symbol;
        token.memo = "CAR Collection By: Nashki";
        token.treasury = address(this);
        token.tokenSupplyType = true; // set supply to FINITE
        token.maxSupply = 10;
        token.tokenKeys = keys;
        token.freezeDefault = false;
        token.expiry = createAutoRenewExpiry(address(this), 7000000);

        (int256 responseCode, address createdToken) = HederaTokenService
            .createNonFungibleToken(token);

        if (responseCode != HederaResponseCodes.SUCCESS) {
            revert("Failed to create non-fungible token");
        }

        emit CreatedToken(createdToken);
    }

    function mintNFT(address token, bytes[] memory metadata) external {
        (int256 response, , int64[] memory serial) = HederaTokenService
            .mintToken(token, 0, metadata);

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Failed to mint non-fungible token");
        }

        emit MintedToken(serial);
    }

    struct Renter {
        address walletAddress;
        string userName;
        bool canRent;
        bool active;
        uint256 balance;
        uint256 due;
        uint256 start;
        uint256 end;
    }

    mapping(address => Renter) public renters;

    function addRenter(
        address walletAddress,
        string memory userName,
        bool canRent,
        bool active,
        uint256 balance,
        uint256 due,
        uint256 start,
        uint256 end
    ) external payable {
        renters[walletAddress] = Renter(
            walletAddress,
            userName,
            canRent,
            active,
            balance,
            due,
            start,
            end
        );
    }

    function checkUserExists(address walletAddress) public view returns (bool) {
        return bytes(renters[walletAddress].userName).length > 0;
    }

    function getUsername(address walletAddress)
        external
        view
        returns (string memory)
    {
        require(checkUserExists(walletAddress), "User is not registered!");
        return renters[walletAddress].userName;
    }

    function borrowing(
        address nftAddress,
        address walletAddress,
        int64 serial
    ) external payable {
        // Check if customer transfers the lockup amount
        require(msg.value == lockupAmount, "Incorrect amount");
        require(renters[walletAddress].due == 0, "You have a pending due");
        require(
            renters[walletAddress].canRent == true,
            "You cannot borrow at this time"
        );

        // Transfer NFT to customer
        int256 response = HederaTokenService.transferNFT(
            nftAddress,
            address(this),
            msg.sender,
            serial
        );

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Failed to transfer non-fungible token");
        }

        renters[walletAddress].start = block.timestamp;
        renters[walletAddress].canRent = false;
        renters[walletAddress].active = true;

        emit Response(response);
    }

    function returning(
        address nftAddress,
        address walletAddress,
        int64 serial
    ) external payable {
        // Return NFT from customer
        require(renters[walletAddress].active == true, "Borrow your car first");

        int256 response = HederaTokenService.transferNFT(
            nftAddress,
            msg.sender,
            address(this),
            serial
        );

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Failed to transfer non-fungible token");
        }

        // Return HBAR to customer
        payable(msg.sender).transfer(lockupAmount);
        renters[walletAddress].end = block.timestamp;
        renters[walletAddress].active = false;
        setDue(walletAddress);

        emit Response(response);
    }

    function renterTimespan(uint256 start, uint256 end)
        internal
        pure
        returns (uint256)
    {
        return end - start;
    }

    function getTotalDuration(address walletAddress)
        public
        view
        returns (uint256)
    {
        require(
            renters[walletAddress].active == false,
            "Car currently borrowed"
        );

        uint256 timestamp = renterTimespan(
            renters[walletAddress].start,
            renters[walletAddress].end
        );
        uint256 timestampInMinutes = timestamp / 60;
        return timestampInMinutes;
    }

    function scoring(address receiver, int64 amount) external {
        require(msg.sender == owner, "Not owner");
        require(amount <= 5, "Only can allocate up to 5 REP tokens");

        int256 response = HederaTokenService.transferToken(
            ftAddress,
            address(this),
            receiver,
            amount
        );

        if (response != HederaResponseCodes.SUCCESS) {
            revert("Transfer Failed");
        }

        emit Response(response);
    }

    function balanceOf() external view returns (uint256) {
        return address(this).balance;
    }

    function renterBalance(address walletAddress)
        external
        view
        returns (uint256)
    {
        return renters[walletAddress].balance;
    }

    function renterDue(address walletAddress) external view returns (uint256) {
        return renters[walletAddress].due;
    }

    function getStart(address walletAddress) external view returns (uint256) {
        return renters[walletAddress].start;
    }

    function setDue(address walletAddress) internal {
        uint256 timespanMinutes = getTotalDuration(walletAddress);
        renters[walletAddress].due = timespanMinutes * 100000000;
    }

    function canRentCar(address walletAddress) external view returns (bool) {
        return renters[walletAddress].canRent;
    }

    function checkActive(address walletAddress) external view returns (bool) {
        return renters[walletAddress].active;
    }

    function deposit(address walletAddress) external payable {
        renters[walletAddress].balance += msg.value;
    }

    function makePayment(address walletAddress) external payable {
        require(
            renters[walletAddress].due > 0,
            "You have anything due at this time"
        );
        require(
            renters[walletAddress].balance >= msg.value,
            "You do not enough funds to cover payment. Please make a deposit"
        );

        renters[walletAddress].balance -= msg.value;
        renters[walletAddress].canRent = true;
        renters[walletAddress].due = 0;
        renters[walletAddress].start = 0;
        renters[walletAddress].end = 0;
    }
}