import { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin, Building, PenSquare, CheckCircle2, CircleOff, Store, MenuSquare, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ScrapeRequest, 
  scrapeGoogleMaps, 
  ScrapedLocation,
  BUSINESS_CATEGORIES,
  ALL_BUSINESS_TYPES,
  CITIES,
  getLocalitiesForCity 
} from "@/lib/supabaseScraper";
import localitiesData from '@/data/localities.json';
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ScraperSearchProps {
  onResultsFound: (results: ScrapedLocation[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onProgress?: (progress: number) => void;
  onSearchStart?: (query: string) => void;
}

const SCROLL_OPTIONS = ["5", "10", "15", "20", "All (till end)"];

export default function ScraperSearch({ onResultsFound, isLoading, setIsLoading, onProgress, onSearchStart }: ScraperSearchProps) {
  const { toast } = useToast();
  // Store the previous search params to prevent unwanted resets
  const previousSearchRef = useRef<{
    category: string;
    profession: string;
    location: string;
  }>({
    category: "",
    profession: "",
    location: ""
  });
  
  const [searchParams, setSearchParams] = useState<ScrapeRequest>({
    query: "",
    profession: "",
    location: "",
    scrollCount: 10,
    localities: []
  });
  
  // State for business category selection
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [filteredBusinessTypes, setFilteredBusinessTypes] = useState<string[]>([]);
  
  // State for localities
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([]);
  const [selectedLocalities, setSelectedLocalities] = useState<Record<string, boolean>>({});
  const [showLocalitySelector, setShowLocalitySelector] = useState(false);
  const [allSelected, setAllSelected] = useState(false);
  
  // Update available business types when category changes
  useEffect(() => {
    if (selectedCategory) {
      const types = BUSINESS_CATEGORIES[selectedCategory as keyof typeof BUSINESS_CATEGORIES] || [];
      setFilteredBusinessTypes(types);
      
      // Only reset profession when category changes intentionally
      // (not during component updates after search)
      if (previousSearchRef.current.category !== selectedCategory) {
        setSearchParams(prev => ({
          ...prev,
          profession: ""
        }));
      }
      
      // Update previous category reference
      previousSearchRef.current.category = selectedCategory;
    } else {
      setFilteredBusinessTypes([]);
    }
  }, [selectedCategory]);
  
  // Update query when profession or location changes
  useEffect(() => {
    if (searchParams.profession && searchParams.location) {
      setSearchParams(prev => ({
        ...prev,
        query: `${searchParams.profession} in ${searchParams.location}`
      }));
    }
  }, [searchParams.profession, searchParams.location]);
  
  // Update localities when city changes
  useEffect(() => {
    if (searchParams.location) {
      const localities = localitiesData[searchParams.location as keyof typeof localitiesData] || [];
      setAvailableLocalities(localities);
      
      if (localities.length > 0) {
        // Initialize all localities as not selected
        const initialSelectedState: Record<string, boolean> = {};
        localities.forEach(locality => {
          initialSelectedState[locality] = false;
        });
        setSelectedLocalities(initialSelectedState);
        setShowLocalitySelector(true);
      } else {
        setShowLocalitySelector(false);
      }
    } else {
      setShowLocalitySelector(false);
    }
  }, [searchParams.location]);
  
  // Toggle select all
  const toggleSelectAll = () => {
    const newValue = !allSelected;
    setAllSelected(newValue);
    
    const updatedLocalities: Record<string, boolean> = {};
    availableLocalities.forEach(locality => {
      updatedLocalities[locality] = newValue;
    });
    setSelectedLocalities(updatedLocalities);
  };
  
  // Handle locality checkbox changes
  const handleLocalityChange = (locality: string, checked: boolean) => {
    setSelectedLocalities(prev => ({
      ...prev,
      [locality]: checked
    }));
    
    // Check if all are now selected or not
    const updatedLocalities = {
      ...selectedLocalities,
      [locality]: checked
    };
    
    const allChecked = availableLocalities.every(loc => updatedLocalities[loc]);
    setAllSelected(allChecked);
  };
  
  // Get active localities from checkbox state
  const getActiveLocalities = (): string[] => {
    return Object.entries(selectedLocalities)
      .filter(([_, isSelected]) => isSelected)
      .map(([locality]) => locality);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.query && (!searchParams.profession || !searchParams.location)) {
      toast({
        variant: "destructive",
        title: "Search details required",
        description: "Please select a business type and location or enter a search query",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Start with zero progress
    if (onProgress) onProgress(0);
    
    // Make sure the business type is properly included in search
    const effectiveQuery = searchParams.query || `${searchParams.profession} in ${searchParams.location}`;
    
    // Notify about search starting with the query
    if (onSearchStart) {
      onSearchStart(effectiveQuery);
    }
    
    try {
      // Save current search parameters to prevent reset
      previousSearchRef.current = {
        category: selectedCategory,
        profession: searchParams.profession,
        location: searchParams.location
      };
      
      // Get active localities
      const activeLocalities = getActiveLocalities();
      
      // Prepare the final search request
      const searchRequest: ScrapeRequest = {
        ...searchParams,
        query: effectiveQuery, // Ensure query is set with business type and location
        profession: searchParams.profession, // Explicitly include profession
        localities: activeLocalities.length > 0 ? activeLocalities : undefined
      };
      
      console.log('Starting search with params:', searchRequest);
      
      // For locality-based searches, update progress as each locality is processed
      if (activeLocalities.length > 0) {
        const results: ScrapedLocation[] = [];
        let completedLocalities = 0;
        
        for (const locality of activeLocalities) {
          // Update the progress based on completed localities
          if (onProgress) {
            const progress = Math.floor((completedLocalities / activeLocalities.length) * 100);
            onProgress(progress);
          }
          
          const localityQuery = `${searchRequest.profession || searchRequest.query} in ${locality} ${searchRequest.location}`;
          const localityResults = await scrapeGoogleMaps({
            ...searchRequest,
            query: localityQuery,
            localities: undefined // Don't recursively search localities
          });
          
          results.push(...localityResults);
          completedLocalities++;
        }
        
        // Final progress update
        if (onProgress) onProgress(100);
        
        // Deduplicate results
        const seen = new Set();
        const uniqueResults = results.filter(lead => {
          const key = `${lead.name}|${lead.phoneNumber}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        
        if (uniqueResults.length > 0) {
          toast({
            title: "Search Complete",
            description: `Found ${uniqueResults.length} businesses across ${activeLocalities.length} localities`,
            className: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white",
          });
          onResultsFound(uniqueResults);
        } else {
          toast({
            variant: "destructive",
            title: "No Results Found",
            description: "Try different search terms or locations",
          });
        }
      } else {
        // Simple progress simulation for single searches
        const updateProgress = () => {
          if (!isLoading || !onProgress) return;
          
          const progressSteps = [10, 25, 40, 60, 75, 90];
          let currentStep = 0;
          
          const interval = setInterval(() => {
            if (currentStep < progressSteps.length && isLoading) {
              onProgress(progressSteps[currentStep]);
              currentStep++;
            } else {
              clearInterval(interval);
            }
          }, 800);
        };
        
        updateProgress();
        const results = await scrapeGoogleMaps(searchRequest);
        
        if (onProgress) onProgress(100);
        
        if (results.length > 0) {
          toast({
            title: "Search Complete",
            description: `Found ${results.length} businesses for "${effectiveQuery}"`,
            className: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white",
          });
          onResultsFound(results);
        } else {
          toast({
            variant: "destructive",
            title: "No Results Found",
            description: "Try different search terms or location",
          });
        }
      }
    } catch (error) {
      console.error("Error scraping Google Maps:", error);
      toast({
        variant: "destructive",
        title: "Scraping Failed",
        description: "There was an error processing your request",
      });
    } finally {
      // No need to set loading to false here since it's controlled by the parent component
      // after results are displayed
    }
  };

  return (
    <form onSubmit={handleSearch} className="p-6 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Business Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Store className="h-4 w-4 text-teal-500" />
              Business Category
            </label>
            
            <Select 
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select business category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Business Categories</SelectLabel>
                  {Object.keys(BUSINESS_CATEGORIES).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {/* Business Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Store className="h-4 w-4 text-teal-500" />
              Business Type
            </label>
            
            <Select 
              value={searchParams.profession}
              onValueChange={(value) => setSearchParams({...searchParams, profession: value})}
              disabled={isLoading || !selectedCategory}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedCategory ? "Select business type" : "Select a category first"} />
              </SelectTrigger>
              <SelectContent>
                {filteredBusinessTypes.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>Business Types</SelectLabel>
                    {filteredBusinessTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ) : (
                  <div className="py-2 px-2 text-sm text-gray-500 italic">
                    Please select a category first
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* City Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-teal-500" />
              City
            </label>
            
            <Select 
              value={searchParams.location}
              onValueChange={(value) => setSearchParams({...searchParams, location: value})}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tier 1 Cities</SelectLabel>
                  {CITIES.slice(0, 8).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <Separator className="my-2" />
                <SelectGroup>
                  <SelectLabel>Tier 2 Cities</SelectLabel>
                  {CITIES.slice(8).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {/* Scroll Count Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <MenuSquare className="h-4 w-4 text-teal-500" />
              Results Limit (scroll count)
            </label>
            
            <Select 
              value={
                typeof searchParams.scrollCount === 'number' 
                  ? searchParams.scrollCount.toString() 
                  : searchParams.scrollCount || '10'
              }
              onValueChange={(value) => {
                setSearchParams({
                  ...searchParams, 
                  scrollCount: value === 'All (till end)' 
                    ? 'all' 
                    : parseInt(value, 10)
                })
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select scroll count" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Scroll Options</SelectLabel>
                  {SCROLL_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <p className="text-xs text-gray-500 mt-1">
              Higher values retrieve more results but take longer
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Localities */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Building className="h-4 w-4 text-teal-500" />
                Localities
              </label>
              
              {showLocalitySelector && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Select All</span>
                  <Checkbox 
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    disabled={isLoading || !searchParams.location || availableLocalities.length === 0}
                  />
                </div>
              )}
            </div>
            
            {showLocalitySelector ? (
              <Card className="p-0 overflow-hidden border-gray-200">
                <ScrollArea className="h-[200px] w-full">
                  <div className="p-2 grid grid-cols-1">
                    {availableLocalities.map((locality) => (
                      <div 
                        key={locality} 
                        className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded-md"
                      >
                        <Checkbox 
                          id={locality} 
                          checked={selectedLocalities[locality] || false}
                          onCheckedChange={(checked) => 
                            handleLocalityChange(locality, checked as boolean)
                          }
                          disabled={isLoading}
                        />
                        <label 
                          htmlFor={locality} 
                          className="text-sm text-gray-700 cursor-pointer select-none flex-grow"
                        >
                          {locality}
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="p-2 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {Object.values(selectedLocalities).filter(Boolean).length} of {availableLocalities.length} selected
                    </span>
                    {Object.values(selectedLocalities).some(Boolean) && (
                      <button
                        type="button"
                        onClick={() => {
                          const resetLocalities: Record<string, boolean> = {};
                          availableLocalities.forEach(locality => {
                            resetLocalities[locality] = false;
                          });
                          setSelectedLocalities(resetLocalities);
                          setAllSelected(false);
                        }}
                        className="text-teal-500 hover:text-teal-700"
                        disabled={isLoading}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-sm text-gray-500">
                  {searchParams.location 
                    ? "No localities data available for this city" 
                    : "Please select a city first"}
                </p>
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              Target specific areas within the selected city (optional)
            </p>
          </div>
          
          {/* Custom Query */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <PenSquare className="h-4 w-4 text-teal-500" />
                Custom Query (Optional)
              </label>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Override the auto-generated query with your own search terms.
                      Leave empty to use the business type and location selection.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="relative">
              <Input
                type="text"
                placeholder="e.g., bakery in downtown Mumbai"
                value={searchParams.query}
                onChange={(e) => setSearchParams({...searchParams, query: e.target.value})}
                className="pr-10"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              Current search: <span className="font-medium text-gray-600">
                {searchParams.query || (searchParams.profession && searchParams.location 
                  ? `${searchParams.profession} in ${searchParams.location}` 
                  : "No search query yet")}
              </span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Search button */}
      <div className="mt-6">
        <Button
          type="submit"
          className="w-full bg-teal-500 hover:bg-teal-600 text-white"
          disabled={isLoading || (!searchParams.query && (!searchParams.profession || !searchParams.location))}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Start Search
            </>
          )}
        </Button>
      </div>
      
      {/* Preview badge for current search */}
      {(searchParams.profession || searchParams.query) && searchParams.location && (
        <div className="mt-4 flex items-center justify-center">
          <Badge variant="outline" className="px-3 py-1 bg-teal-50 text-teal-700 border-teal-100">
            {searchParams.query || `${searchParams.profession} in ${searchParams.location}`}
            {getActiveLocalities().length > 0 && (
              <span className="ml-1 text-xs text-teal-500">
                ({getActiveLocalities().length} localities)
              </span>
            )}
          </Badge>
        </div>
      )}
    </form>
  );
} 