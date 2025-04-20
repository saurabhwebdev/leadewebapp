import { saveScrapeResults as saveToSupabase } from './supabaseDb';
import localitiesData from '@/data/localities.json';

// Types that match our scraper's functionality
export interface ScrapedLocation {
  id?: string;
  name: string;
  specialty: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  scrapedAt: Date;
  searchQuery: string;
}

export interface ScrapeRequest {
  query: string;
  profession?: string;
  location?: string;
  scrollCount?: number | 'all'; // How many times to scroll (or "all" for infinite)
  localities?: string[]; // For targeting specific areas within a city
}

// List of available professions for the dropdown
export const PROFESSIONS = [
  "Dentist", "Physician", "Orthopedic", "Cardiologist", "Dermatologist", "Physiotherapist", "Pediatrician", "ENT", "Gynecologist", "Neurologist", "Urologist", "Oncologist", "Psychiatrist", "General Surgeon", "Ophthalmologist", "Pulmonologist", "Gastroenterologist", "Nephrologist", "Rheumatologist", "Endocrinologist", "Plastic Surgeon", "Radiologist", "Anesthesiologist", "Homeopath", "Ayurvedic Doctor"
];

// Business categories for the business lead generator
export const BUSINESS_CATEGORIES = {
  "Healthcare": [
    "Dentist", "Physician", "Orthopedic", "Cardiologist", "Dermatologist", "Physiotherapist", 
    "Pediatrician", "ENT", "Gynecologist", "Neurologist", "Urologist", "Oncologist", 
    "Psychiatrist", "General Surgeon", "Ophthalmologist", "Pulmonologist", "Gastroenterologist", 
    "Nephrologist", "Rheumatologist", "Endocrinologist", "Plastic Surgeon", "Radiologist", 
    "Anesthesiologist", "Homeopath", "Ayurvedic Doctor", "Medical Clinic", "Hospital", "Pharmacy"
  ],
  "Retail": [
    "Clothing Store", "Electronics Store", "Furniture Store", "Grocery Store", 
    "Supermarket", "Shopping Mall", "Jewelry Store", "Bookstore", "Department Store",
    "Toy Store", "Hardware Store", "Home Decor", "Specialty Shop", "Gift Shop"
  ],
  "Food & Dining": [
    "Restaurant", "Cafe", "Coffee Shop", "Bakery", "Fast Food", "Food Delivery", 
    "Catering Service", "Food Truck", "Bar", "Pub", "Brewery", "Ice Cream Shop"
  ],
  "Professional Services": [
    "Lawyer", "Accountant", "Financial Advisor", "Insurance Agent", "Real Estate Agent",
    "Marketing Agency", "Advertising Agency", "Business Consultant", "IT Consultant",
    "Web Development", "Software Company", "Staffing Agency", "PR Firm"
  ],
  "Education": [
    "School", "College", "University", "Coaching Center", "Tutoring Service", 
    "Training Institute", "Vocational School", "Computer Training", "Language School"
  ],
  "Personal Care": [
    "Salon", "Spa", "Barbershop", "Beauty Parlor", "Nail Salon", "Massage Therapy",
    "Yoga Studio", "Gym", "Fitness Center", "Wellness Center"
  ],
  "Home Services": [
    "Plumber", "Electrician", "Carpenter", "Interior Designer", "Cleaning Service",
    "Pest Control", "Landscaping", "Home Renovation", "Security Service", "HVAC Service"
  ],
  "Automotive": [
    "Car Dealership", "Auto Repair", "Car Wash", "Auto Parts", "Tyre Shop",
    "Motorcycle Dealer", "Auto Body Shop", "Car Rental", "Towing Service"
  ],
  "Hospitality": [
    "Hotel", "Resort", "Motel", "Guest House", "Vacation Rental", "Travel Agency", 
    "Tour Operator", "Event Venue"
  ],
  "Entertainment": [
    "Movie Theater", "Amusement Park", "Game Zone", "Bowling Alley", "Concert Venue",
    "Theater", "Museum", "Art Gallery", "Night Club", "Karaoke"
  ]
};

