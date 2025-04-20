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
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ScrapedLocation, getRecentScrapes } from "@/lib/scraper";

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, logout, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [stats, setStats] = useState({
    totalScrapes: 0,
    totalBusinesses: 0,
    lastActivity: ""
  });

  // Fetch user activity stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const scrapes = await getRecentScrapes(1000);
        
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
        }
        
        setStats({
          totalScrapes: uniqueQueries.size,
          totalBusinesses: uniqueBusinesses.size,
          lastActivity
        });
        
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
    };
    
    fetchStats();
  }, []);

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
      await updateUserProfile(displayName);
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
                        <AvatarImage src={currentUser?.photoURL || ""} alt={currentUser?.displayName || "User"} />
                        <AvatarFallback className="text-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                          {displayName.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <div className="bg-white p-1 rounded-full">
                          <Camera className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-center">{currentUser?.displayName || "User"}</CardTitle>
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
                          readOnly
                          disabled
                        />
                        <p className="text-xs text-gray-500">
                          Email changes require verification and password re-authentication
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={isLoading || displayName === currentUser?.displayName}
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                      >
                        Save Changes
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                      <CardDescription>
                        Add your contact details for better services
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="phone"
                            placeholder="Your phone number"
                          />
                          <Button variant="outline" size="icon">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This feature will be available in a future update.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="preferences" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Notifications</CardTitle>
                      <CardDescription>
                        Configure your email notification preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">Scrape Completion</span>
                          <span className="text-sm text-gray-500">Notify when a scrape is completed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="scrape-email" className="rounded text-teal-500 focus:ring-teal-500" />
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">Weekly Digest</span>
                          <span className="text-sm text-gray-500">Weekly summary of your activity</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="weekly-email" className="rounded text-teal-500 focus:ring-teal-500" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Notification features will be available in a future update.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Display Settings</CardTitle>
                      <CardDescription>
                        Customize your application experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">Dark Mode</span>
                          <span className="text-sm text-gray-500">Switch between light and dark themes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="dark-mode" className="rounded text-teal-500 focus:ring-teal-500" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Theme settings will be available in a future update.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="security" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to maintain account security
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input 
                          id="current-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Password changing functionality will be available in a future update.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        disabled={true} 
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Update Password
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication</CardTitle>
                      <CardDescription>
                        Add an extra layer of security to your account
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col">
                          <span className="font-medium">Enable 2FA</span>
                          <span className="text-sm text-gray-500">Protect your account with two-factor authentication</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="enable-2fa" className="rounded text-teal-500 focus:ring-teal-500" disabled />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Two-factor authentication will be available in a future update.
                      </p>
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