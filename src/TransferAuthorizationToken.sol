// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ERC3009.sol";

contract TransferAuthorizationToken is ERC3009 {
    constructor(string memory name, string memory symbol, string memory version) ERC3009(name, symbol, version) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
