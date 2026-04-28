import { useState, useEffect } from "react"
import StatusBadge from "./ui/StatusBadge"
import LoadingSpinner from "./ui/LoadingSpinner"
import Modal from "./ui/Modal"

const FreelancerDashboard = ({ web3, account, contract, showToast }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submissionLink, setSubmissionLink] = useState("");
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Fetch all jobs
    const fetchJobs = async () => {
        if (contract) {
            setLoading(true);
            try {
                const jobCount = await contract.methods.jobCount().call();
                const jobCountNum = parseInt(jobCount);
                
                if (!jobCountNum || isNaN(jobCountNum)) {
                    setJobs([]);
                    return;
                }
                
                const jobsArray = [];
                
                for (let i = 1; i <= jobCountNum; i++) {
                    const job = await contract.methods.jobs(i).call();
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
                
                setJobs(jobsArray);
            } catch (error) {
                console.error("Error fetching jobs:", error);
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
                await contract.methods.acceptJob(jobId).send({ from: account });
                showToast("Job accepted successfully!", "success");
                fetchJobs();
            } catch (error) {
                console.error("Error accepting job:", error);
                showToast("Error accepting job: " + error.message, "error");
            }
        }
    };

    const submitWork = async (jobId) => {
        if (account && contract && submissionLink.trim()) {
            setSubmitting(true);
            try {
                await contract.methods.submit(jobId, submissionLink).send({ from: account });
                localStorage.setItem(`job_${jobId}_submission`, submissionLink);
                showToast("Work submitted successfully!", "success");
                setSubmissionLink("");
                setSelectedJobId(null);
                fetchJobs();
            } catch (error) {
                console.error("Error submitting work:", error);
                showToast("Error submitting work: " + error.message, "error");
            } finally {
                setSubmitting(false);
            }
        } else {
            showToast("Please provide a submission link", "error");
        }
    };

    const getStatusText = (status, hasSubmitted) => {
        const statusNum = parseInt(status);
        if (statusNum === 0) return "open";
        if (statusNum === 1) {
            if (hasSubmitted) return "submitted";
            return "in-progress";
        }
        if (statusNum === 2) return "completed";
        return "open";
    };

    const formatAddress = (address) => {
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    return (
        <div className="space-y-8">
            {/* Available Jobs */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Available Jobs</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Browse and accept jobs that match your skills
                        </p>
                    </div>
                    <button 
                        onClick={fetchJobs}
                        className="btn-secondary text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="py-12">
                        <LoadingSpinner size="lg" text="Loading jobs..." />
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 font-medium">No jobs available</p>
                        <p className="text-sm text-gray-500 mt-1">Check back later for new opportunities</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {jobs.map((job) => (
                            <div key={job.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                                            <StatusBadge status={getStatusText(job.status, job.hasSubmitted)} />
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3">{job.description}</p>
                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-semibold text-gray-900">{job.budget} ETH</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span className="text-gray-700">Client: {formatAddress(job.client)}</span>
                                            </div>
                                            {parseInt(job.rejectCount) > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    <span className="text-amber-700 font-medium">{job.rejectCount}/3 rejections</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-2 min-w-[180px]">
                                        {parseInt(job.status) === 0 && job.freelancer === "0x0000000000000000000000000000000000000000" && (
                                            <button 
                                                onClick={() => acceptJob(job.id)}
                                                className="btn-success text-sm py-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Accept Job
                                                </div>
                                            </button>
                                        )}
                                        
                                        {parseInt(job.status) === 1 && job.freelancer.toLowerCase() === account.toLowerCase() && parseInt(job.rejectCount) < 3 && (
                                            <button 
                                                onClick={() => setSelectedJobId(job.id)}
                                                className="btn-primary text-sm py-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    {job.hasSubmitted ? "Resubmit Work" : "Submit Work"}
                                                </div>
                                            </button>
                                        )}
                                        
                                        {parseInt(job.status) === 1 && job.freelancer.toLowerCase() === account.toLowerCase() && job.hasSubmitted && parseInt(job.rejectCount) >= 3 && (
                                            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-center">
                                                <span className="text-sm font-medium text-red-700">✕ Max Rejections Reached</span>
                                            </div>
                                        )}
                                        
                                        {parseInt(job.status) === 2 && job.freelancer.toLowerCase() === account.toLowerCase() && (
                                            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                                                <span className="text-sm font-medium text-emerald-700">✓ Job Completed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Submission Modal */}
            <Modal 
                isOpen={!!selectedJobId} 
                onClose={() => {
                    setSelectedJobId(null);
                    setSubmissionLink("");
                }}
                title={`Submit Work for Job #${selectedJobId}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Submission Link (IPFS or URL)
                        </label>
                        <input 
                            type="text" 
                            placeholder="https://ipfs.io/ipfs/Qm..." 
                            value={submissionLink} 
                            onChange={(e) => setSubmissionLink(e.target.value)}
                            className="input-field"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Provide a link to your work submission (IPFS, Google Drive, GitHub, etc.)
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => submitWork(selectedJobId)}
                            disabled={submitting}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <LoadingSpinner size="sm" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Submit Work
                                </>
                            )}
                        </button>
                        <button 
                            onClick={() => {
                                setSelectedJobId(null);
                                setSubmissionLink("");
                            }}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FreelancerDashboard;