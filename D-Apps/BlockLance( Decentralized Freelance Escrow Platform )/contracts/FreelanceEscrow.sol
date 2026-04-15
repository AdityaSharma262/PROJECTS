// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract FreelanceEscrow{
    enum jobStatus{Open, InProgress, Submitted, Approved, Rejected, Refunded}
    struct Job {
        address client;
        address freelancer;
        uint256 amount;
        jobStatus status;
        string[] submissions;
        uint16 rejectCount;
        bool freelancerPaid;

    }
    mapping (uint256 => Job) public jobs;
    uint256 public jobCount;



    function createJob() external payable returns(uint) {

            require(msg.value > 0, "Amount must be greater than zero");
            jobCount++;
            Job memory newJob = Job({
                client: msg.sender,
                freelancer: address(0),
                amount: msg.value,
                status: jobStatus.Open,
                submissions: new string[](0),
                rejectCount: 0,
                freelancerPaid: false
            });
            jobs[jobCount] = newJob;
            return jobCount;

    }

    function acceptJob(uint16 jobId)external {

        require(jobs[jobId].status == jobStatus.Open, "Job is not open");
        require(msg.sender != jobs[jobId].client, "You can't accept your own job");
        require(jobs[jobId].client != address(0), "Job does not exist");
        require(jobs[jobId].freelancer == address(0), "work already assigned to someone else");

        jobs[jobId].freelancer = msg.sender;
        jobs[jobId].status = jobStatus.InProgress;


    }

    function submit(uint16 jobId, string memory submission)external {
        require(msg.sender == jobs[jobId].freelancer, "Only the authorized person can give submission");
        require(jobs[jobId].client != address(0), "Job does not exist");
        require(jobs[jobId].status == jobStatus.InProgress, "Job is not in progress");
        jobs[jobId].submissions.push(submission);
        jobs[jobId].status = jobStatus.Submitted;
    }

    function approveSubmission(uint16 jobId)external {
        require(msg.sender == jobs[jobId].client, "Only the client can approve submission");
        require(jobs[jobId].status == jobStatus.Submitted,"No submission has been made !");

        jobs[jobId].status = jobStatus.Approved;
        payable(jobs[jobId].freelancer).transfer(jobs[jobId].amount);
        jobs[jobId].freelancerPaid = true;
        
    }

    function rejectSubmission(uint16 jobId)external {
        require(msg.sender == jobs[jobId].client, "Only the client can approve submission");
        require(jobs[jobId].status == jobStatus.Submitted,"No submission has been made !");
        require(!jobs[jobId].freelancerPaid, "Freelancer has already been paid");
        
        jobs[jobId].rejectCount++;
        if(jobs[jobId].rejectCount < 3){
            jobs[jobId].status = jobStatus.InProgress;
        }else{
            jobs[jobId].status = jobStatus.Refunded;
            payable(jobs[jobId].client).transfer(jobs[jobId].amount);
        }
        }

    
}
