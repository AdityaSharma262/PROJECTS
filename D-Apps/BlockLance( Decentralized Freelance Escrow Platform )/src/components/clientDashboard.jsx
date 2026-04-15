import { useState, useEffect } from "react"

const ClientDashboard =  ({ web3, account, contract }) => {
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [jobBudget, setJobBudget] = useState("");
    const [submissions, setSubmissions] = useState([]);
    const [submissionLinks, setSubmissionLinks] = useState({});

    // Fetch all jobs and their submissions
    const fetchSubmissions = async () => {
        if (contract) {
            try {
                console.log("Fetching jobs for account:", account);
                const jobCount = await contract.methods.jobCount().call();
                console.log("Total job count:", jobCount);
                const jobCountNum = parseInt(jobCount);
                if (!jobCountNum || isNaN(jobCountNum)) {
                    console.error("jobCount is invalid:", jobCountNum);
                    setSubmissions([]);
                    return;
                }
                const submissionsArray = [];
                const linksObj = {};
                
                for (let i = 1; i <= jobCountNum; i++) {
                    const job = await contract.methods.jobs(i).call();
                    console.log(`Job ${i}:`, job);
                    console.log(`Job client: ${job.client}, Current account: ${account}`);
                    console.log(`Match: ${job.client.toLowerCase() === account.toLowerCase()}`);
                    if (job.client.toLowerCase() === account.toLowerCase()) {
                        // Get submission link from localStorage if it exists
                        const submissionLink = localStorage.getItem(`job_${i}_submission`);
                        console.log(`Job ${i} submission link:`, submissionLink);
                        
                        // Only consider it a submission if there's actually a link AND a freelancer is assigned
                        const hasSubmission = !!submissionLink && job.freelancer !== "0x0000000000000000000000000000000000000000";
                        
                        if (submissionLink) {
                            linksObj[i] = submissionLink;
                        }
                        
                        const jobData = {
                            jobId: i,
                            title: localStorage.getItem(`job_${i}_title`) || "Untitled Job",
                            description: localStorage.getItem(`job_${i}_description`) || "No description provided",
                            budget: job.amount ? web3.utils.fromWei(job.amount, 'ether') : '0',
                            status: job.status,
                            freelancer: job.freelancer,
                            rejectCount: job.rejectCount,
                            freelancerPaid: job.freelancerPaid,
                            hasSubmission: hasSubmission
                        };
                        
                        console.log(`Job ${i} data:`, jobData);
                        submissionsArray.push(jobData);
                    }
                }
                console.log("Filtered jobs for this client:", submissionsArray);
                setSubmissions(submissionsArray);
                setSubmissionLinks(linksObj);
            } catch (error) {
                console.error("Error fetching submissions:", error);
                setSubmissions([]);
            }
        }
    };

    useEffect(() => {
        if (account && contract) {
            fetchSubmissions();
        }
    }, [contract, account]);

const createJob = async()=>{
        if(account && web3 && contract && jobBudget && jobTitle && jobDescription){
            try {
                console.log("Creating job with budget:", jobBudget, "ETH");
        const valueInWei = web3.utils.toWei(jobBudget, "ether");
                console.log("Value in Wei:", valueInWei);
        const result = await contract.methods.createJob().send({from: account, value: valueInWei});
                console.log("Job creation result:", result);
                
                // Get the job ID from the transaction result
                const jobCount = await contract.methods.jobCount().call();
                const jobId = parseInt(jobCount);
                console.log("New job ID:", jobId);
                
                // Store title and description locally
                localStorage.setItem(`job_${jobId}_title`, jobTitle);
                localStorage.setItem(`job_${jobId}_description`, jobDescription);
                console.log("Stored in localStorage:", { title: jobTitle, description: jobDescription });
                
                alert("Job created successfully!");
                setJobTitle("");
                setJobDescription("");
                setJobBudget("");
                fetchSubmissions(); // Refresh the list
            } catch (error) {
                console.error("Error creating job:", error);
                alert("Error creating job: " + error.message);
            }
    }else{
            alert("Please fill in all fields: title, description, and budget");
        }
    }

    const approveSubmission = async (jobId) => {
        if (account && contract) {
            try {
                console.log("Approving submission for job:", jobId);
                await contract.methods.approveSubmission(jobId).send({ from: account });
                alert("Submission approved! Payment has been released to the freelancer.");
                fetchSubmissions(); // Refresh the list
            } catch (error) {
                console.error("Error approving submission:", error);
                alert("Error approving submission: " + error.message);
            }
        }
    };

    const rejectSubmission = async (jobId) => {
        if (account && contract) {
            try {
                console.log("Rejecting submission for job:", jobId);
                await contract.methods.rejectSubmission(jobId).send({ from: account });
                alert("Submission rejected. Freelancer can submit again.");
                fetchSubmissions(); // Refresh the list
            } catch (error) {
                console.error("Error rejecting submission:", error);
                alert("Error rejecting submission: " + error.message);
            }
        }
    };

    const getStatusText = (status, hasSubmission, rejectCount, freelancerPaid) => {
        const statusNum = parseInt(status);
        if (statusNum === 0) return "Open";
        if (statusNum === 1) {
            if (hasSubmission) return "Pending Review";
            return "In Progress";
        }
        if (statusNum === 2 || freelancerPaid) return "Completed";
        return "Unknown";
    };

    const getStatusClass = (status, hasSubmission, freelancerPaid) => {
        const statusNum = parseInt(status);
        if (statusNum === 0) return 'open';
        if (statusNum === 1) {
            if (hasSubmission) return 'pending-review';
            return 'in-progress';
        }
        if (statusNum === 2 || freelancerPaid) return 'completed';
        return 'unknown';
    };

return(
    <div>
            <div className="dashboard-card">
                <h2>Create New Job</h2>
                <div className="form-group" >
                    <input 
                        type="text" 
                        placeholder="Job Title" 
                        value={jobTitle} 
                        onChange={(e)=>setJobTitle(e.target.value)} 
                    />
                </div>
                <div className="form-group">
                    <textarea 
                        placeholder="Job Description" 
                        value={jobDescription} 
                        onChange={(e)=>setJobDescription(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <input 
                        type="text" 
                        placeholder="Job Budget (ETH)" 
                        value={jobBudget} 
                        onChange={(e)=>setJobBudget(e.target.value)} 
                    />
                </div>
                <button onClick={createJob}>Create Job</button>
            </div>
            <div className="dashboard-card">
                <h2>My Jobs</h2>
                {submissions.length === 0 ? (
                    <div className="centered-message">No jobs found. Create your first job above!</div>
                ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Job ID</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Budget (ETH)</th>
                            <th>Status</th>
                            <th>Freelancer</th>
                            <th>Reject Count</th>
                            <th>Submission</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map((submission) => (
                            <tr key={submission.jobId}>
                                <td>{submission.jobId}</td>
                                <td>{submission.title}</td>
                                <td style={{ maxWidth: "200px", wordWrap: "break-word" }}>{submission.description}</td>
                                <td>{submission.budget}</td>
                                <td>
                                    <span className={`status-badge status-${getStatusClass(submission.status, submission.hasSubmission, submission.freelancerPaid)}`}>
                                        {getStatusText(submission.status, submission.hasSubmission, submission.rejectCount, submission.freelancerPaid)}
                                    </span>
                                </td>
                                <td>{submission.freelancer !== "0x0000000000000000000000000000000000000000" ? submission.freelancer.substring(0, 6) + "..." + submission.freelancer.substring(38) : "No freelancer assigned"}</td>
                                <td>{submission.rejectCount}/3</td>
                                <td>
                                    {submission.hasSubmission ? (
                                        <a 
                                            href={submissionLinks[submission.jobId]} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="submission-link"
                                        >
                                            View Submission
                                        </a>
                                    ) : (
                                        <span className="no-submission">No submission yet</span>
                                    )}
                                </td>
                                <td>
                                    {submission.hasSubmission && !submission.freelancerPaid && parseInt(submission.status) !== 2 && (
                                        <div className="action-buttons">
                                            <button 
                                                className="approve-btn"
                                                onClick={() => approveSubmission(submission.jobId)}
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                className="reject-btn"
                                                onClick={() => rejectSubmission(submission.jobId)}
                                                disabled={parseInt(submission.rejectCount) >= 3}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {(submission.freelancerPaid || parseInt(submission.status) === 2) && (
                                        <span className="completed-status">Payment released</span>
                                    )}
                                    {!submission.hasSubmission && parseInt(submission.status) === 1 && (
                                        <span className="waiting-status">Waiting for submission</span>
                                    )}
                                    {!submission.hasSubmission && parseInt(submission.status) === 0 && (
                                        <span className="open-status">Job is open</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
    </div>
    );
};
export default ClientDashboard;