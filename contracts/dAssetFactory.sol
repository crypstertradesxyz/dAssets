// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./dAssetToken.sol";
import "./MockRobinhoodOracle.sol";

/**
 * @title dAssetFactory
 * @notice Permissionless factory allowing any user on Robinhood Chain to deploy & mint Bounce.tech leveraged assets.
 */
contract dAssetFactory {
    address public owner;
    address public oracle;
    address public hyperlaneBridge;
    address public usdcToken;

    struct AssetInfo {
        address tokenAddress;
        string symbol;
        string underlying;
        uint8 leverage;
        bool isShort;
        address poolAddress;
        uint256 totalMinted;
        uint256 createdAt;
    }

    mapping(string => AssetInfo) public assets;
    string[] public assetSymbols;

    event AssetDeployed(string indexed symbol, address indexed tokenAddress, uint8 leverage, bool isShort);
    event AssetMinted(string indexed symbol, address indexed recipient, uint256 amountMinted, uint256 usdcPaid);
    event PoolRegistered(string indexed symbol, address indexed poolAddress, uint256 initialLiquidity);

    modifier onlyOwner() {
        require(msg.sender == owner, "Factory: unauthorized");
        _;
    }

    constructor(address _oracle, address _hyperlaneBridge, address _usdc) {
        owner = msg.sender;
        oracle = _oracle;
        hyperlaneBridge = _hyperlaneBridge;
        usdcToken = _usdc;
    }

    function deployAsset(
        string memory name,
        string memory symbol,
        string memory underlying,
        uint8 leverage,
        bool isShort,
        bytes32 hyperevmId
    ) public returns (address) {
        if (assets[symbol].tokenAddress != address(0)) {
            return assets[symbol].tokenAddress;
        }

        dAssetToken token = new dAssetToken(
            name,
            symbol,
            underlying,
            leverage,
            isShort,
            address(this),
            oracle,
            hyperevmId
        );

        assets[symbol] = AssetInfo({
            tokenAddress: address(token),
            symbol: symbol,
            underlying: underlying,
            leverage: leverage,
            isShort: isShort,
            poolAddress: address(0),
            totalMinted: 0,
            createdAt: block.timestamp
        });

        assetSymbols.push(symbol);
        emit AssetDeployed(symbol, address(token), leverage, isShort);
        return address(token);
    }

    /**
     * @notice Genuine permissionless minting of leveraged assets to the caller's address.
     */
    function mintAsset(string memory symbol, uint256 amount) external payable returns (bool) {
        AssetInfo storage asset = assets[symbol];
        require(asset.tokenAddress != address(0), "Factory: asset not deployed yet");
        dAssetToken(asset.tokenAddress).mint(msg.sender, amount);
        asset.totalMinted += amount;
        emit AssetMinted(symbol, msg.sender, amount, msg.value);
        return true;
    }

    /**
     * @notice Deploy if not existing and mint in a single genuine transaction.
     */
    function deployAndMint(
        string memory name,
        string memory symbol,
        string memory underlying,
        uint8 leverage,
        bool isShort,
        bytes32 hyperevmId,
        uint256 mintAmount
    ) external payable returns (address tokenAddress) {
        tokenAddress = assets[symbol].tokenAddress;
        if (tokenAddress == address(0)) {
            tokenAddress = deployAsset(name, symbol, underlying, leverage, isShort, hyperevmId);
        }

        if (mintAmount > 0) {
            dAssetToken(tokenAddress).mint(msg.sender, mintAmount);
            assets[symbol].totalMinted += mintAmount;
            emit AssetMinted(symbol, msg.sender, mintAmount, msg.value);
        }
        return tokenAddress;
    }

    function registerLiquidityPool(string memory symbol, address poolAddress, uint256 initialLiquidity) external {
        require(assets[symbol].tokenAddress != address(0), "Factory: asset not found");
        assets[symbol].poolAddress = poolAddress;
        emit PoolRegistered(symbol, poolAddress, initialLiquidity);
    }

    function getAsset(string memory symbol) external view returns (AssetInfo memory) {
        return assets[symbol];
    }

    function getAssetCount() external view returns (uint256) {
        return assetSymbols.length;
    }
}
