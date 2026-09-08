// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title dAssetToken
 * @notice Represents a bridged Bounce.tech HyperEVM leveraged asset on Robinhood Chain.
 * Auto-rebalanced position backed by Hyperliquid perpetual futures.
 */
contract dAssetToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public owner;
    address public factory;
    address public oracle;
    string public underlyingSymbol;
    uint8 public leverageMultiplier;
    bool public isShort;
    bytes32 public hyperevmSourceAssetId;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RebalanceExecuted(uint256 newNav, uint256 timestamp);

    modifier onlyAuthorized() {
        require(msg.sender == owner || msg.sender == factory, "dAsset: unauthorized");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _underlying,
        uint8 _leverage,
        bool _isShort,
        address _factory,
        address _oracle,
        bytes32 _hyperevmId
    ) {
        name = _name;
        symbol = _symbol;
        underlyingSymbol = _underlying;
        leverageMultiplier = _leverage;
        isShort = _isShort;
        factory = _factory;
        oracle = _oracle;
        owner = msg.sender;
        hyperevmSourceAssetId = _hyperevmId;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "dAsset: insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "dAsset: insufficient balance");
        if (allowance[from][msg.sender] != type(uint256).max) {
            require(allowance[from][msg.sender] >= value, "dAsset: insufficient allowance");
            allowance[from][msg.sender] -= value;
        }
        balanceOf[from] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external onlyAuthorized returns (bool) {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
        return true;
    }

    function burn(address from, uint256 amount) external onlyAuthorized returns (bool) {
        require(balanceOf[from] >= amount, "dAsset: burn amount exceeds balance");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
        return true;
    }
}
