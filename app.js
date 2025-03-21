// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('roulette-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add better lighting for improved visibility
// Main ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Key light from top
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(0, 10, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

// Fill light from left side
const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
fillLight.position.set(-5, 5, 2);
scene.add(fillLight);

// Back light for better definition
const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
backLight.position.set(5, 5, -5);
scene.add(backLight);

// Add a subtle spotlight on top of the wheel
const spotLight = new THREE.SpotLight(0xffffff, 0.7);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.1;
spotLight.decay = 2;
spotLight.distance = 20;
spotLight.castShadow = true;
scene.add(spotLight);

// Create a simplified roulette wheel using Three.js primitives
const wheelGroup = new THREE.Group();

// Wheel base (a wide, flat cylinder)
const wheelGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 32);
const wheelMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    specular: 0x111111,
    shininess: 30 
});
const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
wheel.castShadow = true;
wheel.receiveShadow = true;
wheelGroup.add(wheel);

// Add a rim around the wheel
const rimGeometry = new THREE.TorusGeometry(2, 0.1, 16, 100);
const rimMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B4513,
    specular: 0x333333,
    shininess: 30
});
const rim = new THREE.Mesh(rimGeometry, rimMaterial);
rim.rotation.x = Math.PI / 2;
rim.position.y = 0.1;
rim.castShadow = true;
wheelGroup.add(rim);

// Define European roulette wheel sequence (standard order)
const rouletteSequence = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Add slots with number labels as billboards
const slotCount = 37; // 0-36 for European roulette
const slotRadius = 1.8; // Slightly inside the wheel's edge
const slotHeight = 0.15;

// Store references to all number labels
const numberSprites = [];

// Function to create a canvas texture with a number
function createNumberTexture(number, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw circular background
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Draw border
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'white';
    ctx.stroke();
    
    // Draw number text
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 64, 64);
    
    return new THREE.CanvasTexture(canvas);
}

// Create all the slots and number labels
for (let i = 0; i < slotCount; i++) {
    const number = rouletteSequence[i];
    const angle = (i / slotCount) * Math.PI * 2;
    const x = slotRadius * Math.cos(angle);
    const z = slotRadius * Math.sin(angle);
    
    // Determine slot color
    let slotColor, slotHexColor;
    if (number === 0) {
        slotColor = 'green';
        slotHexColor = 0x00AA00; // Green for 0
    } else {
        // Red numbers: 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        if (redNumbers.includes(number)) {
            slotColor = 'red';
            slotHexColor = 0xC10000;
        } else {
            slotColor = 'black';
            slotHexColor = 0x000000;
        }
    }
    
    // Create a slot (cuboid)
    const slotGeometry = new THREE.BoxGeometry(0.2, slotHeight, 0.4);
    const slotMaterial = new THREE.MeshPhongMaterial({ 
        color: slotHexColor,
        specular: 0x333333,
        shininess: 30
    });
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.position.set(x, slotHeight/2, z);
    slot.castShadow = true;
    slot.receiveShadow = true;
    
    // Rotate each slot to point toward center
    slot.rotation.y = Math.atan2(-z, -x);
    wheelGroup.add(slot);
    
    // Create number sprite/billboard
    const numberTexture = createNumberTexture(number, slotColor);
    const numberMaterial = new THREE.SpriteMaterial({ map: numberTexture });
    const numberSprite = new THREE.Sprite(numberMaterial);
    numberSprite.scale.set(0.5, 0.5, 1);
    numberSprite.position.set(x, slotHeight + 0.3, z);
    numberSprite.userData = { angle: angle }; // Store the angle for rotation
    
    numberSprites.push(numberSprite);
    wheelGroup.add(numberSprite);
}

