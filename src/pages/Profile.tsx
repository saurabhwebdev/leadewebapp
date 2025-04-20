import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Settings, 
  Bell, 
  Lock, 
  Shield, 
  LogOut, 
  Camera, 
  Mail, 
  Phone, 
  Calendar,
  Map as MapIcon,
  Database,
  Store
} from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { ScrapedLocation, getRecentScrapes } from "@/lib/supabaseDb";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, logout, updateUserProfile } = useSupabaseAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get name from user metadata or email
  const userFullName = currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || "User";
  const [displayName, setDisplayName] = useState(userFullName);
  
  const [stats, setStats] = useState({
    totalScrapes: 0,
    totalBusinesses: 0,
    lastActivity: ""
  });

  // Fetch user activity stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching user data for profile:', currentUser?.id);
        const response = await getRecentScrapes(1000);
        const scrapes = response.data || [];
        
        console.log(`Profile received ${scrapes.length} scrapes from Supabase`);
        
        // Count unique businesses and queries
        const uniqueBusinesses = new Set();
        const uniqueQueries = new Set();
        
        scrapes.forEach(scrape => {
          uniqueBusinesses.add(`${scrape.name}-${scrape.phoneNumber}`);
          uniqueQueries.add(scrape.searchQuery);
        });
        
        // Get last activity date
        let lastActivity = "No activity yet";
        if (scrapes.length > 0) {
          const mostRecent = new Date(scrapes[0].scrapedAt);
          lastActivity = mostRecent.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          console.log('Most recent activity:', lastActivity);
        }
        
        setStats({
          totalScrapes: uniqueQueries.size,
          totalBusinesses: uniqueBusinesses.size,
          lastActivity
        });
        
        console.log('Profile stats updated:', uniqueQueries.size, uniqueBusinesses.size);
        
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };
    
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      console.error("Failed to log out", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "There was a problem logging you out",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid name",
        description: "Please enter a valid display name",
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile({ full_name: displayName });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was a problem updating your profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set document title
  document.title = "Your Profile - MapHarvest";

  // Get initials for avatar
  const getInitials = () => {
    if (!displayName) return "U";
    return displayName.substring(0, 2).toUpperCase();
  };

  // Get avatar URL from Supabase user
  const avatarUrl = currentUser?.user_metadata?.avatar_url || null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column - Profile overview */}
            <div className="md:w-1/3">
              <Card className="shadow-md border-gray-100">
                <CardHeader className="pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarUrl || ""} alt={displayName} />
                        <AvatarFallback className="text-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <div className="bg-white p-1 rounded-full">
                          <Camera className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-center">{displayName}</CardTitle>
                  <CardDescription className="text-center">
                    {currentUser?.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500">Activity Summary</h3>
                    <Separator />
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                        <MapIcon className="h-5 w-5 text-teal-500 mb-1" />
                        <span className="text-lg font-bold">{stats.totalScrapes}</span>
                        <span className="text-xs text-gray-500">Scrapes</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                        <Store className="h-5 w-5 text-teal-500 mb-1" />
                        <span className="text-lg font-bold">{stats.totalBusinesses}</span>
                        <span className="text-xs text-gray-500">Business Leads</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500">Last Activity</h3>
                    <Separator />
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{stats.lastActivity}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    className="w-full mt-6" 
                    onClick={handleLogout}
                    disabled={isLoading}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Right column - Profile tabs */}
            <div className="md:w-2/3">
              <Tabs defaultValue="account" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="account">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </TabsTrigger>
                  <TabsTrigger value="preferences">
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Shield className="mr-2 h-4 w-4" />
                    Security
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="account" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your account information here
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input 
                          id="name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Your name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email"
                          value={currentUser?.email || ""}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">
                          Email cannot be changed
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isLoading}
                        className="ml-auto bg-teal-500 hover:bg-teal-600"
                      >
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preferences" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Preferences</CardTitle>
                      <CardDescription>
                        Manage your application preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Notification Settings</h3>
                        <Separator />
                        <p className="text-sm text-gray-500">
                          Notification preferences will be added in a future update.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security</CardTitle>
                      <CardDescription>
                        Manage your security settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Password</h3>
                        <Separator />
                        <p className="text-sm text-gray-500">
                          Password management will be added in a future update.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 