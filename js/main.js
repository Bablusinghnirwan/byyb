/**
 * Main JavaScript File for Cosmic Love Experience
 * Advanced Canvas Engine, Audio Ducking, and Orchestration
 */

const CONFIG = {
    herName: "My Love", 
    specialDate: "Our Special Day"
};

const STAGES = ['index', 'game', 'journey', 'gift', 'letter'];
let bgMusic = null;
const FADE_DURATION = 1500; // Slower fade for cinematic feel
let cosmicEngine = null; // Global reference to canvas engine

document.addEventListener('DOMContentLoaded', () => {
    insertPersonalization();
    handleLoadingScreen();
    checkAccess();
    
    // Add flash overlay div if it doesn't exist
    if (!document.getElementById('flash-overlay')) {
        const flash = document.createElement('div');
        flash.id = 'flash-overlay';
        document.body.appendChild(flash);
    }

    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);

    // Initializations
    cosmicEngine = new CosmicBackground();
    initCustomCursor();
    initRippleEffect();
    initMusic();
});

/**
 * Loading Screen
 */
function handleLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 1500);
            }, 2000); 
        });
    }
}

/**
 * Personalization Injector
 */
function insertPersonalization() {
    const nameElements = document.querySelectorAll('[data-insert="name"]');
    nameElements.forEach(el => el.textContent = CONFIG.herName);
}

/**
 * Cinematic Navigation System
 */
function navigate(url, requiredStage = null) {
    if (requiredStage) {
        unlockStage(requiredStage);
    }

    const flash = document.getElementById('flash-overlay');
    flash.classList.add('active'); // Trigger flash
    
    // Fade out body slightly after flash starts
    setTimeout(() => {
        document.body.classList.remove('loaded');
        document.body.classList.add('fade-out');
    }, 100);

    fadeAudioOut();

    setTimeout(() => {
        window.location.href = url;
    }, 600); // Redirect during peak flash
}

function checkAccess() {
    let path = window.location.pathname;
    let currentPage = 'index';
    
    if (path.includes('game')) currentPage = 'game';
    else if (path.includes('journey')) currentPage = 'journey';
    else if (path.includes('gift')) currentPage = 'gift';
    else if (path.includes('letter')) currentPage = 'letter';

    const highestUnlocked = localStorage.getItem('unlockedStage') || 'index';
    const currentIndex = STAGES.indexOf(currentPage);
    const unlockedIndex = STAGES.indexOf(highestUnlocked);

    if (currentIndex > unlockedIndex) {
        window.location.replace((currentPage === 'index' ? '' : '../') + (highestUnlocked === 'index' ? 'index.html' : `${highestUnlocked}.html`));
    }
}

function unlockStage(stage) {
    const currentUnlocked = localStorage.getItem('unlockedStage') || 'index';
    if (STAGES.indexOf(stage) > STAGES.indexOf(currentUnlocked)) {
        localStorage.setItem('unlockedStage', stage);
    }
}

/**
 * Advanced Audio System
 */
function initMusic() {
    const musicState = localStorage.getItem('musicMuted') === 'true';
    bgMusic = document.getElementById('bg-music');
    
    if (!bgMusic) {
        bgMusic = new Audio();
        bgMusic.id = 'bg-music';
        bgMusic.loop = true;
        document.body.appendChild(bgMusic);
    }

    bgMusic.muted = musicState;
    bgMusic.volume = 0; 

    // Create toggle UI first so we can update it
    createMusicToggle(bgMusic);
    const toggleBtn = document.getElementById('music-toggle');

    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            fadeAudioIn();
            if(toggleBtn) toggleBtn.innerHTML = bgMusic.muted ? '🔇' : '🎵';
        }).catch(error => {
            // Browser blocked autoplay
            if(toggleBtn) toggleBtn.innerHTML = '🔇'; // Show muted until interaction
            
            // Wait for user to interact with the page (click anywhere)
            const startAudioOnInteract = () => {
                if(bgMusic.paused && !bgMusic.muted) {
                    bgMusic.play().then(() => {
                        fadeAudioIn();
                        if(toggleBtn) toggleBtn.innerHTML = '🎵';
                    }).catch(e => {});
                }
                document.body.removeEventListener('click', startAudioOnInteract);
                document.body.removeEventListener('touchstart', startAudioOnInteract);
            };
            
            document.body.addEventListener('click', startAudioOnInteract);
            document.body.addEventListener('touchstart', startAudioOnInteract);
        });
    }
}

function fadeAudioIn(targetVolume = 0.5) {
    if (!bgMusic || bgMusic.muted) return;
    let vol = bgMusic.volume;
    const interval = setInterval(() => {
        if (vol < targetVolume) { 
            vol += 0.02;
            bgMusic.volume = Math.min(vol, targetVolume);
        } else {
            clearInterval(interval);
        }
    }, FADE_DURATION / 25);
}

function fadeAudioOut() {
    if (!bgMusic || bgMusic.muted) return;
    let vol = bgMusic.volume;
    const interval = setInterval(() => {
        if (vol > 0.02) {
            vol -= 0.02;
            bgMusic.volume = Math.max(vol, 0);
        } else {
            bgMusic.volume = 0;
            bgMusic.pause();
            clearInterval(interval);
        }
    }, FADE_DURATION / 25);
}

