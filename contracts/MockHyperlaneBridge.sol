// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockHyperlaneBridge
 * @notice Simulates Hyperlane Warp Route interchain mailbox and security modules between HyperEVM and Robinhood Chain.
 */
contract MockHyperlaneBridge {
    uint32 public constant HYPEREVM_DOMAIN = 999;
    uint32 public constant ROBINHOOD_CHAIN_DOMAIN = 13371;

    event Dispatched(uint32 indexed destinationDomain, bytes32 indexed recipient, bytes message);
    event Processed(uint32 indexed originDomain, bytes32 indexed sender, bytes message);

    function dispatch(
        uint32 destinationDomain,
        bytes32 recipient,
        bytes calldata messageBody
    ) external payable returns (bytes32 messageId) {
        messageId = keccak256(abi.encodePacked(block.timestamp, msg.sender, destinationDomain, recipient, messageBody));
        emit Dispatched(destinationDomain, recipient, messageBody);
        return messageId;
    }
}
