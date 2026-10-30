const fs = require('fs');

// 1. Update Navbar.tsx
let navCode = fs.readFileSync('pc-web/src/components/Navbar.tsx', 'utf8').replace(/\r\n/g, '\n');

navCode = navCode.replace(
  '  Smartphone,\n  Monitor,\n} from \'lucide-react\';',
  '  Smartphone,\n  Monitor,\n  ShieldCheck,\n} from \'lucide-react\';'
);

navCode = navCode.replace(
  '  viewMode: \'desktop\' | \'mobile\';\n  onToggleViewMode: (mode: \'desktop\' | \'mobile\') => void;',
  '  viewMode: \'desktop\' | \'mobile\' | \'admin\';\n  onToggleViewMode: (mode: \'desktop\' | \'mobile\' | \'admin\') => void;'
);

const adminButton = `          <button
            onClick={() => onToggleViewMode('admin')}
            className={\`flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium transition-colors \${
              viewMode === 'admin'
                ? 'bg-[#00635D] text-white shadow-xs'
                : 'text-gray-300 hover:text-white'
            }\`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>`;

navCode = navCode.replace(
  '          </button>\n        </div>\n      </div>',
  '          </button>\n' + adminButton + '\n        </div>\n      </div>'
);

fs.writeFileSync('pc-web/src/components/Navbar.tsx', navCode.replace(/\n/g, '\r\n'), 'utf8');
console.log('Navbar.tsx updated');

// 2. Update App.tsx in pc-web
let appCode = fs.readFileSync('pc-web/src/App.tsx', 'utf8').replace(/\r\n/g, '\n');

if (!appCode.includes('AdminPortal')) {
  appCode = appCode.replace(
    "import { MobileViewSimulator } from './components/MobileViewSimulator';",
    "import { MobileViewSimulator } from './components/MobileViewSimulator';\nimport { AdminPortal } from './components/AdminPortal';"
  );

  appCode = appCode.replace(
    "  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');",
    "  const [viewMode, setViewMode] = useState<'desktop' | 'mobile' | 'admin'>('desktop');"
  );

  // When viewMode === 'admin', render AdminPortal
  appCode = appCode.replace(
    "      {/* Main Container */}\n      <main className=\"flex-1 max-w-6xl w-full mx-auto px-4 py-6\">",
    `      {/* Admin Portal Mode (Checklist Items 15-18) */}
      {viewMode === 'admin' ? (
        <AdminPortal onBackToApp={() => setViewMode('desktop')} />
      ) : (
      /* Main Container */
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">`
  );

  // Close the conditional rendering before </div>
  appCode = appCode.replace(
    "      </main>\n    </div>",
    "      </main>\n      )} \n    </div>"
  );

  fs.writeFileSync('pc-web/src/App.tsx', appCode.replace(/\n/g, '\r\n'), 'utf8');
  console.log('pc-web/App.tsx updated');
}

