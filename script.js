// ============================
// CALIBRATED MAP CONFIGURATION (ZOOM: 13.6 & CENTER REALIGNED)
// ============================
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tiles.openfreemap.org/styles/liberty', 
    center: [32.8540, 39.9195], 
    zoom: 13.6,                
    minZoom: 13.6,             
    maxZoom: 13.6,             
    
    // EXPERIMENTAL CONTROLS: FIXED VIEWPORT MATRIX
    dragPan: false,            
    doubleClickZoom: false,    
    boxZoom: false,            
    keyboard: false,           
    touchZoomRotate: false,    
    
    pixelRatio: window.devicePixelRatio || 2 
});

// ============================
// ORIGINAL KML GEOMETRY VERTICES (triangle corners of the scene)
// ============================
const positions = {
    leftNode:  [32.845501, 39.921050], // G Actor - Left Top Corner
    rightNode: [32.858463, 39.923483], // M Actor - Right Top Corner
    mainNode:  [32.858746, 39.913890]  // Main Actor - Bottom Corner
};

// ============================
// EXPERIMENT SUBJECTS CONFIGURATION
// ============================
const people = [
    { id: "leftNode", markerType: "grey-letter-dot", initial: "G" },
    { id: "rightNode", markerType: "grey-letter-dot", initial: "M" },
    { id: "mainNode", markerType: "blue-pulse-dot" }
];

// ============================
// MARKER RENDER ENGINE
// ============================
function createMarkerElement(person) {
    const clusterEl = document.createElement("div");
    clusterEl.className = "marker-cluster";

    const agentEl = document.createElement("div");
    agentEl.className = "agent-node";

    if (person.markerType === "blue-pulse-dot") {
        const mapsDotContainer = document.createElement("div");
        mapsDotContainer.className = "google-maps-dot-container";

        const breathingPulse = document.createElement("div");
        breathingPulse.className = "google-maps-pulse";

        const solidCore = document.createElement("div");
        solidCore.className = "google-maps-core";

        mapsDotContainer.appendChild(breathingPulse);
        mapsDotContainer.appendChild(solidCore);
        agentEl.appendChild(mapsDotContainer);
    } 
    else if (person.markerType === "grey-letter-dot") {
        const greyDot = document.createElement("div");
        greyDot.className = "experimental-grey-letter-dot";
        greyDot.textContent = person.initial;
        agentEl.appendChild(greyDot);
    }

    clusterEl.appendChild(agentEl);
    return clusterEl;
}

const markerInstances = {};

function initMarkers() {
    people.forEach(person => {
        const marker = new maplibregl.Marker({
            element: createMarkerElement(person),
            anchor: "center"
        })
        .setLngLat(positions[person.id])
        .addTo(map);

        markerInstances[person.id] = marker;
    });
}

initMarkers();

// ============================
// TIMED INTERPOLATION ENGINE WITH TARGETED ESCAPE MATRIX
// ============================
const DELAY_DURATION = 5 * 1000;       // 5 seconds stable
const CONVERGE_DURATION = 10 * 1000;   // 10 seconds convergence window
const ESCAPE_DURATION = 15 * 1000;     // 15 seconds escape window
const TOTAL_DURATION = DELAY_DURATION + CONVERGE_DURATION + ESCAPE_DURATION; // Total: 30 seconds

const startG = positions.leftNode;
const startM = positions.rightNode;

const midLng = (startG[0] + startM[0]) / 2;
const midLat = (startG[1] + startM[1]) / 2; 

const offsetPercent = 0.04; 
const deltaLng = startM[0] - startG[0];
const deltaLat = startM[1] - startG[1];

const midTargetG = [midLng - (deltaLng * offsetPercent), midLat - (deltaLat * offsetPercent)];
const midTargetM = [midLng + (deltaLng * offsetPercent), midLat + (deltaLat * offsetPercent)];

// 2 Saniyelik Kuzeybatı Kırılma Noktası Koordinatları (-Lng, +Lat)
const pivotTargetG = [midTargetG[0] - 0.000600, midTargetG[1] + 0.000400];
const pivotTargetM = [midTargetM[0] - 0.000600, midTargetM[1] + 0.000400];

// Ankara Kızılay/Sıhhiye Aksına Göre Belirlenen Final Doğrusal Kuzeydoğu Varış Noktaları
const finalTargetG = [32.855850, 39.928250]; 
const finalTargetM = [32.856350, 39.928400]; 

