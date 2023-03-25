// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/finance/PaymentSplitter.sol';
import '@ganache/console.log/console.sol';

/// @custom:security-contact ProvenanceMarket.art@proton.me
contract ProvNFT is
    ERC1155URIStorage,
    ERC1155Supply,
    Pausable,
    PaymentSplitter
{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint8 constant SUPPLY_PER_ID = 1;
    uint256 public mintPrice = 0.001 ether;
    address[] pausers;

    event NFTMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 value
    );

    event PayFee(address indexed sender);

    constructor(
        address[] memory _payees,
        uint256[] memory _shares
    ) ERC1155('') PaymentSplitter(_payees, _shares) {
        pausers = _payees;
    }

    modifier onlyPauser() {
        uint256 length = pausers.length;
        for (uint256 p = 0; p < length; p++) {
            require(pausers[p] == msg.sender, 'Caller has to be a pauser');
        }
        _;
    }

    function mint(string memory metadataURI) public payable returns (uint256) {
        require(msg.value >= mintPrice, 'Invalid ether amount for minting');

        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId, SUPPLY_PER_ID, '');
        _setURI(newItemId, metadataURI);
        _tokenIds.increment();

        emit NFTMinted(msg.sender, newItemId, msg.value);

        return newItemId;
    }

    function imageGenerationPayment(uint256 cost) public payable {
        require(
            msg.value >= cost,
            'Insufficient payment amount for AI image generation'
        );
        emit PayFee(msg.sender);
    }

    function mintBatch(
        uint256 mintAmount,
        string[] memory metadataURIs
    ) public payable returns (uint256[] memory) {
        require(
            metadataURIs.length == mintAmount,
            'metadataURIs array length does not match the NFT mint amount'
        );
        require(
            msg.value >= mintPrice * mintAmount,
            'Invalid ether amount for minting'
        );

        uint256[] memory ids = new uint256[](mintAmount);
        for (uint i = 0; i < mintAmount; i++) {
            uint256 newItemId = _tokenIds.current();
            ids[i] = newItemId;
            _setURI(newItemId, metadataURIs[i]);
            _tokenIds.increment();
        }

        // Create array of `mintAmount` elements for unique batch mints
        uint256[] memory amounts = new uint256[](mintAmount);
        bytes memory amountsData = abi.encodePacked(
            bytes32(uint256(1)),
            bytes32(mintAmount - 1)
        );
        assembly {
            mstore(add(amounts, 32), mload(add(amountsData, 32)))
        }

        _mintBatch(msg.sender, ids, amounts, '');
        return ids;
    }

    function getTotalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function pause() public onlyPauser {
        _pause();
    }

    function unpause() public onlyPauser {
        _unpause();
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
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
