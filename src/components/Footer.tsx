import { Link } from "react-router-dom";
import { Map, Mail, Github, Twitter } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 w-8 h-8 rounded-lg">
                <Map className="w-8 h-8 p-1.5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
                MapHarvest
              </span>
            </Link>
            <p className="text-gray-600 mb-4 max-w-md">
              Extract valuable business data from Google Maps with our powerful scraping tool.
              Find and export locations, contact details, ratings, and more.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-teal-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-teal-500 transition-colors"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              <a 
                href="mailto:info@mapharvest.com" 
                className="text-gray-400 hover:text-teal-500 transition-colors"
                aria-label="Email"
              >
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-teal-500 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-teal-500 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-teal-500 transition-colors">
                  API
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-teal-500 transition-colors">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-teal-500 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-teal-500 transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-teal-500 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-600 hover:text-teal-500 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center text-sm text-gray-500">
          <p>© {currentYear} MapHarvest. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/" className="hover:text-teal-500 transition-colors">
              Terms of Service
            </Link>
            <Link to="/" className="hover:text-teal-500 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-teal-500 transition-colors">
              Legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
