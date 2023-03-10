// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/finance/PaymentSplitter.sol';

/// @custom:security-contact ProvenanceMarket.art@proton.me
contract ProvNFT is ERC1155URIStorage, ERC1155Supply, Ownable, PaymentSplitter {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint8 constant SUPPLY_PER_ID = 1;
    uint256 public mintPrice = 0.01 ether;

    constructor(
        address[] memory _payees,
        uint256[] memory _shares
    ) ERC1155('') PaymentSplitter(_payees, _shares) {}

    function mint(
        bytes memory data,
        string memory tokenURI
    ) public payable returns (uint256) {
        require(msg.value == mintPrice, 'Invalid ether amount for minting');

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId, SUPPLY_PER_ID, data);
        _setURI(newItemId, tokenURI);
        _tokenIds.increment();
        return newItemId;
    }

    function mintBatch(
        address to,
        uint256[] memory amounts,
        bytes memory data
    ) public payable returns (uint256[] memory) {
        uint256[] memory ids = new uint256[](amounts.length);
        for (uint i = 0; i < amounts.length; i++) {
            uint256 newItemId = _tokenIds.current();
            ids[i] = newItemId;
            _tokenIds.increment();
        }
        _mintBatch(to, ids, amounts, data);
        return ids;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, 'Balance is 0');

        (bool success, ) = payable(msg.sender).call{ value: balance }('');
        require(success);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function uri(
        uint256 tokenId
    )
        public
        view
        virtual
        override(ERC1155URIStorage, ERC1155)
        returns (string memory)
    {
        return super.uri(tokenId);
    }
}
