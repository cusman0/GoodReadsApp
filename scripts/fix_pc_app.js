const fs = require('fs');
let code = fs.readFileSync('pc-web/src/App.tsx', 'utf8').replace(/\r\n/g, '\n');

// Replace the start of the ternary cleanly
code = code.replace(
  `      {/* Admin Portal Mode (Checklist Items 15-18) */}
      {viewMode === 'admin' ? (
        <AdminPortal onBackToApp={() => setViewMode('desktop')} />
      ) : (
      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">`,
  `      {/* Admin Portal Mode (Checklist Items 15-18) */}
      {viewMode === 'admin' ? (
        <AdminPortal onBackToApp={() => setViewMode('desktop')} />
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">`
);

// Replace the end of main to close the ternary
code = code.replace(
  `            <aside className="lg:col-span-3">
              <NewsSidebar />
            </aside>
          </div>
        )}
      </main>`,
  `            <aside className="lg:col-span-3">
              <NewsSidebar />
            </aside>
          </div>
        )}
      </main>
      )}`
);

fs.writeFileSync('pc-web/src/App.tsx', code.replace(/\n/g, '\r\n'), 'utf8');
console.log('pc-web/src/App.tsx syntax fixed');

