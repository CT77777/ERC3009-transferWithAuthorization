// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/TransferAuthorizationToken.sol";

contract DeployTransferAuthorizationToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer address:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        TransferAuthorizationToken token = new TransferAuthorizationToken("TransferAuthorizationToken", "TAT", "1");

        vm.stopBroadcast();

        console.log("TransferAuthorizationToken deployed at:", address(token));
    }
}
