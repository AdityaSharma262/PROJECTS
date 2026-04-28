import { useState, useEffect } from "react"
import StatusBadge from "./ui/StatusBadge"
import LoadingSpinner from "./ui/LoadingSpinner"
import Modal from "./ui/Modal"

const ClientDashboard = ({ web3, account, contract, showToast }) => {
    const [jobTitle, setJobTitle] = useState("");
    const [jobDescription, setJobDescription] = useState("");
    const [jobBudget, setJobBudget] = useState("");
    const [submissions, setSubmissions] = useState([]);
    const [submissionLinks, setSubmissionLinks] = useState({});
    const [loading, setLoading] = useState(false);
    const [creatingJob, setCreatingJob] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    // Fetch all jobs and their submissions
    const fetchSubmissions = async () => {
        if (contract) {
            setLoading(true);
            try {
                const jobCount = await contract.methods.jobCount().call();
                const jobCountNum = parseInt(jobCount);
                if (!jobCountNum || isNaN(jobCountNum)) {
                    setSubmissions([]);
                    return;
                }
                const submissionsArray = [];
                const linksObj = {};
                
                for (let i = 1; i <= jobCountNum; i++) {
                    const job = await contract.methods.jobs(i).call();
                    if (job.client.toLowerCase() === account.toLowerCase()) {
                        const submissionLink = localStorage.getItem(`job_${i}_submission`);
                        
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
                        
                        submissionsArray.push(jobData);
                    }
                }
                setSubmissions(submissionsArray);
                setSubmissionLinks(linksObj);
            } catch (error) {
                console.error("Error fetching submissions:", error);
                setSubmissions([]);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (account && contract) {
            fetchSubmissions();
        }
    }, [contract, account]);

    const createJob = async () => {
        if (account && web3 && contract && jobBudget && jobTitle && jobDescription) {
            setCreatingJob(true);
            try {
                const valueInWei = web3.utils.toWei(jobBudget, "ether");
                const result = await contract.methods.createJob().send({ from: account, value: valueInWei });
                
                const jobCount = await contract.methods.jobCount().call();
                const jobId = parseInt(jobCount);
                
                localStorage.setItem(`job_${jobId}_title`, jobTitle);
                localStorage.setItem(`job_${jobId}_description`, jobDescription);
                
                showToast("Job created successfully!", "success");
                setJobTitle("");
                setJobDescription("");
                setJobBudget("");
                fetchSubmissions();
            } catch (error) {
                console.error("Error creating job:", error);
                showToast("Error creating job: " + error.message, "error");
            } finally {
                setCreatingJob(false);
            }
        } else {
            showToast("Please fill in all fields: title, description, and budget", "error");
        }
    };

    const approveSubmission = async (jobId) => {
        if (account && contract) {
            try {
                await contract.methods.approveSubmission(jobId).send({ from: account });
                showToast("Submission approved! Payment released to freelancer.", "success");
                fetchSubmissions();
            } catch (error) {
                console.error("Error approving submission:", error);
                showToast("Error approving submission: " + error.message, "error");
            }
        }
    };

    const rejectSubmission = async (jobId) => {
        if (account && contract) {
            try {
                await contract.methods.rejectSubmission(jobId).send({ from: account });
                showToast("Submission rejected. Freelancer can submit again.", "info");
                fetchSubmissions();
            } catch (error) {
                console.error("Error rejecting submission:", error);
                showToast("Error rejecting submission: " + error.message, "error");
            }
        }
    };

    const getStatusText = (status, hasSubmission, rejectCount, freelancerPaid) => {
        const statusNum = parseInt(status);
        if (statusNum === 0) return "open";
        if (statusNum === 1) {
            if (hasSubmission) return "pending-review";
            return "in-progress";
        }
        if (statusNum === 2 || freelancerPaid) return "completed";
        return "open";
    };

    const formatAddress = (address) => {
        if (address === "0x0000000000000000000000000000000000000000") return "Not assigned";
        return `${address.substring(0, 6)}...${address.substring(38)}`;
    };

    return (
        <div className="space-y-8">
            {/* Create Job Form */}
            <div className="card">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Create New Job</h2>
                        <p className="text-sm text-gray-600">Post a job and fund escrow instantly</p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Job Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g., Build a React Website" 
                            value={jobTitle} 
                            onChange={(e) => setJobTitle(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description</label>
                        <textarea 
                            placeholder="Describe the job requirements..." 
                            value={jobDescription} 
                            onChange={(e) => setJobDescription(e.target.value)}
                            className="input-field"
                            rows="4"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Budget (ETH)</label>
                        <input 
                            type="text" 
                            placeholder="0.5" 
                            value={jobBudget} 
                            onChange={(e) => setJobBudget(e.target.value)}
                            className="input-field"
                        />
                    </div>
                    
                    <button 
                        onClick={createJob}
                        disabled={creatingJob}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {creatingJob ? (
                            <>
                                <LoadingSpinner size="sm" />
                                Creating Job...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Job & Fund Escrow
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Jobs List */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">My Jobs</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {submissions.length} {submissions.length === 1 ? 'job' : 'jobs'} total
                        </p>
                    </div>
                    <button 
                        onClick={fetchSubmissions}
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
                ) : submissions.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-600 font-medium">No jobs found</p>
                        <p className="text-sm text-gray-500 mt-1">Create your first job above!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {submissions.map((job) => (
                            <div key={job.jobId} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                                            <StatusBadge status={getStatusText(job.status, job.hasSubmission, job.rejectCount, job.freelancerPaid)} />
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
                                                <span className="text-gray-700">{formatAddress(job.freelancer)}</span>
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
                                    
                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                        {job.hasSubmission && !job.freelancerPaid && parseInt(job.status) !== 2 && (
                                            <>
                                                <button 
                                                    onClick={() => approveSubmission(job.jobId)}
                                                    className="btn-success text-sm py-2"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Approve & Pay
                                                    </div>
                                                </button>
                                                <button 
                                                    onClick={() => rejectSubmission(job.jobId)}
                                                    disabled={parseInt(job.rejectCount) >= 3}
                                                    className="btn-danger text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Reject
                                                    </div>
                                                </button>
                                            </>
                                        )}
                                        
                                        {job.hasSubmission && (
                                            <button 
                                                onClick={() => setSelectedJob(job)}
                                                className="btn-secondary text-sm py-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    View Submission
                                                </div>
                                            </button>
                                        )}
                                        
                                        {(job.freelancerPaid || parseInt(job.status) === 2) && (
                                            <div className="px-4 py-2 bg-gray-100 rounded-lg text-center">
                                                <span className="text-sm font-medium text-gray-700">✓ Payment Released</span>
                                            </div>
                                        )}
                                        
                                        {!job.hasSubmission && parseInt(job.status) === 1 && (
                                            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
                                                <span className="text-sm font-medium text-amber-700">⏳ Waiting for Submission</span>
                                            </div>
                                        )}
                                        
                                        {!job.hasSubmission && parseInt(job.status) === 0 && (
                                            <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                                                <span className="text-sm font-medium text-emerald-700">✓ Job is Open</span>
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
                isOpen={!!selectedJob} 
                onClose={() => setSelectedJob(null)}
                title={`Submission for ${selectedJob?.title}`}
            >
                {selectedJob && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Submission Link</label>
                            <a 
                                href={submissionLinks[selectedJob.jobId]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-200 rounded-lg text-primary-700 hover:bg-primary-100 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View Submission
                            </a>
                        </div>
                        <button 
                            onClick={() => setSelectedJob(null)}
                            className="btn-secondary w-full"
                        >
                            Close
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ClientDashboard;