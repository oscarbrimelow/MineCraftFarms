import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Menu, X, Upload, User, LogOut, LogIn, Shield } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface NavbarProps {
  user: SupabaseUser | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setUserRole(data.role);
        });
    } else {
      setUserRole(null);
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/farms?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-minecraft-sm sticky top-0 z-50 border-b-4 border-minecraft-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-2xl font-display text-minecraft-green"
            >
              🧱
            </motion.div>
            <span className="text-xl font-display text-minecraft-green text-shadow hidden sm:block">
              Minecraft Farms
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farms, materials, tags..."
                className="w-full px-4 py-2 pl-10 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green focus:ring-offset-2"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-minecraft-green" size={18} />
            </div>
          </form>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/farms"
              className="px-4 py-2 text-gray-700 hover:text-minecraft-green font-medium transition-colors"
            >
              Browse
            </Link>
            <Link
              to="/upload"
              className="flex items-center space-x-2 px-4 py-2 bg-minecraft-green text-white rounded-lg hover:bg-minecraft-green-dark transition-colors shadow-minecraft-sm"
            >
              <Upload size={18} />
              <span>Upload</span>
            </Link>
            {user ? (
              <>
                {userRole === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-minecraft-sm"
                  >
                    <Shield size={18} />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/account"
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-minecraft-green transition-colors"
                >
                  <User size={18} />
                  <span>Account</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/account"
                className="flex items-center space-x-2 px-4 py-2 bg-minecraft-indigo text-white rounded-lg hover:bg-minecraft-indigo-dark transition-colors shadow-minecraft-sm"
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-minecraft-green"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 space-y-2"
          >
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search farms..."
                  className="w-full px-4 py-2 pl-10 rounded-lg border-2 border-minecraft-green focus:outline-none focus:ring-2 focus:ring-minecraft-green"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-minecraft-green" size={18} />
              </div>
            </form>
            <Link
              to="/farms"
              className="block px-4 py-2 text-gray-700 hover:bg-minecraft-green/10 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Browse
            </Link>
            <Link
              to="/upload"
              className="flex items-center space-x-2 px-4 py-2 bg-minecraft-green text-white rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Upload size={18} />
              <span>Upload</span>
            </Link>
            {user ? (
              <>
                {userRole === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Shield size={18} />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  to="/account"
                  className="block px-4 py-2 text-gray-700 hover:bg-minecraft-green/10 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Account
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/account"
                className="flex items-center space-x-2 px-4 py-2 bg-minecraft-indigo text-white rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
}

