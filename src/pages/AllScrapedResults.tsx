import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrapedLocation, getRecentScrapes } from "@/lib/scraper";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  Filter, 
  MapPin, 
  Phone, 
  Store, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle
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
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  DocumentData, 
  QueryDocumentSnapshot,
  getCountFromServer
} from "firebase/firestore";

export default function AllScrapedResults() {
  const { currentUser } = useAuth();
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
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageStack, setPageStack] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  
  // Available specialties in the data for filtering
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  
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
      const specialtiesQuery = query(
        collection(db, 'scrapedLocations'),
        orderBy('specialty'),
        limit(50)
      );
      
      const snapshot = await getDocs(specialtiesQuery);
      
      // Extract and deduplicate specialties
      const specialtySet = new Set<string>();
      snapshot.docs.forEach(doc => {
        const specialty = doc.data().specialty;
        if (specialty) specialtySet.add(specialty);
      });
      
      setAvailableSpecialties(Array.from(specialtySet).sort());
    } catch (error) {
      console.error("Error loading specialties:", error);
    } finally {
      setIsLoadingSpecialties(false);
    }
  };
  
  // Fetch the current page of results using Firestore pagination
  const fetchResultsPage = async (direction: 'next' | 'prev' | 'first' = 'first') => {
    setIsLoading(true);
    
    try {
      // Create the base query
      let baseQuery = collection(db, 'scrapedLocations');
      let constraints = [];
      
      // Add specialty filter if selected
      if (specialtyFilter !== "all") {
        constraints.push(where('specialty', '==', specialtyFilter));
      }
      
      // Add ordering
      const { key, direction: sortDirection } = sortConfig;
      constraints.push(orderBy(key === 'scrapedAt' ? 'scrapedAt' : key, sortDirection === 'ascending' ? 'asc' : 'desc'));
      
      // Get total count first (for pagination info)
      if (direction === 'first') {
        const countQuery = query(baseQuery, ...constraints);
        const countSnapshot = await getCountFromServer(countQuery);
        setTotalItems(countSnapshot.data().count);
      }
      
      // Build query with pagination
      let firestoreQuery;
      
      if (direction === 'next' && lastVisible) {
        // Get next page
        firestoreQuery = query(
          baseQuery,
          ...constraints,
          startAfter(lastVisible),
          limit(itemsPerPage)
        );
      } else if (direction === 'prev' && pageStack.length > 0) {
        // Get previous page
        const prevPageCursor = pageStack[pageStack.length - 1];
        setPageStack(prev => prev.slice(0, -1));
        
        firestoreQuery = query(
          baseQuery,
          ...constraints,
          startAfter(prevPageCursor),
          limit(itemsPerPage)
        );
      } else {
        // First page or reset
        firestoreQuery = query(
          baseQuery,
          ...constraints,
          limit(itemsPerPage)
        );
        setPageStack([]);
      }
      
      // Execute the query
      const snapshot = await getDocs(firestoreQuery);
      
      if (snapshot.empty) {
        setResults([]);
        setLastVisible(null);
        setFirstVisible(null);
        
        toast({
          title: "No results found",
          description: "Try changing your filters",
          variant: "destructive",
        });
      } else {
        // Save first and last documents for pagination
        setFirstVisible(snapshot.docs[0]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        
        // If moving to next page, save the first doc of current page to allow going back
        if (direction === 'next' && firstVisible) {
          setPageStack(prev => [...prev, firstVisible]);
        }
        
        // Convert documents to ScrapedLocation objects
        const fetchedResults = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            scrapedAt: data.scrapedAt?.toDate() || new Date()
          } as ScrapedLocation;
        });
        
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
  
  // Fetch the total number of leads from all collections
  const fetchTotalCount = async () => {
    try {
      // Use the getRecentScrapes function with a high limit to get all data for counting
      const allData = await getRecentScrapes(100000);
      
      // Apply specialty filter if needed
      let filteredData = allData;
      if (specialtyFilter !== "all") {
        filteredData = allData.filter(item => item.specialty === specialtyFilter);
      }
      
      // Count unique leads (deduplicate by name + phone)
      const uniqueLeadKeys = new Set();
      const uniqueLeads: ScrapedLocation[] = [];
      
      filteredData.forEach(item => {
        const key = `${item.name}-${item.phoneNumber}`;
        if (!uniqueLeadKeys.has(key)) {
          uniqueLeadKeys.add(key);
          uniqueLeads.push(item);
        }
      });
      
      // Update total count with actual count
      setTotalItems(uniqueLeads.length);
      
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
      (result.phoneNumber && result.phoneNumber.toLowerCase().includes(searchTerm))
    );
  };
  
  // Handle page navigation
  const goToPage = (page: number) => {
    if (page === currentPage) return;
    
    if (page > currentPage) {
      // Going forward
      fetchResultsPage('next');
    } else if (page < currentPage) {
      // Going backward
      fetchResultsPage('prev');
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

  // Export to CSV
  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Preparing export",
        description: "Getting all results for export...",
      });
      
      // For export, we need to fetch all results that match the current filters
      const baseQuery = collection(db, 'scrapedLocations');
      let constraints = [];
      
      if (specialtyFilter !== "all") {
        constraints.push(where('specialty', '==', specialtyFilter));
      }
      
      const { key, direction: sortDirection } = sortConfig;
      constraints.push(orderBy(key === 'scrapedAt' ? 'scrapedAt' : key, sortDirection === 'ascending' ? 'asc' : 'desc'));
      
      // Fetch in batches of 100 for export
      const EXPORT_BATCH_SIZE = 100;
      let lastDoc = null;
      let allResults: ScrapedLocation[] = [];
      let hasMore = true;
      
      while (hasMore) {
        let exportQuery;
        if (lastDoc) {
          exportQuery = query(
            baseQuery,
            ...constraints,
            startAfter(lastDoc),
            limit(EXPORT_BATCH_SIZE)
          );
        } else {
          exportQuery = query(
            baseQuery,
            ...constraints,
            limit(EXPORT_BATCH_SIZE)
          );
        }
        
        const snapshot = await getDocs(exportQuery);
        
        if (snapshot.empty) {
          hasMore = false;
        } else {
          lastDoc = snapshot.docs[snapshot.docs.length - 1];
          
          const batchResults = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              scrapedAt: data.scrapedAt?.toDate() || new Date()
            } as ScrapedLocation;
          });
          
          allResults = [...allResults, ...batchResults];
          
          if (snapshot.docs.length < EXPORT_BATCH_SIZE) {
            hasMore = false;
          }
        }
      }
      
      // Filter results if text filter is applied
      if (filterText) {
        const searchTerm = filterText.toLowerCase();
        allResults = allResults.filter(result => 
          result.name.toLowerCase().includes(searchTerm) ||
          result.address.toLowerCase().includes(searchTerm) ||
          result.specialty.toLowerCase().includes(searchTerm) ||
          (result.phoneNumber && result.phoneNumber.toLowerCase().includes(searchTerm))
        );
      }
      
      // Generate CSV
      const headers = ['Name', 'Specialty', 'Address', 'Phone Number', 'Scraped Date', 'Search Query'];
      const dataRows = allResults.map(location => [
        location.name,
        location.specialty,
        location.address,
        location.phoneNumber || '',
        new Date(location.scrapedAt).toLocaleString(),
        location.searchQuery
      ]);
      
      const csvContent = [
        headers.join(','),
        ...dataRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `business-leads-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: `Exported ${allResults.length} business leads to CSV`,
        className: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white",
      });
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "An error occurred while exporting data to CSV",
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
                  fetchResultsPage('first');
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
                
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" size={16} />
                    <Input
                      placeholder="Search current page..."
                      className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-white/60 max-w-xs h-9"
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
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
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 max-w-[200px]">
                      <SelectValue placeholder="Filter by specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {availableSpecialties.map(specialty => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                      fetchResultsPage('first');
                    }}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 w-28">
                      <SelectValue placeholder="Rows per page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 per page</SelectItem>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="w-full excel-style">
                  <TableHeader className="bg-gray-50 sticky top-0 border-b">
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
                      <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => requestSort('address')}>
                        <div className="flex items-center">
                          Address {getSortIcon('address')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer whitespace-nowrap">
                        <div className="flex items-center">
                          Phone Number
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => requestSort('scrapedAt')}>
                        <div className="flex items-center">
                          Date Scraped {getSortIcon('scrapedAt')}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer whitespace-nowrap">
                        <div className="flex items-center">
                          Query
                        </div>
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
                      filteredResults.map((lead, index) => (
                        <TableRow key={`${lead.id || lead.name}-${index}`} className="hover:bg-gray-50 border-b border-gray-100">
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                              {lead.specialty}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            <div className="flex items-center">
                              <MapPin className="mr-1 h-3 w-3 text-gray-400 shrink-0" />
                              <span className="text-sm">{lead.address}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center mb-1 text-sm">
                              <Phone className="mr-1 h-3 w-3 text-gray-400 shrink-0" />
                              <span>{lead.phoneNumber || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="mr-1 h-3 w-3 text-gray-400" />
                              {formatDate(lead.scrapedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">
                            {lead.searchQuery}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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
                            fetchResultsPage('first');
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
                          disabled={!lastVisible || isLoading}
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
      
      <style jsx>{`
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
      `}</style>
      
      <Footer />
    </div>
  );
} 