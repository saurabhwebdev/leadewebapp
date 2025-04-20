import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useState } from "react";
import { Menu, X, Map, Database, User, Settings, LogOut, Store, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const { currentUser, logout, loginWithGoogle } = useSupabaseAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // With Supabase OAuth, navigation happens after redirect
    } catch (error) {
      console.error("Failed to log in", error);
    }
  };

  // Get user avatar and name from Supabase user
  const getUserAvatar = () => {
    if (!currentUser) return "";
    
    // Try to get avatar from user metadata first
    if (currentUser.user_metadata?.avatar_url) {
      return currentUser.user_metadata.avatar_url;
    }
    
    // Fallback to identicon or empty string
    return "";
  };
  
  const getUserDisplayName = () => {
    if (!currentUser) return "User";
    
    // Try to get name from user metadata
    if (currentUser.user_metadata?.full_name) {
      return currentUser.user_metadata.full_name;
    }
    
    // Fallback to email
    return currentUser.email?.split('@')[0] || "User";
  };
  
  const userInitials = getUserDisplayName().substring(0, 2).toUpperCase();
  const userEmail = currentUser?.email || "";

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-6 sticky top-0 z-50 animate-fade-in">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 w-8 h-8 rounded-lg transform group-hover:rotate-6 transition-transform duration-300">
            <Map className="w-8 h-8 p-1.5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
            MapHarvest
          </span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-700 hover:text-teal-500 transition-colors">
            Home
          </Link>
          
          {currentUser ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-teal-500 transition-colors">
                Dashboard
              </Link>
              <Link to="/lead-scraper" className="text-gray-700 hover:text-teal-500 transition-colors flex items-center gap-1.5">
                <Store className="h-4 w-4" />
                Business Leads
              </Link>
              <Link to="/all-results" className="text-gray-700 hover:text-teal-500 transition-colors flex items-center gap-1.5">
                <Database className="h-4 w-4" />
                All Results
              </Link>
              
              {/* User avatar with dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 ml-4 outline-none">
                    <Avatar className="h-8 w-8 ring-2 ring-teal-500/20 cursor-pointer hover:ring-teal-500/40 transition-all">
                      <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{getUserDisplayName()}</span>
                      <span className="text-xs text-gray-500 truncate">{userEmail}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/profile">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/all-results">
                    <DropdownMenuItem className="cursor-pointer">
                      <Database className="mr-2 h-4 w-4" />
                      <span>My Leads</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/lead-scraper">
                    <DropdownMenuItem className="cursor-pointer">
                      <Store className="mr-2 h-4 w-4" />
                      <span>Business Lead Generator</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={handleLogin}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 animate-fade-in"
            >
              Sign in with Google
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden text-gray-700" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden pt-4 pb-4 px-6 space-y-3 border-t mt-4 animate-slide-down">
          <Link to="/" className="block py-2 text-gray-700 hover:text-teal-500">
            Home
          </Link>
          
          {currentUser ? (
            <>
              <Link to="/dashboard" className="block py-2 text-gray-700 hover:text-teal-500">
                Dashboard
              </Link>
              <Link to="/lead-scraper" className="flex items-center gap-1.5 py-2 text-gray-700 hover:text-teal-500">
                <Store className="h-4 w-4" />
                Business Leads
              </Link>
              <Link to="/all-results" className="flex items-center gap-1.5 py-2 text-gray-700 hover:text-teal-500">
                <Database className="h-4 w-4" />
                All Results
              </Link>
              <Link to="/profile" className="flex items-center gap-1.5 py-2 text-gray-700 hover:text-teal-500">
                <User className="h-4 w-4" />
                My Profile
              </Link>
              <Button 
                variant="ghost" 
                className="w-full text-left justify-start pl-0 text-gray-700 hover:text-red-500 hover:bg-transparent" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Logout
              </Button>
              <div className="flex items-center gap-2 py-2">
                <Avatar className="h-8 w-8 ring-2 ring-teal-500/20">
                  <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
                  <AvatarFallback className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700">{getUserDisplayName()}</span>
              </div>
            </>
          ) : (
            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600"
            >
              Sign in with Google
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
