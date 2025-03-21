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

// Add lighting for better visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(0, 10, 0);
spotLight.angle = Math.PI / 3;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
scene.add(spotLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 8, 5);
scene.add(dirLight);

// Create the wheel group
const wheelGroup = new THREE.Group();

// Wheel base
const wheelGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 36);
const wheelMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    shininess: 30 
});
const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
wheel.receiveShadow = true;
wheelGroup.add(wheel);

// Add a rim
const rimGeometry = new THREE.TorusGeometry(2, 0.1, 16, 100);
const rimMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xCD7F32, // Bronze color for rim
    shininess: 80
});
const rim = new THREE.Mesh(rimGeometry, rimMaterial);
rim.rotation.x = Math.PI / 2;
rim.position.y = 0.1;
wheelGroup.add(rim);

// Define the standard European roulette sequence
const rouletteSequence = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Create number texture for slots
function createNumberTexture(number, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;  // Increase from 128
    canvas.height = 256; // Increase from 128
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(128, 128, 120, 0, Math.PI * 2); // Adjust for larger canvas
    ctx.fill();

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 128px Arial'; // Increase from 64px
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), 128, 128);

    return new THREE.CanvasTexture(canvas);
}

// Add slots with proper dividers
const slotCount = 37; // 0-36 for European roulette
const slotRadius = 1.8;
const slotHeight = 0.15;

// Create individual slots
for (let i = 0; i < slotCount; i++) {
    const number = rouletteSequence[i];
    const angle = (i / slotCount) * Math.PI * 2;
    
    // Determine color based on standard roulette rules
    let slotColor, colorName;
    if (number === 0) {
        slotColor = 0x00AA00; // Green for 0
        colorName = 'green';
    } else {
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        if (redNumbers.includes(number)) {
            slotColor = 0xC10000; // Red
            colorName = 'red';
        } else {
            slotColor = 0x000000; // Black
            colorName = 'black';
        }
    }
    
    // Create a slot group to hold the slot and number
    const slotGroup = new THREE.Group();
    slotGroup.rotation.y = angle;
    
    // Calculate slot geometry (trapezoidal shape)
    const slotShape = new THREE.Shape();
    const innerRadius = 1.2;
    const outerRadius = 2.0;
    
    // Calculate angles for the sides of the trapezoid
    const angleStep = (Math.PI * 2) / slotCount;
    const halfAngleStep = angleStep / 2;
    
    // Create a trapezoid shape that exactly fits between dividers
    const innerWidth = (innerRadius * Math.sin(halfAngleStep)) * 2;
    const outerWidth = (outerRadius * Math.sin(halfAngleStep)) * 2;
    
    slotShape.moveTo(-innerWidth/2, 0);
    slotShape.lineTo(innerWidth/2, 0);
    slotShape.lineTo(outerWidth/2, outerRadius - innerRadius);
    slotShape.lineTo(-outerWidth/2, outerRadius - innerRadius);
    slotShape.closePath();
    
    // Extrude the shape to create a 3D slot
    const extrudeSettings = {
        steps: 1,
        depth: slotHeight,
        bevelEnabled: false
    };
    
    const slotGeometry = new THREE.ExtrudeGeometry(slotShape, extrudeSettings);
    const slotMaterial = new THREE.MeshPhongMaterial({ 
        color: slotColor,
        shininess: 50
    });
    
    const slot = new THREE.Mesh(slotGeometry, slotMaterial);
    slot.rotation.x = -Math.PI / 2; // Make it flat
    slot.position.y = 0.1; // Position at top of wheel
    slot.position.z = -(innerRadius); // Center it at inner radius
    slot.castShadow = true;
    
    slotGroup.add(slot);
    
    // Create number plate at the outer edge of each slot
    const numberTexture = createNumberTexture(number, colorName);
    const plateGeometry = new THREE.CircleGeometry(0.25, 32);
    const plateMaterial = new THREE.MeshBasicMaterial({ 
        map: numberTexture,
        side: THREE.DoubleSide
    });
    
    const numberPlate = new THREE.Mesh(plateGeometry, plateMaterial);
    
    // Position at the outer edge of the slot
    numberPlate.position.set(0, 0.16, -(outerRadius - 0.3)); // Change from 0.2 to 0.3
    numberPlate.rotation.x = -Math.PI / 2; // Face upward
    
    
    slotGroup.add(numberPlate);
    wheelGroup.add(slotGroup);
}

