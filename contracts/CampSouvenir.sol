// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CampSouvenir
/// @notice A personal learning record, not an official certificate,
/// and not affiliated with any official curriculum.
contract CampSouvenir {
    struct Souvenir {
        uint16 lessonsCompleted;
        uint64 recordedAt;
    }

    mapping(address => mapping(bytes32 => Souvenir)) public souvenirs;

    error EmptyCampName();
    error CampNameTooLong();
    error NicknameTooLong();
    error NoLessonsCompleted();
    error AlreadyCollected();

    event SouvenirCollected(
        address indexed learner,
        bytes32 indexed campHash,
        string campName,
        string nickname,
        uint16 lessonsCompleted,
        uint64 recordedAt
    );

    function collectSouvenir(
        string calldata campName,
        string calldata nickname,
        uint16 lessonsCompleted
    ) external {
        uint256 campNameLength = bytes(campName).length;
        if (campNameLength == 0) revert EmptyCampName();
        if (campNameLength > 64) revert CampNameTooLong();
        if (bytes(nickname).length > 32) revert NicknameTooLong();
        if (lessonsCompleted == 0) revert NoLessonsCompleted();

        bytes32 campHash = keccak256(bytes(campName));
        if (souvenirs[msg.sender][campHash].lessonsCompleted != 0) {
            revert AlreadyCollected();
        }

        uint64 recordedAt = uint64(block.timestamp);
        souvenirs[msg.sender][campHash] = Souvenir(lessonsCompleted, recordedAt);

        emit SouvenirCollected(
            msg.sender, campHash, campName, nickname, lessonsCompleted, recordedAt
        );
    }

    function hasSouvenir(address learner, string calldata campName) external view returns (bool) {
        return souvenirs[learner][keccak256(bytes(campName))].lessonsCompleted != 0;
    }
}