// Add dividers between slots
for (let i = 0; i < slotCount; i++) {
    const angle = (i / slotCount) * Math.PI * 2;
    const innerRadius = 1.2;
    const outerRadius = 2;
    
    const dividerGeometry = new THREE.BoxGeometry(0.03, 0.25, outerRadius - innerRadius);
    const dividerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xAAAAAA,
        specular: 0x333333,
        shininess: 30
    });
    const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
    
    // Position at the edge between slots
    const midAngle = angle + (0.5 / slotCount) * Math.PI * 2;
    const midX = (innerRadius + (outerRadius - innerRadius) / 2) * Math.cos(midAngle);
    const midZ = (innerRadius + (outerRadius - innerRadius) / 2) * Math.sin(midAngle);
    
    divider.position.set(midX, 0.15, midZ);
    divider.rotation.y = Math.atan2(-midZ, -midX);
    
    wheelGroup.add(divider);
}

// Add a central cone (simulating the wheel's center)
const coneGeometry = new THREE.ConeGeometry(0.5, 0.5, 32);
const coneMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x666666,
    specular: 0x333333,
    shininess: 50
});
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(0, 0.35, 0);
cone.castShadow = true;
wheelGroup.add(cone);

// Add decorative spokes to the wheel
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x1 = 0.5 * Math.cos(angle);
    const z1 = 0.5 * Math.sin(angle);
    const x2 = 1.9 * Math.cos(angle);
    const z2 = 1.9 * Math.sin(angle);
    
    const spokeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
    const spokeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xc0c0c0,
        specular: 0x666666,
        shininess: 80
    });
    const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    
    spoke.position.set((x1 + x2) / 2, 0.15, (z1 + z2) / 2);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = angle;
    spoke.castShadow = true;
    
    wheelGroup.add(spoke);
}

// Add the wheel to the scene
scene.add(wheelGroup);

// Add a simple ball (a small sphere)
const ballGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const ballMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFFFFFF,
    specular: 0xFFFFFF,
    shininess: 100
});
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(slotRadius, 0.3, 0); // Start on the edge of the wheel
ball.castShadow = true;
scene.add(ball);

// Position the camera for better viewing angle
camera.position.set(0, 5, 5); 
camera.lookAt(0, 0, 0);

// Add orbit controls for user interaction
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 4;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2.2; // Prevent going below wheel
controls.update();

// Add a floor under the wheel
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x006400,
    specular: 0x111111,
    shininess: 10
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.1;
floor.receiveShadow = true;
scene.add(floor);

// Variables for spinning
let wheelSpeed = 0;
let ballSpeed = 0;
let isSpinning = false;
let winningNumber = 0;
let winningIndex = 0;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update orbit controls
    controls.update();
    
    // Update all number sprites to face the camera
    numberSprites.forEach(sprite => {
        // If wheel is rotating, update sprite positions to maintain correct orientation
        if (isSpinning) {
            const angle = sprite.userData.angle + wheelGroup.rotation.y;
            const x = slotRadius * Math.cos(angle);
            const z = slotRadius * Math.sin(angle);
            sprite.position.x = x;
            sprite.position.z = z;
        }
    });

    if (isSpinning) {
        // Spin the wheel
        wheelGroup.rotation.y += wheelSpeed;
        wheelSpeed *= 0.995; // Slow down gradually
        
        // Ball physics - more realistic
        ballSpeed *= 0.997;
        
        // Ball movement with realistic physics
        const currentTime = Date.now() * 0.001;
        const ballHeightFrequency = 5 + (1 - ballSpeed / 0.05) * 15; // Speed up bouncing as ball slows
        const ballHeightAmplitude = Math.min(0.2, ballSpeed * 3); // Lower bounces as speed decreases
        
        // Calculate ball height with bouncing effect
        const ballHeight = slotHeight + 0.1 + Math.abs(Math.sin(currentTime * ballHeightFrequency)) * ballHeightAmplitude;
        
        // As the ball slows down, it should gradually move toward the outer edge
        const ballRadiusOffset = Math.max(0, 0.3 * (1 - ballSpeed / 0.05));
        const ballCurrentRadius = slotRadius + ballRadiusOffset;
        
        // Ball angle calculation - moves opposite to wheel initially, then syncs with wheel
        const ballAngleDelta = ballSpeed * (ballSpeed > 0.01 ? -15 : 1); // Ball moves opposite to wheel initially
        const ballAngle = wheelGroup.rotation.y + ballAngleDelta + Math.sin(currentTime) * 0.05 * (ballSpeed / 0.05);
        
        // Update ball position
        ball.position.x = ballCurrentRadius * Math.cos(ballAngle);
        ball.position.y = Math.max(slotHeight, ballHeight);
        ball.position.z = ballCurrentRadius * Math.sin(ballAngle);

        // Stop spinning after slowing down significantly
        if (wheelSpeed < 0.001) {
            isSpinning = false;
            
            // Find the right slot index based on winning number
            winningIndex = rouletteSequence.indexOf(winningNumber);
            
            // Snap ball to the winning slot
            const slotAngle = (winningIndex / slotCount) * Math.PI * 2 + wheelGroup.rotation.y;
            ball.position.x = slotRadius * Math.cos(slotAngle);
            ball.position.y = slotHeight + 0.1;  // Just above the slot
            ball.position.z = slotRadius * Math.sin(slotAngle);
            
            console.log(`Winning number: ${winningNumber}`);
            document.getElementById('winning-number').textContent = `Winning number: ${winningNumber}`;
            
            // Highlight the winning number in the betting table
            const betOptions = document.querySelectorAll('.bet-option');
            betOptions.forEach(option => {
                option.classList.remove('winning-number');
                if (option.dataset.type === 'number' && parseInt(option.dataset.value) === winningNumber) {
                    option.classList.add('winning-number');
                }
            });
        }
    }

    renderer.render(scene, camera);
}
animate();

