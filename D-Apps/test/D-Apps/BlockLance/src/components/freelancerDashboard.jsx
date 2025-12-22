import { useState, useEffect } from "react"

const FreelancerDashboard = ({ web3, account, contract }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submissionLink, setSubmissionLink] = useState("");
    const [selectedJobId, setSelectedJobId] = useState(null);

    // Fetch all jobs
    const fetchJobs = async () => {
        if (contract) {
            setLoading(true);
            try {
                console.log("Freelancer: Fetching jobs...");
                const jobCount = await contract.methods.jobCount().call();
                console.log("Freelancer: Total job count:", jobCount);
                
                const jobCountNum = parseInt(jobCount);
                if (!jobCountNum || isNaN(jobCountNum)) {
                    console.error("Freelancer: jobCount is invalid:", jobCountNum);
                    setJobs([]);
                    setLoading(false);
                    return;
                }
                
                const jobsArray = [];
                
                for (let i = 1; i <= jobCountNum; i++) {
                    const job = await contract.methods.jobs(i).call();
                    console.log(`Freelancer: Job ${i}:`, job);
                    
                    // Check if this freelancer has submitted work for this job
                    const hasSubmitted = localStorage.getItem(`job_${i}_submission`) !== null;
                    
                    jobsArray.push({
                        id: i,
                        title: localStorage.getItem(`job_${i}_title`) || "Untitled Job",
                        description: localStorage.getItem(`job_${i}_description`) || "No description provided",
                        budget: job.amount ? web3.utils.fromWei(job.amount, 'ether') : '0',
                        status: job.status,
                        client: job.client,
                        freelancer: job.freelancer,
                        rejectCount: job.rejectCount,
                        hasSubmitted: hasSubmitted
                    });
                }
                
                console.log("Freelancer: All jobs fetched:", jobsArray);
                setJobs(jobsArray);
            } catch (error) {
                console.error("Freelancer: Error fetching jobs:", error);
                setJobs([]);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (account && contract) {
            fetchJobs();
        }
    }, [contract, account]);

    const acceptJob = async (jobId) => {
        if (account && contract) {
            try {
                console.log("Accepting job:", jobId);
                await contract.methods.acceptJob(jobId).send({ from: account });
                alert("Job accepted successfully!");
                fetchJobs(); // Refresh the list
            } catch (error) {
                console.error("Error accepting job:", error);
                alert("Error accepting job: " + error.message);
            }
        }
    };

    const submitWork = async (jobId) => {
        if (account && contract && submissionLink.trim()) {
            try {
                console.log("Submitting work for job:", jobId, "Link:", submissionLink);
                await contract.methods.submit(jobId, submissionLink).send({ from: account });
                
                // Store submission link locally for client to access (this will overwrite any previous submission)
                localStorage.setItem(`job_${jobId}_submission`, submissionLink);
                
                alert("Work submitted successfully!");
                setSubmissionLink("");
                setSelectedJobId(null);
                fetchJobs(); // Refresh the list
            } catch (error) {
                console.error("Error submitting work:", error);
                alert("Error submitting work: " + error.message);
            }
        } else {
            alert("Please provide a submission link");
        }
    };

    const getStatusText = (status, hasSubmitted) => {
        const statusNum = parseInt(status);
        if (statusNum === 0) return "Open";
        if (statusNum === 1) {
            if (hasSubmitted) return "Submitted";
            return "In Progress";
        }
        if (statusNum === 2) return "Completed";
        return "Unknown";
    };

    const getStatusClass = (status, hasSubmitted) => {
        const statusNum = parseInt(status);
        if (statusNum === 0) return 'open';
        if (statusNum === 1) {
            if (hasSubmitted) return 'submitted';
            return 'in-progress';
        }
        if (statusNum === 2) return 'completed';
        return 'unknown';
    };

    return (
        <div>
            <div className="dashboard-card">
                <h2>Available Jobs</h2>
                {loading ? (
                    <div className="centered-message">Loading jobs...</div>
                ) : jobs.length === 0 ? (
                    <div className="centered-message">No jobs available at the moment.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Budget (ETH)</th>
                                <th>Status</th>
                                <th>Reject Count</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map((job) => (
                                <tr key={job.id}>
                                    <td>{job.id}</td>
                                    <td>{job.title}</td>
                                    <td>{job.description}</td>
                                    <td>{job.budget}</td>
                                    <td>
                                        <span className={`status-badge status-${getStatusClass(job.status, job.hasSubmitted)}`}>
                                            {getStatusText(job.status, job.hasSubmitted)}
                                        </span>
                                    </td>
                                    <td>{job.rejectCount}/3</td>
                                    <td>
                                        {parseInt(job.status) === 0 && job.freelancer === "0x0000000000000000000000000000000000000000" && (
                                            <button 
                                                className="accept-btn"
                                                onClick={() => acceptJob(job.id)}
                                            >
                                                Accept Job
                                            </button>
                                        )}
                                        {parseInt(job.status) === 1 && job.freelancer.toLowerCase() === account.toLowerCase() && parseInt(job.rejectCount) < 3 && (
                                            <button 
                                                className="submit-btn"
                                                onClick={() => setSelectedJobId(job.id)}
                                            >
                                                {job.hasSubmitted ? "Resubmit Work" : "Submit Work"}
                                            </button>
                                        )}
                                        {parseInt(job.status) === 1 && job.freelancer.toLowerCase() === account.toLowerCase() && job.hasSubmitted && parseInt(job.rejectCount) >= 3 && (
                                            <span className="rejected-status">Max rejections reached</span>
                                        )}
                                        {parseInt(job.status) === 2 && job.freelancer.toLowerCase() === account.toLowerCase() && (
                                            <span className="completed-status">Job completed</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Submission Modal */}
            {selectedJobId && (
                <div className="dashboard-card">
                    <h3>Submit Work for Job #{selectedJobId}</h3>
                    <div className="form-group">
                        <input 
                            type="text" 
                            placeholder="IPFS Submission Link (e.g., https://ipfs.io/ipfs/Qm...)" 
                            value={submissionLink} 
                            onChange={(e) => setSubmissionLink(e.target.value)}
                        />
                    </div>
                    <div className="button-group">
                        <button 
                            className="submit-btn"
                            onClick={() => submitWork(selectedJobId)}
                        >
                            Submit Work
                        </button>
                        <button 
                            className="cancel-btn"
                            onClick={() => {
                                setSelectedJobId(null);
                                setSubmissionLink("");
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default FreelancerDashboard;