import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, MessageCircle, MapPin, Star, Users, Clock, CheckCircle, Target, CaseSensitive as University } from 'lucide-react';
import Hero from '../components/Hero';
import ListingCard from '../components/ListingCard';
import { useListings } from '../contexts/ListingsContext';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { listings, recommendedListings } = useListings();
  const navigate = useNavigate();
  
  // Show recommended listings for logged-in users, otherwise show recent listings
  const featuredListings = user && recommendedListings.length > 0 
    ? recommendedListings.slice(0, 3)
    : listings.slice(0, 3);

  const features = [
    {
      icon: Target,
      title: 'Smart Matching',
      description: 'AI-powered recommendations based on your university, preferences, and budget.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: University,
      title: 'University-Focused',
      description: 'Find housing near your campus with verified student communities.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: Shield,
      title: 'Verified Students',
      description: 'All users are verified with university email addresses for safety and trust.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: MessageCircle,
      title: 'Direct Messaging',
      description: 'Chat directly with hosts and potential roommates through our secure platform.',
      color: 'bg-yellow-100 text-yellow-600'
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Create Your Profile',
      description: 'Sign up with your university email and set your housing preferences.',
      icon: Users,
    },
    {
      step: 2,
      title: 'Get Smart Matches',
      description: 'Our AI finds listings that match your university, budget, and lifestyle.',
      icon: Target,
    },
    {
      step: 3,
      title: 'Connect & Chat',
      description: 'Message hosts directly and schedule viewings or ask questions.',
      icon: MessageCircle,
    },
    {
      step: 4,
      title: 'Move In',
      description: 'Finalize your agreement and move into your perfect student home.',
      icon: CheckCircle,
    },
  ];

  // Get university display name
  const getUniversityDisplayName = () => {
    if (!user?.university) return 'Students';
    
    // Handle "Unknown University" case
    if (user.university === 'Unknown University' || user.university === 'Unknown') {
      return 'Students';
    }
    
    return `${user.university} Students`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <Hero />

      {/* Featured Listings */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {user && recommendedListings.length > 0 
                ? `Recommended for ${getUniversityDisplayName()}`
                : 'Featured Listings'
              }
            </h2>
            <p className="text-xl text-gray-600">
              {user && recommendedListings.length > 0
                ? 'Personalized housing matches based on your preferences'
                : 'Discover amazing student housing options in your area'
              }
            </p>
          </div>

          {featuredListings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {featuredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    showMatchScore={!!user}
                  />
                ))}
              </div>

              <div className="text-center">
                <Link
                  to="/browse"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>
                    {user ? 'View All Recommendations' : 'View All Listings'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <University className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No listings available yet
              </h3>
              <p className="text-gray-600 mb-6">
                Be the first to post a listing in your area!
              </p>
              <Link
                to={user ? "/create" : "/register"}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span>{user ? 'Post a Listing' : 'Get Started'}</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose UniNest?
            </h2>
            <p className="text-xl text-gray-600">
              The smartest platform for student housing connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get matched with your perfect student home in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="text-center relative">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="absolute top-2 -right-2 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Find Your Perfect Student Home?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who have found their ideal living situation with smart matching
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/browse"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;