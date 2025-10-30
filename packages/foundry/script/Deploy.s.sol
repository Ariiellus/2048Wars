//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DeployHelpers.s.sol";
import { Monad2048 } from "../contracts/Monad2048.sol";


/**
 * @notice Main deployment script for 2048 Wars contracts
 * @dev Run this when you want to deploy the 2048 Wars game contract
 *
 * Example: yarn deploy # runs this script (without `--file` flag)
 */
contract DeployScript is ScaffoldETHDeploy {
    /**
     * @dev Deployer setup based on `ETH_KEYSTORE_ACCOUNT` in `.env`:
     *      - "scaffold-eth-default": Uses Anvil's account #9 (0xa0Ee7A142d267C1f36714E4a8F75612F20a79720), no password prompt
     *      - "scaffold-eth-custom": requires password used while creating keystore
     *
     * Note: Must use ScaffoldEthDeployerRunner modifier to:
     *      - Setup correct `deployer` account and fund it
     *      - Export contract addresses & ABIs to `nextjs` packages
     */
    function run() external ScaffoldEthDeployerRunner {
        Monad2048 game = new Monad2048();
        deployments.push(Deployment({ name: "Monad2048", addr: address(game) }));
    }
}
