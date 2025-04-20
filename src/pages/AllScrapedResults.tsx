import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrapedLocation, getRecentScrapes, getTotalLeadCount } from "@/lib/supabaseDb";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  Filter, 
  MapPin, 
  Phone, 
  Mail,
  Globe,
  Store, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  ArrowRight,
  Copy,
  ClipboardCheck,
  ExternalLink,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";

export default function AllScrapedResults() {
  const { currentUser } = useSupabaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapedLocation[]>([]);
  const [filterText, setFilterText] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ScrapedLocation;
    direction: 'ascending' | 'descending';
  }>({ key: 'scrapedAt', direction: 'descending' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Available specialties in the data for filtering
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  
  // State for expanded row
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Load data on initial page load and when pagination or filters change
  useEffect(() => {
    loadSpecialties();
    fetchResultsPage();
    fetchTotalCount();
  }, [currentPage, itemsPerPage, specialtyFilter, sortConfig]);
  
  // Calculate total pages when total items or items per page changes
  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);
  
  // Load unique specialties for the filter
  const loadSpecialties = async () => {
    if (availableSpecialties.length > 0) return;
    
    setIsLoadingSpecialties(true);
    try {
      const { data, error } = await supabase
        .from('scrapedlocations')
        .select('specialty')
        .order('specialty');
      
      if (error) throw error;
      
      // Extract and deduplicate specialties
      const specialtySet = new Set<string>();
      data.forEach(item => {
        if (item.specialty) specialtySet.add(item.specialty);
      });
      
      setAvailableSpecialties(Array.from(specialtySet).sort());
    } catch (error) {
      console.error("Error loading specialties:", error);
    } finally {
      setIsLoadingSpecialties(false);
    }
  };
  
  // Fetch the current page of results using Supabase
  const fetchResultsPage = async () => {
    setIsLoading(true);
    
    try {
      // Build the Supabase query
      let query = supabase
        .from('scrapedlocations')
        .select('*', { count: 'exact' });
      
      // Add specialty filter if selected
      if (specialtyFilter !== "all") {
        query = query.eq('specialty', specialtyFilter);
      }
      
      // Add ordering - map camelCase properties to lowercase column names
      const { key, direction: sortDirection } = sortConfig;
      let orderColumn = key.toLowerCase(); // Default to lowercase version
      
      // Map our camelCase properties to the actual column names in Supabase
      if (key === 'phoneNumber') orderColumn = 'phonenumber';
      else if (key === 'scrapedAt') orderColumn = 'scrapedat';
      else if (key === 'searchQuery') orderColumn = 'searchquery';
      
      query = query.order(orderColumn, { ascending: sortDirection === 'ascending' });
      
      // Add pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);
      
      // Execute query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setResults([]);
        // Only show no results message if there's a filter applied
        if (specialtyFilter !== "all" || currentPage > 1) {
          toast({
            title: "No results found",
            description: "Try changing your filters or going back to page 1",
            variant: "destructive",
          });
        }
      } else {
        // Convert data to ScrapedLocation objects with correct camelCase properties
        const fetchedResults = data.map(item => ({
          id: item.id,
          name: item.name,
          specialty: item.specialty,
          address: item.address,
          phoneNumber: item.phonenumber,
          email: item.email,
          scrapedAt: item.scrapedat ? new Date(item.scrapedat) : new Date(),
          searchQuery: item.searchquery,
          user_id: item.user_id
        }));
        
        setResults(fetchedResults);
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      toast({
        title: "Error loading data",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch the total count from Supabase
  const fetchTotalCount = async () => {
    try {
      const totalCount = await getTotalLeadCount();
      setTotalItems(totalCount);
    } catch (error) {
      console.error("Error fetching total count:", error);
    }
  };
  
  // Handle text filtering (client-side for now)
  const getFilteredResults = () => {
    if (!filterText) return results;
    
    const searchTerm = filterText.toLowerCase();
    return results.filter(result => 
      result.name.toLowerCase().includes(searchTerm) ||
      result.address.toLowerCase().includes(searchTerm) ||
      result.specialty.toLowerCase().includes(searchTerm) ||
      (result.phoneNumber && result.phoneNumber.toLowerCase().includes(searchTerm)) ||
      (result.email && result.email.toLowerCase().includes(searchTerm)) ||
      (result.searchQuery && result.searchQuery.toLowerCase().includes(searchTerm))
    );
  };
  
  // Handle page navigation
  const goToPage = (page: number) => {
    if (page === currentPage) return;
    
    if (page > currentPage) {
      // Going forward
      fetchResultsPage();
    } else if (page < currentPage) {
      // Going backward
      fetchResultsPage();
    }
    
    setCurrentPage(page);
  };
  
  // Handle sort column click
  const requestSort = (key: keyof ScrapedLocation) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
  const getSortIcon = (key: keyof ScrapedLocation) => {
    if (sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUp className="ml-1 h-4 w-4" /> : 
      <ChevronDown className="ml-1 h-4 w-4" />;
  };

  // Export all results to CSV
  const exportToCSV = async () => {
    setIsLoading(true);
    
    try {
      toast({
        title: "Preparing export...",
        description: "This may take a moment for large datasets",
      });
      
      // For export, we need to fetch all results that match the current filters
      let query = supabase
        .from('scrapedlocations')
        .select('*');
      
      // Add specialty filter if selected
      if (specialtyFilter !== "all") {
        query = query.eq('specialty', specialtyFilter);
      }
      
      // Add ordering - map camelCase properties to lowercase column names
      const { key, direction: sortDirection } = sortConfig;
      let orderColumn = key.toLowerCase(); // Default to lowercase version
      
      // Map our camelCase properties to the actual column names in Supabase
      if (key === 'phoneNumber') orderColumn = 'phonenumber';
      else if (key === 'scrapedAt') orderColumn = 'scrapedat';
      else if (key === 'searchQuery') orderColumn = 'searchquery';
      
      query = query.order(orderColumn, { ascending: sortDirection === 'ascending' });
      
      // Fetch all data (may need pagination for very large datasets)
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          title: "No data to export",
          description: "Try changing your filters first",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Process data
      const exportResults = data.map(item => ({
        ...item,
        scrapedAt: item.scrapedat ? new Date(item.scrapedat) : new Date(),
      }));
      
      // Generate CSV data
      const headers = [
        { label: "Business Name", key: "name" },
        { label: "Specialty", key: "specialty" },
        { label: "Address", key: "address" },
        { label: "Phone", key: "phoneNumber" },
        { label: "Email", key: "email" },
        { label: "Scraped Date", key: "scrapedAt" },
        { label: "Search Query", key: "searchQuery" },
      ];
      
      let csvContent = headers.map(h => h.label).join(',') + '\n';
      
      // Add data rows
      exportResults.forEach(item => {
        const row = [
          `"${item.name?.replace(/"/g, '""') || ''}"`,
          `"${item.specialty?.replace(/"/g, '""') || ''}"`,
          `"${item.address?.replace(/"/g, '""') || ''}"`,
          `"${item.phoneNumber?.replace(/"/g, '""') || ''}"`,
          `"${item.email?.replace(/"/g, '""') || ''}"`,
          `"${formatDate(item.scrapedAt)}"`,
          `"${item.searchQuery?.replace(/"/g, '""') || ''}"`,
        ];
        csvContent += row.join(',') + '\n';
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `lead_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export complete!",
        description: `${exportResults.length} leads exported successfully.`,
        className: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Generate page numbers for pagination
  const getPageNumbers = () => {
    // For server-side pagination, we need to handle this differently
    // We'll just show current page number and total
    return [currentPage];
  };

  // Set document title
  document.title = "All Scraped Results - MapHarvest";

  // Get filtered results for display
  const filteredResults = getFilteredResults();

  // Empty state component for when there's no data
  const EmptyState = () => (
    <div className="text-center py-12 space-y-3">
      <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-700">No leads found</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        Try scraping for business leads using the Business Lead Scraper first.
        Once you've collected leads, they'll appear here.
      </p>
      <div className="pt-4">
        <Link to="/lead-scraper">
          <Button 
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600"
          >
            Go to Lead Scraper <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );

  // Toggle expanded row
  const toggleExpandRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
      className: "bg-teal-50 text-teal-700 border-teal-200",
    });
    
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Store className="h-8 w-8 text-teal-500" />
                All Business Leads
              </h1>
              <p className="text-gray-600 max-w-3xl">
                Consolidated view of all scraped business contact information
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => {
                  setCurrentPage(1);
                  fetchResultsPage();
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                onClick={exportToCSV}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                size="sm"
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
            </div>
          </header>
          
          <Card className="shadow-md border-gray-100 overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white">Business Leads Database</CardTitle>
                  <CardDescription className="text-white/80">
                    {totalItems > 0 ? `${totalItems} total leads` : "Loading..."}
                  </CardDescription>
                </div>
                
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={18} />
                    <Input
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Search by name, specialty, address, phone, email or query..."
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/70"
                    />
                  </div>
                  
                  <Select
                    value={specialtyFilter}
                    onValueChange={(value) => {
                      setSpecialtyFilter(value);
                      setCurrentPage(1);
                    }}
                    disabled={isLoadingSpecialties}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-[160px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {isLoadingSpecialties ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        availableSpecialties.map(specialty => (
                          <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-[120px]">
                      <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                  
                  <div className="mt-2 text-xs text-white/80">
                    Click the expand button on any row to see detailed information and contact options
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-hidden">
                {!isLoading && results.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="rounded-md border">
                    <ScrollArea className="h-[500px]">
                    <Table className="w-full excel-style">
                        <TableHeader className="bg-gray-50 sticky top-0 border-b z-10">
                        <TableRow>
                          <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => requestSort('name')}>
                            <div className="flex items-center">
                              Name {getSortIcon('name')}
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => requestSort('specialty')}>
                            <div className="flex items-center">
                              Specialty {getSortIcon('specialty')}
                            </div>
                          </TableHead>
                            <TableHead className="cursor-pointer whitespace-nowrap hidden md:table-cell" onClick={() => requestSort('address')}>
                            <div className="flex items-center">
                              Address {getSortIcon('address')}
                            </div>
                          </TableHead>
                            <TableHead className="whitespace-nowrap hidden sm:table-cell">
                            <div className="flex items-center">
                                Phone
                            </div>
                          </TableHead>
                            <TableHead className="cursor-pointer whitespace-nowrap hidden lg:table-cell" onClick={() => requestSort('scrapedAt')}>
                            <div className="flex items-center">
                                Date {getSortIcon('scrapedAt')}
                            </div>
                          </TableHead>
                            <TableHead className="text-right w-10">
                              <span className="sr-only">Actions</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResults.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              {isLoading ? (
                                <div className="flex items-center justify-center">
                                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                                  Loading business leads...
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <AlertCircle className="h-8 w-8 text-amber-500 mb-2" />
                                  <p>No business leads found matching your filters.</p>
                                  {filterText && <p className="text-sm mt-1">Try clearing your search term.</p>}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                            filteredResults.map((lead, index) => {
                              const uniqueRowId = `${lead.id || lead.name}-${index}`;
                              const isExpanded = expandedRow === uniqueRowId;
                              
                              return (
                                <>
                                  <TableRow key={uniqueRowId} className="hover:bg-teal-50/30 border-b border-gray-100">
                                    <TableCell className="font-medium text-teal-800">{lead.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                  {lead.specialty}
                                </Badge>
                              </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                      <div className="flex items-center max-w-[200px] truncate">
                                  <MapPin className="mr-1 h-3 w-3 text-gray-400 shrink-0" />
                                        <span className="text-sm truncate">{lead.address}</span>
                                </div>
                              </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                      {lead.phoneNumber ? (
                                        <div className="flex items-center text-sm group">
                                          <Phone className="mr-1 h-3 w-3 text-gray-400" />
                                          <span className="mr-1">{lead.phoneNumber}</span>
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button 
                                                  variant="ghost" 
                                                  size="icon" 
                                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => copyToClipboard(lead.phoneNumber || '', uniqueRowId)}
                                                >
                                                  {copiedId === uniqueRowId ? (
                                                    <ClipboardCheck className="h-3 w-3 text-teal-500" />
                                                  ) : (
                                                    <Copy className="h-3 w-3 text-gray-400" />
                                                  )}
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent side="top">
                                                <p>Copy phone number</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                </div>
                                      ) : (
                                        <span className="text-xs text-gray-400">No phone available</span>
                                      )}
                              </TableCell>
                                    <TableCell className="hidden lg:table-cell text-xs text-gray-500 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                                  {formatDate(lead.scrapedAt)}
                                </div>
                              </TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0"
                                        onClick={() => toggleExpandRow(uniqueRowId)}
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  
                                  {isExpanded && (
                                    <TableRow className="bg-slate-50">
                                      <TableCell colSpan={6} className="p-0">
                                        <div className="p-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <h4 className="font-medium text-sm text-gray-700 mb-2">Details</h4>
                                              <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                  <MapPin className="h-4 w-4 text-teal-500 mt-0.5" />
                                                  <div>
                                                    <p className="text-sm font-medium">Address</p>
                                                    <p className="text-sm text-gray-600">{lead.address}</p>
                                                  </div>
                                                </div>
                                                
                                                <div className="flex items-start gap-2">
                                                  <Calendar className="h-4 w-4 text-teal-500 mt-0.5" />
                                                  <div>
                                                    <p className="text-sm font-medium">Scraped Date</p>
                                                    <p className="text-sm text-gray-600">
                                                      {formatDate(lead.scrapedAt)}
                                                    </p>
                                                  </div>
                                                </div>

                                                <div className="flex items-start gap-2">
                                                  <Search className="h-4 w-4 text-teal-500 mt-0.5" />
                                                  <div>
                                                    <p className="text-sm font-medium">Search Query</p>
                                                    <p className="text-sm text-gray-600">{lead.searchQuery}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <h4 className="font-medium text-sm text-gray-700 mb-2">Contact Options</h4>
                                              <div className="space-y-2">
                                                {lead.phoneNumber && (
                                                  <div className="flex items-start gap-2">
                                                    <Phone className="h-4 w-4 text-teal-500 mt-0.5" />
                                                    <div className="flex-grow">
                                                      <p className="text-sm font-medium">Phone</p>
                                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <p className="text-sm text-gray-600">{lead.phoneNumber}</p>
                                                        <div className="flex gap-1">
                                                          <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => copyToClipboard(lead.phoneNumber || '', uniqueRowId)}
                                                          >
                                                            {copiedId === uniqueRowId ? (
                                                              <>
                                                                <ClipboardCheck className="mr-1 h-3 w-3" />
                                                                Copied
                                                              </>
                                                            ) : (
                                                              <>
                                                                <Copy className="mr-1 h-3 w-3" />
                                                                Copy
                                                              </>
                                                            )}
                                                          </Button>
                                                          <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => window.open(`tel:${lead.phoneNumber}`, '_blank')}
                                                          >
                                                            <Phone className="mr-1 h-3 w-3" />
                                                            Call
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {lead.email && (
                                                  <div className="flex items-start gap-2">
                                                    <Mail className="h-4 w-4 text-teal-500 mt-0.5" />
                                                    <div className="flex-grow">
                                                      <p className="text-sm font-medium">Email</p>
                                                      <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <p className="text-sm text-gray-600">{lead.email}</p>
                                                        <div className="flex gap-1">
                                                          <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => copyToClipboard(lead.email || '', `${uniqueRowId}-email`)}
                                                          >
                                                            {copiedId === `${uniqueRowId}-email` ? (
                                                              <>
                                                                <ClipboardCheck className="mr-1 h-3 w-3" />
                                                                Copied
                                                              </>
                                                            ) : (
                                                              <>
                                                                <Copy className="mr-1 h-3 w-3" />
                                                                Copy
                                                              </>
                                                            )}
                                                          </Button>
                                                          <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                                                          >
                                                            <Mail className="mr-1 h-3 w-3" />
                                                            Email
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                <div className="flex items-start gap-2">
                                                  <Globe className="h-4 w-4 text-teal-500 mt-0.5" />
                                                  <div className="flex-grow">
                                                    <p className="text-sm font-medium">Google Maps</p>
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                      <p className="text-sm text-gray-600 truncate max-w-[200px]">{lead.name}</p>
                                                      <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(lead.name + ' ' + lead.address)}`, '_blank')}
                                                      >
                                                        <ExternalLink className="mr-1 h-3 w-3" />
                                                        View on Maps
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex justify-end mt-4">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleExpandRow(uniqueRowId)}
                                              className="text-xs text-gray-500"
                                            >
                                              Close Details
                                            </Button>
                                          </div>
                                        </div>
                              </TableCell>
                            </TableRow>
                                  )}
                                </>
                              );
                            })
                        )}
                      </TableBody>
                    </Table>
                    </ScrollArea>
                  </div>
                )}
              </div>
              
              {/* Pagination and summary info */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="text-sm text-gray-500 mb-4 md:mb-0">
                    Showing page {currentPage} of {totalPages || '?'} ({filteredResults.length} results displayed)
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setCurrentPage(1);
                            fetchResultsPage();
                          }} 
                          disabled={currentPage === 1 || isLoading}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => goToPage(currentPage - 1)} 
                          disabled={currentPage === 1 || isLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      
                      {/* Current page indicator */}
                      <PaginationItem>
                        <PaginationLink isActive={true}>
                          {currentPage}
                        </PaginationLink>
                      </PaginationItem>
                      
                      <PaginationItem>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => goToPage(currentPage + 1)} 
                          disabled={!filteredResults.length || isLoading}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                      <PaginationItem>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          disabled={true}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  <div className="mt-4 md:mt-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" disabled={isLoading}>
                          <Download className="mr-2 h-4 w-4" />
                          Export Options
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={exportToCSV}>
                          Export to CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportToCSV}>
                          Export to Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <style>
        {`
        .excel-style {
          border-collapse: collapse;
          font-size: 14px;
        }
        .excel-style th {
          background-color: #f9fafb;
          font-weight: 600;
          text-align: left;
          padding: 12px 16px;
        }
        .excel-style td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .excel-style tr:hover {
          background-color: #f8fafc;
        }
        .excel-style tr:nth-child(even) {
          background-color: #fafafa;
        }
        `}
      </style>
      
      <Footer />
    </div>
  );
} 