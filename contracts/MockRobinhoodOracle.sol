// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockRobinhoodOracle
 * @notice Real-time NAV price oracle tracking Bounce.tech HyperEVM perpetual leveraged positions.
 */
contract MockRobinhoodOracle {
    struct PriceData {
        uint256 navPrice;       // 18 decimals (e.g. 100 * 1e18)
        uint256 indexPrice;     // underlying spot price
        int256 fundingRate24h;  // basis points
        uint256 lastRebalance;
        uint256 updatedAt;
    }

    address public admin;
    mapping(string => PriceData) public prices;
    mapping(address => bool) public authorizedFeeders;

    event PriceUpdated(string indexed symbol, uint256 navPrice, uint256 indexPrice, uint256 timestamp);
    event RebalanceReported(string indexed symbol, uint256 newNav, uint256 timestamp);

    modifier onlyFeeder() {
        require(msg.sender == admin || authorizedFeeders[msg.sender], "Oracle: unauthorized");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedFeeders[msg.sender] = true;
    }

    function setPrice(
        string calldata symbol,
        uint256 navPrice,
        uint256 indexPrice,
        int256 fundingRate24h
    ) external onlyFeeder {
        prices[symbol] = PriceData({
            navPrice: navPrice,
            indexPrice: indexPrice,
            fundingRate24h: fundingRate24h,
            lastRebalance: block.timestamp,
            updatedAt: block.timestamp
        });
        emit PriceUpdated(symbol, navPrice, indexPrice, block.timestamp);
    }

    function getPrice(string calldata symbol) external view returns (uint256, uint256, uint256) {
        PriceData memory data = prices[symbol];
        require(data.updatedAt > 0, "Oracle: price not available");
        return (data.navPrice, data.indexPrice, data.updatedAt);
    }
}
