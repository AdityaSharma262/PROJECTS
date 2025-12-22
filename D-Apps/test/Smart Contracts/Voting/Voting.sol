// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

contract Voting{
    struct Candidate{
        string name;
        uint votes;
    }

    mapping(uint => Candidate) public candidates;
    uint public candidateCount;
    mapping (address => bool)public hasVoted;

    event Voted(address voter , uint256 candidateId);

    function addCandidate(string calldata _name)public {
        candidates [candidateCount] = Candidate(_name,0);
        candidateCount++;
    }

    function vote(uint256 _candidateId)public{
        require(!hasVoted[msg.sender], "You have already voted");
        require(_candidateId < candidateCount, "Invalid candidate id");
      candidates[_candidateId].votes++; 
     hasVoted[msg.sender] = true;
       emit Voted(msg.sender , _candidateId);
    }
    function candidatesCount() public view returns (uint256) {
    return candidateCount;
}


    function getVotes(uint256 _candidateId) public view returns(uint256){
        require(_candidateId < candidateCount,"Invalid candidate id" );
        return candidates[_candidateId].votes;
        

    }
}