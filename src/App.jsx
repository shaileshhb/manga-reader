import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';

// Utility functions for storage
const storage = {
  saveProgress: (mangaId, page) => {
    const progress = JSON.parse(localStorage.getItem('mangaProgress') || '{}');
    progress[mangaId] = { currentPage: page, lastRead: Date.now() };
    localStorage.setItem('mangaProgress', JSON.stringify(progress));
  },
  
  getProgress: (mangaId) => {
    const progress = JSON.parse(localStorage.getItem('mangaProgress') || '{}');
    return progress[mangaId] || { currentPage: 0, lastRead: 0 };
  },
  
  saveMangaList: (mangaList) => {
    localStorage.setItem('mangaList', JSON.stringify(mangaList));
  },
  
  getMangaList: () => {
    return JSON.parse(localStorage.getItem('mangaList') || '[]');
  },
  
  saveTheme: (theme) => {
    localStorage.setItem('theme', theme);
  },
  
  getTheme: () => {
    return localStorage.getItem('theme') || 'dark';
  }
};

export default function App() {
  const [darkMode, setDarkMode] = useState(storage.getTheme() === 'dark');
  const [currentManga, setCurrentManga] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [mangaList, setMangaList] = useState(storage.getMangaList());
  const [showLibrary, setShowLibrary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'double'
  
  const imageRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Apply theme
  useEffect(() => {
    storage.saveTheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Auto-hide controls
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    if (!showLibrary) {
      resetControlsTimeout();
      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, [showLibrary, currentPage]);

  // Load manga from CBZ file
  const loadManga = async (file) => {
    setLoading(true);
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      const imageFiles = [];
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      
      for (const filename of Object.keys(contents.files)) {
        const zipFile = contents.files[filename];
        if (!zipFile.dir && imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
          const blob = await zipFile.async('blob');
          const url = URL.createObjectURL(blob);
          imageFiles.push({ name: filename, url });
        }
      }
      
      // Sort pages naturally
      imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      
      const manga = {
        id: Date.now().toString(),
        name: file.name.replace('.cbz', ''),
        pages: imageFiles.length,
        addedDate: Date.now()
      };
      
      const updatedList = [...mangaList, manga];
      setMangaList(updatedList);
      storage.saveMangaList(updatedList);
      
      setCurrentManga(manga);
      setPages(imageFiles);
      
      // Load saved progress
      const progress = storage.getProgress(manga.id);
      setCurrentPage(progress.currentPage);
      
      setShowLibrary(false);
    } catch (error) {
      alert('Error loading manga: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const cbzFile = files.find(file => file.name.toLowerCase().endsWith('.cbz'));
    if (cbzFile) {
      loadManga(cbzFile);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // Navigation
  const nextPage = () => {
    const increment = viewMode === 'double' ? 2 : 1;
    if (currentPage < pages.length - increment) {
      const newPage = currentPage + increment;
      setCurrentPage(newPage);
      storage.saveProgress(currentManga.id, newPage);
      resetControlsTimeout();
    }
  };

  const prevPage = () => {
    const decrement = viewMode === 'double' ? 2 : 1;
    if (currentPage > 0) {
      const newPage = Math.max(0, currentPage - decrement);
      setCurrentPage(newPage);
      storage.saveProgress(currentManga.id, newPage);
      resetControlsTimeout();
    }
  };

  // Click to navigate
  const handlePageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPos = clickX / rect.width;
    
    if (clickPos > 0.66) {
      nextPage();
    } else if (clickPos < 0.33) {
      prevPage();
    } else {
      setShowControls(!showControls);
      resetControlsTimeout();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showLibrary && pages.length > 0) {
        switch (e.key) {
          case 'ArrowLeft':
            prevPage();
            break;
          case 'ArrowRight':
            nextPage();
            break;
          case 'f':
            document.documentElement.requestFullscreen?.();
            break;
          case 'Escape':
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              setShowLibrary(true);
            }
            break;
          case ' ':
            e.preventDefault();
            nextPage();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLibrary, currentPage, pages.length, viewMode]);

  // Remove manga from library
  const removeManga = (mangaId, e) => {
    e.stopPropagation();
    const updatedList = mangaList.filter(m => m.id !== mangaId);
    setMangaList(updatedList);
    storage.saveMangaList(updatedList);
    
    const progress = JSON.parse(localStorage.getItem('mangaProgress') || '{}');
    delete progress[mangaId];
    localStorage.setItem('mangaProgress', JSON.stringify(progress));
  };

  if (showLibrary) {
    return (
      <div className={`min-h-screen transition-colors ${darkMode ? 'bg-gray-950' : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Manga Reader
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your personal manga library
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-3 rounded-xl transition-all shadow-lg ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                  : 'bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>

          {/* Upload Zone */}
          <div
            className={`relative rounded-2xl p-12 mb-12 text-center transition-all border-2 ${
              dragOver
                ? darkMode
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-blue-400 bg-blue-50'
                : darkMode
                ? 'border-gray-700 bg-gray-900/50'
                : 'border-gray-200 bg-white shadow-xl'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mb-6">
              <div className="text-6xl mb-4">📚</div>
              <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Upload Your Manga
              </h2>
              <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Drag and drop your .cbz file here, or click to browse
              </p>
              <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                ⚠️ Note: Files are not permanently stored. You'll need to re-upload after closing the browser.
              </p>
            </div>
            <input
              type="file"
              accept=".cbz"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) loadManga(file);
              }}
              className="hidden"
              id="fileInput"
            />
            <label
              htmlFor="fileInput"
              className={`inline-block px-8 py-4 rounded-xl cursor-pointer transition-all transform hover:scale-105 shadow-lg ${
                darkMode
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
              }`}
            >
              Choose File
            </label>
          </div>

          {/* Library */}
          {mangaList.length > 0 && (
            <div>
              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Reads ({mangaList.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mangaList.slice().reverse().map((manga) => {
                  const progress = storage.getProgress(manga.id);
                  const progressPercent = ((progress.currentPage + 1) / manga.pages) * 100;
                  
                  return (
                    <div
                      key={manga.id}
                      className={`group relative rounded-xl p-5 transition-all transform hover:scale-105 hover:shadow-2xl cursor-pointer ${
                        darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:shadow-xl'
                      }`}
                    >
                      <button
                        onClick={(e) => removeManga(manga.id, e)}
                        className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                        title="Remove"
                      >
                        ×
                      </button>
                      
                      <div className="mb-4">
                        <div className={`w-full h-56 rounded-lg flex items-center justify-center text-5xl ${
                          darkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                        }`}>
                          📖
                        </div>
                      </div>
                      
                      <h3 className={`font-bold text-lg mb-2 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`} title={manga.name}>
                        {manga.name}
                      </h3>
                      
                      <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {manga.pages} pages
                      </div>
                      
                      <div>
                        <div className={`flex justify-between text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <span>Progress</span>
                          <span>{progress.currentPage + 1}/{manga.pages}</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className={`rounded-2xl p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Loading manga...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Reader View - Book-like experience
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-black"
      onMouseMove={resetControlsTimeout}
      onClick={handlePageClick}
    >
      {/* Top Navigation Bar */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLibrary(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
            >
              <span>←</span>
              <span className="hidden sm:inline">Library</span>
            </button>
            
            <h2 className="text-white font-medium text-lg truncate max-w-md mx-4">
              {currentManga?.name}
            </h2>
            
            <div className="flex items-center gap-3">
              <span className="text-white/80 text-sm">
                {currentPage + 1} / {pages.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode(viewMode === 'single' ? 'double' : 'single');
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-all"
              >
                {viewMode === 'single' ? '📄' : '📖'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Reading Area - Book Style */}
      <div className="h-full flex items-center justify-center p-4 sm:p-8">
        <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
          {viewMode === 'single' ? (
            // Single Page View
            <div className="relative h-full flex items-center justify-center">
              <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden max-h-full" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <img
                  ref={imageRef}
                  src={pages[currentPage]?.url}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[85vh] w-auto object-contain select-none"
                  style={{ transform: `scale(${zoom})` }}
                  draggable={false}
                />
              </div>
            </div>
          ) : (
            // Double Page View
            <div className="relative h-full flex items-center justify-center gap-2">
              {/* Left Page */}
              {currentPage > 0 && (
                <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden max-h-full" style={{ boxShadow: '-10px 20px 60px rgba(0,0,0,0.3)' }}>
                  <img
                    src={pages[currentPage - 1]?.url}
                    alt={`Page ${currentPage}`}
                    className="max-h-[85vh] w-auto object-contain select-none"
                    draggable={false}
                  />
                </div>
              )}
              
              {/* Right Page */}
              <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden max-h-full" style={{ boxShadow: '10px 20px 60px rgba(0,0,0,0.3)' }}>
                <img
                  ref={imageRef}
                  src={pages[currentPage]?.url}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[85vh] w-auto object-contain select-none"
                  draggable={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="bg-gradient-to-t from-black/80 to-transparent backdrop-blur-md px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevPage();
                }}
                disabled={currentPage === 0}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 rounded-lg text-white transition-all"
              >
                ← Prev
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(Math.max(0.5, zoom - 0.25));
                  }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-white text-sm min-w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(Math.min(3, zoom + 0.25));
                  }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all flex items-center justify-center"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextPage();
                }}
                disabled={currentPage >= pages.length - 1}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 rounded-lg text-white transition-all"
              >
                Next →
              </button>
            </div>
            
            <p className="text-white/60 text-xs text-center mt-4">
              Click left/right to navigate • Space to advance • F for fullscreen • Esc to exit
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}