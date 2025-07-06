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

    // Use official university coordinates for proximity scoring
    if (userUniversity?.coordinates && typeof listing.location.latitude === 'number' && typeof listing.location.longitude === 'number') {
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
      // Fallback for listings near the university by name if coordinates are missing
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
        const budgetUtilization = totalCost / user.preferences.maxBudget;
        if (budgetUtilization <= 0.8) {
          score += 25; // Great value (20% under budget or more)
        } else {
          score += 20; // Good value (within budget)
        }
      } else {
        // Penalty for over budget, capped at max score for this category
        const overBudget = totalCost - user.preferences.maxBudget;
        const penalty = Math.min(25, (overBudget / user.preferences.maxBudget) * 25);
        score += Math.max(0, 25 - penalty); // Ensure score doesn't go below 0 for this category
      }
    } else {
      score += 15; // Default score if no budget set by user
    }

    // Room type preference (15% weight)
    maxScore += 15;
    if (user.preferences?.preferredRoomTypes &&
        Array.isArray(user.preferences.preferredRoomTypes) &&
        user.preferences.preferredRoomTypes.includes(listing.roomType)) {
      score += 15;
    } else {
      score += 5; // Partial score for flexibility if preference not met
    }

    // Lifestyle compatibility (15% weight)
    maxScore += 15;
    let lifestyleScore = 0;

    const listingPrefs = listing.preferences || {}; // Ensure listingPrefs is an object
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
        : 5; // Default if no preferred amenities
      score += amenityScore;
    } else {
      score += 5; // Default score if user has no preferred amenities set
    }

    // Ensure score is within 0-100 bounds and rounded
    return Math.round(Math.max(0, Math.min(100, (score / maxScore) * 100)));
  }

  /**
   * Calculate relevance score based on user's context (e.g., same university, local area, newness)
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

    // Geographic proximity (30 points) based on city/state
    if (user.location?.city && listing.location.city &&
        user.location.city === listing.location.city) {
      score += 30;
    } else if (user.location?.state && listing.location.state &&
               user.location.state === listing.location.state) {
      score += 20;
    }

    // Recent listings get boost (20 points)
    if (listing.createdAt instanceof Date) {
      const daysSinceCreated = (Date.now() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated <= 7) {
        score += 20;
      } else if (daysSinceCreated <= 30) {
        score += 10;
      }
    }

    return Math.min(100, score); // Cap score at 100
  }

  /**
   * Filter listings based on user's matching criteria (e.g., max distance, same university, budget)
   */
  static filterListingsForUser(user: User, listings: Listing[]): Listing[] {
    if (!user || !Array.isArray(listings)) {
      return [];
    }

    return listings.filter(listing => {
      // Basic safety checks for listing validity
      if (!listing || !listing.location) return false;

      // Don't show user's own listings
      if (listing.hostId === user.id) return false;

      const criteria = user.matchingPreferences;
      if (!criteria) return true; // No specific criteria set by user, show all eligible listings

      // Distance filter: from user's current location to listing
      // Corrected: Add check for valid user coordinates (not 0,0)
      if (criteria.maxDistance && user.location?.coordinates?.lat !== undefined && user.location?.coordinates?.lng !== undefined &&
          (user.location.coordinates.lat !== 0 || user.location.coordinates.lng !== 0)) {
        const userLat = user.location.coordinates.lat;
        const userLng = user.location.coordinates.lng;

        // Ensure listing also has valid coordinates for distance calculation
        if (typeof listing.location.latitude === 'number' && typeof listing.location.longitude === 'number' &&
            (listing.location.latitude !== 0 || listing.location.longitude !== 0)) {
            const distance = calculateDistance(
                userLat,
                userLng,
                listing.location.latitude,
                listing.location.longitude
            );
            if (distance > criteria.maxDistance) {
                return false; // Filter out if beyond max distance
            }
        } else {
            // If listing has invalid coords, consider it not matching the distance filter
            return false;
        }
      }

      // University filter (if strict preference is set to only show same university)
      if (user.matchingPreferences?.sameUniversity) {
        const nearbyUniversities = listing.location.nearbyUniversities || [];
        if (!Array.isArray(nearbyUniversities) || !nearbyUniversities.some(uni => uni.name === user.university)) {
          return false; // Filter out if not near user's university
        }
      }

      // Budget filter (total cost within user's preferred range)
      if (user.matchingPreferences?.budgetRange) {
        const utilitiesCost = listing.utilities?.cost || 0;
        const totalCost = listing.price + (listing.utilities?.included ? 0 : utilitiesCost);
        if (totalCost < user.matchingPreferences.budgetRange.min ||
            totalCost > user.matchingPreferences.budgetRange.max) {
          return false; // Filter out if outside budget range
        }
      }

      return true; // Listing passed all active filters
    });
  }

  /**
   * Sort listings by relevance, match score, distance, or price.
   */
  static sortListings(
    listings: Listing[],
    sortBy: string,
    user?: User
  ): Listing[] {
    // Return a shallow copy to avoid mutating the original array
    const sorted = [...listings];

    switch (sortBy) {
      case "relevance":
        // Assumes relevanceScore is calculated and attached to Listing objects prior to sorting
        return sorted.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      case "match":
        // Assumes matchScore is calculated and attached to Listing objects prior to sorting
        return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      case "distance":
        // Sort by distance from user's location, if valid user coordinates are available
        // Corrected: Add check for valid user coordinates (not 0,0)
        if (user?.location?.coordinates?.lat !== undefined && user?.location?.coordinates?.lng !== undefined &&
            (user.location.coordinates.lat !== 0 || user.location.coordinates.lng !== 0)) {
          const userLat = user.location.coordinates.lat;
          const userLng = user.location.coordinates.lng;

          return sorted.sort((a, b) => {
            // If listing coordinates are missing or 0,0, push them to the end (effectively treating as "far")
            const aHasValidCoords = typeof a.location?.latitude === 'number' && typeof a.location?.longitude === 'number' && (a.location.latitude !== 0 || a.location.longitude !== 0);
            const bHasValidCoords = typeof b.location?.latitude === 'number' && typeof b.location?.longitude === 'number' && (b.location.latitude !== 0 || b.location.longitude !== 0);

            if (!aHasValidCoords && !bHasValidCoords) return 0; // Both invalid, keep original order
            if (!aHasValidCoords) return 1; // A is invalid, push to end
            if (!bHasValidCoords) return -1; // B is invalid, push to end

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
        // If no valid user location for distance sorting, default to relevance or no specific order
        console.warn("[MatchingService] No valid user location for 'distance' sorting. Falling back to relevance or natural order.");
        // Fallback to relevance if user object is present, otherwise just return as is
        return user ? sorted.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)) : sorted;
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "newest":
        // Sort by creation date, newest first
        return sorted.sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
        });
      default:
        // Default sort: perhaps by relevance if user is available, otherwise by creation date or just current order
        console.warn(`[MatchingService] Unknown sort option: ${sortBy}. Falling back to relevance or natural order.`);
        return user ? sorted.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)) : sorted;
    }
  }

  /**
   * Get personalized recommendations for a user.
   * Filters by user criteria, then sorts by combined relevance and match score.
   */
  static getRecommendations(user: User, allListings: Listing[], limit: number = 10): Listing[] {
    if (!user || !Array.isArray(allListings)) {
      return [];
    }

    // Step 1: Filter listings that meet user's hard matching criteria
    const filteredListings = this.filterListingsForUser(user, allListings);

    // Step 2: Ensure match and relevance scores are calculated for each listing
    // This assumes these scores are not persistent in the DB and need re-calculation per user session
    const listingsWithScores = filteredListings.map(listing => ({
      ...listing,
      matchScore: this.calculateMatchScore(user, listing),
      relevanceScore: this.calculateRelevanceScore(user, listing)
    }));
    
    // Step 3: Sort by a combined score (e.g., relevance first, then match)
    // The 'relevance' sort case in sortListings implicitly handles this
    const sortedListings = this.sortListings(listingsWithScores, 'relevance', user);
    
    // Step 4: Return top N recommendations
    return sortedListings.slice(0, Math.max(0, limit));
  }

  /**
   * Find potential roommate matches based on shared university and preferences.
   */
  static findRoommateMatches(user: User, allUsers: User[]): User[] {
    if (!user || !Array.isArray(allUsers)) {
      return [];
    }

    return allUsers
      .filter(otherUser => {
        // Exclude self and invalid users
        if (!otherUser || otherUser.id === user.id) return false;
        
        // Match by same university (strong criterion)
        if (otherUser.university !== user.university) return false;
        
        // Match by similar preferences (if user preferences are available)
        if (user.preferences && otherUser.preferences) {
          const lifestyleMatch = 
            user.preferences.smokingAllowed === otherUser.preferences.smokingAllowed &&
            user.preferences.petsAllowed === otherUser.preferences.petsAllowed && // Added pets for lifestyle
            user.preferences.studyFriendly === otherUser.preferences.studyFriendly &&
            user.preferences.socialLevel === otherUser.preferences.socialLevel; // Added social level for lifestyle
          
          if (!lifestyleMatch) return false;

          // Optional: Match by preferred room types intersection (e.g., at least one common preferred type)
          if (user.preferences.preferredRoomTypes?.length && otherUser.preferences.preferredRoomTypes?.length) {
            const hasCommonRoomType = user.preferences.preferredRoomTypes.some(type =>
              otherUser.preferences?.preferredRoomTypes?.includes(type)
            );
            if (!hasCommonRoomType) return false;
          }

          // Optional: Match by preferred amenities intersection
          if (user.preferences.preferredAmenities?.length && otherUser.preferences.preferredAmenities?.length) {
            const hasCommonAmenity = user.preferences.preferredAmenities.some(amenity =>
              otherUser.preferences?.preferredAmenities?.includes(amenity)
            );
            // This could be weighted, but for a boolean filter, simply having one common is enough
            if (!hasCommonAmenity) return false;
          }
        }
        
        // Consider filtering by year proximity here if 'similarYear' preference is implemented for roommates
        // For simplicity, currently just checks preferences commonalities

        return true; // Passed all roommate matching criteria
      })
      .slice(0, 20); // Limit to top 20 matches for performance and relevance
  }
}

export default MatchingService;