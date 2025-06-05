// Add hover-scale class to buttons
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('button, a');
    buttons.forEach(button => {
        button.classList.add('hover-scale');
    });

    // Initialize bookmarks from localStorage
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];

    // Check which page we're on
    const isBookmarksPage = window.location.pathname.includes('bookmarks.html');
    
    if (isBookmarksPage) {
        displayBookmarks();
    }

    // Handle form submission (only on main page)
    const bookmarkForm = document.getElementById('bookmarkForm');
    if (bookmarkForm) {
        bookmarkForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form values
            const title = document.getElementById('linkTitle').value.trim();
            const url = document.getElementById('url').value.trim();
            const category = document.getElementById('category').value;

            // Validate inputs
            if (!title || !url || !category) {
                alert('Please fill in all fields');
                return;
            }

            // Validate URL format
            try {
                new URL(url);
            } catch (e) {
                alert('Please enter a valid URL');
                return;
            }

            const bookmark = {
                id: Date.now(),
                title: title,
                url: url,
                category: category,
                dateAdded: new Date().toLocaleDateString(),
                timestamp: new Date().toISOString()
            };

            try {
                // Get existing bookmarks
                let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
                
                // Add new bookmark
                bookmarks.push(bookmark);
                
                // Save to localStorage
                localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                
                // Reset form
                bookmarkForm.reset();

                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
                successMessage.textContent = 'Bookmark saved successfully!';
                document.body.appendChild(successMessage);
                
                // Remove success message after 3 seconds
                setTimeout(() => {
                    successMessage.remove();
                }, 3000);

                // Redirect to bookmarks page
                window.location.href = 'bookmarks.html';
            } catch (error) {
                console.error('Error saving bookmark:', error);
                alert('Error saving bookmark. Please try again.');
            }
        });
    }
});

// Function to display bookmarks
function displayBookmarks() {
    const bookmarksList = document.getElementById('bookmarksList');
    const searchFilterContainer = document.getElementById('searchFilterContainer');
    
    try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        
        // Sort bookmarks by timestamp (newest first)
        bookmarks.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (bookmarks.length === 0) {
            bookmarksList.innerHTML = `
                <div class="col-span-full text-center text-gray-500 py-8">
                    <p class="text-lg mb-4">No bookmarks saved yet.</p>
                    <a href="index.html" class="text-blue-600 hover:text-blue-800">Add your first bookmark</a>
                </div>
            `;
            return;
        }

        // Create search and filter container
        searchFilterContainer.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div class="flex-1">
                    <div class="relative">
                        <input type="text" 
                               id="searchInput" 
                               placeholder="Search bookmarks by title or URL..." 
                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <label for="categoryFilter" class="text-sm font-medium text-gray-700">Filter by Category:</label>
                    <select id="categoryFilter" class="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                        <option value="all">All Categories</option>
                        ${[...new Set(bookmarks.map(b => b.category))].map(category => `
                            <option value="${escapeHtml(category)}">${escapeHtml(category)}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            <div class="text-sm text-gray-500 mt-4">
                Total Bookmarks: <span id="bookmarkCount">${bookmarks.length}</span>
            </div>
        `;

        // Add event listeners for search and filter
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');

        function applyFilters() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const selectedCategory = categoryFilter.value;
            
            const filteredBookmarks = bookmarks.filter(bookmark => {
                const matchesSearch = searchTerm === '' || 
                    bookmark.title.toLowerCase().includes(searchTerm) || 
                    bookmark.url.toLowerCase().includes(searchTerm);
                
                const matchesCategory = selectedCategory === 'all' || 
                    bookmark.category === selectedCategory;
                
                return matchesSearch && matchesCategory;
            });

            updateBookmarksDisplay(filteredBookmarks);
            document.getElementById('bookmarkCount').textContent = filteredBookmarks.length;
        }

        // Add debounced search
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(applyFilters, 300);
        });

        categoryFilter.addEventListener('change', applyFilters);

        // Initial display
        updateBookmarksDisplay(bookmarks);

    } catch (error) {
        console.error('Error displaying bookmarks:', error);
        bookmarksList.innerHTML = `
            <div class="col-span-full text-center text-red-500 py-8">
                Error loading bookmarks. Please try refreshing the page.
            </div>
        `;
    }
}

