import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Download, Map, Database, Plus, Search, Users, ArrowUpRight, Store, ArrowRight, Phone } from "lucide-react";
import { ScrapedLocation, getRecentScrapes } from "@/lib/scraper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [date] = useState(new Date());
  const [recentScrapes, setRecentScrapes] = useState<ScrapedLocation[]>([]);
  const [totalUniqueLeads, setTotalUniqueLeads] = useState<number>(0);
  const [totalSavedContacts, setTotalSavedContacts] = useState<number>(0);
  const [uniqueScrapesData, setUniqueScrapesData] = useState<ScrapedLocation[]>([]);
  const [totalUniqueQueries, setTotalUniqueQueries] = useState<number>(0);

  // Format the date as "Monday, January 1"
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Load recent scrapes and get unique counts
  useEffect(() => {
    const loadRecentScrapes = async () => {
      try {
        // Get all data without limit to ensure we get the complete counts
        const allData = await getRecentScrapes(100000); // Use a very high limit to get all data
        setRecentScrapes(allData);
        
        // De-duplicate data for accurate counts of unique businesses
        const uniqueLeadKeys = new Set();
        const uniquePhoneNumbers = new Set(); // For tracking unique phone numbers
        const uniqueLeads: ScrapedLocation[] = [];
        
        allData.forEach(item => {
          const key = `${item.name}-${item.phoneNumber}`;
          if (!uniqueLeadKeys.has(key)) {
            uniqueLeadKeys.add(key);
            uniqueLeads.push(item);
            
            // Count phone numbers separately
            if (item.phoneNumber) {
              uniquePhoneNumbers.add(item.phoneNumber);
            }
          }
        });
        
        setTotalUniqueLeads(uniqueLeads.length);
        setTotalSavedContacts(uniquePhoneNumbers.size); // Set total unique phone numbers
        
        // Get unique recent scrape queries
        const uniqueQueryKeys = new Set();
        const uniqueQueries: ScrapedLocation[] = [];
        
        // Sort by date first to get the most recent
        const sortedByDate = [...allData].sort((a, b) => {
          const dateA = new Date(a.scrapedAt).getTime();
          const dateB = new Date(b.scrapedAt).getTime();
          return dateB - dateA; // Most recent first
        });
        
        // Take only unique queries from recent scrapes
        sortedByDate.forEach(item => {
          if (!uniqueQueryKeys.has(item.searchQuery)) {
            uniqueQueryKeys.add(item.searchQuery);
            uniqueQueries.push(item);
          }
        });
        
        // Save the total number of unique queries
        setTotalUniqueQueries(uniqueQueryKeys.size);
        
        // Show the most recent unique queries
        setUniqueScrapesData(uniqueQueries.slice(0, 5));
        
      } catch (error) {
        console.error("Error loading recent scrapes:", error);
        toast({
          variant: "destructive",
          title: "Failed to load scrapes",
          description: "Please try refreshing the page.",
        });
      }
    };
    
    loadRecentScrapes();
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">{formattedDate}</p>
            </div>
            
            <div className="mt-4 md:mt-0 space-x-2 flex">
              <Link to="/lead-scraper">
                <Button 
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 flex items-center gap-1.5"
                >
                  <Store className="h-4 w-4" /> Business Lead Scraper
                </Button>
              </Link>
              <Link to="/all-results">
                <Button 
                  variant="outline"
                  className="border-teal-200 text-teal-600 hover:bg-teal-50 flex items-center gap-1.5"
                >
                  <Database className="h-4 w-4" /> View All Leads
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-white">Welcome back, {currentUser?.displayName || 'User'}!</CardTitle>
                <CardDescription className="text-white/80">
                  Ready to extract valuable data from Google Maps? Use our specialized business lead scraper.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Search className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Scrapes</p>
                        <p className="text-2xl font-bold">{totalUniqueQueries || uniqueScrapesData.length || '0'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Business Leads</p>
                        <p className="text-2xl font-bold">{totalUniqueLeads || '0'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Saved Contacts</p>
                        <p className="text-2xl font-bold">{totalSavedContacts || '0'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center gap-1.5">
                    <Store className="h-5 w-5 text-teal-500" />
                    Business Lead Scraper
                  </CardTitle>
                  <CardDescription>Find businesses and professionals</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-gray-600">
                  Our specialized tool for finding business listings from Google Maps. Target by business type and location.
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Link to="/lead-scraper" className="w-full">
                  <Button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600">
                    Open Business Scraper <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Scrapes</CardTitle>
                  <CardDescription>Your latest business lead extractions</CardDescription>
                </div>
                <Link to="/all-results">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowUpRight className="h-5 w-5 text-gray-400 hover:text-teal-500" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uniqueScrapesData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead>Specialty</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uniqueScrapesData.map((scrape, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{scrape.searchQuery}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                {scrape.specialty}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {new Date(scrape.scrapedAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) :
                    <div className="text-center py-8">
                      <Map className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No recent scrapes</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Your recent scraping activity will appear here
                      </p>
                    </div>
                  }
                </div>
              </CardContent>
              {uniqueScrapesData.length > 0 && (
                <CardFooter className="pt-0">
                  <Link to="/all-results" className="w-full">
                    <Button variant="outline" className="w-full text-teal-600 border-teal-200 hover:bg-teal-50">
                      <Database className="mr-2 h-4 w-4" /> View All Leads
                    </Button>
                  </Link>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
