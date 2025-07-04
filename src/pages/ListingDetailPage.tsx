import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  MessageCircle,
  Star,
  Wifi,
  Car,
  Utensils,
  Home,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail
} from 'lucide-react';
import { useListings } from '../contexts/ListingsContext';
import { useMessaging } from '../contexts/MessagingContext';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, favoriteListings, toggleFavorite } = useListings();
  const { createConversation } = useMessaging();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);

  const listing = listings.find(l => l.id === id);
  
  useEffect(() => {
    if (!listing && listings.length > 0) {
      navigate('/browse');
    }
  }, [listing, listings, navigate]);
  
  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  const isFavorite = favoriteListings.includes(listing.id);
  const isOwner = user?.id === listing.hostId;

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wi-fi':
        return <Wifi className="w-5 h-5" />;
      case 'parking':
        return <Car className="w-5 h-5" />;
      case 'kitchen':
        return <Utensils className="w-5 h-5" />;
      default:
        return <Home className="w-5 h-5" />;
    }
  };

  const handleContactHost = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (isOwner) return;

    try {
      const conversation = await createConversation(listing, listing.host);
      navigate('/messages', { state: { activeConversation: conversation } });
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => toggleFavorite(listing.id)}
              className={`p-2 rounded-full transition-colors ${
                isFavorite
                  ? 'bg-red-100 text-red-600'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 bg-white text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="relative">
              <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={listing.images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {listing.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {listing.images.length > 1 && (
                <div className="flex space-x-2 mt-4 overflow-x-auto">
                  {listing.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${listing.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Listing Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.location.city}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Home className="w-4 h-4" />
                      <span className="capitalize">{listing.roomType}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{listing.maxOccupants} max</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">${listing.price}</div>
                  <div className="text-gray-600">per month</div>
                  {listing.deposit && (
                    <div className="text-sm text-gray-500 mt-1">
                      ${listing.deposit} deposit
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Available {format(listing.availableFrom, 'MMM d, yyyy')}</span>
                </div>
                {listing.availableTo && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Until {format(listing.availableTo, 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listing.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getAmenityIcon(amenity)}
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            {listing.rules && listing.rules.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">House Rules</h2>
                <ul className="space-y-2">
                  {listing.rules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span className="text-gray-700">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
              <div className="space-y-2">
                <p className="text-gray-700">{listing.location.address}</p>
                <p className="text-gray-600">{listing.location.city}</p>
              </div>
              <div className="mt-4 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">Map placeholder</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Host Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hosted by</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {listing.host.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{listing.host.name}</h4>
                  <p className="text-sm text-gray-600">{listing.host.university}</p>
                  <p className="text-sm text-gray-600">{listing.host.year}</p>
                </div>
              </div>
              
              {listing.host.bio && (
                <p className="text-gray-700 text-sm mb-4">{listing.host.bio}</p>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>Verified Student</span>
              </div>

              {!isOwner && (
                <div className="space-y-3">
                  <button
                    onClick={handleContactHost}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message Host</span>
                  </button>
                  
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contact Info</span>
                  </button>
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender preference:</span>
                  <span className="text-gray-900 capitalize">
                    {listing.preferences.gender || 'Any'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Smoking:</span>
                  <span className="text-gray-900">
                    {listing.preferences.smokingAllowed ? 'Allowed' : 'Not allowed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pets:</span>
                  <span className="text-gray-900">
                    {listing.preferences.petsAllowed ? 'Allowed' : 'Not allowed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Study environment:</span>
                  <span className="text-gray-900">
                    {listing.preferences.studyFriendly ? 'Study-friendly' : 'Social'}
                  </span>
                </div>
              </div>
            </div>

            {/* Utilities */}
            {listing.utilities && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilities</h3>
                <div className="space-y-2">
                  {listing.utilities.included ? (
                    <p className="text-green-600 font-medium">✓ All utilities included</p>
                  ) : (
                    <div>
                      <p className="text-gray-600">Utilities not included</p>
                      {listing.utilities.cost && (
                        <p className="text-gray-900">
                          Estimated: ${listing.utilities.cost}/month
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{listing.host.email || 'Email not available'}</span>
              </div>
              {listing.host.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">{listing.host.phone}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingDetailPage;