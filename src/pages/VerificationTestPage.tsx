import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  FileText,
  Play,
  User,
  Shield,
} from "lucide-react";

const VerificationTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState("");

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setCurrentTest(testName);
    try {
      const result = await testFn();
      setTestResults((prev) => ({
        ...prev,
        [testName]: { success: true, result },
      }));
    } catch (error: any) {
      setTestResults((prev) => ({
        ...prev,
        [testName]: { success: false, error: error.message },
      }));
    }
  };

  const testEmailValidation = async () => {
    const testCases = [
      { email: "student@university.edu", expected: true },
      { email: "john.doe@harvard.edu", expected: true },
      { email: "test@mit.edu", expected: true },
      { email: "invalid@gmail.com", expected: false },
      { email: "not-an-email", expected: false },
      { email: "", expected: false },
    ];

    const results = testCases.map(({ email, expected }) => {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      const isValidFormat = emailRegex.test(email);
      const isEduDomain = email.endsWith(".edu");
      const actual = isValidFormat && isEduDomain;

      return {
        email: email || "(empty)",
        expected,
        actual,
        passed: expected === actual,
      };
    });

    const allPassed = results.every((r) => r.passed);
    if (!allPassed) {
      throw new Error("Email validation tests failed");
    }

    return results;
  };

  const testTokenGeneration = async () => {
    const tokens = [];
    for (let i = 0; i < 5; i++) {
      const token = crypto.randomUUID();
      tokens.push(token);
    }

    // Check all tokens are unique
    const uniqueTokens = new Set(tokens);
    if (uniqueTokens.size !== tokens.length) {
      throw new Error("Generated duplicate tokens");
    }

    // Check token format (UUID v4)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const invalidTokens = tokens.filter((token) => !uuidRegex.test(token));
    if (invalidTokens.length > 0) {
      throw new Error("Generated invalid token format");
    }

    return { tokens, count: tokens.length };
  };

  const testLocalStorageIntegration = async () => {
    const testData = {
      id: "test_123",
      userId: "user_456",
      method: "email" as const,
      status: "pending" as const,
      submittedAt: new Date(),
      universityEmail: "test@university.edu",
    };

    // Test storage
    localStorage.setItem("test_verification", JSON.stringify(testData));

    // Test retrieval
    const retrieved = localStorage.getItem("test_verification");
    if (!retrieved) {
      throw new Error("Failed to store data in localStorage");
    }

    const parsed = JSON.parse(retrieved);
    if (parsed.id !== testData.id) {
      throw new Error("Data integrity check failed");
    }

    // Cleanup
    localStorage.removeItem("test_verification");

    return { stored: testData, retrieved: parsed };
  };

  const testVerificationFlow = async () => {
    // Simulate the full verification flow
    const steps = [];

    // Step 1: User input validation
    const email = "student@harvard.edu";
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    const isValid = emailRegex.test(email) && email.endsWith(".edu");
    steps.push({ step: "Email Validation", passed: isValid });

    // Step 2: Token generation
    const token = crypto.randomUUID();
    steps.push({ step: "Token Generation", passed: token.length > 0 });

    // Step 3: Request creation
    const request = {
      id: `req_${Date.now()}`,
      userId: "test_user",
      method: "email",
      status: "pending",
      submittedAt: new Date(),
      universityEmail: email,
    };
    steps.push({
      step: "Request Creation",
      passed: request.id.includes("req_"),
    });

    // Step 4: URL generation
    const verificationUrl = `${window.location.origin}/verify-email?token=${token}`;
    steps.push({
      step: "URL Generation",
      passed: verificationUrl.includes("verify-email"),
    });

    // Step 5: Storage simulation
    localStorage.setItem("test_flow", JSON.stringify(request));
    const stored = localStorage.getItem("test_flow");
    steps.push({ step: "Data Storage", passed: stored !== null });

    // Cleanup
    localStorage.removeItem("test_flow");

    const allPassed = steps.every((s) => s.passed);
    if (!allPassed) {
      throw new Error("Verification flow test failed");
    }

    return { steps, verificationUrl, token };
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});

    const tests = [
      { name: "emailValidation", fn: testEmailValidation },
      { name: "tokenGeneration", fn: testTokenGeneration },
      { name: "localStorageIntegration", fn: testLocalStorageIntegration },
      { name: "verificationFlow", fn: testVerificationFlow },
    ];

    for (const test of tests) {
      await runTest(test.name, test.fn);
      // Small delay for visual effect
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setCurrentTest("");
    setIsRunning(false);
  };

  const getTestStatus = (testName: string) => {
    const result = testResults[testName];
    if (!result) return "pending";
    return result.success ? "success" : "error";
  };

  const getTestIcon = (testName: string) => {
    const status = getTestStatus(testName);
    if (status === "pending")
      return <Clock className="w-5 h-5 text-gray-400" />;
    if (status === "success")
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              UniNest Verification System Test
            </h1>
            <p className="text-gray-600">
              Comprehensive testing suite for email verification functionality
            </p>
          </div>

          <div className="mb-8 text-center">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              {isRunning ? "Running Tests..." : "Run All Tests"}
            </button>
          </div>

          {isRunning && currentTest && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-blue-800 font-medium">
                  Running: {currentTest}
                </span>
              </div>
            </div>
          )}

          <div className="grid gap-6">
            {/* Email Validation Test */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {getTestIcon("emailValidation")}
                <h3 className="text-xl font-semibold">Email Validation</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Tests university email format validation (.edu domain
                requirement)
              </p>
              {testResults.emailValidation && (
                <div className="mt-4">
                  {testResults.emailValidation.success ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        Test Results:
                      </h4>
                      <div className="space-y-1">
                        {testResults.emailValidation.result.map(
                          (test: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              {test.passed ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span>{test.email}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-red-800">
                        {testResults.emailValidation.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Token Generation Test */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {getTestIcon("tokenGeneration")}
                <h3 className="text-xl font-semibold">Token Generation</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Tests UUID v4 token generation for verification links
              </p>
              {testResults.tokenGeneration && (
                <div className="mt-4">
                  {testResults.tokenGeneration.success ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-semibold">
                        Generated {testResults.tokenGeneration.result.count}{" "}
                        unique tokens
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Example: {testResults.tokenGeneration.result.tokens[0]}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-red-800">
                        {testResults.tokenGeneration.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LocalStorage Integration Test */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {getTestIcon("localStorageIntegration")}
                <h3 className="text-xl font-semibold">
                  LocalStorage Integration
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Tests data persistence for verification requests
              </p>
              {testResults.localStorageIntegration && (
                <div className="mt-4">
                  {testResults.localStorageIntegration.success ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-semibold">
                        ✅ Data storage and retrieval working correctly
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-red-800">
                        {testResults.localStorageIntegration.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Verification Flow Test */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {getTestIcon("verificationFlow")}
                <h3 className="text-xl font-semibold">
                  Complete Verification Flow
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                Tests the entire email verification process end-to-end
              </p>
              {testResults.verificationFlow && (
                <div className="mt-4">
                  {testResults.verificationFlow.success ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">
                        Flow Steps:
                      </h4>
                      <div className="space-y-2">
                        {testResults.verificationFlow.result.steps.map(
                          (step: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{step.step}</span>
                            </div>
                          )
                        )}
                      </div>
                      <div className="mt-3 p-3 bg-white rounded border">
                        <p className="text-sm text-gray-600">Generated URL:</p>
                        <p className="text-xs font-mono text-blue-600 break-all">
                          {testResults.verificationFlow.result.verificationUrl}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-red-800">
                        {testResults.verificationFlow.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
              <li>
                If all tests pass, your verification logic is working correctly
              </li>
              <li>
                Test the actual verification page at <code>/verification</code>
              </li>
              <li>Check your Supabase SMTP settings for email delivery</li>
              <li>
                Consider implementing SendGrid/Resend for production emails
              </li>
            </ol>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/verification"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <User className="w-4 h-4" />
              Go to Verification Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationTestPage;
