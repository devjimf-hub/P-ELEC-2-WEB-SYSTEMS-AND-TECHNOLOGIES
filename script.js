document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const homePage = document.getElementById('home-page');
    const presentationPage = document.getElementById('presentation-page');
    const presentationsContainer = document.getElementById('presentations-container');
    const backToHomeBtn = document.getElementById('back-to-home');
    const prevSlideBtn = document.getElementById('prev-slide');
    const nextSlideBtn = document.getElementById('next-slide');
    const slideContent = document.getElementById('slide-content');
    const currentSlideEl = document.getElementById('current-slide');
    const totalSlidesEl = document.getElementById('total-slides');
    const progressBar = document.getElementById('progress-bar');
    const slideNavigation = document.getElementById('slide-navigation');
    const presentationTitleEl = document.getElementById('presentation-title');
    
    // State variables
    let currentPresentation = null;
    let currentSlideIndex = 0;
    let presentations = [];
    
    // Initialize the app
    init();
    
    function init() {
        // Load all JSON presentations
        loadPresentations();
        
        // Set up event listeners
        backToHomeBtn.addEventListener('click', showHomePage);
        prevSlideBtn.addEventListener('click', showPreviousSlide);
        nextSlideBtn.addEventListener('click', showNextSlide);
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (!presentationPage.classList.contains('active')) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    showPreviousSlide();
                    break;
                case 'ArrowRight':
                    showNextSlide();
                    break;
                case 'Home':
                    showSlide(0);
                    break;
                case 'End':
                    showSlide(currentPresentation.slides.length - 1);
                    break;
                case 'Escape':
                    showHomePage();
                    break;
            }
        });
    }
    
    // Load all JSON presentations from the directory
    async function loadPresentations() {
        try {
            // In a real implementation, you would fetch this from a server endpoint
            // that scans the directory and returns the list of JSON files.
            // For this example, we'll simulate it with hardcoded filenames.

            const presentationFiles = [];

            for (let i = 1; i < 10; i++) {
                const element = 'p'+i+'.json';
                presentationFiles.push(element);
            }
            
            // Simulated list of JSON files (in a real app, this would be dynamic)

            
            // Load each presentation file
            const loadedPresentations = [];
            for (const file of presentationFiles) {
                try {
                    const response = await fetch(file);
                    if (!response.ok) continue;
                    
                    const presentation = await response.json();
                    presentation.filename = file;
                    loadedPresentations.push(presentation);
                } catch (error) {
                    console.error(`Error loading presentation ${file}:`, error);
                }
            }
            
            presentations = loadedPresentations;
            renderPresentationCards();
        } catch (error) {
            console.error('Error loading presentations:', error);
        }
    }
    
    // Render presentation cards on the home page
    function renderPresentationCards() {
        presentationsContainer.innerHTML = '';
        
        if (presentations.length === 0) {
            presentationsContainer.innerHTML = '<p class="no-presentations">No presentations found.</p>';
            return;
        }
        
        presentations.forEach(presentation => {
            const card = document.createElement('div');
            card.className = 'presentation-card';
            card.innerHTML = `
                <div class="presentation-card" data-filename="${presentation.filename}">
                    <img src="${presentation.thumbnail || 'https://via.placeholder.com/300x180?text=Presentation'}" alt="${presentation.title}">
                    <div class="card-content">
                        <h3>${presentation.title}</h3>
                        <p>${presentation.description || 'No description available.'}</p>
                        <div class="meta">
                            <span>${presentation.slides.length} slides</span>
                            <span>By ${presentation.author || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => loadPresentation(presentation.filename));
            presentationsContainer.appendChild(card);
        });
    }
    
    // Load a specific presentation
    async function loadPresentation(filename) {
        try {
            const response = await fetch(filename);
            if (!response.ok) throw new Error('Failed to load presentation');
            
            currentPresentation = await response.json();
            currentSlideIndex = 0;
            
            // Update UI
            presentationTitleEl.textContent = currentPresentation.title;
            totalSlidesEl.textContent = currentPresentation.slides.length;
            
            // Render the first slide
            renderSlide();
            renderSlideNavigation();
            
            // Switch to presentation view
            showPresentationPage();
        } catch (error) {
            console.error('Error loading presentation:', error);
            alert('Failed to load the presentation. Please try again.');
        }
    }
    
    // Render the current slide
    function renderSlide() {
        if (!currentPresentation || !currentPresentation.slides[currentSlideIndex]) return;
        
        const slide = currentPresentation.slides[currentSlideIndex];
        let slideHTML = '';
        
        // Determine slide type and render accordingly
        switch(slide.type) {
            case 'title':
                slideHTML = `
                    <div class="slide title-slide">
                        <h1 class="slide-title">${slide.title}</h1>
                        ${slide.subtitle ? `<h2 class="slide-subtitle">${slide.subtitle}</h2>` : ''}
                        ${slide.content ? `<div class="slide-content-text">${slide.content}</div>` : ''}
                        ${slide.footer ? `<div class="slide-footer">${slide.footer}</div>` : ''}
                    </div>
                `;
                break;
                
            case 'content':
                slideHTML = `
                    <div class="slide content-slide">
                        ${slide.title ? `<h2 class="slide-title">${slide.title}</h2>` : ''}
                        ${slide.content ? `<div class="slide-content-text">${slide.content}</div>` : ''}
                        ${slide.list ? `
                            <ul class="slide-list">
                                ${slide.list.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        ` : ''}
                        ${slide.image ? `<img src="${slide.image}" alt="${slide.imageAlt || ''}" class="slide-image">` : ''}
                        ${slide.footer ? `<div class="slide-footer">${slide.footer}</div>` : ''}
                    </div>
                `;
                break;

            case 'video':
                slideHTML = `
                    <div class="slide video-slide">
                        ${slide.title ? `<h2 class="slide-title">${slide.title}</h2>` : ''}
                        ${slide.description ? `<div class="slide-content-text">${slide.description}</div>` : ''}
                        ${
                            slide.video
                                ? (slide.video.includes('youtube.com') || slide.video.includes('youtu.be')
                                    ? `<div class="video-embed">
                                        <iframe width="560" height="315"
                                            src="https://www.youtube.com/embed/${extractYouTubeId(slide.video)}"
                                            frameborder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowfullscreen>
                                        </iframe>
                                    </div>`
                                    : `<video class="slide-video" controls${slide.poster ? ` poster="${slide.poster}"` : ''}>
                                        <source src="${slide.video}" type="video/mp4">
                                        Your browser does not support the video tag.
                                    </video>`
                                )
                                : ''
                        }
                        ${slide.footer ? `<div class="slide-footer">${slide.footer}</div>` : ''}
                    </div>
                `;
                break;
                
            case 'code':
                slideHTML = `
                    <div class="slide code-slide">
                        ${slide.title ? `<h2 class="slide-title">${slide.title}</h2>` : ''}
                        ${slide.description ? `<div class="slide-content-text">${slide.description}</div>` : ''}
                        <pre class="code-block"><code>${slide.code}</code></pre>
                        ${slide.footer ? `<div class="slide-footer">${slide.footer}</div>` : ''}
                    </div>
                `;
                break;
                
            default:
                slideHTML = `
                    <div class="slide default-slide">
                        ${slide.title ? `<h2 class="slide-title">${slide.title}</h2>` : ''}
                        ${slide.content ? `<div class="slide-content-text">${slide.content}</div>` : ''}
                        ${slide.footer ? `<div class="slide-footer">${slide.footer}</div>` : ''}
                    </div>
                `;
        }
        
        slideContent.innerHTML = slideHTML;
        currentSlideEl.textContent = currentSlideIndex + 1;
        
        // Update progress bar
        const progress = ((currentSlideIndex + 1) / currentPresentation.slides.length) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update active dot in navigation
        const dots = document.querySelectorAll('.slide-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlideIndex);
        });
    }

    function extractYouTubeId(url) {
        // Handles both youtu.be and youtube.com URLs
        const regExp = /(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&#?]+)/;
        const match = url.match(regExp);
        return match && match[1] ? match[1] : '';
    }
    
    // Render slide navigation dots
    function renderSlideNavigation() {
        slideNavigation.innerHTML = '';
        
        for (let i = 0; i < currentPresentation.slides.length; i++) {
            const dot = document.createElement('div');
            dot.className = `slide-dot ${i === currentSlideIndex ? 'active' : ''}`;
            dot.dataset.slideIndex = i;
            dot.addEventListener('click', () => showSlide(i));
            slideNavigation.appendChild(dot);
        }
    }
    
    // Show a specific slide
    function showSlide(index) {
        if (!currentPresentation || index < 0 || index >= currentPresentation.slides.length) return;
        
        currentSlideIndex = index;
        renderSlide();
    }
    
    // Show the next slide
    function showNextSlide() {
        if (!currentPresentation) return;
        
        if (currentSlideIndex < currentPresentation.slides.length - 1) {
            currentSlideIndex++;
            renderSlide();
        }
    }
    
    // Show the previous slide
    function showPreviousSlide() {
        if (!currentPresentation) return;
        
        if (currentSlideIndex > 0) {
            currentSlideIndex--;
            renderSlide();
        }
    }
    
    // Switch to presentation view
    function showPresentationPage() {
        homePage.classList.remove('active');
        presentationPage.classList.add('active');
    }
    
    // Switch to home view
    function showHomePage() {
        presentationPage.classList.remove('active');
        homePage.classList.add('active');
    }
});