import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, RefreshCw, MessageSquare, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-20 border-t border-slate-800">
      {/* Value props strip */}
      <div className="border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Verified Students</p>
              <p className="text-[11px] text-slate-400">Trusted peer-to-peer campus trades</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Item Exchange</p>
              <p className="text-[11px] text-slate-400">Trade books & electronics directly</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Price Negotiation</p>
              <p className="text-[11px] text-slate-400">Real-time fair counter-offers</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Zero Shipping Cost</p>
              <p className="text-[11px] text-slate-400">Hand-to-hand campus meetup points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                Campus<span className="text-teal-400">Cart</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The dedicated student-first marketplace for universities and colleges. Buy, sell, exchange and negotiate essentials with zero fees.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/" className="hover:text-white transition-colors">Marketplace Home</Link></li>
              <li><Link to="/browse" className="hover:text-white transition-colors">Browse Products</Link></li>
              <li><Link to="/exchange" className="hover:text-white transition-colors">Exchange Hub</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Categories</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/browse?category=books" className="hover:text-white transition-colors">Textbooks & Notes</Link></li>
              <li><Link to="/browse?category=calculators" className="hover:text-white transition-colors">Scientific Calculators</Link></li>
              <li><Link to="/browse?category=lab-equipment" className="hover:text-white transition-colors">Lab Equipment & Coats</Link></li>
              <li><Link to="/browse?category=electronics" className="hover:text-white transition-colors">Electronics & Hardware</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Student Account</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/my-listings" className="hover:text-white transition-colors">List an Item for Sale</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
              <li><Link to="/negotiations" className="hover:text-white transition-colors">Active Offers</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition-colors">Saved Wishlist</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} CampusCart &bull; Smart Campus Marketplace. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-slate-500">
            <span>Direct Campus Pickup</span>
            <span>&bull;</span>
            <span>Zero Brokerage</span>
            <span>&bull;</span>
            <span>Student Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
