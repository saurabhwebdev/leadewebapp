import { useEffect, useState } from "react";
import { ScrapedLocation } from "@/lib/scraper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Download, Filter, MapPin, Phone, Mail, Globe, Calendar, Search, ChevronDown, ChevronUp, Copy, ClipboardCheck, ExternalLink, FileSpreadsheet, Printer, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { motion } from "framer-motion";

interface ScraperResultsProps {
  results: ScrapedLocation[];
  searchQuery?: string;
}

export default function ScraperResults({ results, searchQuery }: ScraperResultsProps) {
  const { toast } = useToast();
  const [filteredResults, setFilteredResults] = useState<ScrapedLocation[]>([]);
  const [filterText, setFilterText] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof ScrapedLocation;
    direction: 'ascending' | 'descending';
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Update filtered results when results change
  useEffect(() => {
    setFilteredResults(results);
    setFilterText("");
    setSortConfig(null);
    setCurrentPage(1);
  }, [results]);

  // Handle filtering
  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setFilterText(value);
    setCurrentPage(1);
    
    if (!value) {
      setFilteredResults(results);
      return;
    }
    
    const filtered = results.filter(
      location => 
        location.name.toLowerCase().includes(value) ||
        location.address.toLowerCase().includes(value) ||
        location.specialty.toLowerCase().includes(value) ||
        (location.phoneNumber && location.phoneNumber.toLowerCase().includes(value))
    );
    
    setFilteredResults(filtered);
  };

  // Handle sorting
  const requestSort = (key: keyof ScrapedLocation) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    
    const sortedData = [...filteredResults].sort((a, b) => {
      // Special handling for different data types
      if (key === 'scrapedAt') {
        const dateA = a[key] instanceof Date ? a[key] as Date : new Date(a[key] as any);
        const dateB = b[key] instanceof Date ? b[key] as Date : new Date(b[key] as any);
        return direction === 'ascending' 
          ? dateA.getTime() - dateB.getTime() 
          : dateB.getTime() - dateA.getTime();
      }
      
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredResults(sortedData);
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

  // CSV Export
  const exportToCSV = () => {
    try {
      const headers = ['Name', 'Specialty', 'Address', 'Phone Number', 'Scraped Date'];
      const dataRows = filteredResults.map(location => [
        location.name,
        location.specialty,
        location.address,
        location.phoneNumber || '',
        new Date(location.scrapedAt).toLocaleString()
      ]);
      
      const csvContent = [
        headers.join(','),
        ...dataRows.map(row => row.map(cell => `"${cell}"`).join(','))
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
        title: "Export Successful",
        description: `${filteredResults.length} business leads exported to CSV`,
        className: "bg-teal-500 text-white",
      });
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "An error occurred while exporting data to CSV.",
      });
    }
  };

  const getSortIcon = (key: keyof ScrapedLocation) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />;
  };
  
  // Pagination logic
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResults.slice(startIndex, endIndex);
  };
  
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    setExpandedRow(null); // Close any expanded rows when changing pages
  };
  
  // Toggle expanded row
  const toggleExpandRow = (id: string) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  // Print current results
  const handlePrint = () => {
    try {
      // Create a printable version
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window');
      }
      
      const tableStyle = `
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .header { margin-bottom: 20px; }
        @media print {
          body { font-size: 12px; }
          h1 { font-size: 18px; }
          .no-print { display: none; }
        }
      `;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Business Leads - ${new Date().toLocaleDateString()}</title>
          <style>${tableStyle}</style>
        </head>
        <body>
          <div class="header">
            <h1>Business Leads</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            ${searchQuery ? `<p>Search query: ${searchQuery}</p>` : ''}
            <p>Total results: ${filteredResults.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Type</th>
                <th>Address</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${filteredResults.map(result => `
                <tr>
                  <td>${result.name}</td>
                  <td>${result.specialty}</td>
                  <td>${result.address}</td>
                  <td>${result.phoneNumber || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="no-print">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      toast({
        title: "Print Ready",
        description: "Print dialog opened in a new window",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        variant: "destructive",
        title: "Print Failed",
        description: "There was an error preparing the print view",
      });
    }
  };

  if (!results.length) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500">
        <Store className="h-8 w-8 mb-2 text-gray-300" />
        <p>No business leads to display</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-5 w-5 text-teal-500" />
                Business Leads
              </CardTitle>
              <CardDescription className="text-base">
                Found {filteredResults.length} {filteredResults.length === 1 ? 'business' : 'businesses'} 
                {searchQuery ? ` for "${searchQuery}"` : ''}
              </CardDescription>
            </div>
            
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white h-9 px-3 sm:w-auto w-full">
                    {itemsPerPage} per page <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[5, 10, 20, 50].map(value => (
                    <DropdownMenuItem 
                      key={value} 
                      onClick={() => {
                        setItemsPerPage(value);
                        setCurrentPage(1);
                      }}
                      className={itemsPerPage === value ? "bg-teal-50 text-teal-700" : ""}
                    >
                      {value} results
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                onClick={exportToCSV}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white h-9 sm:w-auto w-full"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              
              <Button
                onClick={handlePrint}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white h-9 sm:w-auto w-full"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name, specialty, address or phone..."
              className="pl-10 bg-white border-gray-200 focus-visible:ring-teal-500"
              value={filterText}
              onChange={handleFilter}
            />
          </div>
        </CardHeader>
        
        <div className="px-1 sm:px-4">
          <ScrollArea className="h-[400px] sm:h-[500px] rounded-md border-t border-b">
            <Table>
              <TableHeader className="sticky top-0 bg-slate-50 z-10">
                <TableRow className="hover:bg-slate-50">
                  <TableHead className="cursor-pointer font-medium" onClick={() => requestSort('name')}>
                    <div className="flex items-center">
                      Name {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer font-medium" onClick={() => requestSort('specialty')}>
                    <div className="flex items-center">
                      Specialty {getSortIcon('specialty')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer font-medium hidden lg:table-cell" onClick={() => requestSort('address')}>
                    <div className="flex items-center">
                      Location {getSortIcon('address')}
                    </div>
                  </TableHead>
                  <TableHead className="font-medium hidden md:table-cell">Contact</TableHead>
                  <TableHead className="text-right w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="h-8 w-8 text-gray-300" />
                        <p className="text-base font-medium">No results found</p>
                        <p className="text-sm">Try adjusting your search filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  getCurrentPageData().map((location, index) => {
                    const uniqueRowId = `${location.name}-${index}`;
                    const isExpanded = expandedRow === uniqueRowId;
                    
                    return (
                      <>
                        <TableRow key={uniqueRowId} className="hover:bg-teal-50/30">
                          <TableCell>
                            <div className="font-medium text-teal-800">{location.name}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                              {location.specialty}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center max-w-[200px] truncate">
                              <MapPin className="mr-1 h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="text-sm truncate">{location.address}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {location.phoneNumber ? (
                              <div className="flex items-center text-sm group">
                                <Phone className="mr-1 h-3 w-3 text-gray-400" />
                                <span className="mr-1">{location.phoneNumber}</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => copyToClipboard(location.phoneNumber || '', uniqueRowId)}
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
                            <TableCell colSpan={5} className="p-0">
                              <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-700 mb-2">Details</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-teal-500 mt-0.5" />
                                        <div>
                                          <p className="text-sm font-medium">Address</p>
                                          <p className="text-sm text-gray-600">{location.address}</p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-start gap-2">
                                        <Calendar className="h-4 w-4 text-teal-500 mt-0.5" />
                                        <div>
                                          <p className="text-sm font-medium">Scraped Date</p>
                                          <p className="text-sm text-gray-600">
                                            {new Date(location.scrapedAt).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium text-sm text-gray-700 mb-2">Contact Options</h4>
                                    <div className="space-y-2">
                                      {location.phoneNumber && (
                                        <div className="flex items-start gap-2">
                                          <Phone className="h-4 w-4 text-teal-500 mt-0.5" />
                                          <div className="flex-grow">
                                            <p className="text-sm font-medium">Phone</p>
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                              <p className="text-sm text-gray-600">{location.phoneNumber}</p>
                                              <div className="flex gap-1">
                                                <Button 
                                                  variant="outline" 
                                                  size="sm" 
                                                  className="h-7 px-2 text-xs"
                                                  onClick={() => copyToClipboard(location.phoneNumber || '', `${uniqueRowId}-phone`)}
                                                >
                                                  {copiedId === `${uniqueRowId}-phone` ? (
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
                                                  onClick={() => window.open(`tel:${location.phoneNumber}`, '_blank')}
                                                >
                                                  <Phone className="mr-1 h-3 w-3" />
                                                  Call
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
                                            <p className="text-sm text-gray-600 truncate max-w-[200px]">{location.name}</p>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="h-7 px-2 text-xs"
                                              onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(location.name + ' ' + location.address)}`, '_blank')}
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
        
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 pb-6">
          <div className="text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
            Showing {Math.min(filteredResults.length, (currentPage - 1) * itemsPerPage + 1)}-
            {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} results
          </div>
          
          {totalPages > 1 && (
            <Pagination className="order-1 sm:order-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {pageNumbers.map(number => {
                  // For mobile, only show a subset of page numbers
                  if (typeof window !== 'undefined' && window.innerWidth < 640) {
                    if (
                      number === 1 ||
                      number === totalPages ||
                      number === currentPage
                    ) {
                      return (
                        <PaginationItem key={number}>
                          <PaginationLink
                            isActive={currentPage === number}
                            onClick={() => handlePageChange(number)}
                          >
                            {number}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    if (
                      (number === currentPage - 1 && number > 1) ||
                      (number === currentPage + 1 && number < totalPages)
                    ) {
                      return (
                        <PaginationItem key={number}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  }
                  
                  // For desktop, show a more comprehensive set
                  if (
                    number <= 2 ||
                    number > totalPages - 2 ||
                    number === currentPage ||
                    number === currentPage - 1 ||
                    number === currentPage + 1
                  ) {
                    return (
                      <PaginationItem key={number}>
                        <PaginationLink
                          isActive={currentPage === number}
                          onClick={() => handlePageChange(number)}
                        >
                          {number}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Show ellipsis instead of consecutive page numbers
                  if (
                    number === 3 && currentPage > 4 ||
                    number === totalPages - 2 && currentPage < totalPages - 3
                  ) {
                    return (
                      <PaginationItem key={number}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
} 