// Function to update bookmarks display
function updateBookmarksDisplay(bookmarks) {
    const bookmarksList = document.getElementById('bookmarksList');
    
    // Group bookmarks by category
    const groupedBookmarks = bookmarks.reduce((groups, bookmark) => {
        const category = bookmark.category;
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(bookmark);
        return groups;
    }, {});

    // Create HTML for each category
    bookmarksList.innerHTML = Object.entries(groupedBookmarks).map(([category, bookmarks]) => `
        <div class="col-span-full mb-8">
            <h3 class="text-xl font-bold text-gray-800 mb-4 capitalize">${escapeHtml(category)}</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                ${bookmarks.map(bookmark => `
                    <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200 border-l-4 border-blue-500">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-gray-900 truncate" title="${escapeHtml(bookmark.title)}">
                                    ${escapeHtml(bookmark.title)}
                                </h3>
                                <a href="${escapeHtml(bookmark.url)}" 
                                   target="_blank" 
                                   class="text-blue-600 hover:text-blue-800 text-sm break-all block mt-1"
                                   title="${escapeHtml(bookmark.url)}">
                                    ${escapeHtml(bookmark.url)}
                                </a>
                                <div class="mt-3 flex items-center justify-between">
                                    <p class="text-xs text-gray-400">Added: ${bookmark.dateAdded}</p>
                                    <button onclick="deleteBookmark(${bookmark.id})" 
                                        class="text-red-600 hover:text-red-800 focus:outline-none p-1 hover:bg-red-50 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Function to delete a bookmark
function deleteBookmark(id) {
    // Create and show custom confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    dialog.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Delete Bookmark</h3>
            <p class="text-gray-600 mb-6">Are you sure you want to delete this bookmark? This action cannot be undone.</p>
            <div class="flex justify-end space-x-4">
                <button id="cancelDelete" class="px-4 py-2 text-gray-600 hover:text-gray-800 focus:outline-none">
                    Cancel
                </button>
                <button id="confirmDelete" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none">
                    Delete
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Handle cancel
    document.getElementById('cancelDelete').addEventListener('click', () => {
        dialog.remove();
    });

    // Handle confirm
    document.getElementById('confirmDelete').addEventListener('click', () => {
        try {
            let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
            const bookmarkToDelete = bookmarks.find(b => b.id === id);
            
            if (!bookmarkToDelete) {
                throw new Error('Bookmark not found');
            }

            bookmarks = bookmarks.filter(bookmark => bookmark.id !== id);
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            
            // Remove dialog
            dialog.remove();

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
            successMessage.textContent = 'Bookmark deleted successfully';
            document.body.appendChild(successMessage);

            // Remove success message after 3 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 3000);

            // Update the display
            displayBookmarks();
        } catch (error) {
            console.error('Error deleting bookmark:', error);
            
            // Remove dialog
            dialog.remove();

            // Show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
            errorMessage.textContent = 'Error deleting bookmark. Please try again.';
            document.body.appendChild(errorMessage);

            // Remove error message after 3 seconds
            setTimeout(() => {
                errorMessage.remove();
            }, 3000);
        }
    });

    // Close dialog when clicking outside
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
            dialog.remove();
        }
    });
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Mobile menu functionality
const mobileMenuButton = document.getElementById('mobileMenuButton');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
            mobileMenu.classList.add('hidden');
        }
    });

    // Close mobile menu when window is resized to desktop view
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 640) { // sm breakpoint
            mobileMenu.classList.add('hidden');
        }
    });
} 