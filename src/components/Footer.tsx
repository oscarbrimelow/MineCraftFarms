import { Link } from 'react-router-dom';
import { Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-minecraft-indigo-dark to-minecraft-green-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-display mb-4 text-shadow">Minecraft Farms</h3>
            <p className="text-gray-300 mb-4">
              The best place to discover, share, and build amazing Minecraft farms for every version and platform.
            </p>
            <p className="text-sm text-gray-400">
              Built with <Heart className="inline-block text-red-500" size={14} /> by the community
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/farms" className="text-gray-300 hover:text-white transition-colors">
                  Browse Farms
                </Link>
              </li>
              <li>
                <Link to="/upload" className="text-gray-300 hover:text-white transition-colors">
                  Upload Farm
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-gray-300 hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/yourusername/minecraft-farms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                >
                  <Github size={16} />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  API
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()} Minecraft Farms. Open source under MIT License.
          </p>
          <p className="mt-2">
            Icons from <a href="https://lucide.dev" className="underline">Lucide</a>. Images from{' '}
            <a href="https://unsplash.com" className="underline">Unsplash</a> and{' '}
            <a href="https://pexels.com" className="underline">Pexels</a>.
          </p>
        </div>
      </div>
    </footer>
  );
}