// Flatten the business categories to get all professions
export const ALL_BUSINESS_TYPES = Object.values(BUSINESS_CATEGORIES).flat();

// List of tier 1 and tier 2 cities
export const CITIES = [
  // Tier 1
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  // Tier 2
  "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal", "Patna", "Ludhiana", "Agra", "Nashik", "Vadodara", "Faridabad", "Meerut", "Rajkot", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli–Dharwad", "Mysore", "Tiruchirappalli", "Bareilly", "Aligarh", "Tiruppur", "Moradabad", "Jalandhar", "Bhubaneswar", "Salem", "Warangal", "Guntur", "Bhiwandi", "Saharanpur", "Gorakhpur", "Bikaner", "Amravati", "Noida", "Jamshedpur", "Bhilai", "Cuttack", "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela", "Nanded", "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar", "Jammu", "Sangli-Miraj & Kupwad", "Mangalore", "Erode", "Belgaum", "Kurnool", "Ambattur", "Tirunelveli", "Malegaon", "Gaya", "Jalgaon", "Udaipur", "Maheshtala", "Davanagere", "Kozhikode"
];

// This would be performed by a backend API in a production app
export const scrapeGoogleMaps = async (request: ScrapeRequest): Promise<ScrapedLocation[]> => {
  console.log('Scraping request:', request);
  
  let allResults: ScrapedLocation[] = [];
  try {
    const localities = request.localities || [];
    
    // If localities are specified, do multiple searches
    if (localities && localities.length > 0) {
      console.log(`Scraping for ${localities.length} localities in ${request.location}...`);
      
      for (const locality of localities) {
        const localityQuery = `${request.profession || request.query} in ${locality} ${request.location}`;
        console.log(`Scraping: ${localityQuery}`);
        const results = await simulateScrape(localityQuery, request.scrollCount);
        allResults = [...allResults, ...results];
      }
      
      // Deduplicate by name + phone
      const seen = new Set();
      allResults = allResults.filter(lead => {
        const key = `${lead.name}|${lead.phoneNumber}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else {
      // Single search
      const query = request.query;
      console.log(`Scraping single query: ${query}, profession: ${request.profession}`);
      allResults = await simulateScrape(query, request.scrollCount);
    }
    
    // Save results to Supabase
    if (allResults.length > 0) {
      console.log(`Saving ${allResults.length} results to Supabase...`);
      try {
        const saveResult = await saveToSupabase(allResults);
        if (saveResult) {
          console.log('Successfully saved to Supabase');
        } else {
          console.warn('Failed to save to Supabase');
        }
      } catch (saveError) {
        console.error('Error saving to Supabase:', saveError);
      }
    }
    
    return allResults;
  } catch (error) {
    console.error('Error in scrapeGoogleMaps:', error);
    throw new Error(`Scraping failed: ${error}`);
  }
};

// Get localities for a particular city
export const getLocalitiesForCity = (city: string): string[] => {
  // The localities data is a Record<string, string[]>, so we can access it directly by key
  return localitiesData[city] || [];
};

// Simulate scrape with mock data generation
const simulateScrape = async (query: string, scrollCount?: number | string): Promise<ScrapedLocation[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const results: ScrapedLocation[] = [];
  const parts = query.split(' in ');
  const profession = parts[0];
  const location = parts.length > 1 ? parts[1] : '';
  
  // Generate random number of results (5-20)
  const resultCount = Math.floor(Math.random() * 15) + 5;
  
  if (scrollCount === 'all') {
    // Simulate infinite scroll by generating more results
    const moreResultCount = Math.floor(Math.random() * 30) + 20;
    for (let i = 0; i < moreResultCount; i++) {
      results.push(generateMockResult(profession, location, query));
    }
  } else {
    // Regular result set
    for (let i = 0; i < resultCount; i++) {
      results.push(generateMockResult(profession, location, query));
    }
  }
  
  return results;
};

// Generate realistic mock business data
const generateMockResult = (profession: string, location: string, searchQuery: string): ScrapedLocation => {
  const businessName = generateBusinessName(profession.split(' ')[0], profession);
  
  // Parse location for more realistic addresses
  const locationParts = location.split(' ');
  const city = locationParts[locationParts.length - 1];
  
  const streetNumber = Math.floor(Math.random() * 200) + 1;
  const streets = [
    "Main Street", "Park Avenue", "Oak Road", "Maple Drive", "Cedar Lane",
    "Pine Street", "Elm Road", "Hill Street", "River Road", "Lake Avenue",
    "Market Street", "Church Road", "School Lane", "Garden Avenue", "Forest Drive"
  ];
  const streetName = streets[Math.floor(Math.random() * streets.length)];
  
  // Generate plausible phone number for India
  const phonePrefix = ["98", "99", "70", "80", "90", "77", "88", "63", "76", "95"];
  const randomPrefix = phonePrefix[Math.floor(Math.random() * phonePrefix.length)];
  const randomSuffix = Math.floor(Math.random() * 10000000).toString().padStart(8, '0');
  const phoneNumber = `+91 ${randomPrefix}${randomSuffix}`;
  
  // Generate email based on business name
  const emailDomains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "business.co.in", "company.in", "protonmail.com"];
  const domainSuffix = emailDomains[Math.floor(Math.random() * emailDomains.length)];
  
  // Clean the business name to create an email-friendly string
  const sanitizedName = businessName
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Remove special chars
    .replace(/\s+/g, '.') // Replace spaces with dots
    .substring(0, 20); // Limit length
  
  // Add a small random number suffix to make it more unique
  const randomSuffix2 = Math.floor(Math.random() * 999);
  const email = `${sanitizedName}${randomSuffix2 > 50 ? randomSuffix2 : ''}@${domainSuffix}`;
  
  return {
    name: businessName,
    specialty: profession,
    address: `${streetNumber} ${streetName}, ${location}`,
    phoneNumber,
    email,
    scrapedAt: new Date(),
    searchQuery
  };
};

// Generate business names based on profession
const generateBusinessName = (category: string, profession: string) => {
  const prefixes = [
    "Advanced", "Elite", "Premier", "Sunshine", "Golden", "Reliable", "Trusted", 
    "Supreme", "Royal", "Perfect", "Excellent", "Prime", "Modern", "Classic", 
    "Universal", "Global", "National", "Metro", "City", "Urban", "Capital",
    "Care", "One", "First", "Smart", "Pro", "Tech", "New Age", "Next Gen"
  ];
  
  const suffixes = [
    "Solutions", "Services", "Experts", "Professionals", "Associates", "Partners",
    "Group", "Team", "Consultants", "Advisors", "Network", "Center", "Hub",
    "Point", "Junction", "Connection", "Link", "Spot", "Place", "Zone", "Area"
  ];
  
  // Healthcare specific names
  if (profession.includes("Doctor") || 
      profession.includes("Clinic") || 
      profession.includes("Hospital") ||
      PROFESSIONS.includes(profession)) {
    
    const healthcarePrefixes = ["Health", "Care", "Life", "Cure", "Heal", "Med", "Well"];
    const healthcareSuffixes = ["Clinic", "Hospital", "Center", "Care"];
    
    const randomPrefix = Math.random() > 0.5 
      ? prefixes[Math.floor(Math.random() * prefixes.length)]
      : healthcarePrefixes[Math.floor(Math.random() * healthcarePrefixes.length)];
    
    const randomSuffix = Math.random() > 0.5 
      ? suffixes[Math.floor(Math.random() * suffixes.length)]
      : healthcareSuffixes[Math.floor(Math.random() * healthcareSuffixes.length)];
    
    return `${randomPrefix} ${profession} ${randomSuffix}`;
  }
  
  // Default business name format
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${randomPrefix} ${profession} ${randomSuffix}`;
}; 