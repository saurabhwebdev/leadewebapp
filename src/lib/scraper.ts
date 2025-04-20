import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit as firestoreLimit, Timestamp, startAfter } from 'firebase/firestore';
import localitiesData from '@/data/localities.json';

// Types that match our new scraper's functionality
export interface ScrapedLocation {
  id?: string;
  name: string;
  specialty: string;
  address: string;
  phoneNumber?: string;
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

// Business categories for the expanded business lead generator
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
// Since we can't use puppeteer/selenium directly in the browser
// (security restrictions), we'll implement a simulated scrape with 
// more realistic data and complete functionality
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
    
    // Save results to Firestore
    if (allResults.length > 0) {
      await saveScrapeResults(allResults);
    }
    
    return allResults;
  } catch (error) {
    console.error('Error in scrapeGoogleMaps:', error);
    throw new Error(`Scraping failed: ${error}`);
  }
};

// Check if a lead already exists in Firestore
const checkForExistingLead = async (lead: any): Promise<boolean> => {
  try {
    // Check if a lead with the same name and phone number already exists
    const q = query(
      collection(db, 'scrapedLocations'),
      where('name', '==', lead.name),
      where('phoneNumber', '==', lead.phoneNumber || '')
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty; // Returns true if the lead already exists
  } catch (error) {
    console.error('Error checking for existing lead:', error);
    return false; // On error, assume it doesn't exist and try to save anyway
  }
};

// Save scrape results to Firestore
export const saveScrapeResults = async (results: ScrapedLocation[]) => {
  try {
    console.log('Saving results to Firestore...');
    
    // Convert JavaScript Date objects to Firestore Timestamps
    const firestoreResults = results.map(result => ({
      ...result,
      scrapedAt: Timestamp.fromDate(result.scrapedAt)
    }));
    
    // Check for existing leads and only save new ones
    const newLeadsToSave = [];
    
    for (const result of firestoreResults) {
      const exists = await checkForExistingLead(result);
      
      if (!exists) {
        // Only add to batch if it doesn't already exist
        newLeadsToSave.push(result);
      } else {
        console.log(`Skipped duplicate lead: ${result.name}`);
      }
    }
    
    if (newLeadsToSave.length === 0) {
      console.log('No new leads to save.');
      return true;
    }
    
    // Save only the new leads
    const batch = [];
    for (const result of newLeadsToSave) {
      batch.push(addDoc(collection(db, 'scrapedLocations'), result));
    }
    
    await Promise.all(batch);
    console.log(`${newLeadsToSave.length} new leads saved successfully!`);
    return true;
  } catch (error) {
    console.error('Error saving scrape results:', error);
    return false;
  }
};

// Get recent scrape results with pagination to handle large datasets
export const getRecentScrapes = async (limitCount = 10) => {
  try {
    console.log(`Getting recent scrapes with limit: ${limitCount}`);
    
    const allResults: ScrapedLocation[] = [];
    let lastDoc = null;
    const batchSize = 500; // Firestore max batch size
    let hasMore = true;
    
    // If unlimited results are requested (or a very high number), fetch in batches
    if (limitCount > 500) {
      while (hasMore && allResults.length < limitCount) {
        // Create query with pagination
        let q;
        if (lastDoc) {
          q = query(
            collection(db, 'scrapedLocations'),
            orderBy('scrapedAt', 'desc'),
            startAfter(lastDoc),
            firestoreLimit(batchSize)
          );
        } else {
          q = query(
            collection(db, 'scrapedLocations'),
            orderBy('scrapedAt', 'desc'),
            firestoreLimit(batchSize)
          );
        }
        
        const snapshot = await getDocs(q);
        
        // If no more results, break the loop
        if (snapshot.empty) {
          hasMore = false;
          break;
        }
        
        // Process results
        const docs = snapshot.docs.map(doc => {
          const data = doc.data() as { scrapedAt?: { toDate(): Date } };
          return {
            id: doc.id,
            ...data as Record<string, any>,
            scrapedAt: data.scrapedAt?.toDate() || new Date()
          } as ScrapedLocation;
        });
        
        // Add to results array
        allResults.push(...docs);
        
        // Set the last document for next pagination
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        
        // Break if we've reached the requested limit
        if (allResults.length >= limitCount) {
          break;
        }
      }
      
      console.log(`Found ${allResults.length} total scrapes after batching`);
      return allResults;
    } else {
      // For smaller requests, use the original approach
      const q = query(
        collection(db, 'scrapedLocations'),
        orderBy('scrapedAt', 'desc'),
        firestoreLimit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      console.log(`Found ${snapshot.docs.length} recent scrapes`);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          scrapedAt: data.scrapedAt?.toDate() || new Date()
        };
      }) as ScrapedLocation[];
    }
  } catch (error) {
    console.error('Error getting recent scrapes:', error);
    return [];
  }
};

