// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MyNFT is ERC721URIStorage {
    uint256 public tokenCount;

    constructor() ERC721("MyNFT", "MNFT") {}

    function mint(string memory tokenURI) external returns (uint256) {
        tokenCount++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, tokenURI);
        return tokenCount;
    }
}
