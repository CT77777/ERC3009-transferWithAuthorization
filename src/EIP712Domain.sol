// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EIP712Library.sol";

abstract contract EIP712Domain {
    bytes32 public DOMAIN_SEPARATOR;

    constructor(string memory name, string memory version) {
        DOMAIN_SEPARATOR = EIP712Library.makeDomainSeparator(name, version);
    }
}
