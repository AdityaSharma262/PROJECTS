const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreelancerEscrow", function () {
  let FreelancerEscrow;
  let freelancerEscrow;
  let owner;
  let client;
  let freelancer;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get signers
    [owner, client, freelancer, addr1, addr2] = await ethers.getSigners();

    // Deploy contract
    FreelancerEscrow = await ethers.getContractFactory("FreelancerEscrow");
    freelancerEscrow = await FreelancerEscrow.deploy();
    await freelancerEscrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await freelancerEscrow.owner()).to.equal(owner.address);
    });

    it("Should start with job count 0", async function () {
      expect(await freelancerEscrow.jobCount()).to.equal(0);
    });
  });

  describe("Job Creation", function () {
    it("Should allow client to create a job", async function () {
      const jobBudget = ethers.parseEther("1.0");
      
      await expect(freelancerEscrow.connect(client).createJob({ value: jobBudget }))
        .to.emit(freelancerEscrow, "JobCreated")
        .withArgs(1, client.address, jobBudget);

      expect(await freelancerEscrow.jobCount()).to.equal(1);
      
      const job = await freelancerEscrow.jobs(1);
      expect(job.client).to.equal(client.address);
      expect(job.amount).to.equal(jobBudget);
      expect(job.status).to.equal(0); // Open
    });

    it("Should fail if no ETH is sent", async function () {
      await expect(freelancerEscrow.connect(client).createJob({ value: 0 }))
        .to.be.revertedWith("Job budget must be greater than 0");
    });
  });

  describe("Job Acceptance", function () {
    beforeEach(async function () {
      // Create a job first
      const jobBudget = ethers.parseEther("1.0");
      await freelancerEscrow.connect(client).createJob({ value: jobBudget });
    });

    it("Should allow freelancer to accept an open job", async function () {
      await expect(freelancerEscrow.connect(freelancer).acceptJob(1))
        .to.emit(freelancerEscrow, "JobAccepted")
        .withArgs(1, freelancer.address);

      const job = await freelancerEscrow.jobs(1);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.status).to.equal(1); // In Progress
    });

    it("Should fail if job doesn't exist", async function () {
      await expect(freelancerEscrow.connect(freelancer).acceptJob(999))
        .to.be.revertedWith("Job does not exist");
    });

    it("Should fail if job is not open", async function () {
      // Accept the job first
      await freelancerEscrow.connect(freelancer).acceptJob(1);
      
      // Try to accept it again
      await expect(freelancerEscrow.connect(addr1).acceptJob(1))
        .to.be.revertedWith("Job is not open");
    });
  });

  describe("Work Submission", function () {
    beforeEach(async function () {
      // Create and accept a job
      const jobBudget = ethers.parseEther("1.0");
      await freelancerEscrow.connect(client).createJob({ value: jobBudget });
      await freelancerEscrow.connect(freelancer).acceptJob(1);
    });

    it("Should allow freelancer to submit work", async function () {
      const submissionLink = "https://example.com/submission";
      
      await expect(freelancerEscrow.connect(freelancer).submitWork(1, submissionLink))
        .to.emit(freelancerEscrow, "WorkSubmitted")
        .withArgs(1, submissionLink);
    });

    it("Should fail if not the assigned freelancer", async function () {
      const submissionLink = "https://example.com/submission";
      
      await expect(freelancerEscrow.connect(addr1).submitWork(1, submissionLink))
        .to.be.revertedWith("Only the assigned freelancer can submit work");
    });
  });

  describe("Submission Approval", function () {
    beforeEach(async function () {
      // Create, accept, and submit work
      const jobBudget = ethers.parseEther("1.0");
      await freelancerEscrow.connect(client).createJob({ value: jobBudget });
      await freelancerEscrow.connect(freelancer).acceptJob(1);
      await freelancerEscrow.connect(freelancer).submitWork(1, "https://example.com/submission");
    });

    it("Should allow client to approve submission", async function () {
      const initialBalance = await ethers.provider.getBalance(freelancer.address);
      
      await expect(freelancerEscrow.connect(client).approveSubmission(1))
        .to.emit(freelancerEscrow, "SubmissionApproved")
        .withArgs(1, freelancer.address);

      const job = await freelancerEscrow.jobs(1);
      expect(job.freelancerPaid).to.be.true;
      expect(job.status).to.equal(2); // Completed
    });

    it("Should fail if not the job client", async function () {
      await expect(freelancerEscrow.connect(addr1).approveSubmission(1))
        .to.be.revertedWith("Only the job client can approve submissions");
    });
  });

  describe("Submission Rejection", function () {
    beforeEach(async function () {
      // Create, accept, and submit work
      const jobBudget = ethers.parseEther("1.0");
      await freelancerEscrow.connect(client).createJob({ value: jobBudget });
      await freelancerEscrow.connect(freelancer).acceptJob(1);
      await freelancerEscrow.connect(freelancer).submitWork(1, "https://example.com/submission");
    });

    it("Should allow client to reject submission", async function () {
      await expect(freelancerEscrow.connect(client).rejectSubmission(1))
        .to.emit(freelancerEscrow, "SubmissionRejected")
        .withArgs(1, freelancer.address);

      const job = await freelancerEscrow.jobs(1);
      expect(job.rejectCount).to.equal(1);
      expect(job.status).to.equal(1); // Back to In Progress
    });

    it("Should fail after 3 rejections", async function () {
      // Reject 3 times
      await freelancerEscrow.connect(client).rejectSubmission(1);
      await freelancerEscrow.connect(freelancer).submitWork(1, "https://example.com/submission2");
      await freelancerEscrow.connect(client).rejectSubmission(1);
      await freelancerEscrow.connect(freelancer).submitWork(1, "https://example.com/submission3");
      await freelancerEscrow.connect(client).rejectSubmission(1);
      
      // Try to reject a 4th time
      await freelancerEscrow.connect(freelancer).submitWork(1, "https://example.com/submission4");
      await expect(freelancerEscrow.connect(client).rejectSubmission(1))
        .to.be.revertedWith("Maximum rejections reached");
    });
  });
}); 