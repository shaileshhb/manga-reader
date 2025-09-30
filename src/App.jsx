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

// Simple Loading Component
const SimpleLoading = () => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading manga...</p>
      </div>
    </div>
  );
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const imageRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const readerRef = useRef(null);

  // Apply theme
  useEffect(() => {
    storage.saveTheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const readerElement = readerRef.current;
      if (readerElement) {
        if (readerElement.requestFullscreen) {
          readerElement.requestFullscreen();
        } else if (readerElement.webkitRequestFullscreen) { /* Safari */
          readerElement.webkitRequestFullscreen();
        } else if (readerElement.msRequestFullscreen) { /* IE11 */
          readerElement.msRequestFullscreen();
        }
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
      }
    }
  };

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
    
    if (clickPos > 0.7) {
      nextPage();
    } else if (clickPos < 0.3) {
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
            toggleFullscreen();
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
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Manga Reader
              </h1>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className={`text-4xl lg:text-5xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Read Manga Your Way
                </h2>
                <p className={`text-xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  A modern, privacy-focused manga reader that works entirely in your browser. No uploads, no accounts, no tracking.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Privacy First
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Your manga never leaves your device
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Multiple Formats
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Supports CBZ with various image formats
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Session Memory
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Remembers your page during the session
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Customizable
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Dark/light themes, zoom, and viewing modes
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className={`relative rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className={`h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center px-3`}>
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="p-6 h-80 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">📚</div>
                    <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Drop your CBZ file here
                    </p>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-2xl"></div>
                <div className="absolute -top-6 -left-6 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* Upload Zone */}
            <div
              className={`relative rounded-2xl p-12 text-center transition-all border-2 ${
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
                <div className="text-6xl mb-4">📖</div>
                <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Start Reading Now
                </h2>
                <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Drag and drop your .cbz file here, or click to browse
                </p>
                <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                  ⚠️ Files are processed locally in your browser and not permanently stored
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
          </div>
        </div>

        {loading && <SimpleLoading />}
      </div>
    );
  }

  // Reader View - Book-like experience
  return (
    <div 
      ref={readerRef}
      className="fixed inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-black"
      onMouseMove={resetControlsTimeout}
      onClick={handlePageClick}
    >
      {/* Top Navigation Bar - Minimalist */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="bg-black/60 backdrop-blur-sm px-3 py-2">
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLibrary(true);
              }}
              className="p-2 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            
            <h2 className="text-white text-sm font-medium truncate max-w-xs mx-2">
              {currentManga?.name}
            </h2>
            
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode(viewMode === 'single' ? 'double' : 'single');
                }}
                className="p-2 text-white/80 hover:text-white transition-colors"
                title={viewMode === 'single' ? 'Double Page View' : 'Single Page View'}
              >
                {viewMode === 'single' ? '📄' : '📖'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="p-2 text-white/80 hover:text-white transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? '⊡' : '⛶'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Side Navigation Indicators - Minimal */}
      <div className={`fixed left-2 top-1/2 -translate-y-1/2 z-40 transition-opacity duration-300 ${
        currentPage > 0 ? 'opacity-60' : 'opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevPage();
          }}
          className="p-2 bg-black/40 rounded-full text-white/80 hover:bg-black/60 hover:text-white transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <div className={`fixed right-2 top-1/2 -translate-y-1/2 z-40 transition-opacity duration-300 ${
        currentPage < pages.length - 1 ? 'opacity-60' : 'opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextPage();
          }}
          className="p-2 bg-black/40 rounded-full text-white/80 hover:bg-black/60 hover:text-white transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Main Reading Area - Optimized for Mobile */}
      <div className="h-full flex items-center justify-center p-1 sm:p-2 md:p-4">
        <div className="relative w-full h-full flex items-center justify-center">
          {viewMode === 'single' ? (
            // Single Page View
            <div className="relative h-full flex items-center justify-center w-full">
              <div className="relative bg-white dark:bg-gray-900 rounded shadow-xl overflow-hidden max-h-full max-w-full">
                <img
                  ref={imageRef}
                  src={pages[currentPage]?.url}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[90vh] max-w-full object-contain select-none"
                  style={{ transform: `scale(${zoom})` }}
                  draggable={false}
                />
              </div>
            </div>
          ) : (
            // Double Page View
            <div className="relative h-full flex items-center justify-center gap-1 sm:gap-2 w-full">
              {/* Left Page */}
              {currentPage > 0 && (
                <div className="relative bg-white dark:bg-gray-900 rounded shadow-xl overflow-hidden max-h-full flex-1">
                  <img
                    src={pages[currentPage - 1]?.url}
                    alt={`Page ${currentPage}`}
                    className="max-h-[90vh] w-auto object-contain select-none mx-auto"
                    draggable={false}
                  />
                </div>
              )}
              
              {/* Right Page */}
              <div className="relative bg-white dark:bg-gray-900 rounded shadow-xl overflow-hidden max-h-full flex-1">
                <img
                  ref={imageRef}
                  src={pages[currentPage]?.url}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[90vh] w-auto object-contain select-none mx-auto"
                  draggable={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls - Minimalist */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="bg-black/60 backdrop-blur-sm px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.max(0.5, zoom - 0.25));
                }}
                className="p-1 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="text-white text-xs">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.min(3, zoom + 0.25));
                }}
                className="p-1 text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                ></div>
              </div>
              <span className="text-white text-xs whitespace-nowrap">
                {currentPage + 1}/{pages.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}