let startTime = null;

function animateNodes(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // PHASE 1: Baseline stabilization timeline (0s - 5s)
    if (elapsed < DELAY_DURATION) {
        if (markerInstances["leftNode"]) markerInstances["leftNode"].setLngLat(positions.leftNode);
        if (markerInstances["rightNode"]) markerInstances["rightNode"].setLngLat(positions.rightNode);
    }
    // PHASE 2: Trajectory convergence to midpoint (5s - 15s)
    else if (elapsed >= DELAY_DURATION && elapsed < (DELAY_DURATION + CONVERGE_DURATION)) {
        const progress = (elapsed - DELAY_DURATION) / CONVERGE_DURATION;

        const currentG_Lng = startG[0] + (midTargetG[0] - startG[0]) * progress;
        const currentG_Lat = startG[1] + (midTargetG[1] - startG[1]) * progress;

        const currentM_Lng = startM[0] + (midTargetM[0] - startM[0]) * progress;
        const currentM_Lat = startM[1] + (midTargetM[1] - startM[1]) * progress;

        if (markerInstances["leftNode"]) markerInstances["leftNode"].setLngLat([currentG_Lng, currentG_Lat]);
        if (markerInstances["rightNode"]) markerInstances["rightNode"].setLngLat([currentM_Lng, currentM_Lat]);
    }
    // PHASE 3: Escape Trajectory (15s - 30s)
    else if (elapsed >= (DELAY_DURATION + CONVERGE_DURATION) && elapsed <= TOTAL_DURATION) {
        const escapeElapsed = elapsed - DELAY_DURATION - CONVERGE_DURATION;

        let currentG = [];
        let currentM = [];

        // SEGMENT 3.1: 2 saniyelik ani Kuzeybatı kırılması (15s - 17s)
        if (escapeElapsed < 2000) {
            const segProgress = escapeElapsed / 2000;
            currentG = [
                midTargetG[0] + (pivotTargetG[0] - midTargetG[0]) * segProgress,
                midTargetG[1] + (pivotTargetG[1] - midTargetG[1]) * segProgress
            ];
            currentM = [
                midTargetM[0] + (pivotTargetM[0] - midTargetM[0]) * segProgress,
                midTargetM[1] + (pivotTargetM[1] - midTargetM[1]) * segProgress
            ];
        }
        // SEGMENT 3.2: Kuzeydoğuya dönüp lineer şekilde Sıhhiye yönüne ilerleme (17s - 30s -> 13 saniye)
        else {
            const segProgress = (escapeElapsed - 2000) / 13000;
            currentG = [
                pivotTargetG[0] + (finalTargetG[0] - pivotTargetG[0]) * segProgress,
                pivotTargetG[1] + (finalTargetG[1] - pivotTargetG[1]) * segProgress
            ];
            currentM = [
                pivotTargetM[0] + (finalTargetM[0] - pivotTargetM[0]) * segProgress,
                pivotTargetM[1] + (finalTargetM[1] - pivotTargetM[1]) * segProgress
            ];
        }

        if (markerInstances["leftNode"]) markerInstances["leftNode"].setLngLat(currentG);
        if (markerInstances["rightNode"]) markerInstances["rightNode"].setLngLat(currentM);
    }
    // PHASE 4: Post-termination freeze matrix (Post 30s)
    else if (elapsed > TOTAL_DURATION) {
        if (markerInstances["leftNode"]) markerInstances["leftNode"].setLngLat(finalTargetG);
        if (markerInstances["rightNode"]) markerInstances["rightNode"].setLngLat(finalTargetM);
        return;
    }

    if (elapsed < TOTAL_DURATION) {
        requestAnimationFrame(animateNodes);
    }
}

// Qualtrics senkronizasyon hatasını (Yeşil Ekran) önleyen güvenli tetikleyici mekanizması
function startExecution() {
    const mapCanvas = map.getCanvas();
    if (mapCanvas) {
        mapCanvas.style.filter = 'grayscale(0.6) contrast(1.1) brightness(0.95) hue-rotate(25deg)';
    }
    requestAnimationFrame(animateNodes);
}

if (map.isStyleLoaded()) {
    startExecution();
} else {
    map.once('styledata', startExecution);
}