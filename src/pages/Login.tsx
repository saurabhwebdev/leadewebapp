import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Map } from "lucide-react";

export default function Login() {
  const { loginWithGoogle } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  // Set document title
  document.title = "Login - MapHarvest";

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Note: With Supabase OAuth, the navigation will happen after redirect back
      // via the auth callback page
    } catch (err) {
      console.error("Failed to sign in with Google", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
            <div className="text-center mb-8 space-y-3">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center transform hover:rotate-6 transition-transform duration-300">
                <Map className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Welcome to MapHarvest
              </h1>
              <p className="text-gray-600">
                Sign in to access powerful maps data extraction
              </p>
            </div>
            
            <Button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 shadow-sm transition-all duration-300 py-6 group"
            >
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fillOpacity=".4"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fillOpacity=".6"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fillOpacity=".8"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fillOpacity="1"
                  />
                </svg>
                <span className="text-sm font-medium">Continue with Google</span>
              </div>
            </Button>
            
            <p className="mt-8 text-center text-sm text-gray-600">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
