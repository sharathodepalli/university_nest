import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { verificationService } from "../lib/verificationService";
import {
  Shield,
  GraduationCap,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  FileText,
  Star,
  ArrowLeft,
  Info,
  AlertTriangle,
  Eye,
} from "lucide-react";

type VerificationMethod = "email" | "document" | "admin";
type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

interface VerificationRequest {
  id: string;
  userId: string;
  method: VerificationMethod;
  status: VerificationStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  documents?: string[];
  universityEmail?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

const VerificationPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedMethod, setSelectedMethod] =
    useState<VerificationMethod>("email");
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>("unverified");
  const [universityEmail, setUniversityEmail] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationRequest, setVerificationRequest] =
    useState<VerificationRequest | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if user is already verified using the new student verification field
    if (user.student_verified || user.verification_status === "verified") {
      setVerificationStatus("verified");
      return;
    }

    // Load verification status from production service
    const loadVerificationStatus = async () => {
      try {
        const result = await verificationService.getVerificationStatus(user.id);
        if (result.success && result.data) {
          const status = result.data;
          if (status.student_verified) {
            setVerificationStatus("verified");
          } else if (status.verification_status === "pending") {
            setVerificationStatus("pending");
            // Create a mock request for UI consistency
            const request: VerificationRequest = {
              id: `req_${Date.now()}`,
              userId: user.id,
              method: "email",
              status: "pending",
              submittedAt: new Date(),
              universityEmail: status.student_email || "",
            };
            setVerificationRequest(request);
            if (status.student_email) {
              setUniversityEmail(status.student_email);
            }
          }
        }
      } catch (error) {
        console.warn("Failed to load verification status:", error);
        // If we can't load from the database, start fresh
      }
    };

    loadVerificationStatus();
  }, [user, navigate]);

  const handleEmailVerification = async () => {
    // Clear previous states
    setError("");
    setSuccess("");

    if (!universityEmail.trim()) {
      setError("Please enter your university email address");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Use production verification service
      const result = await verificationService.requestEmailVerification(
        user!.id,
        universityEmail.trim(),
        (user as any)?.user_metadata?.name ||
          user?.email?.split("@")[0] ||
          "Student"
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      // Update UI state
      const request: VerificationRequest = {
        id: result.data?.id || `req_${Date.now()}`,
        userId: user!.id,
        method: "email",
        status: "pending",
        submittedAt: new Date(),
        universityEmail: universityEmail.trim(),
      };

      setVerificationRequest(request);
      setVerificationStatus("pending");
      setSuccess(result.message);
    } catch (err: any) {
      console.error("Email verification error:", err);
      setError(
        err.message || "Failed to send verification email. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 3) {
      setError("Maximum 3 documents allowed");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    const invalidFiles = files.filter(
      (file) => !validTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setError("Only JPEG, PNG, and PDF files are allowed");
      return;
    }

    setDocuments(files);
    setError("");
  };

  const handleDocumentVerification = async () => {
    if (documents.length === 0) {
      setError("Please upload at least one document");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // TODO: Implement document verification via verificationService
      // For now, show an informative message
      setError(
        "Document verification is not yet implemented. Please use email verification instead."
      );
    } catch (err) {
      setError("Failed to upload documents. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    if (!verificationRequest?.universityEmail) {
      setError("No email address found for resending");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Use the production verification service to resend email
      const result = await verificationService.requestEmailVerification(
        user!.id,
        verificationRequest.universityEmail,
        (user as any)?.user_metadata?.name ||
          user?.email?.split("@")[0] ||
          "Student"
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      setSuccess(
        "Verification email resent successfully! Please check your inbox."
      );
    } catch (err: any) {
      console.error("Error resending verification email:", err);
      setError(err.message || "Failed to resend email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove verification simulation - not needed in production
  const simulateVerificationApproval = async () => {
    setError(
      "Verification simulation is disabled in production mode. Please use the actual email verification process."
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "verified":
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case "pending":
        return <Clock className="w-8 h-8 text-yellow-600" />;
      case "rejected":
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      default:
        return <Shield className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case "verified":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-yellow-50 border-yellow-200";
      case "rejected":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">UniNest</span>
            </div>

            <div className="flex items-center justify-center mb-4">
              {getStatusIcon()}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Account Verification
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Verify your student status to unlock premium features and gain
              access to verified-only listings and messaging.
            </p>
          </div>
        </div>

        {/* Explanation Section */}
        {verificationStatus === "unverified" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h3 className="font-semibold text-blue-900 mb-2">
                  About Verification
                </h3>
                <div className="text-blue-800 space-y-2">
                  <p>
                    <strong>You're logged in with:</strong> {user?.email}
                  </p>
                  <p>
                    <strong>For verification, we need:</strong> Your university
                    email (.edu address)
                  </p>
                  <p className="text-xs text-blue-700">
                    This two-email system lets you use any email for daily
                    access while confirming your student status with your
                    official university email.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Status */}
        <div className={`rounded-xl p-6 mb-8 border ${getStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Verification Status
              </h3>
              <p className="text-gray-600">
                {verificationStatus === "verified" &&
                  "Your account is verified! You have access to all features."}
                {verificationStatus === "pending" &&
                  `Your verification is being reviewed. We'll notify you once it's complete.`}
                {verificationStatus === "rejected" &&
                  "Your verification was rejected. Please try again with different documents."}
                {verificationStatus === "unverified" &&
                  "Your account is not verified. Choose a verification method below."}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  verificationStatus === "verified"
                    ? "bg-green-100 text-green-800"
                    : verificationStatus === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : verificationStatus === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {verificationStatus === "verified" && "✓ Verified"}
                {verificationStatus === "pending" && "⏳ Pending"}
                {verificationStatus === "rejected" && "✗ Rejected"}
                {verificationStatus === "unverified" && "○ Unverified"}
              </span>
            </div>
          </div>

          {verificationRequest && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Method:</span>
                  <p className="text-gray-900 capitalize">
                    {verificationRequest.method}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Submitted:</span>
                  <p className="text-gray-900">
                    {verificationRequest.submittedAt.toLocaleDateString()}
                  </p>
                </div>
                {verificationRequest.reviewedAt && (
                  <div>
                    <span className="font-medium text-gray-600">Reviewed:</span>
                    <p className="text-gray-900">
                      {verificationRequest.reviewedAt.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Verification Benefits */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            Verification Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">
                  Access Premium Listings
                </h4>
                <p className="text-sm text-gray-600">
                  View and apply to verified-only housing options
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">
                  Priority Messaging
                </h4>
                <p className="text-sm text-gray-600">
                  Message hosts who only accept verified users
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Trust Badge</h4>
                <p className="text-sm text-gray-600">
                  Display verified status on your profile and listings
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Enhanced Safety</h4>
                <p className="text-sm text-gray-600">
                  Connect with other verified students for safer housing
                </p>
              </div>
            </div>
          </div>
        </div>

        {verificationStatus === "verified" ? (
          /* Verified State */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Account Verified!
            </h3>
            <p className="text-gray-600 mb-6">
              Your student status has been confirmed. You now have access to all
              UniNest features.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate("/browse")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Verified Listings
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        ) : verificationStatus === "pending" ? (
          /* Pending State */
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="text-center mb-6">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verification In Progress
              </h3>
              <p className="text-gray-600">
                {verificationRequest?.method === "email"
                  ? "Please check your email and click the verification link to complete the process."
                  : "Our team is reviewing your documents. This typically takes 1-2 business days."}
              </p>
            </div>

            {verificationRequest?.method === "email" && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">
                        Verification email sent to:
                      </p>
                      <p className="font-mono">
                        {verificationRequest.universityEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleResendEmail}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Resend Email"}
                  </button>
                </div>
              </div>
            )}

            {/* Development: Simulate approval */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Eye className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-2">Development Mode</p>
                      <button
                        onClick={simulateVerificationApproval}
                        className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                      >
                        Simulate Approval
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Unverified State - Verification Methods */
          <div className="space-y-6">
            {/* Method Selection */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Verification Method
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Verification */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMethod === "email"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedMethod("email")}
                >
                  <div className="flex items-start space-x-3">
                    <Mail className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        University Email
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Verify using your official university email address
                        (.edu)
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Instant
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Verification */}
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedMethod === "document"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedMethod("document")}
                >
                  <div className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Document Upload
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Upload student ID, enrollment letter, or transcript
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          1-2 days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Form */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              {selectedMethod === "email" ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Verify with University Email
                  </h4>
                  <p className="text-sm text-gray-600">
                    Enter your official university email address. We'll send a
                    verification link to confirm your student status.
                  </p>

                  <div>
                    <label
                      htmlFor="university-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      University Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        id="university-email"
                        type="email"
                        value={universityEmail}
                        onChange={(e) => {
                          console.log(
                            "Email input changed to:",
                            e.target.value
                          );
                          setUniversityEmail(e.target.value);
                          // Clear previous errors when user starts typing
                          if (error) setError("");
                          if (success) setSuccess("");
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleEmailVerification();
                          }
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your.email@university.edu"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Must be an official .edu email address
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEmailVerification();
                    }}
                    disabled={isSubmitting || !universityEmail.trim()}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Mail className="w-4 h-4" />
                    )}
                    <span>
                      {isSubmitting ? "Sending..." : "Send Verification Email"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">
                    Upload Student Documents
                  </h4>
                  <p className="text-sm text-gray-600">
                    Upload one or more of the following documents to verify your
                    student status:
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Accepted Documents:
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Student ID card (both sides)</li>
                      <li>• Official enrollment verification letter</li>
                      <li>• Current class schedule or transcript</li>
                      <li>• University acceptance letter</li>
                    </ul>
                  </div>

                  <div>
                    <label
                      htmlFor="documents"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Upload Documents
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        id="documents"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleDocumentUpload}
                        className="hidden"
                      />
                      <label htmlFor="documents" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPEG, PNG, PDF (max 3 files)
                        </p>
                      </label>
                    </div>

                    {documents.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <h6 className="text-sm font-medium text-gray-700">
                          Selected Files:
                        </h6>
                        {documents.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2 text-sm text-gray-600"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{file.name}</span>
                            <span className="text-gray-400">
                              ({(file.size / 1024 / 1024).toFixed(1)} MB)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleDocumentVerification}
                    disabled={isSubmitting || documents.length === 0}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>
                      {isSubmitting ? "Uploading..." : "Submit Documents"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">
                How long does verification take?
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Email verification is instant. Document verification typically
                takes 1-2 business days.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                What if I don't have a university email?
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                You can verify using official documents like your student ID or
                enrollment letter.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Is my information secure?
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Yes, all documents are encrypted and securely stored. We only
                use them for verification purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
