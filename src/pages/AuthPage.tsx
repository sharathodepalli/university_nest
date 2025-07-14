import React, { useState, useEffect, useMemo } from "react";
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
  Shield,
  Info,
  Github,
  Chrome,
  Zap,
  Check,
  X,
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
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!formData.password) return { score: 0, label: "", color: "" };

    let score = 0;
    const password = formData.password;

    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    const levels = [
      { label: "Very Weak", color: "bg-red-500" },
      { label: "Weak", color: "bg-orange-500" },
      { label: "Fair", color: "bg-yellow-500" },
      { label: "Good", color: "bg-blue-500" },
      { label: "Strong", color: "bg-green-500" },
    ];

    return { score, ...(levels[score] || levels[0]) };
  }, [formData.password]);

  // Real-time field validation
  const fieldValidation = useMemo(() => {
    const errors: Record<string, string> = {};

    if (emailTouched && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (nameTouched && !isLogin && formData.name) {
      if (formData.name.length < 2) {
        errors.name = "Name must be at least 2 characters";
      }
    }

    if (passwordTouched && formData.password) {
      if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      }
    }

    return errors;
  }, [
    formData.email,
    formData.name,
    formData.password,
    emailTouched,
    nameTouched,
    passwordTouched,
    isLogin,
  ]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
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
      // Additional validation for registration
      if (!acceptTerms) {
        setValidationErrors(["You must accept the terms and conditions"]);
        setIsSubmitting(false);
        return;
      }
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
        await login(formData.email, formData.password);
        setSuccess("Login successful! Redirecting...");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 500);
      } else {
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Track field interactions for real-time validation
    if (name === "email") setEmailTouched(true);
    if (name === "password") setPasswordTouched(true);
    if (name === "name") setNameTouched(true);

    // Clear errors when user starts typing
    if (error) setError("");
    if (validationErrors.length > 0) setValidationErrors([]);
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
        formData.year &&
        acceptTerms
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

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            disabled={isSubmitting}
          >
            <Chrome className="w-5 h-5 mr-3 text-red-500" />
            Continue with Google
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            disabled={isSubmitting}
          >
            <Github className="w-5 h-5 mr-3 text-gray-900" />
            Continue with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>
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
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                      fieldValidation.name
                        ? "border-red-300 focus:ring-red-500"
                        : nameTouched && formData.name && !fieldValidation.name
                        ? "border-green-300 focus:ring-green-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your full name"
                    aria-required={!isLogin}
                    aria-describedby={
                      fieldValidation.name ? "name-error" : undefined
                    }
                  />
                  {nameTouched && formData.name && (
                    <div className="absolute right-3 top-3">
                      {fieldValidation.name ? (
                        <X className="w-5 h-5 text-red-500" />
                      ) : (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                {fieldValidation.name && (
                  <p
                    id="name-error"
                    className="mt-1 text-sm text-red-600 flex items-center"
                  >
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {fieldValidation.name}
                  </p>
                )}
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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    fieldValidation.email
                      ? "border-red-300 focus:ring-red-500"
                      : emailTouched && formData.email && !fieldValidation.email
                      ? "border-green-300 focus:ring-green-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder={
                    isLogin
                      ? "your.email@example.com"
                      : "your.email@university.edu"
                  }
                  aria-required="true"
                  aria-describedby={
                    fieldValidation.email ? "email-error" : undefined
                  }
                />
                {emailTouched && formData.email && (
                  <div className="absolute right-3 top-3">
                    {fieldValidation.email ? (
                      <X className="w-5 h-5 text-red-500" />
                    ) : (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {fieldValidation.email && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldValidation.email}
                </p>
              )}
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
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    fieldValidation.password
                      ? "border-red-300 focus:ring-red-500"
                      : passwordTouched &&
                        formData.password &&
                        !fieldValidation.password
                      ? "border-green-300 focus:ring-green-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  placeholder="Enter your password"
                  aria-required="true"
                  aria-describedby={
                    fieldValidation.password
                      ? "password-error"
                      : !isLogin
                      ? "password-strength"
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {fieldValidation.password && (
                <p
                  id="password-error"
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {fieldValidation.password}
                </p>
              )}
              {!isLogin && formData.password && passwordTouched && (
                <div id="password-strength" className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      Password strength:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.score >= 4
                          ? "text-green-600"
                          : passwordStrength.score >= 3
                          ? "text-blue-600"
                          : passwordStrength.score >= 2
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <p>
                      Include: uppercase, lowercase, numbers, and symbols for a
                      strong password
                    </p>
                  </div>
                </div>
              )}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Tell others about yourself..."
                  />
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3">
                  <input
                    id="acceptTerms"
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <label
                    htmlFor="acceptTerms"
                    className="text-sm text-gray-700"
                  >
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </>
            )}

            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-lg">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
              {!isLogin && (
                <div className="flex items-start space-x-2 text-blue-600 text-sm bg-blue-50 px-4 py-3 rounded-lg">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Please check your email for a verification link to complete
                    your registration.
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isFormPartiallyFilled()}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            aria-disabled={isSubmitting || !isFormPartiallyFilled()}
          >
            {isSubmitting && (
              <div className="absolute left-4 inset-y-0 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
            <span className="flex items-center">
              {isSubmitting ? (
                `${isLogin ? "Signing In..." : "Creating Account..."}`
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Sign In Securely
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </>
              )}
            </span>
          </button>

          {!isLogin && (
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>By creating an account, you'll be able to:</p>
              <div className="flex flex-wrap justify-center gap-4 text-blue-600">
                <span>• Browse listings</span>
                <span>• Contact hosts</span>
                <span>• Save favorites</span>
                <span>• Post your own listings</span>
              </div>
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