// Spin button functionality
document.getElementById('spin-button').addEventListener('click', () => {
    if (!isSpinning) {
        // Remove any winning number highlight
        const betOptions = document.querySelectorAll('.bet-option');
        betOptions.forEach(option => {
            option.classList.remove('winning-number');
        });
        
        // Start spinning
        isSpinning = true;
        wheelSpeed = 0.1; // Initial wheel speed
        ballSpeed = 0.05; // Initial ball speed
        
        // Random winning number (0-36)
        winningNumber = Math.floor(Math.random() * slotCount);
        winningNumber = rouletteSequence[winningNumber];
        
        document.getElementById('winning-number').textContent = 'Spinning...';
        console.log("Spinning...");
        
        // Check bets after spin ends (if there's a current bet)
        if (currentBet) {
            checkBetAfterSpin();
        }
    }
});

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Betting functionality
let currentBet = null;
let chips = 1000; // Starting chips
let betAmount = 10; // Default bet amount

// Update chips display
function updateChipsDisplay() {
    document.getElementById('chips-display').textContent = `Chips: ${chips}`;
}

// Initialize chips display
updateChipsDisplay();

// We don't need to initialize the betting table because it's hard-coded in the HTML
// Instead, we'll attach event listeners and add styling to the pre-existing elements
function initializeBettingOptions() {
    // Add chip marker functionality
    let currentChipMarker = null;
    
    const betOptions = document.querySelectorAll('.bet-option');
    betOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove existing chip marker if any
            if (currentChipMarker) {
                currentChipMarker.remove();
            }
            
            // Remove selection from all options
            betOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selection to clicked option
            option.classList.add('selected');
            
            // Create a new chip marker
            const chipMarker = document.createElement('div');
            chipMarker.className = 'chip-marker';
            chipMarker.textContent = betAmount;
            
            // Position it at the center of the clicked bet option
            const rect = option.getBoundingClientRect();
            chipMarker.style.left = (rect.left + rect.width/2 - 15) + 'px';
            chipMarker.style.top = (rect.top + rect.height/2 - 15) + 'px';
            
            document.body.appendChild(chipMarker);
            currentChipMarker = chipMarker;
            
            // Set current bet
            const type = option.dataset.type;
            const value = option.dataset.value;
            currentBet = { type, value, amount: betAmount };
            
            document.getElementById('bet-info').textContent = 
                `Current bet: ${betAmount} chips on ${type === 'number' ? 'Number ' + value : value}`;
            
            console.log(`Bet placed: ${type} - ${value} (${betAmount} chips)`);
        });
    });
    
    // Bet amount adjustment buttons
    document.getElementById('increase-bet').addEventListener('click', () => {
        if (betAmount < chips) {
            betAmount += 10;
            document.getElementById('bet-amount-display').textContent = betAmount;
            
            if (currentBet) {
                currentBet.amount = betAmount;
                if (currentChipMarker) {
                    currentChipMarker.textContent = betAmount;
                }
                document.getElementById('bet-info').textContent = 
                    `Current bet: ${betAmount} chips on ${currentBet.type === 'number' ? 'Number ' + currentBet.value : currentBet.value}`;
            }
        }
    });
    
    document.getElementById('decrease-bet').addEventListener('click', () => {
        if (betAmount > 10) {
            betAmount -= 10;
            document.getElementById('bet-amount-display').textContent = betAmount;
            
            if (currentBet) {
                currentBet.amount = betAmount;
                if (currentChipMarker) {
                    currentChipMarker.textContent = betAmount;
                }
                document.getElementById('bet-info').textContent = 
                    `Current bet: ${betAmount} chips on ${currentBet.type === 'number' ? 'Number ' + currentBet.value : currentBet.value}`;
            }
        }
    });
}

