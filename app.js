/* ==========================================================================
   સગપણ સેતુ Premium Matrimonial Portal JS (Gujarati, Light Only, PDF/Img, Live Manager)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. STATE & CONSTANTS
    // ==========================================
    
    let seedProfiles = [];         // Seed data from JSON
    let approvedProfiles = [];     // From LocalStorage (approved submissions)
    let activeProfiles = [];       // Combined seed + approved
    let pendingSubmissions = [];   // From LocalStorage (pending approval)
    let bookmarkedIds = new Set();  // Set of bookmarked profile IDs
    
    // Firebase variables
    let isFirebaseEnabled = false;
    let firebaseDb = null;
    let firebaseStorage = null;
    let firebaseAuth = null;

    // Binary file references for uploads (instead of Base64 strings)
    let tempPdfFile = null;
    let tempPhotoFile = null;
    let tempEditPhotoFile = null;
    let tempEditPdfFile = null;
    let tempEditIsImageBioData = false;

    // Search & Filter state
    const filters = {
        search: "",
        gender: "all",
        ageMin: 20,
        ageMax: 80,
        location: "all",
        state: "all",
        bookmarksOnly: false
    };

    // User Upload Temp Assets Holder
    let tempPdfBase64 = null;
    let tempPdfName = "";
    let tempPdfSize = "";
    let tempIsImageBioData = false; // Tracks if uploaded Bio-Data is an image
    let tempPhotoBase64 = ""; // Base64 string for photo

    // Admin Editor Temp Assets Holder
    let activeEditingSubmission = null; // The pending item currently being edited by admin
    let activeEditingLiveProfile = null; // The live item currently being edited by admin
    let tempEditPhotoBase64 = "";

    // Admin Cropper Variables
    let profileCropper = null;
    let croppedImageBlob = null;

    // Admin Access Passcode
    // const ADMIN_PASSCODE = "admin123";

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================
    
    // View Sections
    const views = {
        directory: document.getElementById('view-directory'),
        submit: document.getElementById('view-submit'),
        about: document.getElementById('view-about'),
        admin: document.getElementById('view-admin')
    };
    
    // Nav Links (both Header and Mobile Bottom bar)
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    // Mobile Filter Drawer Elements
    const mobileFilterToggleBtn = document.getElementById('mobile-filter-toggle');
    const mobileFilterCloseBtn = document.getElementById('mobile-filter-close');
    const mobileFilterApplyBtn = document.getElementById('mobile-filter-apply-btn');
    const filterSidebarEl = document.getElementById('filter-sidebar-el');
    const sidebarOverlayBackdrop = document.getElementById('sidebar-overlay-backdrop');

    // Filter controls
    const resetFiltersBtn = document.getElementById('reset-filters');
    const genderRadios = document.getElementsByName('gender');
    const ageMinInput = document.getElementById('age-min');
    const ageMaxInput = document.getElementById('age-max');
    const ageDisplay = document.getElementById('age-display');
    const locationSelect = document.getElementById('filter-location');
    const stateSelect = document.getElementById('filter-state');
    const bookmarksCheckbox = document.getElementById('show-bookmarks-only');
    
    // Search input & results info
    const searchInput = document.getElementById('search-input');
    const activePillsContainer = document.getElementById('active-pills-container');
    const resultsCountEl = document.getElementById('results-count');
    const profilesGrid = document.getElementById('profiles-grid');
    const recentSectionEl = document.getElementById('recently-added-section');
    const recentProfilesGrid = document.getElementById('recent-profiles-grid');
    const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
    let activeDirectoryView = 'all';
    
    // Submission Form elements
    const submissionForm = document.getElementById('submission-form');
    
    // Photo upload inputs (User Form)
    const photoInput = document.getElementById('submit-photo');
    const photoBrowseBtn = document.getElementById('photo-browse-btn');
    const photoPreviewCircle = document.getElementById('photo-preview-circle');
    const submitMobileInput = document.getElementById('submit-mobile');

    // Bio-Data file upload inputs (User Form)
    const pdfDropZone = document.getElementById('pdf-drop-zone');
    const pdfInput = document.getElementById('submit-pdf');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const selectedFileNameEl = document.getElementById('selected-file-name');
    const selectedFileSizeEl = document.getElementById('selected-file-size');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const submitMessageEl = document.getElementById('submit-message');
    const submitProfileBtn = document.getElementById('submit-profile-btn');
    
    // Admin Login
    const adminLoginView = document.getElementById('admin-login-view');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasscodeInput = document.getElementById('admin-passcode');
    const loginErrorMsg = document.getElementById('login-error-msg');
    
    // Admin Dashboard
    const adminDashboardView = document.getElementById('admin-dashboard-view');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const adminSeedBtn = document.getElementById('admin-seed-btn');
    const adminStatPendingEl = document.getElementById('admin-stat-pending');
    const adminStatApprovedEl = document.getElementById('admin-stat-approved');
    const adminStatTotalLiveEl = document.getElementById('admin-stat-total-live');
    const pendingTableBody = document.getElementById('pending-table-body');
    const liveTableBody = document.getElementById('live-table-body'); // Manage Active Listings table
    
    // Profile Details Modal
    const profileModal = document.getElementById('profile-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalAvatar = document.getElementById('modal-avatar');
    const modalName = document.getElementById('modal-name');
    const modalGender = document.getElementById('modal-gender');
    const modalAge = document.getElementById('modal-age');
    const modalCity = document.getElementById('modal-city');
    const modalState = document.getElementById('modal-state');
    const modalMobile = document.getElementById('modal-mobile');
    const modalBookmarkBtn = document.getElementById('modal-bookmark-btn');
    const modalDownloadBtn = document.getElementById('modal-download-btn');
    const modalOpenNewBtn = document.getElementById('modal-open-new-btn');
    const pdfViewerWrapper = document.getElementById('pdf-viewer-wrapper');
    const pdfFallbackMsg = document.getElementById('pdf-fallback-msg');
    const pdfFallbackOpen = document.getElementById('pdf-fallback-open');

    // Admin Editor Modal
    const adminEditorModal = document.getElementById('admin-editor-modal');
    const adminEditorCloseBtn = document.getElementById('admin-editor-close-btn');
    const adminApprovalEditorForm = document.getElementById('admin-approval-editor-form');
    
    const editNameInput = document.getElementById('edit-name');
    const editGenderSelect = document.getElementById('edit-gender');
    const editAgeInput = document.getElementById('edit-age');
    const editMobileInput = document.getElementById('edit-mobile');
    const editCityInput = document.getElementById('edit-city');
    const editStateInput = document.getElementById('edit-state');
    
    const editPhotoFileInput = document.getElementById('edit-photo-file');
    const editPhotoBrowseBtn = document.getElementById('edit-photo-browse-btn');
    const editPhotoPreview = document.getElementById('edit-photo-preview');

    const editPdfFileInput = document.getElementById('edit-pdf-file');
    const editPdfBrowseBtn = document.getElementById('edit-pdf-browse-btn');
    const editPdfFileName = document.getElementById('edit-pdf-file-name');
    
    const adminEditorPdfWrapper = document.getElementById('admin-editor-pdf-wrapper');
    const adminEditorPdfFallback = document.getElementById('admin-editor-pdf-fallback');
    const adminEditorPdfFallbackBtn = document.getElementById('admin-editor-pdf-fallback-btn');
    const adminRejectSubmissionBtn = document.getElementById('admin-reject-submission-btn');

    // New Cropper elements
    const adminCropperContainer = document.getElementById('admin-cropper-container');
    const adminCropImage = document.getElementById('admin-crop-image');
    const cropSaveBtn = document.getElementById('crop-save-btn');
    const cropRotateLeft = document.getElementById('crop-rotate-left');
    const cropRotateRight = document.getElementById('crop-rotate-right');
    const editPhotoCropBtn = document.getElementById('edit-photo-crop-btn');

    // Trigger Admin File Browser
    if (editPhotoBrowseBtn && editPhotoFileInput) {
        editPhotoBrowseBtn.addEventListener('click', () => editPhotoFileInput.click());
    }

    if (editPdfBrowseBtn && editPdfFileInput) {
        editPdfBrowseBtn.addEventListener('click', () => editPdfFileInput.click());
    }

    // Allow cropping the currently-set preview photo (for existing profiles)
    if (editPhotoCropBtn) {
        editPhotoCropBtn.addEventListener('click', () => {
            // Prefer the temp base64 (set when opening editor or after upload)
            let src = tempEditPhotoBase64 || '';

            // Fallback: try to read background-image from preview element
            if (!src && editPhotoPreview) {
                const bg = getComputedStyle(editPhotoPreview).backgroundImage || '';
                const match = bg.match(/url\((?:\"|\')?(.*?)(?:\"|\')?\)/);
                if (match && match[1] && match[1] !== 'none') {
                    src = match[1];
                }
            }

            if (!src) {
                alert('પ્રોફાઇલ ફોટો ઉપલબ્ધ નથી. કૃપા કરીને પહેલા ફોટો અપલોડ કરો અથવા પસંદ કરો.');
                return;
            }

            if (profileCropper) {
                profileCropper.destroy();
                profileCropper = null;
            }

            if (adminCropImage && adminCropperContainer) {
                adminCropImage.src = src;
                adminCropperContainer.style.display = 'block';
                profileCropper = new Cropper(adminCropImage, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8,
                    background: false,
                    responsive: true
                });
            }
        });
    }

    // Initialize Cropper when image changes
    if (editPhotoFileInput) {
        editPhotoFileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files && files.length > 0) {
                const file = files[0];
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    if (profileCropper) {
                        profileCropper.destroy();
                    }
                    
                    if (adminCropImage && adminCropperContainer) {
                        adminCropImage.src = event.target.result;
                        adminCropperContainer.style.display = 'block';
                        
                        profileCropper = new Cropper(adminCropImage, {
                            aspectRatio: 1, // Fixed 1:1 Square
                            viewMode: 1,
                            autoCropArea: 0.8,
                            background: false,
                            responsive: true
                        });
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Rotate and Save Functionality
    if (cropRotateLeft) {
        cropRotateLeft.addEventListener('click', () => profileCropper && profileCropper.rotate(-90));
    }
    if (cropRotateRight) {
        cropRotateRight.addEventListener('click', () => profileCropper && profileCropper.rotate(90));
    }

    if (cropSaveBtn) {
        cropSaveBtn.addEventListener('click', () => {
            if (!profileCropper) return;

            const canvas = profileCropper.getCroppedCanvas({
                width: 300,
                height: 300,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });

            if (editPhotoPreview) {
                editPhotoPreview.style.backgroundImage = `url(${canvas.toDataURL('image/jpeg')})`;
                editPhotoPreview.innerHTML = ''; 
            }

            canvas.toBlob((blob) => {
                croppedImageBlob = blob;
                // Read into base64 to match your existing system's tempEditPhotoBase64 pipeline if needed
                const reader = new FileReader();
                reader.onloadend = function() {
                    tempEditPhotoBase64 = reader.result;
                };
                reader.readAsDataURL(blob);

                if (adminCropperContainer) adminCropperContainer.style.display = 'none';
            }, 'image/jpeg', 0.85); 
        });
    }

    function resetAdminCropper() {
        if (profileCropper) {
            profileCropper.destroy();
            profileCropper = null;
        }
        const container = document.getElementById('admin-cropper-container');
        if (container) container.style.display = 'none';
        croppedImageBlob = null;
    }

    // ==========================================
    // 3. COLOR GRADIENTS FOR PROFILE AVATARS
    // ==========================================
    
    function getGradientByName(name) {
        const gradients = [
            'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
            'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)',
            'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
            'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
            'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
            'linear-gradient(135deg, #f97316 0%, #e11d48 100%)'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % gradients.length;
        return gradients[index];
    }
    
    function getInitials(name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    }

    // ==========================================
    // 4. STORAGE & INITIAL LOADING
    // ==========================================

    function loadLocalStorage() {
        const savedBookmarks = localStorage.getItem('soulsync_bookmarks');
        if (savedBookmarks) {
            bookmarkedIds = new Set(JSON.parse(savedBookmarks));
        }

        const savedApproved = localStorage.getItem('soulsync_approved_submissions');
        if (savedApproved) {
            approvedProfiles = JSON.parse(savedApproved);
        }

        const savedPending = localStorage.getItem('soulsync_pending_submissions');
        if (savedPending) {
            pendingSubmissions = JSON.parse(savedPending);
        }
    }

    function saveBookmarks() {
        localStorage.setItem('soulsync_bookmarks', JSON.stringify(Array.from(bookmarkedIds)));
    }

    function saveApprovedSubmissions() {
        localStorage.setItem('soulsync_approved_submissions', JSON.stringify(approvedProfiles));
    }

    function savePendingSubmissions() {
        localStorage.setItem('soulsync_pending_submissions', JSON.stringify(pendingSubmissions));
    }

    function normalizeMobileNumber(value) {
        if (!value) return null;
        const digits = value.replace(/\D/g, '');
        if (digits.length === 10) {
            return digits;
        }
        return null;
    }

    function checkFirebase() {
        if (typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined' && FIREBASE_CONFIG.apiKey) {
            try {
                firebase.initializeApp(FIREBASE_CONFIG);
                firebaseDb = firebase.firestore();
                firebaseStorage = firebase.storage();
                firebaseAuth = firebase.auth();
                isFirebaseEnabled = true;
                console.log("Firebase initialized successfully.");
            } catch (err) {
                console.error("Failed to initialize Firebase client:", err);
                isFirebaseEnabled = false;
            }
        } else {
            console.log("Firebase config not found or incomplete. Falling back to LocalStorage (Offline Mode).");
            isFirebaseEnabled = false;
        }

        // Update badge UI
        const statusBadge = document.getElementById('admin-db-status');
        const seedBtn = document.getElementById('admin-seed-btn');
        if (statusBadge) {
            if (isFirebaseEnabled) {
                statusBadge.textContent = "લાઇવ (Firebase)";
                statusBadge.className = "db-status-badge online";
                if (seedBtn) seedBtn.style.display = "inline-flex";
            } else {
                statusBadge.textContent = "ઓફલાઇન (LocalStorage)";
                statusBadge.className = "db-status-badge offline";
                if (seedBtn) seedBtn.style.display = "none";
            }
        }
    }

    async function fetchProfilesFromFirebase() {
        try {
            const snapshot = await firebaseDb.collection('profiles').orderBy('created_at', 'asc').get();
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });

            // Map fields back to app.js conventions
            approvedProfiles = data.filter(p => p.status === 'approved').map(p => ({
                id: p.id,
                name: p.name,
                gender: p.gender,
                age: p.age,
                education: p.education,
                city: p.city,
                state: p.state,
                mobile: p.mobile || p.mobile_number || '',
                photoUrl: p.photo_url || p.photoUrl,
                pdfUrl: p.pdf_url || p.pdfUrl,
                isImageBioData: p.is_image_biodata || p.isImageBioData || false,
                addedAt: p.created_at ? (typeof p.created_at === 'string' ? p.created_at : (p.created_at.toDate ? p.created_at.toDate().toISOString() : new Date(p.created_at).toISOString())) : null
            }));

            pendingSubmissions = data.filter(p => p.status === 'pending').map(p => ({
                id: p.id,
                name: p.name,
                gender: p.gender,
                age: p.age,
                education: p.education,
                city: p.city,
                state: p.state,
                mobile: p.mobile || p.mobile_number || '',
                photoUrl: p.photo_url || p.photoUrl,
                pdfUrl: p.pdf_url || p.pdfUrl,
                isImageBioData: p.is_image_biodata || p.isImageBioData || false
            }));

            console.log(`Fetched ${data.length} profiles from Firebase.`);
            return true;
        } catch (err) {
            console.error("Exception fetching from Firebase:", err);
            return false;
        }
    }

    async function initApp() {
        checkFirebase();
        loadLocalStorage();
        setupTheme();
        
        try {
            const response = await fetch('biodatas.json');
            if (response.ok) {
                seedProfiles = await response.json();
            } else {
                console.error("Failed to load seed profiles.");
                seedProfiles = [];
            }
        } catch (error) {
            console.error("Error fetching biodatas.json:", error);
            seedProfiles = [];
        }

        if (isFirebaseEnabled) {
            const success = await fetchProfilesFromFirebase();
            if (success) {
                // Firebase is the source of truth
                seedProfiles = [];
            } else {
                console.warn("Firebase fetch failed. Falling back to local data.");
                isFirebaseEnabled = false;
                // Force status badge update to offline
                const statusBadge = document.getElementById('admin-db-status');
                const seedBtn = document.getElementById('admin-seed-btn');
                if (statusBadge) {
                    statusBadge.textContent = "ઓફલાઇન (LocalStorage - Fallback)";
                    statusBadge.className = "db-status-badge offline";
                    if (seedBtn) seedBtn.style.display = "none";
                }
            }
        }

        combineProfiles();
        populateFilterDropdowns();
        renderProfilesGrid();
        updateStats();
        
        if (sessionStorage.getItem('soulsync_admin_auth') === 'true') {
            showAdminDashboard();
        }
    }

    function combineProfiles() {
        activeProfiles = [...seedProfiles, ...approvedProfiles];
    }

    function updateStats() {
        adminStatPendingEl.textContent = pendingSubmissions.length;
        adminStatApprovedEl.textContent = approvedProfiles.length;
        adminStatTotalLiveEl.textContent = activeProfiles.length;
    }

    // ==========================================
    // 5. RENDERING & FILTER LOGIC
    // ==========================================

    function populateFilterDropdowns() {
        const selectedLoc = locationSelect.value;
        const selectedState = stateSelect.value;

        locationSelect.innerHTML = '<option value="all">બધા શહેરો</option>';
        stateSelect.innerHTML = '<option value="all">બધા રાજ્યો</option>';

        const cities = Array.from(new Set(activeProfiles.map(p => p.city))).sort();
        cities.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            locationSelect.appendChild(option);
        });

        const states = Array.from(new Set(activeProfiles.map(p => p.state))).sort();
        states.forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            stateSelect.appendChild(option);
        });

        if (Array.from(locationSelect.options).some(opt => opt.value === selectedLoc)) {
            locationSelect.value = selectedLoc;
        }
        if (Array.from(stateSelect.options).some(opt => opt.value === selectedState)) {
            stateSelect.value = selectedState;
        }
    }

    let displayLimit = 10;

    function renderProfilesGrid(resetPagination = true) {
        if (resetPagination) {
            displayLimit = 10;
        }
        profilesGrid.innerHTML = '';
        
        const filtered = activeProfiles.filter(profile => {
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchName = profile.name.toLowerCase().includes(searchLower);
                const matchCity = profile.city.toLowerCase().includes(searchLower);
                const matchState = profile.state.toLowerCase().includes(searchLower);
                
                if (!matchName && !matchCity && !matchState) {
                    return false;
                }
            }

            if (filters.gender !== 'all') {
                const queryGender = filters.gender === 'Male' ? 'પુરુષ' : 'સ્ત્રી';
                if (profile.gender !== queryGender) {
                    return false;
                }
            }

            if (profile.age < filters.ageMin || profile.age > filters.ageMax) {
                return false;
            }

            if (filters.location !== 'all' && profile.city !== filters.location) {
                return false;
            }

            if (filters.state !== 'all' && profile.state !== filters.state) {
                return false;
            }

            if (filters.bookmarksOnly && !bookmarkedIds.has(profile.id)) {
                return false;
            }

            return true;
        });

        filtered.sort((a, b) => a.age - b.age);
       
        const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentProfiles = filtered.filter(profile => {
            const addedAt = getProfileAddedAt(profile);
            return addedAt && addedAt >= recentThreshold;
        }).sort((a, b) => getProfileAddedAt(b) - getProfileAddedAt(a));

        if (activeDirectoryView === 'recent') {
            resultsCountEl.textContent = `${recentProfiles.length} તાજેતરનાા બાયોડેટા ઉપલબ્ધ ...`;
            recentSectionEl.style.display = 'block';
            profilesGrid.style.display = 'none';
            recentProfilesGrid.innerHTML = '';

            if (recentProfiles.length === 0) {
                recentProfilesGrid.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        <h3>તાજેતરના બાયોડેટા મળ્યા નથી</h3>
                        <p>મહેરબાની કરીને અન્ય ફિલ્ટર વિકલ્પો અજમાવો અથવા પછીથી ફરી તપાસો.</p>
                    </div>
                `;
            } else {
                recentProfiles.forEach(profile => {
                    recentProfilesGrid.appendChild(createProfileCard(profile));
                });
            }

            renderActiveFiltersPills();
            return;
        }

        resultsCountEl.textContent = `${filtered.length} યુવકોના બાયોડેટા ઉપલબ્ધ ...`;
        recentSectionEl.style.display = 'none';
        recentProfilesGrid.innerHTML = '';
        profilesGrid.style.display = 'grid';
        profilesGrid.innerHTML = '';
        
        const profilesToRender = filtered.slice(0, displayLimit);
        profilesToRender.forEach(profile => {
            profilesGrid.appendChild(createProfileCard(profile));
        });

        // Add Load More button / Infinite Scroll sentinel if there are more profiles to show
        if (filtered.length > displayLimit) {
            const loadMoreContainer = document.createElement('div');
            loadMoreContainer.id = 'load-more-container';
            loadMoreContainer.className = 'load-more-container';
            loadMoreContainer.style.gridColumn = '1 / -1';
            loadMoreContainer.style.textAlign = 'center';
            loadMoreContainer.style.padding = '2rem 1rem';

            const loadMoreBtn = document.createElement('button');
            loadMoreBtn.className = 'secondary-btn';
            loadMoreBtn.style.minWidth = '200px';
            loadMoreBtn.textContent = 'વધુ બાયોડેટા લોડ કરો (Load More)';
            loadMoreBtn.addEventListener('click', () => {
                displayLimit += 10;
                renderProfilesGrid(false);
            });

            loadMoreContainer.appendChild(loadMoreBtn);
            profilesGrid.appendChild(loadMoreContainer);

            // Infinite Scroll using IntersectionObserver
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    if (entries[0].isIntersecting) {
                        observer.disconnect();
                        displayLimit += 10;
                        renderProfilesGrid(false);
                    }
                }, { threshold: 0.1, rootMargin: '100px' });
                observer.observe(loadMoreBtn);
            }
        }

        renderActiveFiltersPills();
    }

    function toggleBookmark(id, buttonEl) {
        if (bookmarkedIds.has(id)) {
            bookmarkedIds.delete(id);
            buttonEl.classList.remove('bookmarked');
            buttonEl.title = "મનપસંદ કરો";
        } else {
            bookmarkedIds.add(id);
            buttonEl.classList.add('bookmarked');
            buttonEl.title = "મનપસંદમાંથી દૂર કરો";
        }
        saveBookmarks();
        
        if (filters.bookmarksOnly) {
            renderProfilesGrid();
        }
    }

    function getProfileAddedAt(profile) {
        if (!profile) return null;
        const rawDate = profile.addedAt || profile.created_at || profile.submissionDate || profile.createdAt || profile.dateAdded;
        if (!rawDate) return null;
        const parsed = new Date(rawDate);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function createProfileCard(profile) {
        const isBookmarked = bookmarkedIds.has(profile.id);
        const cardEl = document.createElement('div');
        cardEl.className = 'profile-card-horizontal';

        let avatarHtml = '';
        if (profile.photoUrl) {
            avatarHtml = `<img src="${profile.photoUrl}" alt="${profile.name}" class="horizontal-avatar-image" loading="lazy">`;
        } else {
            avatarHtml = getInitials(profile.name);
        }

        cardEl.innerHTML = `
            <div class="horizontal-card-left">
                <div class="horizontal-avatar-container" style="${profile.photoUrl ? '' : 'background: ' + getGradientByName(profile.name)}">
                    ${avatarHtml}
                </div>
            </div>
            
            <div class="horizontal-card-right">
                <div class="horizontal-card-main-content">
                    <div class="horizontal-card-header">
                        <h3 class="horizontal-profile-name">${profile.name}</h3>
                        <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" data-id="${profile.id}" title="${isBookmarked ? 'મનપસંદમાંથી દૂર કરો' : 'મનપસંદ કરો'}">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="horizontal-meta-row">
                        <span class="meta-pill age-pill">${profile.age} વર્ષ</span>
                        <span class="meta-pill education-pill">🎓 અભ્યાસ: ${profile.education || 'N/A'}</span>
                        <span class="meta-pill location-pill">📍 ${profile.city}, ${profile.state}</span>
                    </div>
                </div>
                
                <div class="horizontal-card-footer">
                    <button class="primary-btn w-100 view-pdf-trigger-btn" data-id="${profile.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        બાયો-ડેટા જુઓ
                    </button>
                </div>
            </div>
        `;

        cardEl.querySelector('.bookmark-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleBookmark(profile.id, e.currentTarget);
        });

        cardEl.querySelector('.view-pdf-trigger-btn').addEventListener('click', () => {
            openProfileModal(profile);
        });

        return cardEl;
    }

    function renderActiveFiltersPills() {
        activePillsContainer.innerHTML = '';
        const activePills = [];
        
        if (filters.search) {
            activePills.push({ key: 'search', label: `શોધ: "${filters.search}"` });
        }
        if (filters.gender !== 'all') {
            const genderLbl = filters.gender === 'Male' ? 'પુરુષ' : 'સ્ત્રી';
            activePills.push({ key: 'gender', label: `લિંગ: ${genderLbl}` });
        }
        if (filters.ageMin > 20 || filters.ageMax < 80) {
            activePills.push({ key: 'age', label: `ઉંમર: ${filters.ageMin}-${filters.ageMax}` });
        }
        if (filters.location !== 'all') {
            activePills.push({ key: 'location', label: `શહેર: ${filters.location}` });
        }
        if (filters.state !== 'all') {
            activePills.push({ key: 'state', label: `રાજ્ય: ${filters.state}` });
        }
        if (filters.bookmarksOnly) {
            activePills.push({ key: 'bookmarksOnly', label: 'માત્ર મનપસંદ' });
        }

        if (activePills.length > 0) {
            activePills.forEach(pill => {
                const pillEl = document.createElement('div');
                pillEl.className = 'filter-pill';
                pillEl.innerHTML = `
                    <span>${pill.label}</span>
                    <button class="filter-pill-clear" data-key="${pill.key}">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                `;
                pillEl.querySelector('button').addEventListener('click', () => {
                    clearFilterKey(pill.key);
                });
                activePillsContainer.appendChild(pillEl);
            });
            
            const clearAllEl = document.createElement('button');
            clearAllEl.className = 'text-btn';
            clearAllEl.style.fontSize = '0.8rem';
            clearAllEl.style.padding = '0.35rem 0.5rem';
            clearAllEl.textContent = 'બધા ફિલ્ટર્સ સાફ કરો';
            clearAllEl.addEventListener('click', resetAllFilters);
            activePillsContainer.appendChild(clearAllEl);
        }
    }

    function clearFilterKey(key) {
        if (key === 'search') {
            filters.search = "";
            searchInput.value = "";
        } else if (key === 'gender') {
            filters.gender = "all";
            document.getElementById('gender-all').checked = true;
        } else if (key === 'age') {
            filters.ageMin = 20;
            filters.ageMax = 80;
            ageMinInput.value = 20;
            ageMaxInput.value = 80;
            ageDisplay.textContent = "20 - 80";
        } else if (key === 'location') {
            filters.location = "all";
            locationSelect.value = "all";
        } else if (key === 'state') {
            filters.state = "all";
            stateSelect.value = "all";
        } else if (key === 'bookmarksOnly') {
            filters.bookmarksOnly = false;
            bookmarksCheckbox.checked = false;
        }
        renderProfilesGrid();
    }

    function resetAllFilters() {
        filters.search = "";
        filters.gender = "all";
        filters.ageMin = 20;
        filters.ageMax = 80;
        filters.location = "all";
        filters.state = "all";
        filters.bookmarksOnly = false;

        searchInput.value = "";
        document.getElementById('gender-all').checked = true;
        ageMinInput.value = 20;
        ageMaxInput.value = 80;
        ageDisplay.textContent = "20 - 80";
        locationSelect.value = "all";
        stateSelect.value = "all";
        bookmarksCheckbox.checked = false;

        renderProfilesGrid();
    }

    // ==========================================
    // 6. EVENT LISTENERS FOR FILTERS
    // ==========================================

    resetFiltersBtn.addEventListener('click', resetAllFilters);
    
    Array.from(genderRadios).forEach(radio => {
        radio.addEventListener('change', (e) => {
            filters.gender = e.target.value;
            renderProfilesGrid();
        });
    });

    ageMinInput.addEventListener('input', () => {
        let min = parseInt(ageMinInput.value);
        let max = parseInt(ageMaxInput.value);
        if (min > max) {
            ageMinInput.value = max;
            min = max;
        }
        filters.ageMin = min;
        ageDisplay.textContent = `${min} - ${max}`;
        renderProfilesGrid();
    });

    ageMaxInput.addEventListener('input', () => {
        let min = parseInt(ageMinInput.value);
        let max = parseInt(ageMaxInput.value);
        if (max < min) {
            ageMaxInput.value = min;
            max = min;
        }
        filters.ageMax = max;
        ageDisplay.textContent = `${min} - ${max}`;
        renderProfilesGrid();
    });

    locationSelect.addEventListener('change', (e) => {
        filters.location = e.target.value;
        renderProfilesGrid();
    });

    stateSelect.addEventListener('change', (e) => {
        filters.state = e.target.value;
        renderProfilesGrid();
    });

    bookmarksCheckbox.addEventListener('change', (e) => {
        filters.bookmarksOnly = e.target.checked;
        renderProfilesGrid();
    });

    viewToggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-view');
            if (activeDirectoryView === targetView) return;
            activeDirectoryView = targetView;
            viewToggleButtons.forEach(toggle => {
                toggle.classList.toggle('active', toggle.getAttribute('data-view') === targetView);
            });
            renderProfilesGrid();
        });
    });

    let searchDebounce;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            filters.search = e.target.value.trim();
            renderProfilesGrid();
        }, 200);
    });

    // ==========================================
    // 7. TAB-VIEW NAVIGATION
    // ==========================================
    
    function switchView(targetView) {
        navLinks.forEach(link => {
            const linkView = link.getAttribute('data-view');
            if (linkView === targetView) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        Object.keys(views).forEach(v => {
            if (v === targetView) {
                views[v].classList.add('active');
            } else {
                views[v].classList.remove('active');
            }
        });

        if (targetView === 'admin') {
            if (sessionStorage.getItem('soulsync_admin_auth') === 'true') {
                showAdminDashboard();
            } else {
                showAdminLogin();
            }
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetView = e.currentTarget.getAttribute('data-view');
            switchView(targetView);
        });
    });

    // ==========================================
    // 8. MOBILE FILTER DRAWER INTERACTION
    // ==========================================
    
    function openMobileFilters() {
        filterSidebarEl.classList.add('active');
        sidebarOverlayBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileFilters() {
        filterSidebarEl.classList.remove('active');
        sidebarOverlayBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileFilterToggleBtn) {
        mobileFilterToggleBtn.addEventListener('click', openMobileFilters);
    }
    if (mobileFilterCloseBtn) {
        mobileFilterCloseBtn.addEventListener('click', closeMobileFilters);
    }
    if (mobileFilterApplyBtn) {
        mobileFilterApplyBtn.addEventListener('click', closeMobileFilters);
    }
    if (sidebarOverlayBackdrop) {
        sidebarOverlayBackdrop.addEventListener('click', closeMobileFilters);
    }

    // ==========================================
    // 9. THEME / BOOTSTRAP
    // ==========================================

    function setupTheme() {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // ==========================================
    // 10. DETAILS MODAL LOGIC (With PDF / Image Duality)
    // ==========================================

    function openProfileModal(profile) {
        if (profile.photoUrl) {
            modalAvatar.style.background = 'none';
            modalAvatar.innerHTML = `<img src="${profile.photoUrl}" alt="${profile.name}" class="avatar-image">`;
        } else {
            modalAvatar.innerHTML = '';
            modalAvatar.textContent = getInitials(profile.name);
            modalAvatar.style.background = getGradientByName(profile.name);
        }

        modalName.textContent = profile.name;
        modalGender.textContent = profile.gender;
        modalAge.textContent = `${profile.age} વર્ષ`;
        document.getElementById('modal-education').textContent = profile.education || 'N/A';
        modalMobile.textContent = profile.mobile || 'N/A';
        modalCity.textContent = profile.city;
        modalState.textContent = profile.state;

        const isBookmarked = bookmarkedIds.has(profile.id);
        const heartSvg = modalBookmarkBtn.querySelector('svg');
        const bookmarkText = modalBookmarkBtn.querySelector('.btn-text');
        
        if (isBookmarked) {
            modalBookmarkBtn.classList.add('bookmarked');
            heartSvg.style.fill = 'var(--color-heart)';
            heartSvg.style.color = 'var(--color-heart)';
            bookmarkText.textContent = "મનપસંદમાં છે";
        } else {
            modalBookmarkBtn.classList.remove('bookmarked');
            heartSvg.style.fill = 'none';
            heartSvg.style.color = 'currentColor';
            bookmarkText.textContent = "મનપસંદ કરો";
        }

        // const newBookmarkBtn = modalBookmarkBtn.cloneNode(true);
        // modalBookmarkBtn.parentNode.replaceChild(newBookmarkBtn, modalBookmarkBtn);
        
        // const activeModalBookmarkBtn = document.getElementById('modal-bookmark-btn');
        // activeModalBookmarkBtn.addEventListener('click', () => {
        //     const wasBookmarked = bookmarkedIds.has(profile.id);
        //     if (wasBookmarked) {
        //         bookmarkedIds.delete(profile.id);
        //         activeModalBookmarkBtn.classList.remove('bookmarked');
        //         activeModalBookmarkBtn.querySelector('svg').style.fill = 'none';
        //         activeModalBookmarkBtn.querySelector('svg').style.color = 'currentColor';
        //         activeModalBookmarkBtn.querySelector('.btn-text').textContent = "મનપસંદ કરો";
        //     } else {
        //         bookmarkedIds.add(profile.id);
        //         activeModalBookmarkBtn.classList.add('bookmarked');
        //         activeModalBookmarkBtn.querySelector('svg').style.fill = 'var(--color-heart)';
        //         activeModalBookmarkBtn.querySelector('svg').style.color = 'var(--color-heart)';
        //         activeModalBookmarkBtn.querySelector('.btn-text').textContent = "મનપસંદમાં છે";
        //     }
        //     saveBookmarks();
            
        //     const cardBtn = document.querySelector(`.bookmark-btn[data-id="${profile.id}"]`);
        //     if (cardBtn) {
        //         if (bookmarkedIds.has(profile.id)) {
        //             cardBtn.classList.add('bookmarked');
        //             cardBtn.querySelector('svg').style.fill = 'var(--color-heart)';
        //         } else {
        //             cardBtn.classList.remove('bookmarked');
        //             cardBtn.querySelector('svg').style.fill = 'none';
        //         }
        //     }
        //     if (filters.bookmarksOnly) {
        //         renderProfilesGrid();
        //     }
        // });

       // Directly overwrite the onclick handler to instantly wipe out previous click listeners
        modalBookmarkBtn.onclick = () => {
            const wasBookmarked = bookmarkedIds.has(profile.id);
            if (wasBookmarked) {
                bookmarkedIds.delete(profile.id);
                modalBookmarkBtn.classList.remove('bookmarked');
                modalBookmarkBtn.querySelector('svg').style.fill = 'none';
                modalBookmarkBtn.querySelector('svg').style.color = 'currentColor';
                modalBookmarkBtn.querySelector('.btn-text').textContent = "મનપસંદ કરો";
            } else {
                bookmarkedIds.add(profile.id);
                modalBookmarkBtn.classList.add('bookmarked');
                modalBookmarkBtn.querySelector('svg').style.fill = 'var(--color-heart)';
                modalBookmarkBtn.querySelector('svg').style.color = 'var(--color-heart)';
                modalBookmarkBtn.querySelector('.btn-text').textContent = "મનપસંદમાં છે";
            }
            saveBookmarks();
            
            const cardBtn = document.querySelector(`.bookmark-btn[data-id="${profile.id}"]`);
            if (cardBtn) {
                if (bookmarkedIds.has(profile.id)) {
                    cardBtn.classList.add('bookmarked');
                    cardBtn.querySelector('svg').style.fill = 'var(--color-heart)';
                } else {
                    cardBtn.classList.remove('bookmarked');
                    cardBtn.querySelector('svg').style.fill = 'none';
                }
            }
            if (filters.bookmarksOnly) {
                renderProfilesGrid();
            }
        };

        modalDownloadBtn.href = profile.pdfUrl;
        const fileExt = profile.isImageBioData ? 'png' : 'pdf';
        modalDownloadBtn.download = `${profile.name.replace(/\s+/g, '_')}_Biodata.${fileExt}`;
        
        modalOpenNewBtn.href = profile.pdfUrl;

        renderBioDataPreview(profile.pdfUrl, profile.isImageBioData, pdfViewerWrapper, pdfFallbackMsg, pdfFallbackOpen);

        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function renderBioDataPreview(fileUrl, isImage, wrapperEl, fallbackEl, fallbackOpenEl) {
        wrapperEl.innerHTML = '';
        wrapperEl.style.display = 'block';
        fallbackEl.style.display = 'none';

        if (isImage) {
            const img = document.createElement('img');
            img.src = fileUrl;
            img.className = 'preview-image-full';
            wrapperEl.appendChild(img);
        } else {
            const isLocalFile = window.location.protocol === 'file:';
            const isBase64 = fileUrl.startsWith('data:application/pdf;base64,');

            if (isLocalFile && !isBase64) {
                wrapperEl.style.display = 'none';
                fallbackEl.style.display = 'flex';
                fallbackOpenEl.href = fileUrl;
            } else {
                const iframe = document.createElement('iframe');
                iframe.src = fileUrl;
                iframe.className = 'pdf-iframe';
                iframe.onerror = () => {
                    wrapperEl.style.display = 'none';
                    fallbackEl.style.display = 'flex';
                };
                wrapperEl.appendChild(iframe);
            }
        }
    }

    function closeModal() {
        profileModal.classList.remove('active');
        pdfViewerWrapper.innerHTML = '';
        document.body.style.overflow = '';
    }

    modalCloseBtn.addEventListener('click', closeModal);
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && profileModal.classList.contains('active')) {
            closeModal();
        }
    });

    // ==========================================
    // 11. SUBMISSION FORM & FILE UPLOADS
    // ==========================================

    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

    photoBrowseBtn.addEventListener('click', () => {
        photoInput.click();
    });

    photoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            tempPhotoFile = file;
            handleUploadedPhoto(file, photoPreviewCircle, (b64) => {
                tempPhotoBase64 = b64;
            });
        }
    });

    function handleUploadedPhoto(file, previewEl, callback) {
        if (!file.type.startsWith('image/')) {
            showSubmitAlert("પ્રોફાઇલ ફોટો માટે ફક્ત ઇમેજ ફાઇલો (JPG, PNG, WEBP) જ માન્ય છે.", "danger");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            showSubmitAlert("ફોટો ફાઇલનું કદ ૧ MB થી વધુ ન હોવું જોઈએ.", "danger");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const b64 = event.target.result;
            previewEl.style.backgroundImage = `url(${b64})`;
            previewEl.style.borderStyle = 'solid';
            previewEl.querySelector('span').style.display = 'none';
            callback(b64);
        };
        reader.readAsDataURL(file);
    }

    // PDF/Image Drop-zone
    ['dragenter', 'dragover'].forEach(eventName => {
        pdfDropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            pdfDropZone.classList.add('drop-zone-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        pdfDropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            pdfDropZone.classList.remove('drop-zone-over');
        }, false);
    });

    pdfDropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleUploadedBioData(files[0]);
        }
    });

    pdfDropZone.addEventListener('click', () => {
        pdfInput.click();
    });

    pdfInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUploadedBioData(e.target.files[0]);
        }
    });

    function handleUploadedBioData(file) {
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

        if (!isPdf && !isImg) {
            showSubmitAlert("ફક્ત PDF અથવા ઇમેજ ફોર્મેટ (JPG, PNG) ફાઇલો જ સ્વીકારવામાં આવે છે.", "danger");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            showSubmitAlert("બાયો-ડેટા ફાઇલનું કદ ૨ MB થી વધુ ન હોવું જોઈએ.", "danger");
            return;
        }

        tempPdfFile = file;
        tempPdfName = file.name;
        tempIsImageBioData = isImg;

        const sizeKB = file.size / 1024;
        tempPdfSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(2)} MB` : `${sizeKB.toFixed(1)} KB`;

        const reader = new FileReader();
        reader.onload = (event) => {
            tempPdfBase64 = event.target.result;
            pdfDropZone.style.display = 'none';
            selectedFileNameEl.textContent = tempPdfName;
            selectedFileSizeEl.textContent = tempPdfSize;
            filePreviewContainer.style.display = 'flex';
            submitMessageEl.style.display = 'none';
        };
        reader.onerror = () => {
            showSubmitAlert("ફાઇલ લોડ કરવામાં ભૂલ આવી છે.", "danger");
        };
        reader.readAsDataURL(file);
    }

    removeFileBtn.addEventListener('click', () => {
        resetFileSelection();
    });

    function resetFileSelection() {
        tempPdfBase64 = null;
        tempPdfFile = null;
        tempPdfName = "";
        tempPdfSize = "";
        tempIsImageBioData = false;
        pdfInput.value = "";
        filePreviewContainer.style.display = 'none';
        pdfDropZone.style.display = 'block';
    }

    function resetPhotoSelection() {
        tempPhotoBase64 = "";
        tempPhotoFile = null;
        photoInput.value = "";
        photoPreviewCircle.style.backgroundImage = 'none';
        photoPreviewCircle.style.borderStyle = 'dashed';
        photoPreviewCircle.querySelector('span').style.display = 'block';
    }

    function showSubmitAlert(msg, type) {
        submitMessageEl.textContent = msg;
        submitMessageEl.className = `alert-box alert-${type}`;
        submitMessageEl.style.display = 'block';
    }

    submissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!tempPdfBase64) {
            showSubmitAlert("કૃપા કરીને બાયો-ડેટા ફાઇલ અપલોડ કરો.", "danger");
            return;
        }

        if (!tempPhotoBase64) {
            showSubmitAlert("કૃપા કરીને પ્રોફાઇલ ફોટો અપલોડ કરો.", "danger");
            return;
        }

        const name = document.getElementById('submit-name').value.trim();
        const rawGender = document.getElementById('submit-gender').value;
        const age = parseInt(document.getElementById('submit-age').value);
        const mobile = document.getElementById('submit-mobile').value.trim();
        const city = document.getElementById('submit-location').value.trim();
        const state = document.getElementById('submit-state').value.trim();
        const education = document.getElementById('submit-education').value.trim();

        const gender = rawGender === 'Male' ? 'પુરુષ' : 'સ્ત્રી';
        const normalizedMobile = normalizeMobileNumber(mobile);

        const btnText = submitProfileBtn.querySelector('.btn-text');
        const spinner = submitProfileBtn.querySelector('.btn-spinner');

        if (!normalizedMobile) {
            showSubmitAlert('કૃપા કરીને 10 અંકોનો મોબાઈલ નંબર દાખલ કરો.', 'danger');
            submitProfileBtn.disabled = false;
            btnText.style.display = 'block';
            spinner.style.display = 'none';
            return;
        }

        submitProfileBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'block';

        if (isFirebaseEnabled) {
            try {
                const timestamp = Date.now();
                const submissionId = `submit_${timestamp}`;
                
                // 1. Upload Photo to Storage
                const photoExt = tempPhotoFile.name.split('.').pop() || 'png';
                const photoPath = `photos/photo_${timestamp}.${photoExt}`;
                const photoRef = firebaseStorage.ref().child(photoPath);
                
                const metadata = { cacheControl: 'public,max-age=31536000' };
                await photoRef.put(tempPhotoFile, { customMetadata: metadata });
                const finalPhotoUrl = await photoRef.getDownloadURL();

                // 2. Upload Bio-data to Storage
                const pdfExt = tempPdfFile.name.split('.').pop() || 'pdf';
                const pdfPath = `biodatas/biodata_${timestamp}.${pdfExt}`;
                const pdfRef = firebaseStorage.ref().child(pdfPath);
                await pdfRef.put(tempPdfFile, { customMetadata: metadata });
                const finalPdfUrl = await pdfRef.getDownloadURL();

                // 3. Insert record into database
                await firebaseDb.collection('profiles').doc(submissionId).set({
                    id: submissionId,
                    name: name,
                    gender: gender,
                    age: age,
                    education: education,
                    mobile: normalizedMobile,
                    city: city,
                    state: state,
                    photo_url: finalPhotoUrl,
                    pdf_url: finalPdfUrl,
                    is_image_biodata: tempIsImageBioData,
                    status: 'pending',
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Success
                submissionForm.reset();
                resetFileSelection();
                resetPhotoSelection();
                showSubmitAlert("બાયો-ડેટા સફળતાપૂર્વક મોકલવામાં આવ્યો છે! વેરિફિકેશન પછી પ્રોફાઇલ સક્રિય થશે.", "success");
                
                // Re-fetch tables if admin authenticated
                if (sessionStorage.getItem('soulsync_admin_auth') === 'true') {
                    await fetchProfilesFromFirebase();
                    combineProfiles();
                    updateStats();
                    renderPendingTable();
                    renderLiveTable();
                }
            } catch (err) {
                console.error("Firebase upload error:", err);
                showSubmitAlert(`ડેટાબેઝ અપલોડ ભૂલ: ${err.message || err}`, "danger");
            } finally {
                submitProfileBtn.disabled = false;
                btnText.style.display = 'block';
                spinner.style.display = 'none';
            }
        } else {
            // LocalStorage fallback flow
            setTimeout(() => {
                const newSubmission = {
                    id: `submit_${Date.now()}`,
                    name,
                    gender,
                    age,
                    education,
                    mobile: normalizedMobile,
                    city,
                    state,
                    photoUrl: tempPhotoBase64,
                    pdfUrl: tempPdfBase64,
                    isImageBioData: tempIsImageBioData,
                    submissionDate: new Date().toLocaleDateString(),
                    addedAt: new Date().toISOString()
                };

                pendingSubmissions.push(newSubmission);
                savePendingSubmissions();
                updateStats();

                submissionForm.reset();
                resetFileSelection();
                resetPhotoSelection();
                showSubmitAlert("બાયો-ડેટા સફળતાપૂર્વક મોકલવામાં આવ્યો છે! વેરિફિકેશન પછી પ્રોફાઇલ સક્રિય થશે.", "success");

                submitProfileBtn.disabled = false;
                btnText.style.display = 'block';
                spinner.style.display = 'none';

                views.submit.scrollTop = 0;
                
                if (sessionStorage.getItem('soulsync_admin_auth') === 'true') {
                    renderPendingTable();
                    renderLiveTable();
                }
            }, 1200);
        }
    });

    // ==========================================
    // 12. ADMIN AUTHENTICATION
    // ==========================================

    function showAdminLogin() {
        adminLoginView.style.display = 'block';
        adminDashboardView.style.display = 'none';
        loginErrorMsg.style.display = 'none';
        adminPasscodeInput.value = '';
    }

    function showAdminDashboard() {
        adminLoginView.style.display = 'none';
        adminDashboardView.style.display = 'block';
        if (isFirebaseEnabled) {
            fetchProfilesFromFirebase().then(() => {
                combineProfiles();
                populateFilterDropdowns();
                renderProfilesGrid();
                updateStats();
                renderPendingTable();
                renderLiveTable();
            });
        } else {
            renderPendingTable();
            renderLiveTable();
        }
    }

    adminLoginForm.addEventListener('submit', async (e) => {
        // e.preventDefault();
        // const inputPass = adminPasscodeInput.value.trim();

        // if (inputPass === ADMIN_PASSCODE) {
        //     sessionStorage.setItem('soulsync_admin_auth', 'true');
        //     loginErrorMsg.style.display = 'none';
        //     showAdminDashboard();
        // } else {
        //     loginErrorMsg.style.display = 'block';
        //     adminPasscodeInput.value = '';
        // }
        e.preventDefault();
        
        const email = adminEmailInput.value.trim();
        const password = adminPasscodeInput.value;
        
        // Ensure error messages are cleared initially
        loginErrorMsg.style.display = 'none';
        loginErrorMsg.textContent = '';

        // Check if Firebase is active
        if (!isFirebaseEnabled || !firebaseAuth) {
            loginErrorMsg.textContent = "ડેટાબેઝ જોડાણ ઉપલબ્ધ નથી (Firebase Offline).";
            loginErrorMsg.style.display = 'block';
            return;
        }

        try {
            // Use Firebase authentication system
            const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Successful Login
            if (user) {
                // Save token tracking to SessionStorage
                sessionStorage.setItem('soulsync_admin_auth', 'true');
                sessionStorage.setItem('soulsync_admin_user', JSON.stringify({ uid: user.uid, email: user.email }));
                
                // Clear inputs
                adminEmailInput.value = '';
                adminPasscodeInput.value = '';
                
                // Transition UI view into Admin Dashboard
                showAdminDashboard();
            }
        } catch (err) {
            console.error("Authentication error:", err);
            // Translate or display meaningful error to the admin user
            loginErrorMsg.textContent = "ખોટો ઈમેઈલ અથવા પાસવર્ડ! કૃપા કરીને ફરીથી પ્રયાસ કરો.";
            loginErrorMsg.style.display = 'block';
        }
    });

    adminLogoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('soulsync_admin_auth');
        showAdminLogin();
       // if (isSupabaseEnabled && supabaseClient) {
       //      await supabaseClient.auth.signOut();
       //  }
       //  sessionStorage.removeItem('soulsync_admin_auth');
       //  sessionStorage.removeItem('soulsync_admin_user');
        
       //  // Go back to login screen or default directory view
       //  adminDashboardView.style.display = 'none';
       //  adminLoginView.style.display = 'block';
    });

    // ==========================================
    // 13. ADMIN PENDING REVIEW & METADATA EDITOR
    // ==========================================

    function renderPendingTable() {
        pendingTableBody.innerHTML = '';

        if (pendingSubmissions.length === 0) {
            pendingTableBody.innerHTML = `
                <tr class="empty-table-row">
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                        કોઈ નવી સબમિશન અરજી બાકી નથી.
                    </td>
                </tr>
            `;
            return;
        }

        pendingSubmissions.forEach(sub => {
            const tr = document.createElement('tr');
            
            let avatarHtml = '';
            if (sub.photoUrl) {
                avatarHtml = `<img src="${sub.photoUrl}" alt="${sub.name}" class="avatar-image">`;
            } else {
                avatarHtml = getInitials(sub.name);
            }

            tr.innerHTML = `
                <td data-label="ઉમેદવાર વિગત">
                    <div class="admin-table-avatar">
                        <div class="avatar-mini" style="${sub.photoUrl ? '' : 'background: ' + getGradientByName(sub.name)}">
                            ${avatarHtml}
                        </div>
                        <div>
                            <div class="candidate-mini-name">${sub.name}</div>
                            <div class="text-muted-mini">તારીખ: ${sub.submissionDate || 'N/A'}</div>
                            <div class="text-muted-mini">મોબાઈલ: ${sub.mobile || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td data-label="લિંગ / ઉંમર">${sub.gender} • ${sub.age} વર્ષ</td>
                <td data-label="અભ્યાસ">${sub.education || 'N/A'}</td>
                <td data-label="સ્થળ">${sub.city}, ${sub.state}</td>
                <td data-label="બાયો-ડેટા ફાઇલ">
                    <a href="#" class="pdf-link-btn view-pending-pdf-action" data-id="${sub.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                        બાયો-ડેટા જુઓ
                    </a>
                </td>
                <td data-label="એક્શન">
                    <div class="action-buttons-cell">
                        <button class="action-btn approve-btn" data-id="${sub.id}">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            ચકાસો અને મંજૂર કરો
                        </button>
                        <button class="action-btn reject-btn" data-id="${sub.id}">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            નામંજૂર
                        </button>
                    </div>
                </td>
            `;

            tr.querySelector('.view-pending-pdf-action').addEventListener('click', (e) => {
                e.preventDefault();
                openProfileModal(sub);
            });

            tr.querySelector('.approve-btn').addEventListener('click', () => {
                openAdminEditor(sub, true); // true = pending submission
            });

            tr.querySelector('.reject-btn').addEventListener('click', () => {
                rejectSubmission(sub.id);
            });

            pendingTableBody.appendChild(tr);
        });
    }

    // ==========================================
    // 14. ADMIN LIVE LISTINGS DIRECTORY MANAGER
    // ==========================================

    function renderLiveTable() {
        liveTableBody.innerHTML = '';

        if (activeProfiles.length === 0) {
            liveTableBody.innerHTML = `
                <tr class="empty-table-row">
                    <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
                        ડિરેક્ટરીમાં કોઈ સક્રિય પ્રોફાઇલ્સ નથી.
                    </td>
                </tr>
            `;
            return;
        }

        activeProfiles.forEach(profile => {
            const tr = document.createElement('tr');
            
            let avatarHtml = '';
            if (profile.photoUrl) {
                avatarHtml = `<img src="${profile.photoUrl}" alt="${profile.name}" class="avatar-image">`;
            } else {
                avatarHtml = getInitials(profile.name);
            }

            // Check if profile belongs to LocalStorage user submissions
            const isUserSubmission = approvedProfiles.some(p => p.id === profile.id);
            const sourceLabel = isUserSubmission ? "યુઝર સબમિશન" : "સિસ્ટમ ફાઇલ (JSON)";

            // Actions buttons differ based on source type
            let actionsHtml = '';
            if (isUserSubmission) {
                actionsHtml = `
                    <button class="action-btn approve-btn edit-live-btn" data-id="${profile.id}">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        વિગત સુધારો
                    </button>
                    <button class="action-btn reject-btn delete-live-btn" data-id="${profile.id}">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        ડિલીટ
                    </button>
                `;
            } else {
                actionsHtml = `
                    <button class="action-btn secondary-btn view-seed-edit-btn" style="padding: 0.4rem 0.75rem; font-size: 0.78rem;">
                        ફાઇલમાંથી બદલો
                    </button>
                `;
            }

            tr.innerHTML = `
                <td data-label="ઉમેદવાર વિગત">
                    <div class="admin-table-avatar">
                        <div class="avatar-mini" style="${profile.photoUrl ? '' : 'background: ' + getGradientByName(profile.name)}">
                            ${avatarHtml}
                        </div>
                        <div>
                            <div class="candidate-mini-name">${profile.name}</div>
                            <div class="text-muted-mini">મોબાઈલ: ${profile.mobile || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td data-label="લિંગ / ઉંમર">${profile.gender} • ${profile.age} વર્ષ</td>
                <td data-label="અભ્યાસ">${profile.education || 'N/A'}</td>
                <td data-label="સ્થળ">${profile.city}, ${profile.state}</td>
                <td data-label="સ્રોત" style="font-weight: 600; color: ${isUserSubmission ? 'var(--color-primary)' : 'var(--text-muted)'}">${sourceLabel}</td>
                <td data-label="એક્શન">
                    <div class="action-buttons-cell">
                        ${actionsHtml}
                    </div>
                </td>
            `;

            // Action triggers
            if (isUserSubmission) {
                tr.querySelector('.edit-live-btn').addEventListener('click', () => {
                    openAdminEditor(profile, false); // false = active live profile
                });
                tr.querySelector('.delete-live-btn').addEventListener('click', () => {
                    deleteLiveSubmission(profile.id);
                });
            } else {
                tr.querySelector('.view-seed-edit-btn').addEventListener('click', () => {
                    alert("આ પ્રોફાઇલ સીડ ડેટા ફાઇલની છે. તેને કાયમી માટે બદલવા કે ડિલીટ કરવા માટે તમારા કોમ્પ્યુટરમાં સગપણ સેતુ પ્રોજેક્ટ ફોલ્ડરમાંથી soulsync/biodatas.json ફાઇલ ખોલીને મેન્યુઅલી સુધારો કરો.");
                });
            }

            liveTableBody.appendChild(tr);
        });
    }

    function openAdminEditor(item, isPending) {
        if (isPending) {
            activeEditingSubmission = item;
            activeEditingLiveProfile = null;
        } else {
            activeEditingLiveProfile = item;
            activeEditingSubmission = null;
        }
        
        tempEditPhotoBase64 = item.photoUrl || "";

        editNameInput.value = item.name;
        editGenderSelect.value = item.gender === 'પુરુષ' ? 'Male' : 'Female';
        editAgeInput.value = item.age;
        document.getElementById('edit-education').value = item.education || '';
        editMobileInput.value = item.mobile || '';
        editCityInput.value = item.city;
        editStateInput.value = item.state;

        if (tempEditPhotoBase64) {
            editPhotoPreview.style.backgroundImage = `url(${tempEditPhotoBase64})`;
            editPhotoPreview.style.borderStyle = 'solid';
            editPhotoPreview.querySelector('span').style.display = 'none';
        } else {
            editPhotoPreview.style.backgroundImage = 'none';
            editPhotoPreview.style.borderStyle = 'dashed';
            editPhotoPreview.querySelector('span').style.display = 'block';
        }

        // Render PDF / Image preview
        renderBioDataPreview(item.pdfUrl, item.isImageBioData, adminEditorPdfWrapper, adminEditorPdfFallback, adminEditorPdfFallbackBtn);
        adminEditorPdfFallbackBtn.href = item.pdfUrl;
        const fileExt = item.isImageBioData ? 'png' : 'pdf';
        adminEditorPdfFallbackBtn.download = `${item.name.replace(/\s+/g, '_')}_Review.${fileExt}`;

        adminEditorModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    editPhotoBrowseBtn.addEventListener('click', () => {
        editPhotoFileInput.click();
    });

    editPhotoFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            tempEditPhotoFile = file;
            handleUploadedPhoto(file, editPhotoPreview, (b64) => {
                tempEditPhotoBase64 = b64;
            });
        }
    });

    if (editPdfFileInput) {
        editPdfFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                tempEditPdfFile = file;
                if (editPdfFileName) editPdfFileName.textContent = file.name;
                tempEditIsImageBioData = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
            }
        });
    }

    function closeAdminEditor() {
        adminEditorModal.classList.remove('active');
        adminEditorPdfWrapper.innerHTML = '';
        activeEditingSubmission = null;
        activeEditingLiveProfile = null;
        tempEditPhotoBase64 = "";
        tempEditPhotoFile = null;
        tempEditPdfFile = null;
        if (editPdfFileInput) editPdfFileInput.value = "";
        if (editPdfFileName) editPdfFileName.textContent = "ફાઇલ પસંદ કરેલ નથી";
        editPhotoFileInput.value = "";
        document.body.style.overflow = '';
        resetAdminCropper();
    }

    adminEditorCloseBtn.addEventListener('click', closeAdminEditor);
    adminEditorModal.addEventListener('click', (e) => {
        if (e.target === adminEditorModal) {
            closeAdminEditor();
        }
    });

    adminApprovalEditorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const approvedName = editNameInput.value.trim();
        const rawGender = editGenderSelect.value;
        const approvedAge = parseInt(editAgeInput.value);
        const approvedEducation = document.getElementById('edit-education').value.trim();
        const approvedMobile = editMobileInput.value.trim();
        const approvedCity = editCityInput.value.trim();
        const approvedState = editStateInput.value.trim();

        const approvedGender = rawGender === 'Male' ? 'પુરુષ' : 'સ્ત્રી';
        const normalizedApprovedMobile = normalizeMobileNumber(approvedMobile);

        if (!normalizedApprovedMobile) {
            alert('કૃપા કરીને યોગ્ય ભારતીય મોબાઇલ નંબર દાખલ કરો.');
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalBtnText;
            return;
        }

        const confirmBtn = document.getElementById('admin-confirm-approve-btn');
        const originalBtnText = confirmBtn.innerHTML;
        confirmBtn.disabled = true;
        confirmBtn.textContent = "પબ્લિશ થઈ રહ્યું છે...";

        if (isFirebaseEnabled) {
            try {
                let finalPhotoUrl = tempEditPhotoBase64;
                let finalPdfUrl = activeEditingSubmission ? activeEditingSubmission.pdfUrl : (activeEditingLiveProfile ? activeEditingLiveProfile.pdfUrl : null);
                let finalIsImageBioData = activeEditingSubmission ? activeEditingSubmission.isImageBioData : (activeEditingLiveProfile ? activeEditingLiveProfile.isImageBioData : false);

                const decodeFirebaseStorageUrl = (url) => {
                    if (!url || !url.includes('firebasestorage.googleapis.com')) return null;
                    try {
                        const match = url.split('/o/')[1];
                        if (match) {
                            const pathEncoded = match.split('?')[0];
                            return decodeURIComponent(pathEncoded);
                        }
                    } catch (err) {
                        console.warn("Failed to decode storage URL:", err);
                    }
                    return null;
                };

                // Upload new pdf/image biodata if it was selected
                if (tempEditPdfFile) {
                    const timestamp = Date.now();
                    const pdfExt = tempEditPdfFile.name.split('.').pop() || 'pdf';
                    const pdfPath = `biodatas/biodata_${timestamp}.${pdfExt}`;
                    const pdfRef = firebaseStorage.ref().child(pdfPath);
                    
                    const metadata = { cacheControl: 'public,max-age=31536000' };
                    await pdfRef.put(tempEditPdfFile, { customMetadata: metadata });
                    finalPdfUrl = await pdfRef.getDownloadURL();
                    finalIsImageBioData = tempEditIsImageBioData;

                    // Cleanup old file
                    try {
                        let oldPdfUrl = activeEditingSubmission ? activeEditingSubmission.pdfUrl : (activeEditingLiveProfile ? activeEditingLiveProfile.pdfUrl : null);
                        const oldPath = decodeFirebaseStorageUrl(oldPdfUrl);
                        if (oldPath) {
                            await firebaseStorage.ref().child(oldPath).delete();
                        }
                    } catch(e) {
                         console.warn('Could not delete old bio data:', e);
                    }
                }

                // Upload new photo if it was selected
                if (tempEditPhotoFile) {
                    const timestamp = Date.now();
                    const photoExt = tempEditPhotoFile.name.split('.').pop() || 'png';
                    const photoPath = `photos/photo_${timestamp}.${photoExt}`;
                    const photoRef = firebaseStorage.ref().child(photoPath);

                    const metadata = { cacheControl: 'public,max-age=31536000' };
                    await photoRef.put(tempEditPhotoFile, { customMetadata: metadata });
                    finalPhotoUrl = await photoRef.getDownloadURL();
                }

                if (activeEditingSubmission) {
                    await firebaseDb.collection('profiles').doc(activeEditingSubmission.id).update({
                        name: approvedName,
                        gender: approvedGender,
                        age: approvedAge,
                        education: approvedEducation,
                        mobile: normalizedApprovedMobile,
                        city: approvedCity,
                        state: approvedState,
                        photo_url: finalPhotoUrl || activeEditingSubmission.photoUrl,
                        pdf_url: finalPdfUrl,
                        is_image_biodata: finalIsImageBioData,
                        status: 'approved'
                    });

                } else if (activeEditingLiveProfile) {
                    await firebaseDb.collection('profiles').doc(activeEditingLiveProfile.id).update({
                        name: approvedName,
                        gender: approvedGender,
                        age: approvedAge,
                        education: approvedEducation,
                        mobile: normalizedApprovedMobile,
                        city: approvedCity,
                        state: approvedState,
                        photo_url: finalPhotoUrl || activeEditingLiveProfile.photoUrl,
                        pdf_url: finalPdfUrl,
                        is_image_biodata: finalIsImageBioData
                    });
                }

                tempEditPhotoFile = null;
                await fetchProfilesFromFirebase();
                combineProfiles();
                populateFilterDropdowns();
                renderProfilesGrid();
                updateStats();
                closeAdminEditor();
                renderPendingTable();
                renderLiveTable();

            } catch (err) {
                console.error("Firebase approval update error:", err);
                alert(`અપડેટ કરવામાં ભૂલ આવી: ${err.message || err}`);
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalBtnText;
            }
        } else {
            // LocalStorage offline logic
            if (activeEditingSubmission) {
                const approvedProfile = {
                    id: `profile_${Date.now()}`,
                    name: approvedName,
                    photoUrl: tempEditPhotoBase64 || activeEditingSubmission.photoUrl,
                    gender: approvedGender,
                    age: approvedAge,
                    education: approvedEducation,
                    mobile: normalizedApprovedMobile,
                    city: approvedCity,
                    state: approvedState,
                    pdfUrl: activeEditingSubmission.pdfUrl,
                    isImageBioData: activeEditingSubmission.isImageBioData,
                    addedAt: activeEditingSubmission.addedAt || activeEditingSubmission.submissionDate || new Date().toISOString()
                };

                const index = pendingSubmissions.findIndex(sub => sub.id === activeEditingSubmission.id);
                if (index > -1) {
                    pendingSubmissions.splice(index, 1);
                    savePendingSubmissions();
                }

                approvedProfiles.push(approvedProfile);
                saveApprovedSubmissions();
                
            } else if (activeEditingLiveProfile) {
                const index = approvedProfiles.findIndex(p => p.id === activeEditingLiveProfile.id);
                if (index > -1) {
                    approvedProfiles[index].name = approvedName;
                    approvedProfiles[index].gender = approvedGender;
                    approvedProfiles[index].age = approvedAge;
                    approvedProfiles[index].education = approvedEducation;
                    approvedProfiles[index].mobile = normalizedApprovedMobile;
                    approvedProfiles[index].city = approvedCity;
                    approvedProfiles[index].state = approvedState;
                    if (tempEditPhotoBase64) {
                        approvedProfiles[index].photoUrl = tempEditPhotoBase64;
                    }
                    saveApprovedSubmissions();
                }
            }

            combineProfiles();
            populateFilterDropdowns();
            renderProfilesGrid();
            updateStats();

            closeAdminEditor();
            renderPendingTable();
            renderLiveTable();
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalBtnText;
        }
    });

    adminRejectSubmissionBtn.addEventListener('click', () => {
        if (activeEditingSubmission) {
            const idToReject = activeEditingSubmission.id;
            closeAdminEditor();
            rejectSubmission(idToReject);
        } else if (activeEditingLiveProfile) {
            const idToDelete = activeEditingLiveProfile.id;
            closeAdminEditor();
            deleteLiveSubmission(idToDelete);
        }
    });

    async function rejectSubmission(id) {
        if (confirm("શું તમે ખરેખર આ સબમિશનને નામંજૂર કરીને કાયમ માટે ડિલીટ કરવા માંગો છો?")) {
            if (isFirebaseEnabled) {
                try {
                    const profileToDelete = pendingSubmissions.find(p => p.id === id);

                    await firebaseDb.collection('profiles').doc(id).delete();

                    const decodeFirebaseStorageUrl = (url) => {
                        if (!url || !url.includes('firebasestorage.googleapis.com')) return null;
                        try {
                            const match = url.split('/o/')[1];
                            if (match) {
                                const pathEncoded = match.split('?')[0];
                                return decodeURIComponent(pathEncoded);
                            }
                        } catch (err) {
                            console.warn("Failed to decode storage URL:", err);
                        }
                        return null;
                    };

                    // Delete files from storage if hosted on Firebase
                    if (profileToDelete) {
                        try {
                            const photoPath = decodeFirebaseStorageUrl(profileToDelete.photoUrl);
                            if (photoPath) {
                                await firebaseStorage.ref().child(photoPath).delete();
                            }
                            const pdfPath = decodeFirebaseStorageUrl(profileToDelete.pdfUrl);
                            if (pdfPath) {
                                await firebaseStorage.ref().child(pdfPath).delete();
                            }
                        } catch (storageErr) {
                            console.warn("Could not delete associated files from Storage:", storageErr);
                        }
                    }

                    await fetchProfilesFromFirebase();
                    combineProfiles();
                    populateFilterDropdowns();
                    renderProfilesGrid();
                    updateStats();
                    renderPendingTable();
                    renderLiveTable();
                } catch (err) {
                    console.error("Firebase delete error:", err);
                    alert(`ડિલીટ કરવામાં ભૂલ આવી: ${err.message || err}`);
                }
            } else {
                const index = pendingSubmissions.findIndex(sub => sub.id === id);
                if (index > -1) {
                    pendingSubmissions.splice(index, 1);
                    savePendingSubmissions();
                    
                    updateStats();
                    renderPendingTable();
                }
            }
        }
    }

    async function deleteLiveSubmission(id) {
        if (confirm("શું તમે ખરેખર આ પ્રોફાઇલને ડિરેક્ટરીમાંથી કાયમ માટે ડિલીટ કરવા માંગો છો?")) {
            if (isFirebaseEnabled) {
                try {
                    const profileToDelete = approvedProfiles.find(p => p.id === id);

                    await firebaseDb.collection('profiles').doc(id).delete();

                    const decodeFirebaseStorageUrl = (url) => {
                        if (!url || !url.includes('firebasestorage.googleapis.com')) return null;
                        try {
                            const match = url.split('/o/')[1];
                            if (match) {
                                const pathEncoded = match.split('?')[0];
                                return decodeURIComponent(pathEncoded);
                            }
                        } catch (err) {
                            console.warn("Failed to decode storage URL:", err);
                        }
                        return null;
                    };

                    // Delete files from storage if hosted on Firebase
                    if (profileToDelete) {
                        try {
                            const photoPath = decodeFirebaseStorageUrl(profileToDelete.photoUrl);
                            if (photoPath) {
                                await firebaseStorage.ref().child(photoPath).delete();
                            }
                            const pdfPath = decodeFirebaseStorageUrl(profileToDelete.pdfUrl);
                            if (pdfPath) {
                                await firebaseStorage.ref().child(pdfPath).delete();
                            }
                        } catch (storageErr) {
                            console.warn("Could not delete associated files from Storage:", storageErr);
                        }
                    }

                    await fetchProfilesFromFirebase();
                    combineProfiles();
                    populateFilterDropdowns();
                    renderProfilesGrid();
                    updateStats();
                    renderLiveTable();
                } catch (err) {
                    console.error("Firebase delete error:", err);
                    alert(`ડિલીટ કરવામાં ભૂલ આવી: ${err.message || err}`);
                }
            } else {
                const index = approvedProfiles.findIndex(p => p.id === id);
                if (index > -1) {
                    approvedProfiles.splice(index, 1);
                    saveApprovedSubmissions();

                    combineProfiles();
                    populateFilterDropdowns();
                    renderProfilesGrid();
                    updateStats();
                    
                    renderLiveTable();
                }
            }
        }
    }

    // Seed Data event listener
    if (adminSeedBtn) {
        adminSeedBtn.addEventListener('click', async () => {
            if (!isFirebaseEnabled) return;
            
            if (confirm("શું તમે ખરેખર mock ડેટાબેઝ (biodatas.json) માંથી બધી પ્રોફાઇલ્સને Firebase ડેટાબેઝમાં અપલોડ કરવા માંગો છો?")) {
                adminSeedBtn.disabled = true;
                adminSeedBtn.textContent = "સેડિંગ ચાલુ છે...";

                try {
                    const response = await fetch('biodatas.json');
                    if (!response.ok) throw new Error("biodatas.json ફાઇલ લોડ થઈ શકી નથી.");
                    
                    const localSeeds = await response.json();
                    
                    let successCount = 0;
                    for (const seed of localSeeds) {
                        await firebaseDb.collection('profiles').doc(seed.id).set({
                            id: seed.id,
                            name: seed.name,
                            gender: seed.gender,
                            age: seed.age,
                            city: seed.city,
                            state: seed.state,
                            photo_url: seed.photoUrl || "",
                            pdf_url: seed.pdfUrl,
                            is_image_biodata: seed.isImageBioData || false,
                            status: 'approved',
                            created_at: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        successCount++;
                    }

                    alert(`સફળતાપૂર્વક ${successCount} પ્રોફાઇલ્સ Firebase ડેટાબેઝમાં અપલોડ કરવામાં આવી છે.`);
                    
                    // Reload data from Firebase
                    await fetchProfilesFromFirebase();
                    combineProfiles();
                    populateFilterDropdowns();
                    renderProfilesGrid();
                    updateStats();
                    renderLiveTable();

                } catch (err) {
                    console.error("Database seeding failed:", err);
                    alert(`સેડિંગ કરવામાં ભૂલ આવી: ${err.message}`);
                } finally {
                    adminSeedBtn.disabled = false;
                    adminSeedBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        સિસ્ટમ પ્રોફાઇલ્સ અપલોડ કરો (Seed Seed Data)
                    `;
                }
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && adminEditorModal.classList.contains('active')) {
            closeAdminEditor();
        }
    });

    // ==========================================
    // 15. BOOTSTRAP APP
    // ==========================================
    initApp();

});
