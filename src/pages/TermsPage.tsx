import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Users, Home, MessageCircle } from "lucide-react";

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/register"
            className="inline-flex items-center text-blue-600 hover:text-blue-500 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registration
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-gray-600">Last updated: July 7, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using UniNest, you agree to be bound by these
              Terms of Service. If you disagree with any part of these terms,
              you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              2. User Accounts
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-3">
              <p>
                To use certain features of UniNest, you must create an account.
                You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Keep your account information up to date</li>
                <li>Maintain the security of your password</li>
                <li>
                  Accept responsibility for all activities under your account
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Home className="w-5 h-5 mr-2 text-blue-600" />
              3. Housing Listings
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-3">
              <p>When creating housing listings, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate descriptions and photos</li>
                <li>Honor the terms stated in your listing</li>
                <li>Respond promptly to inquiries</li>
                <li>Not post fraudulent or misleading information</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
              4. Communication and Conduct
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-3">
              <p>
                You agree to use our platform respectfully and professionally.
                Prohibited conduct includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Harassment or abusive behavior</li>
                <li>Spam or unsolicited messages</li>
                <li>Discrimination based on protected characteristics</li>
                <li>
                  Sharing personal contact information outside the platform
                  initially
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. Privacy and Data
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy
              to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              UniNest is a platform connecting students with housing
              opportunities. We are not responsible for the actual rental
              agreements, property conditions, or disputes between users. Users
              engage with each other at their own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. Termination
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to terminate or suspend accounts that violate
              these terms or engage in harmful behavior on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              8. Changes to Terms
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update these terms from time to time. We will notify users
              of any significant changes via email or platform notifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              9. Contact Us
            </h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at
              <a
                href="mailto:legal@uninest.com"
                className="text-blue-600 hover:text-blue-500 ml-1"
              >
                legal@uninest.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/register"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            I Understand, Continue Registration
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