// Check bet against the winning number and update chips
function checkBetAfterSpin() {
    setTimeout(() => {
        let didWin = false;
        let winAmount = 0;
        const resultMessage = document.getElementById('result-message');
        
        if (currentBet) {
            if (currentBet.type === 'number' && parseInt(currentBet.value) === winningNumber) {
                didWin = true;
                winAmount = currentBet.amount * 35; // 35:1 payout for single number
            } else if (currentBet.type === 'color') {
                // Red numbers in European roulette
                const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
                const winningColor = winningNumber === 0 ? 'green' : redNumbers.includes(winningNumber) ? 'red' : 'black';
                if (currentBet.value === winningColor) {
                    didWin = true;
                    winAmount = currentBet.amount * 2; // 1:1 payout for color
                }
            } else if (currentBet.type === 'parity') {
                if (winningNumber !== 0) {
                    const isEven = winningNumber % 2 === 0;
                    if ((currentBet.value === 'even' && isEven) || 
                        (currentBet.value === 'odd' && !isEven)) {
                        didWin = true;
                        winAmount = currentBet.amount * 2; // 1:1 payout
                    }
                }
            } else if (currentBet.type === 'range') {
                if (winningNumber !== 0) {
                    if ((currentBet.value === 'low' && winningNumber >= 1 && winningNumber <= 18) ||
                        (currentBet.value === 'high' && winningNumber >= 19 && winningNumber <= 36)) {
                        didWin = true;
                        winAmount = currentBet.amount * 2; // 1:1 payout
                    }
                }
            } else if (currentBet.type === 'column') {
                if (winningNumber !== 0) {
                    const firstColumn = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];
                    const secondColumn = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
                    const thirdColumn = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
                    
                    if ((currentBet.value === 'first' && firstColumn.includes(winningNumber)) ||
                        (currentBet.value === 'second' && secondColumn.includes(winningNumber)) ||
                        (currentBet.value === 'third' && thirdColumn.includes(winningNumber))) {
                        didWin = true;
                        winAmount = currentBet.amount * 3; // 2:1 payout for column
                    }
                }
            }
        }
        
        if (didWin) {
            chips += winAmount;
            updateChipsDisplay();
            resultMessage.textContent = `You win ${winAmount} chips!`;
            resultMessage.className = 'win-message';
            
            // Add win animation
            const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-casino-bling-achievement-2067.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed:', e));
        } else {
            resultMessage.textContent = 'You lose!';
            resultMessage.className = 'lose-message';
        }
        
        // Reset current bet but keep the selection visible for reference
        document.getElementById('bet-info').textContent = 
            `Last bet: ${currentBet.amount} chips on ${currentBet.type === 'number' ? 'Number ' + currentBet.value : currentBet.value}`;
        currentBet = null;
    }, 5000); // Wait for spin to finish
}

// Initialize the betting options when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeBettingOptions);