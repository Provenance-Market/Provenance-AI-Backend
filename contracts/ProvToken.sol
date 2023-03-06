// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

contract ProvToken is ERC1155, Ownable, ERC1155Supply {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC1155("https://api.mysite.com/tokens/{id}") {}

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function mint(address account, uint256 amount, bytes memory data)
        public
        returns (uint256)
    {
        uint256 newItemId = _tokenIds.current();
        _mint(account, newItemId, amount, data);
        _tokenIds.increment();
        return newItemId;
    }

    function mintBatch(address to, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
        returns (uint256[] memory)
    {
        uint256[] memory ids = new uint256[](amounts.length);
        for (uint i = 0; i < amounts.length; i++) {
            uint256 newItemId = _tokenIds.current();
            ids[i] = newItemId;
            _tokenIds.increment();
        }
        _mintBatch(to, ids, amounts, data);
        return ids;
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
