/**
 * Particle System for Visual Effects
 */

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let particles: Particle[] = [];

/**
 * Resize canvas to match window
 */
function resizeCanvas(): void {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * Particle class
 */
class Particle {
    x: number;
    y: number;
    color: string;
    size: number;
    speedX: number;
    speedY: number;
    life: number;

    constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 8 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 100;
    }

    update(): void {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.1;
        this.life -= 2;
        this.size *= 0.95;
    }

    draw(): void {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Spawn particles at a location
 * @param x - X coordinate
 * @param y - Y coordinate
 */
export function spawnParticles(x: number, y: number): void {
    const colors = ['#f472b6', '#38bdf8', '#fbbf24', '#4ade80', '#ffffff'];
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    }
}

/**
 * Animation loop for particles
 */
function animateParticles(): void {
    if (!ctx || !canvas) {
        requestAnimationFrame(animateParticles);
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(animateParticles);
}

/**
 * Initialize particle system
 */
export function initParticles(): void {
    canvas = document.getElementById('particle-canvas') as HTMLCanvasElement | null;
    if (canvas) {
        ctx = canvas.getContext('2d');
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animateParticles();
}
