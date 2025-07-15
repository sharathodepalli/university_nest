import React from "react";
import { Link } from "react-router-dom";
import { Home, Heart, Mail } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold">UniNest</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Connecting university students with safe, affordable, and verified
              housing options.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="mailto:contact@thetrueshades.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/browse"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link
                  to="/create"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Post Room
                </Link>
              </li>
              <li>
                <Link
                  to="/favorites"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Favorites
                </Link>
              </li>
              <li>
                <Link
                  to="/verification"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Get Verified
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contribute
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:contact@thetrueshades.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <Link
                  to="/about#contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Send Feedback
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@thetrueshades.com?subject=Bug Report"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Report Bug
                </a>
              </li>
              <li>
                <Link
                  to="/about#contact"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Partnership
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 UniNest. Made with{" "}
            <Heart className="w-4 h-4 text-red-500 inline mx-1" /> for students.
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">
            <a
              href="mailto:contact@thetrueshades.com"
              className="hover:text-white transition-colors"
            >
              contact@thetrueshades.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