// Lowers volume temporarily
function duckAudio(targetVolume = 0.1, duration = 3000) {
    if (!bgMusic || bgMusic.muted) return;
    let originalVol = 0.5; // default max
    
    // Fade down
    let vol = bgMusic.volume;
    const downInterval = setInterval(() => {
        if (vol > targetVolume) {
            vol -= 0.05;
            bgMusic.volume = Math.max(vol, targetVolume);
        } else {
            clearInterval(downInterval);
            // Wait, then fade back up
            if (duration !== Infinity) {
                setTimeout(() => fadeAudioIn(originalVol), duration);
            }
        }
    }, 50);
}

function playSFX(src) {
    const isMuted = localStorage.getItem('musicMuted') === 'true';
    if (isMuted) return;
    
    const sfx = new Audio(src);
    sfx.volume = 0.6;
    sfx.play().catch(e => {});
}

function createMusicToggle(audio) {
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'music-toggle';
    toggleBtn.innerHTML = audio.muted ? '🔇' : '🎵';
    
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (audio.muted) {
            audio.muted = false;
            audio.play();
            fadeAudioIn();
            toggleBtn.innerHTML = '🎵';
            localStorage.setItem('musicMuted', 'false');
        } else {
            fadeAudioOut();
            setTimeout(() => {
                audio.muted = true;
                toggleBtn.innerHTML = '🔇';
                localStorage.setItem('musicMuted', 'true');
            }, FADE_DURATION);
        }
    });

    document.body.appendChild(toggleBtn);
}

/**
 * Micro-Interactions: Ripple Effect
 */
function initRippleEffect() {
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.btn-primary');
        if (target) {
            const basePath = window.location.pathname.includes('pages') ? '../' : '';
            playSFX(basePath + 'assets/music/click.mp3');

            const x = e.clientX - target.getBoundingClientRect().left;
            const y = e.clientY - target.getBoundingClientRect().top;

            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            const size = Math.max(target.clientWidth, target.clientHeight) * 1.5;
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.transform = `translate(-50%, -50%) scale(0)`;

            target.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 800);
        }
    });
}

/**
 * Micro-Interactions: Custom Cursor
 */
function initCustomCursor() {
    if (window.innerWidth <= 768) return;

    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    const trails = [];
    for(let i=0; i<4; i++) {
        const trail = document.createElement('div');
        trail.classList.add('cursor-trail');
        // stagger opacity for fading effect
        trail.style.opacity = 1 - (i * 0.2); 
        document.body.appendChild(trail);
        trails.push({ el: trail, x: -100, y: -100 });
    }

    let mouseX = -100;
    let mouseY = -100;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;

        if (e.target.closest('a, button, .cursor-pointer, input, #present')) {
            cursor.classList.add('hovering');
        } else {
            cursor.classList.remove('hovering');
        }
    });

    function animateTrails() {
        let prevX = mouseX;
        let prevY = mouseY;

        trails.forEach((trail) => {
            trail.x += (prevX - trail.x) * 0.4;
            trail.y += (prevY - trail.y) * 0.4;
            
            trail.el.style.left = `${trail.x}px`;
            trail.el.style.top = `${trail.y}px`;
            
            prevX = trail.x;
            prevY = trail.y;
        });

        requestAnimationFrame(animateTrails);
    }
    animateTrails();
}

/**
 * Cosmic Engine (Canvas Particles)
 */
class CosmicBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'cosmic-canvas';
        document.body.prepend(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.particles = [];
        this.baseSpeedMultiplier = 1;
        this.isFinalScene = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Generate particles
        const count = window.innerWidth < 768 ? 40 : 80;
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
        
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    createParticle() {
        // Z-depth representation: larger size = closer (faster), smaller = farther (slower)
        const size = Math.random() * 2 + 0.5;
        const speedBase = size * 0.2; 
        
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            size: size,
            speedY: speedBase,
            speedX: (Math.random() - 0.5) * speedBase,
            opacity: Math.random() * 0.5 + 0.1, // 0.1 to 0.6
            glow: Math.random() * 10 + 5,
            phase: Math.random() * Math.PI * 2, // for subtle pulsing
            baseSpeedY: speedBase,
            baseSpeedX: (Math.random() - 0.5) * speedBase,
        };
    }

    setMood(mood) {
        if (mood === 'game') this.baseSpeedMultiplier = 2.5;
        else if (mood === 'journey') this.baseSpeedMultiplier = 0.8;
        else if (mood === 'letter') this.baseSpeedMultiplier = 0.4;
        else this.baseSpeedMultiplier = 1;
    }

    triggerFinalScene() {
        this.isFinalScene = true;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        for (let p of this.particles) {
            if (this.isFinalScene) {
                // Converge to center
                p.x += (centerX - p.x) * 0.005;
                p.y += (centerY - p.y) * 0.005;
                p.opacity += (1 - p.opacity) * 0.01; // Increase brightness
            } else {
                // Normal floating
                p.y -= p.baseSpeedY * this.baseSpeedMultiplier;
                p.x += Math.sin(p.y * 0.01 + p.phase) * 0.3 * this.baseSpeedMultiplier;
                
                // Wrap around
                if (p.y < -10) p.y = this.height + 10;
                if (p.x < -10) p.x = this.width + 10;
                if (p.x > this.width + 10) p.x = -10;
            }

            // Pulse opacity slightly
            const currentOpacity = p.opacity + Math.sin(Date.now() * 0.001 + p.phase) * 0.1;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 182, 193, ${Math.max(0, currentOpacity)})`;
            this.ctx.shadowBlur = p.glow;
            this.ctx.shadowColor = 'rgba(236, 72, 153, 0.8)';
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // reset
        }

        requestAnimationFrame(this.animate);
    }
}
