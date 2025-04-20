import { supabase } from './supabase';

// Types matching the scraper functionality
export interface ScrapedLocation {
  id?: string;
  name: string;
  specialty: string;
  address: string;
  phoneNumber?: string;
  email?: string;
  scrapedAt: Date | string;
  searchQuery: string;
  user_id?: string;
}

// Save scrape results to Supabase
export const saveScrapeResults = async (results: ScrapedLocation[]) => {
  try {
    console.log('Saving results to Supabase...', results);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return false;
    }
    
    console.log('Current user ID:', user.id);
    
    // Map the data for Supabase
    const supabaseResults = results.map(result => {
      // Ensure date is in ISO format string for Supabase
      const scrapedAt = result.scrapedAt instanceof Date 
        ? result.scrapedAt.toISOString() 
        : typeof result.scrapedAt === 'string' 
          ? result.scrapedAt
          : new Date().toISOString();
          
      return {
        name: result.name,
        specialty: result.specialty,
        address: result.address,
        phonenumber: result.phoneNumber,
        email: result.email,
        scrapedat: scrapedAt,
        searchquery: result.searchQuery,
        user_id: user.id,
        created_at: new Date().toISOString()
      };
    });
    
    console.log('Formatted data for Supabase:', supabaseResults[0]);
    
    // Check for existing leads first and only save new ones
    const newLeadsToSave = [];
    
    for (const result of supabaseResults) {
      const exists = await checkForExistingLead(result);
      
      if (!exists) {
        newLeadsToSave.push(result);
      } else {
        console.log(`Skipped duplicate lead: ${result.name}`);
      }
    }
    
    if (newLeadsToSave.length === 0) {
      console.log('No new leads to save.');
      return true;
    }
    
    // Insert all new leads
    const { data, error } = await supabase
      .from('scrapedlocations')
      .insert(newLeadsToSave)
      .select();
    
    if (error) {
      console.error('Error from Supabase insert:', error);
      throw error;
    }
    
    console.log(`${newLeadsToSave.length} new leads saved successfully!`, data);
    return true;
  } catch (error) {
    console.error('Error saving scrape results:', error);
    return false;
  }
};

// Check if a lead already exists in Supabase
const checkForExistingLead = async (lead: any): Promise<boolean> => {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data, error } = await supabase
      .from('scrapedlocations')
      .select('id')
      .eq('name', lead.name)
      .eq('phonenumber', lead.phonenumber || '')
      .eq('user_id', user.id)
      .limit(1);
    
    if (error) throw error;
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking for existing lead:', error);
    return false; // On error, assume it doesn't exist and try to save anyway
  }
};

// Get recent scrape results with pagination
export const getRecentScrapes = async (limitCount = 10, page = 1) => {
  try {
    console.log(`Getting recent scrapes with limit: ${limitCount}, page: ${page}`);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found, returning empty results');
      return {
        data: [],
        count: 0,
        page,
        pageSize: limitCount
      };
    }
    
    // Query Supabase with user filtering
    const { data, error, count } = await supabase
      .from('scrapedlocations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('scrapedat', { ascending: false })
      .range((page - 1) * limitCount, page * limitCount - 1);
    
    if (error) throw error;
    
    console.log(`Found ${data?.length || 0} results for user ${user.id}`);
    
    // Map the data back to our camelCase format for the frontend
    const mappedData = data?.map(item => ({
      id: item.id,
      name: item.name,
      specialty: item.specialty,
      address: item.address,
      phoneNumber: item.phonenumber,
      email: item.email,
      scrapedAt: item.scrapedat,
      searchQuery: item.searchquery,
      user_id: item.user_id,
      created_at: item.created_at
    })) || [];
    
    return {
      data: mappedData,
      count: count || 0,
      page,
      pageSize: limitCount
    };
  } catch (error) {
    console.error('Error getting recent scrapes:', error);
    // Return empty results instead of throwing
    return {
      data: [],
      count: 0,
      page,
      pageSize: limitCount
    };
  }
};

// Get scrapes by search query
export const getScrapesByQuery = async (searchQuery: string) => {
  try {
    console.log(`Getting scrapes for query: ${searchQuery}`);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found, returning empty results');
      return [];
    }
    
    const { data, error } = await supabase
      .from('scrapedlocations')
      .select('*')
      .eq('searchquery', searchQuery)
      .eq('user_id', user.id)
      .order('scrapedat', { ascending: false });
    
    if (error) throw error;
    
    // Map the data back to our camelCase format for the frontend
    const mappedData = data?.map(item => ({
      id: item.id,
      name: item.name,
      specialty: item.specialty,
      address: item.address,
      phoneNumber: item.phonenumber,
      email: item.email,
      scrapedAt: item.scrapedat,
      searchQuery: item.searchquery,
      user_id: item.user_id,
      created_at: item.created_at
    })) || [];
    
    return mappedData;
  } catch (error) {
    console.error('Error getting scrapes by query:', error);
    return []; // Return empty array instead of throwing
  }
};

// Save waitlist lead to Supabase
export const saveWaitlistLead = async (leadData: any) => {
  try {
    console.log('Saving waitlist lead to Supabase:', leadData);
    
    // Format data to match Supabase table columns exactly
    const formattedData = {
      name: leadData.name,
      email: leadData.email,
      company: leadData.company || null, // Handle optional field
      phone: leadData.phone,
      usecase: leadData.useCase, // Match lowercase column name from schema
      createdat: new Date().toISOString() // Match lowercase column name
    };
    
    console.log('Formatted data for Supabase:', formattedData);
    
    const { data, error } = await supabase
      .from('waitlistleads') // Use lowercase table name
      .insert([formattedData])
      .select();
    
    if (error) {
      console.error('Supabase error when saving waitlist lead:', error);
      throw error;
    }
    
    console.log('Waitlist lead saved successfully:', data);
    return true;
  } catch (error) {
    console.error('Error saving waitlist lead:', error);
    throw error;
  }
};

// Function to get total lead count
export const getTotalLeadCount = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found, returning 0 count');
      return 0;
    }
    
    const { count, error } = await supabase
      .from('scrapedlocations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error('Error getting total lead count:', error);
    return 0;
  }
}; 