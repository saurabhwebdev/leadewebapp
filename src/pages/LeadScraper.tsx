import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import ScraperSearch from "@/components/ScraperSearch";
import ScraperResults from "@/components/ScraperResults";
import { ScrapedLocation } from "@/lib/supabaseScraper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, HelpCircle, Loader2, ArrowUpRight, CheckCircle, Store } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function LeadScraper() {
  const { currentUser } = useSupabaseAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapedLocation[]>([]);
  const [progressValue, setProgressValue] = useState(0);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [searchStats, setSearchStats] = useState<{
    completed: boolean;
    resultsCount: number;
    localities?: number;
  } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Set document title
  document.title = "Business Lead Generator - MapHarvest";

  // Handle progress during scraping
  const handleProgress = (value: number) => {
    setProgressValue(value);
  };

  // Handle search completion and scroll to results
  const handleSearchComplete = (searchResults: ScrapedLocation[]) => {
    setSearchStats({
      completed: true,
      resultsCount: searchResults.length,
      localities: searchResults.length > 0 ? 
        [...new Set(searchResults.map(r => r.address.split(',').slice(-2, -1)[0]?.trim()))].length : 0
    });
    setResults(searchResults);
    
    // Keep the overlay visible for a moment to show completion stats
    setTimeout(() => {
      setIsLoading(false);
      // Scroll to results section after a brief delay
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }, 1500);
  };

  // Track current search query
  const handleSearchStart = (query: string) => {
    setCurrentSearchQuery(query);
    setSearchStats(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white relative">
      <Navbar />
      
      {/* Fullscreen loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 flex-shrink-0">
                    {searchStats?.completed ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-teal-50">
                        <CheckCircle className="h-8 w-8 text-teal-500" />
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 rounded-full border-t-2 border-teal-500 animate-spin"></div>
                        <div className="absolute inset-2 rounded-full border-2 border-dashed border-gray-200"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Store className="h-7 w-7 text-teal-500" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-xl font-medium text-gray-900 mb-1">
                      {searchStats?.completed ? "Search Complete" : "Searching for Leads"}
                    </h3>
                    {searchStats?.completed ? (
                      <p className="text-sm text-gray-600">
                        Found <span className="font-medium text-teal-600">{searchStats.resultsCount}</span> leads
                        {searchStats.localities ? <> across <span className="font-medium text-teal-600">{searchStats.localities}</span> localities</> : null}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">
                        We're extracting business leads based on your search criteria...
                      </p>
                    )}
                  </div>
                </div>
                
                {currentSearchQuery && (
                  <div className="mt-1 mb-2">
                    <Badge variant="outline" className="font-normal bg-teal-50 px-3 py-1 text-xs rounded-full w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {currentSearchQuery}
                    </Badge>
                  </div>
                )}
                
                <Progress 
                  value={searchStats?.completed ? 100 : progressValue} 
                  className="h-3 bg-gray-100" 
                  indicatorClassName={`${searchStats?.completed ? 'bg-teal-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'}`} 
                />
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {searchStats?.completed ? "Completed" : "Processing..."}
                  </p>
                  <p className="text-sm font-medium text-teal-600">
                    {searchStats?.completed ? "100%" : `${progressValue}%`}
                  </p>
                </div>
                
                {searchStats?.completed && (
                  <Button 
                    className="w-full mt-2 bg-teal-500 hover:bg-teal-600 text-white"
                    onClick={() => setIsLoading(false)}
                  >
                    View Results
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.header 
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 mb-4 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              <Store className="h-4 w-4" />
              <span className="text-sm font-medium">Lead Generation Tool</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Business Lead Generator</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Extract contact information for businesses from Google Maps.
              Select a business category and location to find high-quality leads for your outreach campaigns.
            </p>
          </motion.header>
          
          <div className="space-y-8">
            {/* Search controls */}
            <Card className="shadow-sm border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Find Business Leads
                </CardTitle>
                <CardDescription className="text-white/90">
                  Configure your search parameters
                </CardDescription>
              </CardHeader>
              <Tabs defaultValue="search" className="w-full">
                <div className="border-b border-gray-200 bg-white">
                  <TabsList className="w-full rounded-none justify-start p-0 bg-transparent border-0">
                    <TabsTrigger 
                      value="search" 
                      className="flex items-center gap-1 rounded-none flex-1 py-3 border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:border-teal-500 text-gray-600"
                    >
                      <MapPin className="h-4 w-4" />
                      Search
                    </TabsTrigger>
                    <TabsTrigger 
                      value="help" 
                      className="flex items-center gap-1 rounded-none flex-1 py-3 border-b-2 border-transparent data-[state=active]:bg-transparent data-[state=active]:text-teal-600 data-[state=active]:border-teal-500 text-gray-600"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Help
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="search" className="border-none m-0">
                  <ScraperSearch 
                    onResultsFound={handleSearchComplete} 
                    isLoading={isLoading} 
                    setIsLoading={setIsLoading} 
                    onProgress={handleProgress}
                    onSearchStart={handleSearchStart}
                  />
                </TabsContent>
                <TabsContent value="help" className="px-6 py-4 border-none">
                  <ScrollArea className="h-[420px] pr-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs font-bold">1</span>
                        Getting Started
                      </h3>
                      <div className="pl-7 space-y-2 text-sm text-gray-600">
                        <p>The Business Lead Generator helps you find contact information for various businesses and professionals from Google Maps data.</p>
                        <p>Follow these steps to get the best results:</p>
                      </div>
                      
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs font-bold">2</span>
                        Using the Search Form
                      </h3>
                      <ol className="list-none pl-7 space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Step 1:</span> Select a business category (e.g., Healthcare, Retail, Professional Services)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Step 2:</span> Choose a specific business type within that category
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Step 3:</span> Choose a city where you want to find businesses
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Step 4:</span> Optionally select specific localities within the city for more precise targeting
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Step 5:</span> Set the scroll count (how many results to fetch)
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Step 6:</span> Click "Start Search" to begin scraping
                        </li>
                      </ol>
                      
                      <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs font-bold">3</span>
                        Tips for Better Results
                      </h3>
                      <ul className="list-none pl-7 space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Tip:</span> Be specific with your business category and type selection for better targeting
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Tip:</span> For large cities, select specific localities to get more relevant results
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Tip:</span> Start with a smaller scroll count to test your search criteria
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-medium text-teal-600">Tip:</span> Use the export options to save your leads for future use
                        </li>
                      </ul>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </Card>
            
            {/* Results Section */}
            <div ref={resultsRef}>
              {results.length > 0 && (
                <ScraperResults 
                  results={results} 
                  searchQuery={currentSearchQuery} 
                />
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 