// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract multisign{
    address[] public owners;
    uint256 public noOfConfirmationReq;

    struct Transaction{
        address reciever;
        uint value;
        bool isExecuted;
    }
    mapping (uint=>mapping (address=>bool)) isconfirmed;
    Transaction[] public  transactions;

      event TransactionSuubmitted(uint TransactionID, address sender, address reciever,uint amount);

    constructor(address[] memory _owners, uint _noOfConfirmationReq) {
        require(_owners.length >1,"must be atleast two owners");
        require(_noOfConfirmationReq >0 && _noOfConfirmationReq<=_owners.length);

        for(uint i =0;i< _owners.length;i++){
            require(_owners[i] != address(0));
            owners.push(_owners[i]);
        }
        noOfConfirmationReq = _noOfConfirmationReq;
    
    }
        function submitTransactions(address _reciever)public  payable {
            require(_reciever != address(0));
            require (msg.value >0,"must send atleast 1 ether");
            uint TransactionID = transactions.length;
            transactions.push(Transaction({reciever:_reciever, value : msg.value , isExecuted:false}));
            emit  TransactionSuubmitted(TransactionID, msg.sender,_reciever, msg.value);
        }
}