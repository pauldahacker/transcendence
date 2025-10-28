// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TournamentRegistry {
    event FinalRecorded(
        uint256 indexed tournamentId,
        string winnerAlias,
        uint8 finalScoreA,
        uint8 finalScoreB,
        uint8 pointsToWin
    );

    struct Final {
        string winnerAlias;
        uint8 finalScoreA;
        uint8 finalScoreB;
        uint8 pointsToWin;
        bool exists;
    }

    mapping(uint256 => Final) public finals;

    function recordFinal(
        uint256 tournamentId,
        string calldata winnerAlias,
        uint8 finalScoreA,
        uint8 finalScoreB,
        uint8 pointsToWin
    ) external {
        require(!finals[tournamentId].exists, "already_recorded");
        finals[tournamentId] = Final({
            winnerAlias: winnerAlias,
            finalScoreA: finalScoreA,
            finalScoreB: finalScoreB,
            pointsToWin: pointsToWin,
            exists: true
        });
        emit FinalRecorded(tournamentId, winnerAlias, finalScoreA, finalScoreB, pointsToWin);
    }

    function getFinal(uint256 tournamentId) external view returns (
        string memory winnerAlias,
        uint8 finalScoreA,
        uint8 finalScoreB,
        uint8 pointsToWin,
        bool exists
    ) {
        Final storage f = finals[tournamentId];
        return (f.winnerAlias, f.finalScoreA, f.finalScoreB, f.pointsToWin, f.exists);
    }
}