// Add dividers between slots (aligned exactly at the junction of slots)
for (let i = 0; i < slotCount; i++) {
    const angle = (i / slotCount) * Math.PI * 2;
    
    const dividerGroup = new THREE.Group();
    dividerGroup.rotation.y = angle + (Math.PI / slotCount); // Position exactly between slots
    
    const dividerGeometry = new THREE.BoxGeometry(0.04, 0.25, 0.8);
    const dividerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xFFFFFF, // White dividers
        shininess: 90
    });
    const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
    
    // Position at the center of the radius range
    divider.position.set(0, 0.15, -1.6);
    divider.castShadow = true;
    
    dividerGroup.add(divider);
    wheelGroup.add(dividerGroup);
}

// Add a central cone
const coneGeometry = new THREE.ConeGeometry(0.5, 0.5, 32);
const coneMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x666666,
    shininess: 80
});
const cone = new THREE.Mesh(coneGeometry, coneMaterial);
cone.position.set(0, 0.35, 0);
cone.castShadow = true;
wheelGroup.add(cone);

// Add decorative spokes
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    
    const spokeGroup = new THREE.Group();
    spokeGroup.rotation.y = angle;
    
    const spokeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
    const spokeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xD3D3D3, // Light silver color
        shininess: 90
    });
    const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    
    spoke.position.set(0, 0.15, -0.7); // Position from center outward
    spoke.rotation.x = Math.PI / 2; // Lay flat
    spoke.castShadow = true;
    
    spokeGroup.add(spoke);
    wheelGroup.add(spokeGroup);
}

// Add the wheel to the scene
scene.add(wheelGroup);

// Add a ball
const ballGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const ballMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xFFFFFF,
    shininess: 100,
    specular: 0xFFFFFF
});
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(slotRadius, 0.3, 0);
ball.castShadow = true;
scene.add(ball);

// Add a floor under the wheel
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x006400, // Dark green
    shininess: 10
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.1;
floor.receiveShadow = true;
scene.add(floor);

// Position the camera for a good view
camera.position.set(0, 4, 4);
camera.lookAt(0, 0, 0);

// Add orbit controls to let users explore the 3D view
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 4;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 2.2; // Prevent going below wheel
controls.update();

// Variables for spinning
let wheelSpeed = 0;
let ballSpeed = 0;
let isSpinning = false;
let winningNumber = 0;
let winningSlotAngle = 0;
let hasResult = false;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update controls
    controls.update();

    if (isSpinning) {
        // Spin the wheel - the entire wheel group rotates together
        wheelGroup.rotation.y += wheelSpeed;
        wheelSpeed *= 0.98; // Speed up slowdown (was 0.995)
        
        // Ball physics with realistic bouncing and movement
        ballSpeed *= 0.997;
        
        // Ball bouncing effect
        const currentTime = Date.now() * 0.001;
        const ballHeightFrequency = 5 + (1 - ballSpeed / 0.05) * 15; 
        const ballHeightAmplitude = Math.min(0.2, ballSpeed * 3);
        
        const ballHeight = slotHeight + 0.1 + Math.abs(Math.sin(currentTime * ballHeightFrequency)) * ballHeightAmplitude;
        
        // Ball moves opposite to wheel initially, then syncs with wheel as it slows
        const ballAngleDelta = ballSpeed * (ballSpeed > 0.01 ? -15 : 1);
        const ballAngle = wheelGroup.rotation.y + ballAngleDelta + Math.sin(currentTime) * 0.05 * (ballSpeed / 0.05);
        
        // Update ball position
        ball.position.x = slotRadius * Math.cos(ballAngle);
        ball.position.y = Math.max(slotHeight, ballHeight);
        ball.position.z = slotRadius * Math.sin(ballAngle);

        // Stop spinning after slowing down significantly (faster than before)
        if (wheelSpeed < 0.0005) {
            isSpinning = false;
            hasResult = true;
            
            // Find winning slot based on the winning number
            const winningIndex = rouletteSequence.indexOf(winningNumber);
            
            // Calculate final position based on wheel rotation + slot position
            winningSlotAngle = (winningIndex / slotCount) * Math.PI * 2 + wheelGroup.rotation.y;
            
            // Snap ball to final position
            ball.position.x = slotRadius * Math.cos(winningSlotAngle);
            ball.position.y = slotHeight + 0.1;
            ball.position.z = slotRadius * Math.sin(winningSlotAngle);
            
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
    } else if (hasResult) {
        // Keep the ball in the winning position until next spin
        ball.position.x = slotRadius * Math.cos(winningSlotAngle);
        ball.position.y = slotHeight + 0.1;
        ball.position.z = slotRadius * Math.sin(winningSlotAngle);
    }

    renderer.render(scene, camera);
}

