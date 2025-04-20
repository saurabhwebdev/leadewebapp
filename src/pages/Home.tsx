import { Link } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, Search, Database, Globe } from "lucide-react";

export default function Home() {
  const { currentUser } = useSupabaseAuth();

  // Set document title
  document.title = "MapHarvest - Business Lead Generation Tool";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-6 pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
              Extract <span className="text-teal-500">Business Leads</span><br />from Google Maps
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              A powerful tool to find and collect business contact information for your sales outreach campaigns.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {currentUser ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white px-8">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white px-8">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Visual Preview */}
          <div className="w-full max-w-5xl mt-16 relative">
            <div className="aspect-[16/9] bg-gray-100 rounded-lg shadow-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1674589977868-d7e801c48878?auto=format&fit=crop&q=80" 
                alt="Analytics dashboard" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/1200x675/f3f4f6/94a3b8?text=MapHarvest+Dashboard";
                }}
              />
            </div>
            
            {/* Colored accent elements */}
            <div className="absolute -z-10 -top-6 -left-6 w-24 h-24 bg-teal-100 rounded-full blur-xl opacity-70"></div>
            <div className="absolute -z-10 -bottom-8 -right-8 w-32 h-32 bg-teal-100 rounded-full blur-xl opacity-70"></div>
          </div>
        </section>
        
        {/* Features Section (Minimal) */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Search</h3>
                <p className="text-gray-600">
                  Find businesses by industry and location with powerful search capabilities.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                  <Building className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Extract</h3>
                <p className="text-gray-600">
                  Get business details including name, phone, address, and website automatically.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-6">
                  <Database className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Export</h3>
                <p className="text-gray-600">
                  Download your leads as CSV or use our integration options for your CRM.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-teal-500 mb-1">10+</p>
                <p className="text-gray-600">Business Categories</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-teal-500 mb-1">100+</p>
                <p className="text-gray-600">Cities Covered</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-teal-500 mb-1">1000s</p>
                <p className="text-gray-600">Leads Generated</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-teal-500 mb-1">24/7</p>
                <p className="text-gray-600">Availability</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-teal-500 text-white">
          <div className="max-w-3xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold mb-6">Ready to start collecting leads?</h2>
            <p className="text-xl mb-8 opacity-90">
              Sign in now to start using our powerful lead generation tools.
            </p>
            <Link to={currentUser ? "/dashboard" : "/login"}>
              <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100 px-8">
                {currentUser ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
