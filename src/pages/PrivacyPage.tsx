import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Eye,
  Database,
  Users,
  Lock,
  Mail,
} from "lucide-react";

const PrivacyPage: React.FC = () => {
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
            Privacy Policy
          </h1>
          <p className="text-gray-600">Last updated: July 7, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              1. Information We Collect
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-3">
              <p>
                We collect information to provide better services to our users:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Personal Information:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Name and email address</li>
                  <li>University and academic year</li>
                  <li>Profile information and bio</li>
                  <li>Communication preferences</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Usage Information:</h4>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Listings you view and create</li>
                  <li>Messages sent through our platform</li>
                  <li>Search history and preferences</li>
                  <li>Device and browser information</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-600" />
              2. How We Use Your Information
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-3">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our housing marketplace services</li>
                <li>Connect you with relevant housing opportunities</li>
                <li>Enable communication between students and hosts</li>
                <li>Send important updates about your account and listings</li>
                <li>Ensure platform safety and prevent fraud</li>
                <li>Analyze usage patterns to improve user experience</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              3. Information Sharing
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-3">
              <p>We share your information only in these circumstances:</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">
                  With Other Users:
                </h4>
                <p className="text-sm text-blue-700">
                  Your name, university, year, and bio are visible to other
                  users when you contact them or create listings. Your email is
                  never shared publicly.
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-green-800">
                  Service Providers:
                </h4>
                <p className="text-sm text-green-700">
                  We work with trusted service providers who help us operate our
                  platform, under strict confidentiality agreements.
                </p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-orange-800">
                  Legal Requirements:
                </h4>
                <p className="text-sm text-orange-700">
                  We may disclose information if required by law or to protect
                  our users' safety and our platform's security.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-600" />
              4. Data Storage and Security
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-3">
              <p>We protect your information through:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information</li>
                <li>Secure data centers with redundant backups</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              5. Your Privacy Rights
            </h2>
            <div className="text-gray-700 leading-relaxed space-y-3">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Control your communication preferences</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. Cookies and Tracking
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies to improve your
              experience, remember your preferences, and analyze how our
              platform is used. You can control cookie settings through your
              browser.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. Children's Privacy
            </h2>
            <p className="text-gray-700 leading-relaxed">
              UniNest is designed for university students (18+). We do not
              knowingly collect information from children under 18. If you
              believe we have collected such information, please contact us
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              8. Policy Updates
            </h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this privacy policy to reflect changes in our
              practices or applicable laws. We'll notify you of significant
              changes via email or platform notifications.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              9. Contact Us
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-3">
                If you have questions about this privacy policy or your personal
                information:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:privacy@uninest.com"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    privacy@uninest.com
                  </a>
                </p>
                <p>
                  <strong>Data Protection Officer:</strong>{" "}
                  <a
                    href="mailto:dpo@uninest.com"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    dpo@uninest.com
                  </a>
                </p>
              </div>
            </div>
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

export default PrivacyPage;
