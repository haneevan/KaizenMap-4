/* Kaizen Portal - Script.js (Fixed Logic for Nested Japanese Config) */

let map;
let activeMarkerLayer = null; 
let tempCoords = null;

// 1. DYNAMIC CONFIGURATION (Matches your latest Japanese version)
const factoryConfig = {
    "第一工場": {
        folder: "1st Factory",
        floors: {
            "1階": { path: "1st_Factory_1F.png", id: "f1_1f" },
            "2階-1": { path: "1st_Factory_2F-1.png", id: "f1_2f_1" },
            "2階-2": { path: "1st_Factory_2F-2.png", id: "f1_2f_2" },
            "3階": { path: "1st_Factory_3F.png", id: "f1_3f" },
            "屋外": { path: "1st_Factory_Outdoor.png", id: "f1_od" },
            "屋上": { path: "1st_Factory_RF.png", id: "f1_rf" }
        }
    },
    "第二工場": {
        folder: "2nd Factory",
        floors: {
            "1階": { path: "2nd_Factory_1F.png", id: "f2_1f" },
            "2階": { path: "2nd_Factory_2F.png", id: "f2_2f" },
            "3階": { path: "2nd_Factory_3F.png", id: "f2_3f" },
            "屋外": { path: "2nd_Factory_Outdoor.png", id: "f2_od" }
        }
    },
    "第三工場": {
        folder: "3rd Factory",
        floors: {
            "1階": { path: "3rd_Factory_1F.png", id: "f3_1f" }
        }
    },
    "豊田工場": {
        folder: "Toyota Factory",
        floors: {
            "1階": { path: "Toyota_Factory_1F.png", id: "tf_1f" },
            "2階": { path: "Toyota_Factory_2F.png", id: "tf_2f" },
            "3階": { path: "Toyota_Factory_3F.png", id: "tf_3f" },
            "屋外": { path: "Toyota_Factory_Outdoor.png", id: "tf_od" }
        }
    }
};

const office_othersConfig = {
    "事務棟": {
        folder: "Head Office",
        floors: {
            "1階": { path: "Head_Office_1F.png", id: "ho_1f" },
            "2階": { path: "Head_Office_2F.png", id: "ho_2f" },
            "3階": { path: "Head_Office_3F.png", id: "ho_3f" },
            "屋外": { path: "Head_Office_Outdoor.png", id: "ho_od" },
            "屋上": { path: "Head_Office_RF.png", id: "ho_rf" }
        }
    },
    "倉庫": {
        folder: "Material Warehouse",
        floors: {
            "1階": { path: "Material_Warehouse_1F.png", id: "wh_1f" },
            "2階": { path: "Material_Warehouse_2F.png", id: "wh_2f" },
            "3階": { path: "Material_Warehouse_3F.png", id: "wh_3f" },
        }
    }
};

// 2. FIXED MARKER STORAGE INITIALIZATION
const markers = {};
const allConfigs = [factoryConfig, office_othersConfig];

allConfigs.forEach(configSet => {
    for (const building in configSet) {
        // Changed: Now looping through configSet[building].floors
        const floorData = configSet[building].floors;
        for (const floor in floorData) {
            const id = floorData[floor].id;
            markers[id] = L.layerGroup();
        }
    }
});

// 3. NAVIGATION (Unchanged)
function showSection(sectionId) {
    const sections = ['home', 'map', 'list', 'personal', 'profile', 'settings'];
    sections.forEach(s => {
        const content = document.getElementById('content-' + s);
        const link = document.getElementById('link-' + s);
        if (content) content.classList.add('hidden');
        if (link) link.classList.remove('nav-active');
    });

    const activeSection = document.getElementById('content-' + sectionId);
    if (activeSection) activeSection.classList.remove('hidden');

    const activeLink = document.getElementById('link-' + sectionId);
    if (activeLink) activeLink.classList.add('nav-active');

    if (sectionId === 'map') {
        initMap();
        setTimeout(() => { if (map) map.invalidateSize(); }, 200);
    }
}

