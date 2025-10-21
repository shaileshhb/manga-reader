import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';

// Session storage using React state
const SimpleLoading = () => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-red-600/20 border-b-red-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <p className="text-white text-xl font-bold tracking-wider" style={{ fontFamily: 'Arial, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          読み込み中...
        </p>
        <p className="text-red-400 text-sm mt-2">Loading...</p>
      </div>
    </div>
  );
};

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentManga, setCurrentManga] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [mangaList, setMangaList] = useState([]);
  const [showLibrary, setShowLibrary] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [viewMode, setViewMode] = useState('single');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState({});
  
  const imageRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const readerRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const touchMovedRef = useRef(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const readerElement = readerRef.current;
      if (readerElement?.requestFullscreen) {
        readerElement.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

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
      
      imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      
      const manga = {
        id: Date.now().toString(),
        name: file.name.replace('.cbz', ''),
        pages: imageFiles.length,
        addedDate: Date.now()
      };
      
      const updatedList = [...mangaList, manga];
      setMangaList(updatedList);
      
      setCurrentManga(manga);
      setPages(imageFiles);
      
      const savedProgress = progress[manga.id];
      setCurrentPage(savedProgress?.currentPage || 0);
      
      setShowLibrary(false);
    } catch (error) {
      alert('Error loading manga: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const cbzFile = files.find(file => file.name.toLowerCase().endsWith('.cbz'));
    if (cbzFile) {
      loadManga(cbzFile);
    }
  }, [mangaList, progress]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const nextPage = () => {
    const increment = viewMode === 'double' ? 2 : 1;
    if (currentPage < pages.length - increment) {
      const newPage = currentPage + increment;
      setCurrentPage(newPage);
      setProgress(prev => ({
        ...prev,
        [currentManga.id]: { currentPage: newPage, lastRead: Date.now() }
      }));
      resetControlsTimeout();
    }
  };

  const prevPage = () => {
    const decrement = viewMode === 'double' ? 2 : 1;
    if (currentPage > 0) {
      const newPage = Math.max(0, currentPage - decrement);
      setCurrentPage(newPage);
      setProgress(prev => ({
        ...prev,
        [currentManga.id]: { currentPage: newPage, lastRead: Date.now() }
      }));
      resetControlsTimeout();
    }
  };

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

  const onTouchStart = (e) => {
    if (e.touches && e.touches.length === 1) {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      touchMovedRef.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchStartRef.current.x);
    const dy = Math.abs(t.clientY - touchStartRef.current.y);
    if (dx > 10 || dy > 10) touchMovedRef.current = true;
  };

  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    if (!start) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.time;
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    const isSwipe = isHorizontal && Math.abs(dx) > 50 && dt < 600;
    if (isSwipe) {
      if (dx < 0) {
        nextPage();
      } else {
        prevPage();
      }
      resetControlsTimeout();
      return;
    }
    if (!touchMovedRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = t.clientX - rect.left;
      const clickPos = clickX / rect.width;
      if (clickPos > 0.7) {
        nextPage();
      } else if (clickPos < 0.3) {
        prevPage();
      } else {
        setShowControls(!showControls);
        resetControlsTimeout();
      }
    }
  };

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

  const removeManga = (mangaId, e) => {
    e.stopPropagation();
    const updatedList = mangaList.filter(m => m.id !== mangaId);
    setMangaList(updatedList);
    
    const newProgress = { ...progress };
    delete newProgress[mangaId];
    setProgress(newProgress);
  };

  if (showLibrary) {
    return (
      <div className={`min-h-screen transition-colors ${darkMode ? 'bg-black' : 'bg-stone-50'}`}
           onDrop={handleDrop}
           onDragOver={handleDragOver}
           onDragLeave={handleDragLeave}
           style={{
             backgroundImage: darkMode 
               ? 'radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(220, 38, 38, 0.05) 0%, transparent 50%)'
               : 'radial-gradient(circle at 20% 50%, rgba(239, 68, 68, 0.03) 0%, transparent 50%)'
           }}>
        
        <div className="fixed inset-0 pointer-events-none opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30 30 0z' fill='%23dc2626' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 30px'
        }}></div>

        <div className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-black/80 border-b-4 border-red-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center transform -rotate-3 border-2 border-red-400 shadow-lg">
                  <span className="text-2xl">漫</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                    MANGA READER
                  </h1>
                  <p className="text-red-400 text-xs tracking-widest">マンガリーダー</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all transform hover:scale-105 border-2 border-red-400"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <div className="text-center mb-12">
                <div className="inline-block relative mb-6">
                  <h2 className="text-6xl lg:text-7xl font-black text-white mb-2" style={{
                    textShadow: '4px 4px 0px rgba(220, 38, 38, 1), 6px 6px 0px rgba(0, 0, 0, 0.3)',
                    WebkitTextStroke: '2px black'
                  }}>
                    読む
                  </h2>
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-600 rounded-full opacity-50 blur-xl"></div>
                </div>
                <p className="text-3xl font-bold text-red-500 tracking-wider mb-4">
                  READ MANGA
                </p>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Experience manga the way it was meant to be read - with complete privacy and authentic Japanese aesthetics
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {[
                  { icon: '🔒', title: 'PRIVACY', subtitle: 'プライバシー', desc: 'Local storage only' },
                  { icon: '📚', title: 'CBZ FORMAT', subtitle: 'フォーマット', desc: 'Full support' },
                  { icon: '💾', title: 'AUTO-SAVE', subtitle: '自動保存', desc: 'Progress tracking' },
                  { icon: '🎨', title: 'CUSTOM', subtitle: 'カスタム', desc: 'View modes' }
                ].map((feature, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-800 rounded-xl transform rotate-1 group-hover:rotate-2 transition-transform"></div>
                    <div className="relative bg-black border-4 border-white rounded-xl p-6 transform -rotate-1 group-hover:rotate-0 transition-all">
                      <div className="text-4xl mb-3">{feature.icon}</div>
                      <h3 className="text-white font-black text-lg mb-1" style={{ textShadow: '2px 2px 0px rgba(220, 38, 38, 1)' }}>
                        {feature.title}
                      </h3>
                      <p className="text-red-400 text-xs mb-2 tracking-wider">{feature.subtitle}</p>
                      <p className="text-gray-400 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-8 -left-8 w-32 h-32 border-4 border-red-600 rounded-full opacity-20"></div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 border-4 border-red-600 opacity-20" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
              
              <div className={`relative rounded-3xl p-12 text-center transition-all border-8 ${
                dragOver
                  ? 'border-red-500 bg-red-500/20 scale-105'
                  : 'border-white bg-gradient-to-br from-red-900 via-black to-black'
              }`} style={{
                boxShadow: dragOver 
                  ? '0 0 60px rgba(220, 38, 38, 0.6), inset 0 0 60px rgba(220, 38, 38, 0.2)'
                  : '20px 20px 0px rgba(220, 38, 38, 0.3), 0 10px 40px rgba(0,0,0,0.5)'
              }}>
                <div className="relative">
                  <div className="absolute inset-0 opacity-10">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="absolute bg-white h-px" style={{
                        top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 40}%`,
                        left: '50%',
                        width: '100px',
                        transform: `rotate(${i * 30}deg)`,
                        transformOrigin: 'left center'
                      }}></div>
                    ))}
                  </div>
                  
                  <div className="relative z-10">
                    <div className="text-8xl mb-6 animate-bounce">📖</div>
                    <div className="inline-block bg-white px-8 py-4 rounded-2xl transform -rotate-1 mb-6 border-4 border-black" style={{
                      boxShadow: '6px 6px 0px rgba(0,0,0,1)'
                    }}>
                      <h2 className="text-4xl font-black text-black mb-2">
                        START READING!
                      </h2>
                      <p className="text-red-600 font-bold tracking-widest">開始する</p>
                    </div>
                    <p className="text-white text-lg mb-8 font-bold">
                      Drop your CBZ file or click to browse
                    </p>
                    <div className="inline-block bg-yellow-300 px-6 py-3 rounded-lg transform rotate-1 border-3 border-black mb-8">
                      <p className="text-black font-bold text-sm">
                        ⚠️ Files processed locally • No upload to servers
                      </p>
                    </div>
                  </div>
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
                  className="inline-block relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-red-600 rounded-2xl transform translate-x-2 translate-y-2 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform"></div>
                  <div className="relative px-12 py-5 bg-white rounded-2xl border-4 border-black font-black text-2xl transform group-hover:scale-105 transition-all">
                    <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                      CHOOSE FILE
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {mangaList.length > 0 && (
              <div className="mt-16">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
                  <h3 className="text-3xl font-black text-white" style={{ textShadow: '3px 3px 0px rgba(220, 38, 38, 1)' }}>
                    YOUR LIBRARY
                  </h3>
                  <div className="h-1 flex-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mangaList.map((manga) => (
                    <div key={manga.id} className="relative group">
                      <div className="absolute inset-0 bg-red-600 rounded-xl transform rotate-2 group-hover:rotate-3 transition-transform"></div>
                      <div 
                        className="relative bg-black border-4 border-white rounded-xl p-6 transform -rotate-1 group-hover:rotate-0 transition-all cursor-pointer"
                        onClick={() => {
                          setCurrentManga(manga);
                          setShowLibrary(false);
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-4xl">📚</div>
                          <button
                            onClick={(e) => removeManga(manga.id, e)}
                            className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors border-2 border-white"
                          >
                            ✕
                          </button>
                        </div>
                        <h4 className="text-white font-bold text-lg mb-2 truncate">{manga.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>{manga.pages} pages</span>
                          <span>•</span>
                          <span>{progress[manga.id] ? `${Math.round((progress[manga.id].currentPage / manga.pages) * 100)}%` : '0%'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {loading && <SimpleLoading />}
      </div>
    );
  }

  return (
    <div 
      ref={readerRef}
      className="fixed inset-0 bg-black"
      onMouseMove={resetControlsTimeout}
      onClick={handlePageClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="bg-gradient-to-b from-black via-black/90 to-transparent px-3 sm:px-4 py-2 sm:py-3 border-b-2 border-red-600" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowLibrary(true);
              }}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold transition-all border border-white/80 sm:border-2 transform hover:scale-105 text-sm sm:text-base"
            >
              <span className="mr-1">←</span>
              <span className="hidden sm:inline">LIBRARY</span>
              <span className="sm:hidden">Back</span>
            </button>
            
            <h2 className="text-white text-base sm:text-lg font-bold truncate max-w-[50vw] sm:max-w-xs mx-2 sm:mx-4 tracking-wide">
              {currentManga?.name}
            </h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode(viewMode === 'single' ? 'double' : 'single');
                }}
                className="px-2 py-2 sm:px-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-all border border-gray-600 sm:border-2 text-sm sm:text-base"
                title={viewMode === 'single' ? 'Double Page' : 'Single Page'}
              >
                {viewMode === 'single' ? '📄' : '📖'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="px-2 py-2 sm:px-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-all border border-gray-600 sm:border-2 text-sm sm:text-base"
              >
                {isFullscreen ? '⊡' : '⛶'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`hidden md:block fixed left-4 top-1/2 -translate-y-1/2 z-40 transition-opacity duration-300 ${
        currentPage > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevPage();
          }}
          className="p-4 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all border-4 border-white transform hover:scale-110 shadow-xl"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <div className={`hidden md:block fixed right-4 top-1/2 -translate-y-1/2 z-40 transition-opacity duration-300 ${
        currentPage < pages.length - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextPage();
          }}
          className="p-4 bg-red-600 hover:bg-red-500 rounded-full text-white transition-all border-4 border-white transform hover:scale-110 shadow-xl"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="h-full flex items-center justify-center p-2 md:p-4">
        <div className="relative w-full h-full flex items-center justify-center">
          {viewMode === 'single' ? (
            <div className="relative h-full flex items-center justify-center w-full">
              <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden max-h-full max-w-full border-4 border-gray-800">
                <img
                  ref={imageRef}
                  src={pages[currentPage]?.url}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[92vh] max-w-full object-contain select-none"
                  style={{ transform: `scale(${zoom})` }}
                  draggable={false}
                />
              </div>
            </div>
          ) : (
            <div className="relative h-full flex items-center justify-center gap-2 w-full">
              {currentPage > 0 && (
                <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden max-h-full flex-1 border-4 border-gray-800">
                  <img
                    src={pages[currentPage - 1]?.url}
                    alt={`Page ${currentPage}`}
                    className="max-h-[92vh] w-auto object-contain select-none mx-auto"
                    draggable={false}
                  />
                </div>
              )}
              
              <div className="relative bg-white rounded-lg shadow-2xl overflow-hidden max-h-full flex-1 border-4 border-gray-800">
                <img
                  ref={imageRef}
                  src={pages[currentPage]?.url}
                  alt={`Page ${currentPage + 1}`}
                  className="max-h-[92vh] w-auto object-contain select-none mx-auto"
                  draggable={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <div className="bg-gradient-to-t from-black via-black/90 to-transparent px-3 sm:px-4 py-3 sm:py-4 border-t-2 border-red-600" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-between max-w-4xl mx-auto gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.max(0.5, zoom - 0.25));
                }}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-all border border-gray-600 sm:border-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="text-white font-bold text-xs sm:text-sm bg-gray-800 px-2 sm:px-3 py-1 rounded-lg border border-gray-600 sm:border-2">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setZoom(Math.min(3, zoom + 0.25));
                }}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-all border border-gray-600 sm:border-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-3 flex-1 justify-end">
              <input
                type="range"
                min={1}
                max={Math.max(1, pages.length)}
                value={Math.min(pages.length, currentPage + 1)}
                onChange={(e) => {
                  const page = Number(e.target.value) - 1;
                  setCurrentPage(page);
                  if (currentManga) {
                    setProgress(prev => ({
                      ...prev,
                      [currentManga.id]: { currentPage: page, lastRead: Date.now() }
                    }));
                  }
                  resetControlsTimeout();
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-32 sm:w-48 h-2 accent-red-600 bg-gray-800 rounded-lg appearance-none"
              />
              <span className="text-white font-bold text-xs sm:text-sm whitespace-nowrap bg-gray-800 px-2 sm:px-3 py-1 rounded-lg border border-gray-600 sm:border-2">
                {currentPage + 1}/{pages.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}