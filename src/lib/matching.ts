import { User, Listing } from "../types";
import { universityData } from "../data/universities";
import { calculateDistance } from "../utils/haversine";

export class MatchingService {
  /**
   * Calculate match score between user and listing (0-100)
   */
  static calculateMatchScore(user: User, listing: Listing): number {
    // Comprehensive safety checks
    if (!user || !listing || !listing.location || !user.university) {
      return 0;
    }

    let score = 0;
    let maxScore = 0;

    // University proximity (35% weight) - Most important for students
    maxScore += 35;
    const userUniversity = universityData.find(
      (uni) => uni.name === user.university
    );

    if (userUniversity?.coordinates && listing.location.latitude) {
      const distance = calculateDistance(
        userUniversity.coordinates.lat,
        userUniversity.coordinates.lng,
        listing.location.latitude,
        listing.location.longitude
      );

      // Dynamic scoring based on distance
      if (distance <= 1) score += 35; // Very close
      else if (distance <= 3) score += 30; // Walkable
      else if (distance <= 5) score += 25; // Bikable
      else if (distance <= 10) score += 20; // Short commute
      else if (distance <= 20) score += 15; // Reasonable commute
      else score += 5; // Far but manageable
    } else {
      // Fallback for listings near the university by name
      const nearbyUniversities = listing.location.nearbyUniversities || [];
      if (
        Array.isArray(nearbyUniversities) &&
        nearbyUniversities.some(uni => uni.name === user.university)
      ) {
        score += 28; // High score if uni name is in the list but we can't calc distance
      } else {
        score += 5; // Low score if no proximity info
      }
    }

    // Budget compatibility (25% weight)
    maxScore += 25;
    if (user.preferences?.maxBudget && typeof user.preferences.maxBudget === 'number') {
      const utilitiesCost = listing.utilities?.cost || 0;
      const totalCost = listing.price + (listing.utilities?.included ? 0 : utilitiesCost);
      
      if (totalCost <= user.preferences.maxBudget) {
        // Perfect score if within budget
        const budgetUtilization = totalCost / user.preferences.maxBudget;
        if (budgetUtilization <= 0.8) {
          score += 25; // Great value
        } else {
          score += 20; // Good value
        }
      } else {
        // Penalty for over budget
        const overBudget = totalCost - user.preferences.maxBudget;
        const penalty = Math.min(25, (overBudget / user.preferences.maxBudget) * 25);
        score += Math.max(0, 25 - penalty);
      }
    } else {
      score += 15; // Default score if no budget set
    }

    // Room type preference (15% weight)
    maxScore += 15;
    if (user.preferences?.preferredRoomTypes && 
        Array.isArray(user.preferences.preferredRoomTypes) &&
        user.preferences.preferredRoomTypes.includes(listing.roomType)) {
      score += 15;
    } else {
      score += 5; // Partial score for flexibility
    }

    // Lifestyle compatibility (15% weight)
    maxScore += 15;
    let lifestyleScore = 0;
    
    const listingPrefs = listing.preferences || {};
    if (user.preferences) {
      // Study environment is most important for students
      if (typeof user.preferences.studyFriendly === 'boolean' && 
          user.preferences.studyFriendly === listingPrefs.studyFriendly) {
        lifestyleScore += 8;
      }
      
      if (typeof user.preferences.smokingAllowed === 'boolean' && 
          user.preferences.smokingAllowed === listingPrefs.smokingAllowed) {
        lifestyleScore += 4;
      }
      
      if (typeof user.preferences.petsAllowed === 'boolean' && 
          user.preferences.petsAllowed === listingPrefs.petsAllowed) {
        lifestyleScore += 3;
      }
    }
    
    score += lifestyleScore;

    // Amenities match (10% weight)
    maxScore += 10;
    if (user.preferences?.preferredAmenities && 
        Array.isArray(user.preferences.preferredAmenities) &&
        listing.amenities && Array.isArray(listing.amenities)) {
      const matchedAmenities = user.preferences.preferredAmenities.filter(
        amenity => listing.amenities.includes(amenity)
      );
      const amenityScore = user.preferences.preferredAmenities.length > 0 
        ? (matchedAmenities.length / user.preferences.preferredAmenities.length) * 10
        : 5;
      score += amenityScore;
    } else {
      score += 5; // Default score
    }

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Calculate relevance score based on user's context
   */
  static calculateRelevanceScore(user: User, listing: Listing): number {
    if (!user || !listing || !listing.location || !user.university) {
      return 0;
    }

    let score = 0;
    const nearbyUniversities = listing.location.nearbyUniversities || [];

    // Same university gets highest relevance (50 points)
    if (Array.isArray(nearbyUniversities) && nearbyUniversities.some(uni => uni.name === user.university)) {
      score += 50;
    }

    // Geographic proximity (30 points)
    if (user.location?.city && listing.location.city && 
        user.location.city === listing.location.city) {
      score += 30;
    } else if (user.location?.state && listing.location.state && 
               user.location.state === listing.location.state) {
      score += 20;
    }

    // Recent listings get boost (20 points)
    if (listing.createdAt && listing.createdAt instanceof Date) {
      const daysSinceCreated = (Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated <= 7) {
        score += 20;
      } else if (daysSinceCreated <= 30) {
        score += 10;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Filter listings based on user's matching criteria
   */
  static filterListingsForUser(user: User, listings: Listing[]): Listing[] {
    if (!user || !Array.isArray(listings)) {
      return [];
    }

    return listings.filter(listing => {
      // Basic safety checks
      if (!listing || !listing.location) return false;
      
      // Don't show user's own listings
      if (listing.hostId === user.id) return false;

      const criteria = user.matchingPreferences;
      if (!criteria) return true; // No criteria, show all

      // Distance filter
      if (criteria.maxDistance && user.location?.coordinates) {
        const distance = calculateDistance(
          user.location.coordinates.lat,
          user.location.coordinates.lng,
          listing.location.latitude,
          listing.location.longitude
        );
        if (distance > criteria.maxDistance) return false;
      }

      // University filter (if strict preference is set)
      if (user.matchingPreferences?.sameUniversity) {
        const nearbyUniversities = listing.location.nearbyUniversities || [];
        if (!Array.isArray(nearbyUniversities) || !nearbyUniversities.some(uni => uni.name === user.university)) {
          return false;
        }
      }

      // Budget filter
      if (user.matchingPreferences?.budgetRange) {
        const utilitiesCost = listing.utilities?.cost || 0;
        const totalCost = listing.price + (listing.utilities?.included ? 0 : utilitiesCost);
        if (totalCost < user.matchingPreferences.budgetRange.min || 
            totalCost > user.matchingPreferences.budgetRange.max) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort listings by relevance and match score
   */
  static sortListings(
    listings: Listing[],
    sortBy: string,
    user?: User
  ): Listing[] {
    switch (sortBy) {
      case "relevance":
        return [...listings].sort((a, b) => {
          const scoreA = a.relevanceScore || 0;
          const scoreB = b.relevanceScore || 0;
          return scoreB - scoreA;
        });
      case "match":
        return [...listings].sort((a, b) => {
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          return scoreB - scoreA;
        });
      case "distance":
        if (user?.location?.coordinates) {
          const userLat = user.location.coordinates.lat;
          const userLng = user.location.coordinates.lng;

          return [...listings].sort((a, b) => {
            if (!a.location?.latitude || !b.location?.latitude) return 0;

            const distA = calculateDistance(
              userLat,
              userLng,
              a.location.latitude,
              a.location.longitude
            );
            const distB = calculateDistance(
              userLat,
              userLng,
              b.location.latitude,
              b.location.longitude
            );
            return distA - distB;
          });
        }
        return listings; // No user location, return original order
      case "price-asc":
        return [...listings].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...listings].sort((a, b) => b.price - a.price);
      case "newest":
        return [...listings].sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });
      default:
        return listings;
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  static getRecommendations(user: User, allListings: Listing[], limit: number = 10): Listing[] {
    if (!user || !Array.isArray(allListings)) {
      return [];
    }

    // First filter listings that are suitable for the user
    const filteredListings = this.filterListingsForUser(user, allListings);
    
    // Then sort by combined relevance and match score
    const sortedListings = this.sortListings(filteredListings, 'relevance', user);
    
    // Return top recommendations
    return sortedListings.slice(0, Math.max(0, limit));
  }

  /**
   * Find potential roommate matches
   */
  static findRoommateMatches(user: User, allUsers: User[]): User[] {
    if (!user || !Array.isArray(allUsers)) {
      return [];
    }

    return allUsers
      .filter(otherUser => {
        if (!otherUser || otherUser.id === user.id) return false;
        
        // Same university
        if (otherUser.university !== user.university) return false;
        
        // Similar preferences
        if (user.preferences && otherUser.preferences) {
          const lifestyleMatch = 
            user.preferences.smokingAllowed === otherUser.preferences.smokingAllowed &&
            user.preferences.studyFriendly === otherUser.preferences.studyFriendly;
          
          if (!lifestyleMatch) return false;
        }
        
        return true;
      })
      .slice(0, 20); // Limit to top 20 matches
  }
}

export default MatchingService;