// Get scrape results by search query
export const getScrapesByQuery = async (searchQuery: string) => {
  try {
    console.log(`Getting scrapes for query: ${searchQuery}`);
    const q = query(
      collection(db, 'scrapedLocations'),
      where('searchQuery', '==', searchQuery),
      orderBy('scrapedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.docs.length} scrapes for query: ${searchQuery}`);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamp back to Date
      return {
        id: doc.id,
        ...data,
        scrapedAt: data.scrapedAt?.toDate() || new Date()
      };
    }) as ScrapedLocation[];
  } catch (error) {
    console.error(`Error getting scrapes for query ${searchQuery}:`, error);
    return [];
  }
};

// Generate known locality data for major cities
export const getLocalitiesForCity = (city: string): string[] => {
  // Use the JSON data instead of hardcoded values
  return localitiesData[city as keyof typeof localitiesData] || [];
};

// Simulate the scraping process that would normally be done by Puppeteer/Selenium
// This gives us real-looking data without needing a backend service
const simulateScrape = async (query: string, scrollCount?: number | string): Promise<ScrapedLocation[]> => {
  // Simulate loading delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  const results: ScrapedLocation[] = [];
  const scroll = scrollCount === 'all' ? 25 : (Number(scrollCount) || 10);
  
  // Number of results is based on scroll count
  const resultCount = Math.min(scroll * 3 + Math.floor(Math.random() * 5), 75);
  
  // Parse query to extract profession and location if possible
  const queryParts = query.split(' in ');
  const profession = queryParts[0].trim() || '';
  const location = queryParts.length > 1 ? queryParts[1].trim() : '';
  
  // Determine the business category based on the profession
  let businessCategory = '';
  let businessType = profession; // Use the provided profession by default
  
  for (const [category, types] of Object.entries(BUSINESS_CATEGORIES)) {
    if (types.includes(profession)) {
      businessCategory = category;
      break;
    }
  }
  
  // If no category found, use default naming
  if (!businessCategory && businessType) {
    // Try to find partial matches (e.g. "Hotel" might not be exactly "Hotel" in the list)
    for (const [category, types] of Object.entries(BUSINESS_CATEGORIES)) {
      for (const type of types) {
        if (type.toLowerCase().includes(businessType.toLowerCase()) || 
            businessType.toLowerCase().includes(type.toLowerCase())) {
          businessCategory = category;
          businessType = type; // Use the exact type from our list
          break;
        }
      }
      if (businessCategory) break;
    }
  }
  
  if (!businessCategory) {
    businessCategory = 'default';
  }
  
  console.log(`Simulating scrape for business type: ${businessType} in category: ${businessCategory}`);
  
  // Common name components based on business category
  const generateBusinessName = (category: string, profession: string) => {
    const firstNames = ['Amit', 'Priya', 'Rahul', 'Neha', 'Sanjay', 'Divya', 'Vijay', 'Ananya', 'Rajesh', 'Meera', 'Arun', 'Pooja', 'Arjun', 'Deepa', 'Kiran', 'Nisha', 'Vivek', 'Sunita', 'Mohit', 'Anjali'];
    const lastNames = ['Sharma', 'Patel', 'Singh', 'Mehta', 'Gupta', 'Verma', 'Iyer', 'Joshi', 'Kumar', 'Reddy', 'Desai', 'Shah', 'Agarwal', 'Kapoor', 'Chatterjee', 'Bhatia', 'Nair', 'Das', 'Rao', 'Malhotra'];
    
    // Extract city from location if possible
    let city = '';
    for (const c of CITIES) {
      if (location.includes(c)) {
        city = c;
        break;
      }
    }
    
    // Business name templates based on category
    const templates: Record<string, string[]> = {
      'Healthcare': [
        'Dr. [FIRST] [LAST]',
        '[FIRST] [LAST], MD',
        '[LAST] Medical [BUSINESS]',
        '[FIRST] [LAST] [BUSINESS]',
        '[CITY] [BUSINESS]',
        '[LAST] [BUSINESS]'
      ],
      'Retail': [
        '[FIRST]\'s [BUSINESS]',
        '[LAST] [BUSINESS]',
        'The [BUSINESS] Shop',
        '[FIRST] & [FIRST] [BUSINESS]',
        '[CITY] [BUSINESS]',
        'Premium [BUSINESS]'
      ],
      'Food & Dining': [
        '[FIRST]\'s [BUSINESS]',
        'The [BUSINESS] House',
        '[LAST] [BUSINESS]',
        '[CITY] [BUSINESS]',
        'Royal [BUSINESS]',
        'Spice [BUSINESS]'
      ],
      'Professional Services': [
        '[LAST] & Associates',
        '[FIRST] [LAST] [BUSINESS]',
        '[CITY] [BUSINESS] Services',
        '[LAST] & [LAST] [BUSINESS]',
        'Professional [BUSINESS]',
        '[FIRST] [LAST] Consultants'
      ],
      'Education': [
        '[CITY] [BUSINESS] Institute',
        '[LAST] Academy',
        '[LAST] [BUSINESS] Center',
        '[FIRST] [BUSINESS] Classes',
        'Advanced [BUSINESS] Institute',
        'Excellence [BUSINESS] Academy'
      ],
      'Personal Care': [
        '[FIRST]\'s [BUSINESS]',
        '[LAST] [BUSINESS]',
        'Beauty [BUSINESS]',
        'Elite [BUSINESS]',
        '[CITY] [BUSINESS]',
        'Wellness [BUSINESS]'
      ],
      'Home Services': [
        '[LAST] [BUSINESS]',
        '[CITY] [BUSINESS] Services',
        '[FIRST]\'s [BUSINESS]',
        'Professional [BUSINESS]',
        'Home [BUSINESS] Experts',
        'Premier [BUSINESS] Services'
      ],
      'Automotive': [
        '[LAST] [BUSINESS]',
        '[CITY] [BUSINESS]',
        '[FIRST]\'s [BUSINESS]',
        'Premier [BUSINESS]',
        'Reliable [BUSINESS]',
        'Advanced [BUSINESS] Solutions'
      ],
      'Hospitality': [
        '[BUSINESS] [CITY]',
        'The [BUSINESS] Inn',
        'Royal [BUSINESS]',
        'Grand [BUSINESS]',
        'Luxury [BUSINESS]',
        '[CITY] [BUSINESS] Suites'
      ],
      'Entertainment': [
        '[CITY] [BUSINESS]',
        '[FIRST]\'s [BUSINESS]',
        'The [BUSINESS] Zone',
        'Fun [BUSINESS]',
        'Premium [BUSINESS]',
        'Elite [BUSINESS]'
      ],
      'default': [
        '[FIRST] [LAST] [BUSINESS]',
        '[LAST] [BUSINESS]',
        '[CITY] [BUSINESS]',
        'The [BUSINESS] Place',
        'Premium [BUSINESS]',
        '[BUSINESS] Center'
      ]
    };
    
    // Select appropriate category templates or use default
    const categoryTemplates = templates[category] || templates['default'];
    const template = categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
    
    // Get a random first and last name
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    // Replace template placeholders
    return template
      .replace('[FIRST]', firstName)
      .replace('[LAST]', lastName)
      .replace('[BUSINESS]', profession)
      .replace('[CITY]', city || 'Premium');
  };
  
  // Streets in different cities for addresses
  const streets = {
    'Mumbai': ['MG Road', 'SV Road', 'Link Road', 'Hill Road', 'Turner Road', 'Pali Hill', 'Juhu Tara Road'],
    'Delhi': ['Connaught Place', 'Barakhamba Road', 'Chandni Chowk', 'Rajpath', 'Lodhi Road', 'Janpath'],
    'Bangalore': ['MG Road', 'Brigade Road', '100 Feet Road', 'Commercial Street', 'Residency Road', 'Lavelle Road'],
    'default': ['Main Street', 'Park Avenue', 'Gandhi Road', 'Market Road', 'Commercial Street', 'Business Complex']
  };
  
  // Extract city from location if possible
  let city = '';
  for (const c of CITIES) {
    if (location.includes(c)) {
      city = c;
      break;
    }
  }
  
  // If no specific city found, use default
  const cityStreets = streets[city as keyof typeof streets] || streets.default;
  
  // Areas/neighborhoods - use the JSON data
  const areas = location ? [location] : localitiesData[city as keyof typeof localitiesData] || ['Downtown', 'Uptown', 'Central', 'West', 'East', 'North', 'South'];
  
  // Generate realistic results
  for (let i = 0; i < resultCount; i++) {
    // Generate business name based on category
    const name = generateBusinessName(businessCategory, profession);
    
    // Create a realistic address
    const street = cityStreets[Math.floor(Math.random() * cityStreets.length)];
    const area = areas[Math.floor(Math.random() * areas.length)];
    const buildingNum = Math.floor(Math.random() * 500) + 1;
    const address = `${buildingNum}, ${street}, ${area}, ${city || 'Mumbai'}`;
    
    // Create a realistic phone number (India format)
    const phoneNumber = `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    
    results.push({
      name,
      specialty: businessType, // Use the business type as specialty
      address,
      phoneNumber,
      scrapedAt: new Date(),
      searchQuery: query
    });
  }
  
  return results;
}; 