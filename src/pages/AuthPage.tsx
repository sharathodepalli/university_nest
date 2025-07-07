import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  User as UserIcon,
  GraduationCap,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react"; // Renamed User to UserIcon to avoid conflict with imported User type
import { useAuth } from "../contexts/AuthContext";
import { universityOptions } from "../data/mockData";
import {
  userRegistrationSchema,
  userLoginSchema,
  validateInput,
} from "../lib/validation"; // Import validation utilities

const AuthPage: React.FC = () => {
  const { login, register, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === "/login"; // Determines if it's the login form

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    university: "", // Will hold selected university name or 'other'
    customUniversity: "", // Will hold custom university name if 'other' is selected
    year: "",
    bio: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(""); // General error message (e.g., from API or global validation)
  const [validationErrors, setValidationErrors] = useState<string[]>([]); // Specific validation errors from Zod
  const [success, setSuccess] = useState("");
  const [useCustomUniversity, setUseCustomUniversity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      console.log("User already logged in, redirecting to home");
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors([]); // Clear previous validation errors
    setSuccess("");
    setIsSubmitting(true);

    const dataToValidate = {
      ...formData,
      // Ensure the correct university value is used for validation
      university: useCustomUniversity
        ? formData.customUniversity
        : formData.university,
    };

    // --- Client-side Validation ---
    let validationResult;
    if (isLogin) {
      validationResult = validateInput(userLoginSchema, dataToValidate);
    } else {
      validationResult = validateInput(userRegistrationSchema, dataToValidate);
    }

    if (!validationResult.success) {
      setValidationErrors(validationResult.errors);
      setIsSubmitting(false);
      return; // Stop submission if validation fails
    }
    // --- End Client-side Validation ---

    try {
      if (isLogin) {
        console.log("Attempting login with:", formData.email);
        await login(formData.email, formData.password);
        setSuccess("Login successful! Redirecting...");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } else {
        console.log("Attempting registration with:", formData.email);
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          university: dataToValidate.university, // Use the validated university value
          year: formData.year,
          bio: formData.bio,
        });
        setSuccess("Registration successful! Redirecting...");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      // Display API/backend errors
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUniversityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "other") {
      setUseCustomUniversity(true);
      setFormData((prev) => ({
        ...prev,
        university: "",
        customUniversity: "",
      }));
    } else {
      setUseCustomUniversity(false);
      setFormData((prev) => ({
        ...prev,
        university: value,
        customUniversity: "",
      }));
    }
  };

  // isFormPartiallyFilled is now mainly for button disabling if all required fields have some input
  const isFormPartiallyFilled = () => {
    if (isLogin) {
      return formData.email && formData.password;
    } else {
      const universityValue = useCustomUniversity
        ? formData.customUniversity
        : formData.university;
      return (
        formData.name &&
        formData.email &&
        formData.password &&
        universityValue &&
        formData.year
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">UniNest</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? "Welcome back!" : "Join UniNest"}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin
              ? "Sign in to your account to continue"
              : "Create your account to find your perfect student home"}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    aria-required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {isLogin ? "Email" : "University Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    isLogin
                      ? "your.email@example.com"
                      : "your.email@university.edu"
                  }
                  aria-required="true"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label
                    htmlFor="university"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    University
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <select
                      id="university"
                      name="university"
                      required={!isLogin && !useCustomUniversity}
                      value={
                        useCustomUniversity ? "other" : formData.university
                      }
                      onChange={handleUniversityChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                      aria-required={!isLogin && !useCustomUniversity}
                    >
                      <option value="">Select your university</option>
                      {universityOptions.map((uni) => (
                        <option key={uni} value={uni}>
                          {uni}
                        </option>
                      ))}
                      <option value="other">Other (Enter manually)</option>
                    </select>
                  </div>
                </div>

                {useCustomUniversity && (
                  <div>
                    <label
                      htmlFor="customUniversity"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      University Name
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        id="customUniversity"
                        name="customUniversity"
                        type="text"
                        required={useCustomUniversity}
                        value={formData.customUniversity}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your university name"
                        aria-required={useCustomUniversity}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="year"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Year
                  </label>
                  <select
                    id="year"
                    name="year"
                    required={!isLogin}
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-required={!isLogin}
                  >
                    <option value="">Select your year</option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                    <option value="PhD">PhD</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bio (Optional)
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell others about yourself..."
                  />
                </div>
              </>
            )}
          </div>

          {validationErrors.length > 0 && (
            <div className="flex flex-col space-y-1 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
              {validationErrors.map((msg, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-lg">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isFormPartiallyFilled()}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-disabled={isSubmitting || !isFormPartiallyFilled()}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{isLogin ? "Signing In..." : "Creating Account..."}</span>
              </div>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>

          {isLogin && ( // Show forgot password only on login page
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors text-sm"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <Link
                to={isLogin ? "/register" : "/login"}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
