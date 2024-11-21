      async function getColorName(rgb) {
        const [r, g, b] = rgb;
        
        const hex = `${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        try {
            const response = await fetch(`https://www.thecolorapi.com/id?hex=${hex}`);
            const data = await response.json();
            
            if (data.name && data.name.value) {
                return data.name.value;
            }
            
            return `${data.closest_named_hex.name.value} (Approximate)`;
        } catch (error) {
            console.error('Color API Error:', error);
            
            const colorPrefixes = [
                'Mystic', 'Radiant', 'Vibrant', 'Soft', 'Deep', 
                'Pastel', 'Muted', 'Rich', 'Subtle', 'Vivid'
            ];
            
            const baseColors = ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'];
            const randomPrefix = colorPrefixes[Math.floor(Math.random() * colorPrefixes.length)];
            const randomBaseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
            
            return `${randomPrefix} ${randomBaseColor}`;
        }
    }
    
        function ChromaScope() {
            const [imageFile, setImageFile] = React.useState(null);
            const [imageUrl, setImageUrl] = React.useState('');
            const [previewUrl, setPreviewUrl] = React.useState('');
            const [colors, setColors] = React.useState([]);
            const [colorNames, setColorNames] = React.useState({});
            const [loading, setLoading] = React.useState(false);
            const [error, setError] = React.useState(null);
            const [notification, setNotification] = React.useState(null);
            const [colorFormat, setColorFormat] = React.useState('hex');
            const [isDragging, setIsDragging] = React.useState(false);
            const fileInputRef = React.useRef(null);
            const dragCounter = React.useRef(0);
            const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
            
            React.useEffect(() => {
        const handleClickOutside = (event) => {
            const dropdownElement = event.target.closest('.custom-select');
            if (!dropdownElement) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);
    
    React.useEffect(() => {
            const fetchColorNames = async () => {
                const namePromises = colors.map(async (color, index) => {
                    const name = await getColorName(color);
                    return { [index]: name };
                });

                const namesArray = await Promise.all(namePromises);
                const namesObject = namesArray.reduce((acc, curr) => ({...acc, ...curr}), {});
                setColorNames(namesObject);
            };

            if (colors.length > 0) {
                fetchColorNames();
            }
        }, [colors]);

            const showNotification = (message, type = 'success') => {
                setNotification({ message, type });
                setTimeout(() => setNotification(null), 3000);
            };

            const handleDragEnter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter.current++;
                if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                    setIsDragging(true);
                }
            };

            const handleDragLeave = (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounter.current--;
                if (dragCounter.current === 0) {
                    setIsDragging(false);
                }
            };

            const handleDrop = (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                dragCounter.current = 0;
                
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    handleFileUpload(file);
                } else {
                    showNotification('Please drop a valid image file', 'error');
                }
            };

            const handleFileUpload = (file) => {
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImageFile(file);
                        setPreviewUrl(reader.result);
                        setImageUrl('');
                    };
                    reader.readAsDataURL(file);
                    showNotification('Image uploaded successfully');
                } else {
                    showNotification('Please select a valid image file', 'error');
                }
            };

            const convertColor = (rgb) => {
                const [r, g, b] = rgb;
                switch (colorFormat) {
                    case 'hex':
                        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                    case 'rgb':
                        return `rgb(${r}, ${g}, ${b})`;
                    case 'hsl':
                        const rr = r / 255;
                        const gg = g / 255;
                        const bb = b / 255;
                        const max = Math.max(rr, gg, bb);
                        const min = Math.min(rr, gg, bb);
                        let h, s, l = (max + min) / 2;

                        if (max === min) {
                            h = s = 0;
                        } else {
                            const d = max - min;
                            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                            switch (max) {
                                case rr: h = (gg - bb) / d + (gg < bb ? 6 : 0); break;
                                case gg: h = (bb - rr) / d + 2; break;
                                case bb: h = (rr - gg) / d + 4; break;
                            }
                            h /= 6;
                        }

                        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
                    default:
                        return `rgb(${r}, ${g}, ${b})`;
                }
            };

            const extractColors = async () => {
                if (!previewUrl && !imageUrl) {
                    showNotification('Please upload an image or enter a URL', 'error');
                    return;
                }

                setLoading(true);
                setError(null);

                try {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = previewUrl || imageUrl;

                    img.onload = () => {
                        const colorThief = new ColorThief();
                        const palette = colorThief.getPalette(img, 8);
                        setColors(palette);
                        setLoading(false);
                        showNotification('Colors extracted successfully');
                    };

                    img.onerror = () => {
                        setError('Failed to load image. Check the URL and try again.');
                        setLoading(false);
                        showNotification('Failed to load image', 'error');
                    };
                } catch (err) {
                    setError('An unexpected error occurred');
                    setLoading(false);
                    showNotification('An error occurred', 'error');
                }
            };

            const copyToClipboard = async (color) => {
                try {
                    await navigator.clipboard.writeText(color);
                    showNotification(`Copied ${color} to clipboard`);
                } catch (err) {
                    showNotification('Failed to copy color', 'error');
                }
            };

            const downloadPalette = () => {
    const formatDropdown = document.createElement('div');
    formatDropdown.className = 'modal-overlay active';
    formatDropdown.innerHTML = `
        <div class="modal-content relative">
            <button id="cancelDownload" class="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                <i class="fas fa-times"></i>
            </button>
            <h3 class="text-xl font-bold mb-4">Download Palette</h3>
            <div class="grid grid-cols-2 gap-4">
                <button id="downloadTXT" class="button btn-txt">
                    <i class="fas fa-file-alt btn-icon"></i> TXT
                </button>
                <button id="downloadCSS" class="button btn-css">
                    <i class="fas fa-code btn-icon"></i> CSS
                </button>
                <button id="downloadPNG" class="button btn-png">
                    <i class="fas fa-file-image btn-icon"></i> PNG
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(formatDropdown);

    const downloadTXT = () => {
        const content = colors.map((color, index) => {
            const colorValue = convertColor(color);
            const colorName = colorNames[index] || `color-${index}`;
            return `${colorName.replace(/\s+/g, '-').toLowerCase()}: ${colorValue};`;
        }).join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'color-palette.txt';
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(formatDropdown);
        showNotification('Palette downloaded as TXT');
    };

    const downloadCSS = () => {
        const content = `:root {\n${colors.map((color, index) => {
            const colorValue = convertColor(color);
            const colorName = colorNames[index] || `color-${index}`;
            return `    --${colorName.replace(/\s+/g, '-').toLowerCase()}: ${colorValue};`;
        }).join('\n')}\n}`;
        
        const blob = new Blob([content], { type: 'text/css' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'color-palette.css';
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(formatDropdown);
        showNotification('Palette downloaded as CSS');
    };

    const downloadPNG = () => {
    const canvas = document.createElement('canvas');
    const padding = 40;
    const swatchWidth = 300;
    const swatchHeight = 2000;
    const textHeight = 100;
    const creditHeight = 60;
    const canvasWidth = (swatchWidth * colors.length) + (padding * 2);
    const canvasHeight = swatchHeight + textHeight + creditHeight + (padding * 2);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    // Color swatches
    colors.forEach((color, index) => {
        const colorValue = convertColor(color);
        ctx.fillStyle = colorValue;
        const x = padding + (index * swatchWidth);
        const y = padding;
        
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y, swatchWidth, swatchHeight);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'white';
        ctx.font = '30px Inter, sans-serif';
        ctx.textAlign = 'center';
        
        const colorName = colorNames[index] || colorValue;
        ctx.fillText(colorName, x + (swatchWidth / 2), y + swatchHeight + 50);
        ctx.fillText(colorValue, x + (swatchWidth / 2), y + swatchHeight + 80);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '40px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by ChromaScope', canvasWidth / 2, canvasHeight - 20);
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chroma-scope-palette.png';
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(formatDropdown);
        showNotification('Palette downloaded as PNG');
    }, 'image/png');
};

    document.getElementById('downloadTXT').addEventListener('click', downloadTXT);
    document.getElementById('downloadCSS').addEventListener('click', downloadCSS);
    document.getElementById('downloadPNG').addEventListener('click', downloadPNG);
    document.getElementById('cancelDownload').addEventListener('click', () => {
        document.body.removeChild(formatDropdown);
    });
};

            return (
                <div className="min-h-screen bg-dark-background">
                    {/* Notification */}
                    {notification && (
                        <div className={`fixed top-4 right-4 z-50 notification p-4 rounded-lg shadow-lg ${
                            notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'
                        }`}>
                            <p className="text-white">{notification.message}</p>
                        </div>
                    )}

                    {/* Hero Section */}
                    <section className="hero-section py-20 px-4 relative">
                        <div className="container mx-auto text-center relative z-10">
                            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
                                Chroma<span className="text-blue-400">Scope</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-2xl mx-auto">
                                Extract beautiful color palettes from your favorite images
                            </p>

                            <div className="max-w-3xl mx-auto glassmorphism rounded-xl p-6">
                                <div 
                                    className={`drop-zone p-8 rounded-lg mb-6 ${isDragging ? 'active' : ''}`}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDrop}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e.target.files[0])}
                                        className="hidden"
                                    />
                                    <div className="text-center">
                                        <i className="fas fa-cloud-upload-alt text-4xl mb-4 text-blue-400"></i>
                                        <p className="text-lg mb-2">Drag and drop your image here</p>
                                        <p className="text-sm text-gray-400">or</p>
                                        <button 
                                            onClick={() => fileInputRef.current.click()}
                                            className="mt-4 px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                                        >
                                            Choose File
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <input 
                                        type="text" 
                                        value={imageUrl}
                                        onChange={(e) => {
                                            setImageUrl(e.target.value);
                                            setPreviewUrl('');
                                        }}
                                        placeholder="Or enter image URL"
                                        className="flex-1 p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                                    />
                                    <div className="flex gap-2">
            <div className="custom-select" onClick={(e) => e.stopPropagation()}>
                <div 
                    className={`custom-select-trigger ${isDropdownOpen ? 'active' : ''}`}
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    {colorFormat.toUpperCase()}
                    <i className="fas fa-chevron-down"></i>
                </div>
                <div 
                    className={`custom-select-options ${isDropdownOpen ? 'active' : ''}`}
                >
                    {['hex', 'rgb', 'hsl'].map((format) => (
                        <div 
                            key={format}
                            className="custom-select-option"
                            onClick={() => {
                                setColorFormat(format);
                                setIsDropdownOpen(false);
                            }}
                        >
                            {format.toUpperCase()}
                        </div>
                    ))}
                </div>
            </div>
            <button 
                onClick={extractColors}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg transition-all duration-300 disabled:opacity-50"
            >
                {loading ? (
                    <span className="flex items-center">
                        <div className="loading-spinner w-5 h-5 rounded-full mr-2"></div>
                        Extracting...
                    </span>
                ) : (
                    'Extract'
                )}
            </button>
        </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Preview Section */}
                    {(previewUrl || imageUrl) && (
                        <section className="container mx-auto px-4 py-12">
                            <div className="max-w-3xl mx-auto">
                                <div className="rounded-xl overflow-hidden shadow-xl">
                                    <img 
                                        src={previewUrl || imageUrl} 
                                        alt="Preview"
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Color Palette Section */}
                    {colors.length > 0 && (
                <section className="container mx-auto px-4 py-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Extracted Palette</h2>
                        <button
                            onClick={downloadPalette}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <i className="fas fa-download"></i>
                            Download Palette
                        </button>
                    </div>
                    <div className="color-grid grid gap-4">
                        {colors.map((color, index) => {
                            const colorValue = convertColor(color);
                            const colorName = colorNames[index] || 'Loading...';
                            return (
                                <div 
                                    key={index} 
                                    className="color-swatch rounded-xl aspect-square shadow-lg"
                                    style={{ backgroundColor: colorValue }}
                                    onClick={() => copyToClipboard(colorValue)}
                                >
                                    <div className="color-info h-full flex flex-col justify-end p-4">
                                        <span className="text-white font-medium text-sm">
                                            {colorName}
                                        </span>
                                        <span className="text-white font-medium text-xs opacity-75">
                                            {colorValue}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
                    )}

                    {/* Features Section */}
                    <section className="bg-gradient-to-b from-gray-900 to-black py-20">
                        <div className="container mx-auto px-4">
                            <h2 className="text-4xl font-bold text-center mb-12">
                              Features
                            </h2>
                            <div className="grid md:grid-cols-3 gap-8">
                                {[
                                    {
                                        icon: 'magic',
                                        title: 'Smart Extraction',
                                        desc: 'Algorithm detects dominant and accent colors'
                                    },
                                    {
                                        icon: 'palette',
                                        title: 'Multiple Formats',
                                        desc: 'Export colors in HEX, RGB, or HSL format'
                                    },
                                    {
                                        icon: 'download',
                                        title: 'Easy Export',
                                        desc: 'Download your palette for use in design tools'
                                    }
                                ].map((feature, index) => (
                                    <div key={index} className="feature-card p-6 rounded-xl text-center">
                                        <i className={`fas fa-${feature.icon} text-5xl mb-4 text-blue-400`}></i>
                                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                        <p className="text-gray-400">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="bg-gray-900 py-12">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row justify-between items-center">
                                <div className="mb-6 md:mb-0">
                                    <h3 className="text-2xl font-bold mb-2">ChromaScope</h3>
                                    <p className="text-gray-400">Your professional color palette tool</p>
                                </div>
                                <div className="flex space-x-6">
                                    {['twitter', 'github', 'dribbble'].map((social) => (
                                        <a 
                                            key={social}
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors"
                                        >
                                            <i className={`fab fa-${social} text-xl`}></i>
                                        </a>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                                <p className="text-gray-500">
                                    © {new Date().getFullYear()} ChromaScope. All rights reserved.
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            );
        }

        ReactDOM.render(<ChromaScope />, document.getElementById('root'));
