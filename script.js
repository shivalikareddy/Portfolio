document.addEventListener('DOMContentLoaded', () => {
    console.log('Portfolio website loaded successfully.');

    // --- Navigation ---
    const currentLocation = location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentLocation || (currentLocation === '' && linkHref === 'index.html')) {
            link.style.borderBottom = '2px solid #000';
            link.style.paddingBottom = '3px';
        }
    });

    // --- Contact Form ---
    const contactForm = document.querySelector('.contact-form');
    const successMessage = document.getElementById('form-message-success');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: {
                    'Accept': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    // Success!
                    if (successMessage) {
                        successMessage.style.display = 'block';
                        contactForm.reset();
                        // Optional: Hide form or scroll to message
                        successMessage.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        alert('Message sent successfully!');
                        contactForm.reset();
                    }
                } else {
                    response.json().then(data => {
                        if (Object.hasOwn(data, 'errors')) {
                            alert(data["errors"].map(error => error["message"]).join(", "));
                        } else {
                            alert('Oops! There was a problem submitting your form');
                        }
                    })
                }
            })
            .catch(error => {
                alert('Oops! There was a problem submitting your form');
            })
            .finally(() => {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            });
        });
    }


    // --- Intersection Observer for Reveal Effects ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.project-item, .hero, .about-text').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

    // --- UNIFIED TAB SYSTEM ---
    // Handles all tabs (Strategy, Evaluation, etc.) consistently
    const setupAllTabs = () => {
        const allTabButtons = document.querySelectorAll('.tab-btn, .eval-btn');
        
        allTabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const container = button.closest('.tab-container') || button.parentElement.parentElement;
                const targetId = button.getAttribute('data-target');
                const isEval = button.classList.contains('eval-btn');
                const btnClass = isEval ? 'eval-btn' : 'tab-btn';
                const contentClass = isEval ? 'eval-content' : 'tab-content';
                
                // 1. Deactivate all buttons of THIS TYPE in this specific section
                container.querySelectorAll(`.${btnClass}`).forEach(btn => btn.classList.remove('active'));
                
                // 2. Hide all related content blocks in this specific section
                container.querySelectorAll(`.${contentClass}`).forEach(content => content.classList.remove('active'));
                
                // 3. Activate selected item and its corresponding content
                button.classList.add('active');
                const targetContent = container.querySelector('#' + targetId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    };
    setupAllTabs();

    // --- Carousel (Native Scroll) ---
    const carousels = document.querySelectorAll('.carousel-container');
    carousels.forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const dotsContainer = carousel.querySelector('.carousel-dots');
        if (!track || !dotsContainer) return;
        const slides = Array.from(track.children);
        if (slides.length === 0) return;

        // Clone for infinite
        track.appendChild(slides[0].cloneNode(true));
        track.insertBefore(slides[slides.length - 1].cloneNode(true), slides[0]);

        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                track.scrollTo({ left: slides[0].offsetWidth * (index + 1), behavior: 'smooth' });
            });
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('.dot');
        let isJumping = false;

        const initScroll = () => { track.scrollLeft = slides[0].offsetWidth; };
        window.addEventListener('load', initScroll);
        initScroll();

        track.addEventListener('scroll', () => {
            if (isJumping) return;
            const width = slides[0].offsetWidth;
            if (track.scrollLeft >= (slides.length + 1) * width - 5) {
                isJumping = true;
                track.style.scrollBehavior = 'auto';
                track.scrollLeft = width;
                setTimeout(() => { track.style.scrollBehavior = 'smooth'; isJumping = false; }, 50);
            } else if (track.scrollLeft <= 5) {
                isJumping = true;
                track.style.scrollBehavior = 'auto';
                track.scrollLeft = slides.length * width;
                setTimeout(() => { track.style.scrollBehavior = 'smooth'; isJumping = false; }, 50);
            }
            const idx = Math.round(track.scrollLeft / width) - 1;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === (idx + slides.length) % slides.length));
        });

        // Click on Left/Right 40% to Navigate
        carousel.addEventListener('click', (e) => {
            if (isJumping) return;
            const rect = carousel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            
            // Only trigger if clicking on the track area (not dots)
            if (e.target.classList.contains('dot') || e.target.closest('.carousel-dots')) return;

            const slideWidth = slides[0].offsetWidth;
            const currentScroll = track.scrollLeft;
            const clickRatio = x / width;

            if (clickRatio < 0.4) {
                 // Left 40% -> Prev
                 track.scrollTo({ left: currentScroll - slideWidth, behavior: 'smooth' });
            } else if (clickRatio > 0.6) {
                 // Right 40% (start at 60%) -> Next
                 track.scrollTo({ left: currentScroll + slideWidth, behavior: 'smooth' });
            }
        });
    });

    // --- Ecosystem Map Zoom ---
    const mapContainer = document.getElementById('ecosystem-map-container');
    const mapImage = document.getElementById('ecosystem-map-image');

    if (mapContainer && mapImage) {
        // Function to handle zoom logic
        const handleZoom = (e) => {
            const rect = mapContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate percentage position
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            mapImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            mapImage.style.transform = 'scale(2)';
        };

        mapContainer.addEventListener('mousemove', handleZoom);
        mapContainer.addEventListener('mouseenter', handleZoom); // Trigger on enter as well

        mapContainer.addEventListener('mouseleave', () => {
            mapImage.style.transform = 'scale(1)';
            setTimeout(() => {
                mapImage.style.transformOrigin = 'center center';
            }, 300); // Match transition duration
        });
    }

    // --- Button Controlled Carousel (Notification Page) ---
    const btnCarousels = document.querySelectorAll('.carousel-container');
    btnCarousels.forEach(carousel => {
        // Skip if this is the other type of carousel (with dots)
        if (carousel.querySelector('.carousel-dots')) return;

        const track = carousel.querySelector('.carousel-track');
        if (!track) return;
        
        const nextButton = carousel.querySelector('.carousel-btn.next');
        const prevButton = carousel.querySelector('.carousel-btn.prev');
        
        if (!nextButton || !prevButton) return;

        const slides = Array.from(track.children);
        if (!slides.length) return;

        let currentIndex = 0;

        const updateCarousel = () => {
             const slideWidth = slides[0].getBoundingClientRect().width;
             track.style.transform = `translateX(-${slideWidth * currentIndex}px)`;
        };

        nextButton.addEventListener('click', () => {
             // If we are at the last slide, loop back to first
             if (currentIndex === slides.length - 1) {
                 currentIndex = 0;
             } else {
                 currentIndex++;
             }
             updateCarousel();
        });

        prevButton.addEventListener('click', () => {
             // If we are at the first slide, loop to last
             if (currentIndex === 0) {
                 currentIndex = slides.length - 1;
             } else {
                 currentIndex--;
             }
             updateCarousel();
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(updateCarousel, 100);
        });
    });
});