// 4. MAP CORE LOGIC
function initMap() {
    if (!map) {
        map = L.map('kaizen-map', {
            crs: L.CRS.Simple,
            minZoom: -1,
            maxZoom: 2,
            attributionControl: false
        });

        const bounds = [[0, 0], [1500, 2250]];
        const basePath = '/static/resource/Company Blueprints/';

        // 4a. FIXED TREE NODE BUILDER
        function buildTreeBranch(configSet) {
            let branch = [];
            for (const buildingName in configSet) {
                const buildingData = configSet[buildingName];
                const buildingNode = { label: buildingName, children: [] };
                
                // Changed: Pathing now uses buildingData.folder and buildingData.floors
                for (const floorName in buildingData.floors) {
                    const config = buildingData.floors[floorName];
                    const fullPath = `${basePath}${buildingData.folder}/${config.path}`;
                    
                    const imgOverlay = L.imageOverlay(fullPath, bounds);
                    const combinedGroup = L.layerGroup([imgOverlay, markers[config.id]]);
                    
                    buildingNode.children.push({
                        label: floorName,
                        layer: combinedGroup,
                        selected: (config.id === 'f1_1f') 
                    });

                    if (config.id === 'f1_1f') {
                        combinedGroup.addTo(map);
                        activeMarkerLayer = markers[config.id];
                        updateFloorLabel(buildingName, floorName);
                    }
                }
                branch.push(buildingNode);
            }
            return branch;
        }
        // 4b. FIXED LAYER CONTROL WITH NESTED STRUCTURE
        const fullTreeData = [
            { label: '工場エリア (Factories)', children: buildTreeBranch(factoryConfig) },
            { label: '事務・倉庫 (Office & Others)', children: buildTreeBranch(office_othersConfig) }
        ];

        L.control.layers.tree(fullTreeData, null, { 
            collapsed: true, 
            position: 'topleft' 
        }).addTo(map);

        map.fitBounds(bounds);

        // 4c. MODIFIED CLICK TRACKER (Opens Side Panel instead of Modal)
        map.on('click', function(e) {
            tempCoords = e.latlng; 
            
            // Show the side panel
            const panel = document.getElementById('kaizen-side-panel');
            panel.classList.remove('hidden');
            
            // Trigger slide-in animation
            setTimeout(() => {
                panel.style.transform = 'translateX(0)';
            }, 10);

            // Update the coordinates display in the panel
            const coordDisplay = document.getElementById('display-coords');
            if(coordDisplay) {
                coordDisplay.innerText = `Y: ${e.latlng.lat.toFixed(1)}, X: ${e.latlng.lng.toFixed(1)}`;
            }
        });

        map.on('click', function(e) {
            tempCoords = e.latlng; 
            document.getElementById('kaizen-modal').classList.remove('hidden');
            document.getElementById('modal-coords').value = `Y: ${e.latlng.lat.toFixed(1)}, X: ${e.latlng.lng.toFixed(1)}`;
        });

    } else {
        setTimeout(() => { map.invalidateSize(); }, 100);
    }
}

// 5. HELPER: BREADCRUMB
function updateFloorLabel(building, floor) {
    const label = document.getElementById('active-floor-name');
    if (label) {
        label.style.opacity = '0';
        setTimeout(() => {
            label.innerText = `${building} - ${floor}`;
            label.style.opacity = '1';
        }, 200);
    }
}

// 6. FORM SUBMISSION (Synchronized with Backend Logic)
window.submitKaizenForm = function() {
    const title = document.getElementById('kaizen-title').value;
    const category = document.getElementById('kaizen-category').value;
    const desc = document.getElementById('kaizen-description').value;
    
    if (!title || !desc) {
        alert("件名と内容は必須です。");
        return;
    }

    if (activeMarkerLayer && tempCoords) {
        const m = L.marker(tempCoords).addTo(activeMarkerLayer);
        m.bindPopup(`
            <div class="p-1 text-left min-w-[150px]">
                <b class="text-blue-600 text-sm">${title}</b><br>
                <span class="text-[10px] text-slate-400 font-bold">${category}</span>
                <p class="text-xs mt-1 text-slate-600">${desc}</p>
                <button onclick="deleteMarker(${m._leaflet_id})" class="text-[9px] text-red-400 mt-2">Delete</button>
            </div>
        `).openPopup();

        addToLists(title, category, desc, m._leaflet_id);
        closeKaizenModal();
    }
};

// 7. LIST SYNC (Visual updates)
function addToLists(title, category, desc, id) {
    const today = new Date().toLocaleDateString('ja-JP');
    const tableBody = document.getElementById('all-kaizen-table-body');
    const row = `<tr>
        <td class="p-4 text-xs font-mono">${today}</td>
        <td class="p-4 font-bold text-xs">Current User</td>
        <td class="p-4 text-xs">Production</td>
        <td class="p-4 text-sm">${title}</td>
        <td class="p-4 text-xs font-bold text-blue-500">#${category}</td>
        <td class="p-4"><span class="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full font-black">PENDING</span></td>
    </tr>`;
    if(tableBody) tableBody.insertAdjacentHTML('afterbegin', row);

    const cardList = document.getElementById('personal-kaizen-list');
    const card = `<div class="bg-white p-5 rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 shadow-sm">
        <h4 class="font-bold text-slate-800">${title}</h4>
        <p class="text-xs text-slate-500 mt-1">${desc}</p>
        <div class="mt-4 pt-3 border-t text-[10px] text-slate-400 flex justify-between">
            <span>#${category}</span>
            <span class="font-mono">ID: ${id}</span>
        </div>
    </div>`;
    if(cardList) cardList.insertAdjacentHTML('afterbegin', card);
}

// 8. UTILITIES (Updated for Side Panel)
window.closeKaizenSidePanel = function() {
    const panel = document.getElementById('kaizen-side-panel');
    
    // Slide out to the right
    panel.style.transform = 'translateX(100%)';
    
    // Hide from DOM after animation finishes
    setTimeout(() => {
        panel.classList.add('hidden');
        
        // Clear inputs for next time
        document.getElementById('kaizen-title').value = '';
        document.getElementById('kaizen-description').value = '';
    }, 300);
};

window.deleteMarker = function(id) {
    if (activeMarkerLayer) {
        activeMarkerLayer.eachLayer(layer => {
            if (layer._leaflet_id === id) activeMarkerLayer.removeLayer(layer);
        });
    }
};

window.toggleUserMenu = () => document.getElementById('user-dropdown').classList.toggle('hidden');

document.addEventListener('DOMContentLoaded', () => showSection('home'));