// Start animation
animate();

// Spin button functionality
document.getElementById('spin-button').addEventListener('click', () => {
    if (!isSpinning) {
        // Reset winning number highlight
        document.querySelectorAll('.bet-option').forEach(option => {
            option.classList.remove('winning-number');
        });
        
        // Reset hasResult flag
        hasResult = false;
        
        // Start spinning
        isSpinning = true;
        wheelSpeed = 0.1;
        ballSpeed = 0.05;
        
        // Choose a random winning number
        const randomIndex = Math.floor(Math.random() * slotCount);
        winningNumber = rouletteSequence[randomIndex];
        
        document.getElementById('winning-number').textContent = 'Spinning...';
        
        // Process bet if one exists
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
let chips = 1000;
let betAmount = 10;

// Update chips display
function updateChipsDisplay() {
    document.getElementById('chips-display').textContent = `Chips: ${chips}`;
}

// Initialize chips display
updateChipsDisplay();

// Initialize betting options
function initializeBettingOptions() {
    let currentChipMarker = null;
    
    const betOptions = document.querySelectorAll('.bet-option');
    betOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove existing chip marker if any
            if (currentChipMarker) {
                currentChipMarker.remove();
            }
            
            // Update selection
            betOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            // Add chip marker
            const chipMarker = document.createElement('div');
            chipMarker.className = 'chip-marker';
            chipMarker.textContent = betAmount;
            
            // Position chip marker
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
        });
    });
    
    // Bet amount controls
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

// Process bets after spin
function checkBetAfterSpin() {
    setTimeout(() => {
        let didWin = false;
        let winAmount = 0;
        const resultMessage = document.getElementById('result-message');
        
        if (currentBet) {
            // Check if bet wins based on type
            if (currentBet.type === 'number' && parseInt(currentBet.value) === winningNumber) {
                didWin = true;
                winAmount = currentBet.amount * 35; // 35:1 for single number
            } else if (currentBet.type === 'color') {
                const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
                const winningColor = winningNumber === 0 ? 'green' : redNumbers.includes(winningNumber) ? 'red' : 'black';
                if (currentBet.value === winningColor) {
                    didWin = true;
                    winAmount = currentBet.amount * 2; // 1:1 for color
                }
            } else if (currentBet.type === 'parity') {
                if (winningNumber !== 0) {
                    const isEven = winningNumber % 2 === 0;
                    if ((currentBet.value === 'even' && isEven) || 
                        (currentBet.value === 'odd' && !isEven)) {
                        didWin = true;
                        winAmount = currentBet.amount * 2; // 1:1 for even/odd
                    }
                }
            } else if (currentBet.type === 'range') {
                if (winningNumber !== 0) {
                    if ((currentBet.value === 'low' && winningNumber >= 1 && winningNumber <= 18) ||
                        (currentBet.value === 'high' && winningNumber >= 19 && winningNumber <= 36)) {
                        didWin = true;
                        winAmount = currentBet.amount * 2; // 1:1 for range
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
                        winAmount = currentBet.amount * 3; // 2:1 for column
                    }
                }
            }
        }
        
        // Update display based on win/loss
        if (didWin) {
            chips += winAmount;
            updateChipsDisplay();
            resultMessage.textContent = `You win ${winAmount} chips!`;
            resultMessage.className = 'win-message';
        } else {
            resultMessage.textContent = 'You lose!';
            resultMessage.className = 'lose-message';
        }
        
        // Reset current bet but keep the selection visible
        document.getElementById('bet-info').textContent = 
            `Last bet: ${currentBet.amount} chips on ${currentBet.type === 'number' ? 'Number ' + currentBet.value : currentBet.value}`;
        currentBet = null;
    }, 4000); // Slightly shortened wait time for faster gameplay
}

// Initialize betting options when the page loads
document.addEventListener('DOMContentLoaded', initializeBettingOptions);