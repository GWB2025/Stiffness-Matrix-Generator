document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const numNodesInput = document.getElementById('num-nodes');
    const globalMultiplierInput = document.getElementById('global-multiplier');
    const decimalPlacesInput = document.getElementById('decimal-places');
    const fixedNodesContainer = document.getElementById('fixed-nodes-container');
    const elementsContainer = document.getElementById('elements-container');
    const forcesContainer = document.getElementById('forces-container');
    const generateMatrixBtn = document.getElementById('generate-matrix-btn');
    const invertMatrixBtn = document.getElementById('invert-matrix-btn');
    const calculateDisplacementsBtn = document.getElementById('calculate-displacements-btn');
    const calculateStressesBtn = document.getElementById('calculate-stresses-btn');
    const addElementBtn = document.getElementById('add-element-btn');
    const loadExample1Btn = document.getElementById('load-example-1-btn');
    const loadExample3Btn = document.getElementById('load-example-3-btn');
    const activity23Btn = document.getElementById('activity-2-3-btn');
    const clearAppBtn = document.getElementById('clear-app-btn');
    const matrixContainer = document.getElementById('matrix-container');
    const inverseMatrixContainer = document.getElementById('inverse-matrix-container');
    const displacementsContainer = document.getElementById('displacements-container');
    const reactionForcesContainer = document.getElementById('reaction-forces-container');
    const stressesContainer = document.getElementById('stresses-container');
    const globalMatrixMultiplier = document.getElementById('global-matrix-multiplier');
    const inverseMatrixMultiplier = document.getElementById('inverse-matrix-multiplier');
    const inputSection = document.querySelector('.input-section');
    const modal = document.getElementById('example-modal');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const modalImg = document.getElementById('modal-img');
    const showConstructionBtn = document.getElementById('show-construction-btn');
    const constructionModal = document.getElementById('construction-modal');
    const constructionStepsContainer = document.getElementById('construction-steps-container');
    const constructionModalCloseBtn = constructionModal.querySelector('.modal-close-btn');

    const showDiagramBtn = document.getElementById('show-diagram-btn');
    const diagramModal = document.getElementById('diagram-modal');
    const diagramContainer = document.getElementById('diagram-container');
    const diagramModalCloseBtn = diagramModal.querySelector('.modal-close-btn');

    const calculateElementForcesBtn = document.getElementById('calculate-element-forces-btn');
    const elementForcesContainer = document.getElementById('element-forces-container');

    let elementCount = 0;
    let globalStiffnessMatrix = []; // Unscaled
    let fullDisplacementVector = []; // To store nodal displacements
    let reactionForcesResult = [];
    let elementStressesResult = [];
    let elementForcesResult = [];
    let matrixForExport = { K: null, invK: null, kHeaders: null, invKHeaders: null, kMultiplierHtml: '', invKMultiplierHtml: '', kNumericMultiplier: 1, invKNumericMultiplier: 1 };

    // --- HELPER FUNCTIONS ---

    const formatEngineeringNotation = (value, precision = 3) => {
        if (isNaN(value)) {
            return { value: 'NaN', exponent: 0 };
        }
        if (!isFinite(value)) {
            return { value: value > 0 ? 'Infinity' : '-Infinity', exponent: 0 };
        }
        if (value === 0) return { value: '0', exponent: 0 };
        if (Math.abs(value) < 1e-12) return { value: '0', exponent: 0 };

        const absValue = Math.abs(value);

        // If the number is within a "normal" range, don't use engineering notation
        // For example, between 0.001 and 1,000,000 (exclusive of 1,000,000 for adjustedValue logic)
        if (absValue >= 0.001 && absValue < 1000000) {
            return { value: (value < 0 ? '-' : '') + absValue.toFixed(precision).replace(/\.?0+$/, ''), exponent: 0 };
        }

        const log10 = Math.log10(absValue);

        let exponent = Math.floor(log10 / 3) * 3;
        let adjustedValue = absValue / Math.pow(10, exponent);

        // Adjust if adjustedValue is outside [1, 1000)
        if (adjustedValue >= 1000 && exponent < 21) { // Max exponent 21 (10^21)
            adjustedValue /= 1000;
            exponent += 3;
        } else if (adjustedValue < 1 && exponent > -21) { // Min exponent -21 (10^-21)
            adjustedValue *= 1000;
            exponent -= 3;
        }

        const formattedValue = adjustedValue.toFixed(precision).replace(/\.?0+$/, '');
        return { value: (value < 0 ? '-' : '') + formattedValue, exponent: exponent };
    };

    const formatEngineeringNotationForLatex = (value, precision = 3, wrapInMathMode = true) => {
        const { value: formattedValue, exponent } = formatEngineeringNotation(value, precision);

        if (formattedValue === 'NaN' || formattedValue.includes('Infinity')) {
            // These are math-like symbols and should always be in math mode.
            return `$${formattedValue}$`;
        }

        let output;
        if (exponent !== 0) {
            output = `${formattedValue} \\times 10^{${exponent}}`;
        } else {
            output = formattedValue;
        }

        return wrapInMathMode ? `$${output}$` : output;
    };

    const generateLatexString = (matrix, headers, numericMultiplierValue) => {
        if (!matrix) return '';

        const decimalPlaces = parseInt(decimalPlacesInput.value);

        let multiplierString = '';
        // Handle multiplier
        if (numericMultiplierValue && numericMultiplierValue !== 1) {
            const formattedMultiplier = formatEngineeringNotationForLatex(numericMultiplierValue, decimalPlaces, false);
            if (formattedMultiplier) {
                multiplierString = `${formattedMultiplier} \\times \n`;
            }
        }

        // Begin matrix
        // Use 'r' for right-aligned columns as scientific notation breaks decimal alignment.
        const numCols = matrix[0].length;
        const colFormat = Array(numCols).fill('r').join('');
        
        let latex = `\\[\n${multiplierString}\\left[\\begin{array}{${colFormat}}\n`;

        // Add matrix data
        matrix.forEach(row => {
            latex += row.map(val => formatEngineeringNotationForLatex(val, decimalPlaces, false)).join(' & ') + ' \\\\\n';
        });

        latex += `\\end{array}\\right]\n\\]\n`;
        return latex;
    };

    const promptWithLatex = (latex, title = "LaTeX Code") => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(latex).then(() => {
                prompt(`Copied the ${title} to the clipboard. You can also copy it from here:`, latex);
            }, () => {
                prompt(`Failed to copy to clipboard. Please copy the ${title} below:`, latex);
            });
        } else {
            prompt(`Copy the ${title} below:`, latex);
        }
    };

    const formatMultiplier = (value, inverse = false) => {
        if (value === 1) return '';
        if (value === 0) return '0 x';

        let displayValue = value;
        let displayExponent = 0;

        if (value !== 0) {
            displayExponent = Math.floor(Math.log10(Math.abs(value)));
            displayValue = value / Math.pow(10, displayExponent);
        }

        const formattedValue = displayValue.toFixed(3).replace(/\.?0+$/, '');
        const exponentText = `10<sup>${inverse ? -displayExponent : displayExponent}</sup>`;

        if (displayExponent === 0) {
            return `${formattedValue} x`.trim();
        } else {
            return `${formattedValue} ${exponentText} x`.trim();
        }
    };

    // --- STATE MANAGEMENT & UI ---

    const saveState = () => {
        const elements = Array.from(elementsContainer.querySelectorAll('.element-row')).map(row => ({
            label: row.querySelector('.element-label-input').value,
            node1: row.querySelector('.node1').value,
            node2: row.querySelector('.node2').value,
            stiffness: row.querySelector('.stiffness-input').value,
            area: row.querySelector('.area-input').value,
            length: row.querySelector('.length-input').value,
            calculateK: row.querySelector('.calculate-k-checkbox').checked
        }));
        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input[type="checkbox"]')).map(cb => cb.checked);
        const forces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => input.value);
        const state = { 
            numNodes: numNodesInput.value, 
            globalMultiplier: globalMultiplierInput.value, 
            youngsModulus: document.getElementById('youngs-modulus').value,
            decimalPlaces: decimalPlacesInput.value, 
            elements, 
            fixedNodes, 
            forces 
        };
        localStorage.setItem('stiffnessMatrixState', JSON.stringify(state));
    };

    const loadState = () => {
        const savedState = localStorage.getItem('stiffnessMatrixState');
        if (!savedState) {
            resetAppToDefault(false);
            return;
        }
        try {
            const state = JSON.parse(savedState);
            numNodesInput.value = state.numNodes || 2;
            globalMultiplierInput.value = state.globalMultiplier || 1;
            document.getElementById('youngs-modulus').value = state.youngsModulus || '210e9';
            decimalPlacesInput.value = state.decimalPlaces || 4;

            // Clear existing elements before loading
            elementsContainer.innerHTML = '';
            if (state.elements && state.elements.length > 0) {
                state.elements.forEach(el => {
                    const newRow = addElementRow(el.node1, el.node2, el.stiffness, el.area, el.label, el.length);
                    const calcKCheckbox = newRow.querySelector('.calculate-k-checkbox');
                    if (el.calculateK) {
                        calcKCheckbox.checked = true;
                        // Manually trigger the change event to ensure the stiffness field is updated and disabled
                        calcKCheckbox.dispatchEvent(new Event('change'));
                    }
                });
            } else {
                // If no elements saved, add a default one for a fresh start
                addElementRow();
            }

            generateBoundaryConditionsUI(parseInt(numNodesInput.value), state.fixedNodes);
            generateForcesUI(parseInt(numNodesInput.value), state.forces);

        } catch (error) {
            console.error("Failed to load saved state, resetting to default.", error);
            localStorage.removeItem('stiffnessMatrixState');
            resetAppToDefault(false);
        }
    };

    const resetAppToDefault = (shouldSave = true) => {
        numNodesInput.value = 2;
        globalMultiplierInput.value = 1;
        document.getElementById('youngs-modulus').value = '210e9';
        decimalPlacesInput.value = 4;
        elementsContainer.innerHTML = ''; // Clear all elements
        generateBoundaryConditionsUI(2);
        generateForcesUI(2);
        matrixContainer.innerHTML = '';
        inverseMatrixContainer.innerHTML = '';
        displacementsContainer.innerHTML = '';
        reactionForcesContainer.innerHTML = '';
        stressesContainer.innerHTML = '';
        elementForcesContainer.innerHTML = '';
        globalMatrixMultiplier.innerHTML = '';
        inverseMatrixMultiplier.innerHTML = '';
        
        // Clear global calculation results
        fullDisplacementVector = [];
        reactionForcesResult = [];
        elementStressesResult = [];
        elementForcesResult = [];
        matrixForExport = { K: null, invK: null, kHeaders: null, invKHeaders: null, kMultiplierHtml: '', invKMultiplierHtml: '', kNumericMultiplier: 1, invKNumericMultiplier: 1 };

        if (shouldSave) {
            saveState();
        }
    };

    // --- CORE UI & MATRIX GENERATION ---

    const generateBoundaryConditionsUI = (numNodes, fixedStates = []) => {
        fixedNodesContainer.innerHTML = '';
        for (let i = 1; i <= numNodes; i++) {
            const isChecked = fixedStates[i - 1] || false;
            const item = document.createElement('div');
            item.classList.add('fixed-node-item');
            item.innerHTML = `<input type="checkbox" id="fixed-node-${i}" ${isChecked ? 'checked' : ''} title="Tick to fix this node, preventing any displacement."><label for="fixed-node-${i}">Node ${i}</label>`;
            fixedNodesContainer.appendChild(item);
        }
    };

    const generateForcesUI = (numNodes, forceValues = []) => {
        forcesContainer.innerHTML = '';
        for (let i = 1; i <= numNodes; i++) {
            const value = forceValues[i - 1] || 0;
            const item = document.createElement('div');
            item.classList.add('force-item');
            item.innerHTML = `<label for="force-${i}">F<sub>${i}</sub>:</label><input type="number" id="force-${i}" value="${value}" title="Enter the external force applied at this node.">`;
            forcesContainer.appendChild(item);
        }
    };



    const addElementRow = (node1 = 1, node2 = 2, stiffness = 1, area = 1, label = '', length = 1) => {
        elementCount++;
        const elementRow = document.createElement('div');
        elementRow.classList.add('element-row');
        elementRow.setAttribute('id', `element-${elementCount}`);
        elementRow.innerHTML = `
            <div class="element-main-inputs">
                <div class="element-row-top">
                    <div class="element-input-group label-group">
                        <label for="label-${elementCount}">Label</label>
                        <input type="text" id="label-${elementCount}" class="element-label-input" value="${label}" placeholder="Label (optional)" title="An optional label for the element (e.g., 'k1').">
                    </div>
                    <div class="element-input-group">
                        <label for="node1-${elementCount}">Node Left</label>
                        <input type="number" id="node1-${elementCount}" class="node-input node1" value="${node1}" min="1" max="${parseInt(numNodesInput.value)}" title="The left-hand node the element is connected to.">
                    </div>
                    <div class="element-input-group">
                        <label for="node2-${elementCount}">Node Right</label>
                        <input type="number" id="node2-${elementCount}" class="node-input node2" value="${node2}" min="1" max="${parseInt(numNodesInput.value)}" title="The right-hand node the element is connected to.">
                    </div>
                </div>
                <div class="element-row-bottom">
                    <div class="element-input-group">
                        <label for="area-${elementCount}">Area (A)</label>
                        <input type="number" id="area-${elementCount}" class="area-input" value="${area}" step="any" title="The cross-sectional area, used for calculating stress and stiffness.">
                    </div>
                    <div class="element-input-group">
                        <label for="length-${elementCount}">Length (l)</label>
                        <input type="number" id="length-${elementCount}" class="length-input" value="${length}" step="any" title="The length of the element, used for calculating stiffness.">
                    </div>
                    <div class="element-input-group stiffness-group">
                        <label for="stiffness-${elementCount}">Stiffness (k)</label>
                        <div class="stiffness-input-wrapper">
                            <input type="number" id="stiffness-${elementCount}" class="stiffness-input" value="${stiffness}" step="any" title="The stiffness value of the element. Can be calculated automatically.">
                            <div class="calculate-k-container">
                                <input type="checkbox" id="calc-k-cb-${elementCount}" class="calculate-k-checkbox" title="Tick to calculate stiffness automatically from E, A, and l.">
                                <label for="calc-k-cb-${elementCount}">Calc k</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="element-actions">
                <button type="button" class="remove-element-btn" title="Remove this element from the system.">Remove</button>
            </div>
        `;
        elementsContainer.appendChild(elementRow);

        // --- Auto-calculation logic for the new row ---
        const youngsModulusInput = document.getElementById('youngs-modulus');
        const areaInput = elementRow.querySelector('.area-input');
        const lengthInput = elementRow.querySelector('.length-input');
        const stiffnessInput = elementRow.querySelector('.stiffness-input');
        const calcKCheckbox = elementRow.querySelector('.calculate-k-checkbox');

        const updateStiffness = () => {
            if (calcKCheckbox.checked) {
                const E = parseFloat(youngsModulusInput.value);
                const A = parseFloat(areaInput.value);
                const l = parseFloat(lengthInput.value);
                if (!isNaN(E) && !isNaN(A) && !isNaN(l) && l !== 0) {
                    stiffnessInput.value = (A * E) / l;
                } else {
                    stiffnessInput.value = 0;
                }
            }
        };

        calcKCheckbox.addEventListener('change', () => {
            stiffnessInput.disabled = calcKCheckbox.checked;
            if (calcKCheckbox.checked) {
                updateStiffness();
            }
        });

        [areaInput, lengthInput].forEach(input => {
            input.addEventListener('input', updateStiffness);
        });
        // --- End of auto-calculation logic ---

        elementRow.querySelector('.remove-element-btn').addEventListener('click', () => {
            elementRow.remove();
            saveState();
        });

        // Add event listeners for node inputs to update max attribute
        const updateNodeMax = () => {
            const maxNode = parseInt(numNodesInput.value);
            elementRow.querySelector('.node1').setAttribute('max', maxNode);
            elementRow.querySelector('.node2').setAttribute('max', maxNode);
        };
        numNodesInput.addEventListener('change', updateNodeMax);
        updateNodeMax(); // Initial call

        return elementRow;
    };

    // Add event listener for the global Young's Modulus input
    const youngsModulusInput = document.getElementById('youngs-modulus');
    if (youngsModulusInput) {
        youngsModulusInput.addEventListener('input', () => {
            document.querySelectorAll('.element-row').forEach(row => {
                const calcKCheckbox = row.querySelector('.calculate-k-checkbox');
                if (calcKCheckbox && calcKCheckbox.checked) {
                    const areaInput = row.querySelector('.area-input');
                    const lengthInput = row.querySelector('.length-input');
                    const stiffnessInput = row.querySelector('.stiffness-input');
                    
                    const E = parseFloat(youngsModulusInput.value);
                    const A = parseFloat(areaInput.value);
                    const l = parseFloat(lengthInput.value);

                    if (!isNaN(E) && !isNaN(A) && !isNaN(l) && l !== 0) {
                        stiffnessInput.value = (A * E) / l;
                    } else {
                        stiffnessInput.value = 0;
                    }
                }
            });
        });
    }

    const generateAndDisplayMatrix = () => {
        const numNodes = parseInt(numNodesInput.value);
        if (isNaN(numNodes) || numNodes < 2 || numNodes > 10) {
            alert('Please enter a valid number of nodes (between 2 and 10).');
            return false;
        }
        const K = Array(numNodes).fill(0).map(() => Array(numNodes).fill(0).map(() => 0));
        const elementRows = elementsContainer.querySelectorAll('.element-row');
        let isValid = true;
        elementRows.forEach(row => {
            const stiffness = parseFloat(row.querySelector('.stiffness-input').value);
            const nodeId1 = parseInt(row.querySelector('.node1').value);
            const nodeId2 = parseInt(row.querySelector('.node2').value);

            if (isNaN(stiffness) || stiffness <= 0) {
                if (isValid) alert('Invalid input for an element. Stiffness must be a positive number.');
                isValid = false;
                return;
            }
            if (isNaN(nodeId1) || isNaN(nodeId2) || nodeId1 < 1 || nodeId2 < 1 || nodeId1 > numNodes || nodeId2 > numNodes || nodeId1 === nodeId2) {
                if (isValid) alert(`Invalid node IDs for an element. Nodes must be between 1 and ${numNodes} and different.`);
                isValid = false;
                return;
            }

            const i = nodeId1 - 1;
            const j = nodeId2 - 1;
            K[i][i] += stiffness;
            K[j][j] += stiffness;
            K[i][j] -= stiffness;
            K[j][i] -= stiffness;
        });
        if (isValid) {
            globalStiffnessMatrix = K;
            const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
            const multiplierText = formatMultiplier(globalMultiplier);
            displayMatrix(K, 'matrix-container', 'k-title', 'Global Stiffness Matrix (K)', null, multiplierText, 'global-matrix-multiplier', globalMultiplier);
            return true;
        }
        return false;
    };

    const displayMatrix = (matrix, containerId, titleContainerId, title, headers, multiplierHtml, multiplierContainerId, numericMultiplierValue) => {
        const container = document.getElementById(containerId);
        const multiplierContainer = document.getElementById(multiplierContainerId);
        const titleElement = document.getElementById(titleContainerId);
        if (titleElement && title) titleElement.innerHTML = title;
        if (multiplierContainer) multiplierContainer.innerHTML = multiplierHtml || '';
        if (!matrix || matrix.length === 0) {
            container.innerHTML = '<p>Matrix is empty or not generated.</p>';
            return;
        }
        let tableHTML = '<table><thead><tr><th></th>';
        const size = matrix.length;
        const displayHeaders = headers || Array.from({length: size}, (_, i) => i + 1);
        displayHeaders.forEach(h => tableHTML += `<th>${h}</th>`);
        tableHTML += '</tr></thead><tbody>';
        for (let i = 0; i < size; i++) {
            tableHTML += `<tr><th>${displayHeaders[i]}</th>`;
            for (let j = 0; j < size; j++) {
                const val = matrix[i][j];
                const { value: formattedValue, exponent } = formatEngineeringNotation(val, parseInt(decimalPlacesInput.value));
                let cellContent = formattedValue;
                if (exponent !== 0) {
                    cellContent += ` x 10<sup>${exponent}</sup>`;
                }
                tableHTML += `<td>${cellContent}</td>`;
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;

        // Store data for export
        if (containerId === 'matrix-container') {
            matrixForExport.K = matrix;
            matrixForExport.kHeaders = displayHeaders;
            matrixForExport.kMultiplierHtml = multiplierHtml;
            matrixForExport.kNumericMultiplier = numericMultiplierValue;
        } else if (containerId === 'inverse-matrix-container') {
            matrixForExport.invK = matrix;
            matrixForExport.invKHeaders = displayHeaders;
            matrixForExport.invKMultiplierHtml = multiplierHtml;
            matrixForExport.invKNumericMultiplier = numericMultiplierValue;
        }
    };

    // --- MATRIX MATH ---

    const getDeterminant = (m) => {
        if (m.length === 0) return 1;
        if (m.length === 1) return m[0][0];
        if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
        let det = 0;
        for (let j = 0; j < m.length; j++) {
            const minor = m.slice(1).map(row => row.filter((_, colIndex) => colIndex !== j));
            det += m[0][j] * Math.pow(-1, j) * getDeterminant(minor);
        }
        return det;
    };

    const invertMatrix = (m) => {
        const size = m.length;
        if (size === 0) return [];
        const identity = Array(size).fill(0).map((_, i) => Array(size).fill(0).map((__, j) => (i === j ? 1 : 0)));
        const augmented = m.map((row, i) => [...row, ...identity[i]]);
        for (let i = 0; i < size; i++) {
            let pivot = i;
            while (pivot < size && Math.abs(augmented[pivot][i]) < 1e-9) pivot++;
            if (pivot === size) return null;
            [augmented[i], augmented[pivot]] = [augmented[pivot], augmented[i]];
            const divisor = augmented[i][i];
            for (let j = i; j < 2 * size; j++) augmented[i][j] /= divisor;
            for (let k = 0; k < size; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = i; j < 2 * size; j++) augmented[k][j] -= factor * augmented[i][j];
                }
            }
        }
        return augmented.map(row => row.slice(size));
    };

    const getInvertedReducedMatrix = () => {
        if (!generateAndDisplayMatrix()) return null;
        const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input[type="checkbox"]')).map(cb => cb.checked);
        const freeNodesIndices = fixedNodes.map((isFixed, i) => (isFixed ? -1 : i)).filter(i => i !== -1);
        if (freeNodesIndices.length === 0) {
            alert('Cannot invert: No free nodes. Please unfix at least one node.');
            return null;
        }
        const reducedK = freeNodesIndices.map(i => freeNodesIndices.map(j => globalStiffnessMatrix[i][j] * globalMultiplier));
        const det = getDeterminant(reducedK);
        if (Math.abs(det) < 1e-9) {
            alert('The reduced matrix is singular and cannot be inverted. Please check your boundary conditions.');
            inverseMatrixContainer.innerHTML = '<p>The reduced matrix is singular (determinant is zero).</p>';
            inverseMatrixMultiplier.innerHTML = '';
            return null;
        }
        const invertedK = invertMatrix(reducedK);
        return { invertedK, freeNodesIndices, globalMultiplier };
    };

    // --- EVENT LISTENERS ---

    numNodesInput.addEventListener('change', () => {
        const numNodes = parseInt(numNodesInput.value);
        generateBoundaryConditionsUI(numNodes);
        generateForcesUI(numNodes);
        saveState();
    });

    addElementBtn.addEventListener('click', () => {
        addElementRow();
        saveState();
    });

    generateMatrixBtn.addEventListener('click', generateAndDisplayMatrix);

    invertMatrixBtn.addEventListener('click', () => {
        const result = getInvertedReducedMatrix();
        if (!result) return;
        const { invertedK, freeNodesIndices, globalMultiplier } = result;
        const scaledInvertedK = invertedK.map(row => row.map(val => val * globalMultiplier));
        const inverseMultiplierText = formatMultiplier(globalMultiplier, true);
        const reducedMatrixHeaders = freeNodesIndices.map(i => i + 1);
        displayMatrix(scaledInvertedK, 'inverse-matrix-container', 'inv-k-title', 'Inverse of Reduced Matrix (Kᵣ⁻¹)', reducedMatrixHeaders, inverseMultiplierText, 'inverse-matrix-multiplier', 1 / globalMultiplier);
    });

    calculateDisplacementsBtn.addEventListener('click', () => {
        // Clear previous downstream results
        reactionForcesResult = [];
        elementStressesResult = [];
        elementForcesResult = [];
        reactionForcesContainer.innerHTML = '';
        stressesContainer.innerHTML = '';
        elementForcesContainer.innerHTML = '';

        const result = getInvertedReducedMatrix();
        if (!result) return;
        const { invertedK, freeNodesIndices } = result;
        const allForces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => parseFloat(input.value) || 0);
        const freeForces = freeNodesIndices.map(i => allForces[i]);
        const displacements = freeNodesIndices.map((_, i) => {
            let d = 0;
            for (let j = 0; j < freeForces.length; j++) {
                d += invertedK[i][j] * freeForces[j];
            }
            return d;
        });
        let tableHTML = '<table><thead><tr><th>Node</th><th>Displacement (d)</th></tr></thead><tbody>';
        freeNodesIndices.forEach((nodeIndex, i) => {
            const { value: dispValue, exponent: dispExponent } = formatEngineeringNotation(displacements[i], parseInt(decimalPlacesInput.value));
            tableHTML += `<tr><td>${nodeIndex + 1}</td><td>${dispValue} x 10<sup>${dispExponent}</sup></td></tr>`;
        });
        tableHTML += '</tbody></table>';
        displacementsContainer.innerHTML = tableHTML;

        // --- REACTION FORCE CALCULATION ---
        const numNodes = parseInt(numNodesInput.value);
        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input[type="checkbox"]')).map(cb => cb.checked);
        const fixedNodesIndices = fixedNodes.map((isFixed, i) => (isFixed ? i : -1)).filter(i => i !== -1);

        fullDisplacementVector = Array(numNodes).fill(0);
        freeNodesIndices.forEach((nodeIndex, i) => {
            fullDisplacementVector[nodeIndex] = displacements[i];
        });

        const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
        const scaledGlobalK = globalStiffnessMatrix.map(row => row.map(val => val * globalMultiplier));

        const k_times_d = Array(numNodes).fill(0);
        for (let i = 0; i < numNodes; i++) {
            for (let j = 0; j < numNodes; j++) {
                k_times_d[i] += scaledGlobalK[i][j] * fullDisplacementVector[j];
            }
        }

        const reactionForces = k_times_d.map((val, i) => val - allForces[i]);

        let reactionTableHTML = '<table><thead><tr><th>Node</th><th>Reaction Force (R)</th></tr></thead><tbody>';
        if (fixedNodesIndices.length > 0) {
            fixedNodesIndices.forEach(nodeIndex => {
                const force = reactionForces[nodeIndex];
                reactionForcesResult.push({ node: nodeIndex + 1, force: force }); // Store result
                const { value: forceValue, exponent: forceExponent } = formatEngineeringNotation(force, parseInt(decimalPlacesInput.value));
                reactionTableHTML += `<tr><td>${nodeIndex + 1}</td><td>${forceValue} x 10<sup>${forceExponent}</sup></td></tr>`;
            });
        } else {
            reactionTableHTML += '<tr><td colspan="2">No fixed nodes to calculate reaction forces for.</td></tr>';
        }
        reactionTableHTML += '</tbody></table>';
        reactionForcesContainer.innerHTML = reactionTableHTML;
    });

    loadExample1Btn.addEventListener('click', () => {
        numNodesInput.value = 5;
        globalMultiplierInput.value = 1e8; // Set multiplier to 10^8 as per reaction.png example
        decimalPlacesInput.value = 4;

        elementsContainer.innerHTML = ''; // Clear existing elements
        addElementRow(1, 2, 0.3333, 1e-4, 'Element 1');
        addElementRow(2, 3, 1, 1e-4, 'Element 2');
        addElementRow(3, 4, 1, 1e-4, 'Element 3');
        addElementRow(4, 5, 0.3333, 1e-4, 'Element 4');

        generateBoundaryConditionsUI(5, [true, false, false, false, true]); // Fixed nodes 1 and 5
        generateForcesUI(5, [0, 0, 10000, 0, 0]); // Force at node 3

        generateAndDisplayMatrix(); // Generate and display the matrix from the elements
        saveState();

        // Show modal with example 2.2 image
        modalImg.src = 'images/2_2_example.png';
        modalImg.alt = 'Example 2.2 Diagram';
        // Reset modal position to center before showing
        const modalContent = document.querySelector('.modal-content');
        if (modalContent.resetDragPosition) {
            modalContent.resetDragPosition();
        }
        modal.style.display = 'flex'; // Show the modal
    });

    loadExample3Btn.addEventListener('click', () => {
        numNodesInput.value = 5;
        globalMultiplierInput.value = 1;
        decimalPlacesInput.value = 4;

        elementsContainer.innerHTML = ''; // Clear existing elements
        addElementRow(1, 2, 1.5, 1, 'Element 1');
        addElementRow(2, 3, 1.5, 1, 'Element 2');
        addElementRow(2, 3, 2, 1, 'Element 3 (Parallel)');
        addElementRow(2, 4, 5, 1, 'Element 4');
        addElementRow(4, 5, 5, 1, 'Element 5');
        addElementRow(3, 4, 2.5, 1, 'Element 6');

        generateBoundaryConditionsUI(5, [true, false, false, false, true]); // Fixed nodes 1 and 5
        generateForcesUI(5, [0, 100, 0, 100, 0]); // F2=100, F4=100

        generateAndDisplayMatrix();
        saveState();
        
        // Show modal with example 2.3 image
        modalImg.src = 'images/2_3_example.png';
        modalImg.alt = 'Example 2.3 Diagram';
        // Reset modal position to center before showing
        const modalContent = document.querySelector('.modal-content');
        if (modalContent.resetDragPosition) {
            modalContent.resetDragPosition();
        }
        
        modal.style.display = 'flex'; // Show the modal
    });

    if (activity23Btn) {
        activity23Btn.addEventListener('click', () => {
            numNodesInput.value = 5;
            globalMultiplierInput.value = 1;
            decimalPlacesInput.value = 4;

            elementsContainer.innerHTML = ''; // Clear existing elements
            addElementRow(1, 2, 500, 1, 'k1');
            addElementRow(2, 4, 400, 1, 'k2');
            addElementRow(2, 3, 600, 1, 'k3');
            addElementRow(1, 3, 200, 1, 'k4');
            addElementRow(3, 4, 400, 1, 'k5');
            addElementRow(4, 5, 300, 1, 'k6');

            generateBoundaryConditionsUI(5, [true, false, false, false, true]); // Fixed nodes 1 and 5
            generateForcesUI(5, [0, 0, -1000, 0, 0]); // F3=-1000

            generateAndDisplayMatrix();
            saveState();
        });
    }

    clearAppBtn.addEventListener('click', () => resetAppToDefault(true));

    inputSection.addEventListener('input', saveState);
    globalMultiplierInput.addEventListener('input', saveState);
    decimalPlacesInput.addEventListener('input', saveState);

    const formatMatrixForDisplay = (matrix, highlightIndices = []) => {
        const decimalPlaces = parseInt(decimalPlacesInput.value);
        let tableHTML = '<table>';
        tableHTML += '<thead><tr><th></th>' + matrix.map((_, i) => `<th>${i + 1}</th>`).join('') + '</tr></thead>';
        tableHTML += '<tbody>';
        matrix.forEach((row, i) => {
            tableHTML += `<tr><th>${i + 1}</th>`;
            row.forEach((val, j) => {
                const isHighlighted = highlightIndices.some(p => p[0] === i && p[1] === j);
                tableHTML += `<td ${isHighlighted ? 'style="background-color: #d4edda;"' : ''}>${val.toFixed(decimalPlaces)}</td>`;
            });
            tableHTML += '</tr>';
        });
        tableHTML += '</tbody></table>';
        return tableHTML;
    };

    const showConstructionSteps = () => {
        const numNodes = parseInt(numNodesInput.value);
        if (isNaN(numNodes) || numNodes < 2 || numNodes > 10) {
            alert('Please enter a valid number of nodes (between 2 and 10).');
            return;
        }

        const elementRows = elementsContainer.querySelectorAll('.element-row');
        if (elementRows.length === 0) {
            alert('Please add at least one element.');
            return;
        }

        let stepsHTML = '';
        let K = Array(numNodes).fill(0).map(() => Array(numNodes).fill(0));

        stepsHTML += '<h3>Initial Global Matrix (K)</h3>';
        stepsHTML += formatMatrixForDisplay(K);
        stepsHTML += '<hr>';

        let isValid = true;
        elementRows.forEach((row, index) => {
            if (!isValid) return;

            const stiffness = parseFloat(row.querySelector('.stiffness-input').value);
            const nodeId1 = parseInt(row.querySelector('.node1').value);
            const nodeId2 = parseInt(row.querySelector('.node2').value);

            if (isNaN(stiffness) || stiffness <= 0 || isNaN(nodeId1) || isNaN(nodeId2) || nodeId1 < 1 || nodeId2 < 1 || nodeId1 > numNodes || nodeId2 > numNodes || nodeId1 === nodeId2) {
                if (isValid) alert('Invalid input for one or more elements. Cannot show construction.');
                isValid = false;
                return;
            }

            stepsHTML += `<h3>Step ${index + 1}: Adding Element ${index + 1}</h3>`;
            stepsHTML += `<p>Element connecting <b>Node ${nodeId1}</b> and <b>Node ${nodeId2}</b> with stiffness <b>k = ${stiffness}</b></p>`;

            const i = nodeId1 - 1;
            const j = nodeId2 - 1;

            const elemK = [[stiffness, -stiffness], [-stiffness, stiffness]];
            stepsHTML += '<h4>Element Stiffness Matrix</h4>';
            stepsHTML += `<p>For nodes ${nodeId1} and ${nodeId2}:</p>`;
            stepsHTML += formatMatrixForDisplay(elemK);


            K[i][i] += stiffness;
            K[j][j] += stiffness;
            K[i][j] -= stiffness;
            K[j][i] -= stiffness;

            stepsHTML += '<h4>Updated Global Matrix (K)</h4>';
            stepsHTML += '<p>The element stiffness values are added to the global matrix at positions corresponding to the nodes.</p>';
            stepsHTML += formatMatrixForDisplay(K, [[i, i], [j, j], [i, j], [j, i]]);
            stepsHTML += '<hr>';
        });

        if (isValid) {
            constructionStepsContainer.innerHTML = stepsHTML;
            constructionModal.style.display = 'flex';
        }
    };

    showConstructionBtn.addEventListener('click', showConstructionSteps);

    constructionModalCloseBtn.addEventListener('click', () => {
        constructionModal.style.display = 'none';
    });

    const generateAndShowDiagram = () => {
        const numNodes = parseInt(numNodesInput.value);
        if (isNaN(numNodes) || numNodes < 2 || numNodes > 10) {
            alert('Please enter a valid number of nodes (between 2 and 10).');
            return;
        }

        const elements = Array.from(elementsContainer.querySelectorAll('.element-row')).map(row => ({
            node1: parseInt(row.querySelector('.node1').value),
            node2: parseInt(row.querySelector('.node2').value),
            label: row.querySelector('.element-label-input').value,
        }));

        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input[type="checkbox"]')).map(cb => cb.checked);
        const forces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => parseFloat(input.value) || 0);

        // --- 2D Layout Algorithm ---
        const adj = Array.from({ length: numNodes + 1 }, () => []);
        elements.forEach(el => {
            if (!isNaN(el.node1) && !isNaN(el.node2) && el.node1 !== el.node2) {
                adj[el.node1].push(el.node2);
                adj[el.node2].push(el.node1);
            }
        });
        const layers = [];
        const visited = new Set();
        for (let i = 1; i <= numNodes; i++) {
            if (!visited.has(i)) {
                const queue = [[i, 0]];
                visited.add(i);
                while (queue.length > 0) {
                    const [u, layer] = queue.shift();
                    if (!layers[layer]) layers[layer] = [];
                    if (!layers[layer].includes(u)) {
                        layers[layer].push(u);
                    }
                    adj[u].forEach(v => {
                        if (!visited.has(v)) {
                            visited.add(v);
                            queue.push([v, layer + 1]);
                        }
                    });
                }
            }
        }

        const svgWidth = 700;
        const svgHeight = 400;
        const xPadding = 60;
        const yPadding = 40;
        const nodeRadius = 15;

        const layerSpacing = layers.length > 1 ? (svgWidth - 2 * xPadding) / (layers.length - 1) : 0;
        const nodePositions = {};

        layers.forEach((layer, layerIndex) => {
            const layerHeight = svgHeight - 2 * yPadding;
            const numNodesInLayer = layer.length;
            const nodeSpacingY = numNodesInLayer > 1 ? layerHeight / (numNodesInLayer - 1) : layerHeight / 2;
            
            layer.sort((a, b) => a - b); // Sort nodes for consistent layout

            layer.forEach((node, nodeIndexInLayer) => {
                const x = xPadding + layerIndex * layerSpacing;
                const y = yPadding + (numNodesInLayer > 1 ? nodeIndexInLayer * nodeSpacingY : nodeSpacingY);
                nodePositions[node] = { x, y };
            });
        });

        // --- SVG Generation ---
        let svg = `<svg width="${svgWidth}" height="${svgHeight}" style="font-family: sans-serif;">`;
        
        // Define arrowhead marker
        svg += `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" fill="#c0392b">
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
        `;

        // --- Draw Elements (Springs) ---
        const elementCounts = {};
        elements.forEach(el => {
            if (isNaN(el.node1) || isNaN(el.node2) || el.node1 === el.node2) return;
            const n1 = Math.min(el.node1, el.node2);
            const n2 = Math.max(el.node1, el.node2);
            const key = `${n1}-${n2}`;
            if (!elementCounts[key]) elementCounts[key] = { count: 0, total: 0 };
            elementCounts[key].total++;
        });

        elements.forEach(el => {
            if (isNaN(el.node1) || isNaN(el.node2) || !nodePositions[el.node1] || !nodePositions[el.node2] || el.node1 === el.node2) {
                return; // Skip invalid elements
            }
            const n1_key = Math.min(el.node1, el.node2);
            const n2_key = Math.max(el.node1, el.node2);
            const key = `${n1_key}-${n2_key}`;
            
            elementCounts[key].count++;
            const parallelOffset = (elementCounts[key].count - (elementCounts[key].total + 1) / 2) * 15;

            const pos1 = nodePositions[el.node1];
            const pos2 = nodePositions[el.node2];

            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const angle = Math.atan2(dy, dx);
            
            const offsetX = parallelOffset * Math.sin(angle);
            const offsetY = -parallelOffset * Math.cos(angle);

            const startX = pos1.x + offsetX;
            const startY = pos1.y + offsetY;
            const endX = pos2.x + offsetX;
            const endY = pos2.y + offsetY;

            svg += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="#34495e" stroke-width="2"/>`;

            if (el.label) {
                const midX = (pos1.x + pos2.x) / 2;
                const midY = (pos1.y + pos2.y) / 2;

                let labelOffset;
                if (parallelOffset === 0) {
                    labelOffset = -18; // Default offset for single lines
                } else {
                    labelOffset = parallelOffset + Math.sign(parallelOffset) * 18;
                }
                
                const labelOffsetX = labelOffset * Math.sin(angle);
                const labelOffsetY = -labelOffset * Math.cos(angle);

                const labelX = midX + labelOffsetX;
                const labelY = midY + labelOffsetY;
                svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="12" fill="#e67e22">${el.label}</text>`;
            }
        });

        // --- Draw Nodes ---
        Object.keys(nodePositions).forEach(nodeId => {
            const pos = nodePositions[nodeId];
            svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeRadius}" fill="#3498db" stroke="#2980b9" stroke-width="2"/>`;
            svg += `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dy=".3em" fill="white" font-weight="bold">${nodeId}</text>`;
        });

        // --- Draw Boundary Conditions ---
        fixedNodes.forEach((isFixed, i) => {
            const nodeId = i + 1;
            if (isFixed && nodePositions[nodeId]) {
                const pos = nodePositions[nodeId];
                const supportSize = 20;
                svg += `<path d="M ${pos.x} ${pos.y} l ${-supportSize/2} ${supportSize} h ${supportSize} Z" fill="#95a5a6" />`;
            }
        });

        // --- Draw Forces ---
        forces.forEach((force, i) => {
            const nodeId = i + 1;
            if (force !== 0 && nodePositions[nodeId]) {
                const pos = nodePositions[nodeId];
                const isPositive = force > 0;
                const arrowLength = 50;

                const startX = pos.x + (isPositive ? nodeRadius : -nodeRadius);
                const endX = startX + (isPositive ? arrowLength : -arrowLength);
                
                svg += `<line x1="${startX}" y1="${pos.y}" x2="${endX}" y2="${pos.y}" stroke="#c0392b" stroke-width="2" marker-end="url(#arrowhead)" />`;
                
                const labelX = startX + (isPositive ? arrowLength / 2 : -arrowLength / 2);
                const labelY = pos.y - 10; // Place label 10px above the arrow
                svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="12" fill="#c0392b">${force}</text>`;
            }
        });

        svg += '</svg>';

        diagramContainer.innerHTML = svg;
        diagramModal.style.display = 'flex';
    };

    showDiagramBtn.addEventListener('click', generateAndShowDiagram);

    diagramModalCloseBtn.addEventListener('click', () => {
        diagramModal.style.display = 'none';
    });
    
    const exportKBtn = document.getElementById('export-k-latex');
    if (exportKBtn) {
        exportKBtn.addEventListener('click', () => {
            if (matrixForExport.K) {
                const latexString = generateLatexString(matrixForExport.K, matrixForExport.kHeaders, matrixForExport.kNumericMultiplier);
                promptWithLatex(latexString, "Global Stiffness Matrix (K)");
            } else {
                alert('Please generate the matrix first.');
            }
        });
    }

    const exportInvKBtn = document.getElementById('export-inv-k-latex');
    if (exportInvKBtn) {
        exportInvKBtn.addEventListener('click', () => {
            if (matrixForExport.invK) {
                const latexString = generateLatexString(matrixForExport.invK, matrixForExport.invKHeaders, matrixForExport.invKNumericMultiplier);
                promptWithLatex(latexString, "Inverse of Reduced Matrix");
            } else {
                alert('Please generate the inverse matrix first.');
            }
        });
    }

    if (calculateStressesBtn) {
        calculateStressesBtn.addEventListener('click', () => {
            if (fullDisplacementVector.length === 0) {
                alert('Please calculate displacements first.');
                return;
            }
            elementStressesResult = []; // Clear previous results

            const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
            const elementRows = elementsContainer.querySelectorAll('.element-row');
            const stresses = [];
            elementRows.forEach((row, i) => {
                const label = row.querySelector('.element-label-input').value || `Element ${i + 1}`;
                const stiffness_unscaled = parseFloat(row.querySelector('.stiffness-input').value);
                const area = parseFloat(row.querySelector('.area-input').value);
                if (isNaN(stiffness_unscaled) || isNaN(area) || area === 0) {
                    stresses.push(NaN); // Invalid input
                    elementStressesResult.push({ label: label, stress: NaN });
                    return;
                }
                const stiffness_scaled = stiffness_unscaled * globalMultiplier;
                const nodeId1 = parseInt(row.querySelectorAll('.node-input')[0].value);
                const nodeId2 = parseInt(row.querySelectorAll('.node-input')[1].value);
                const d1 = fullDisplacementVector[nodeId1 - 1];
                const d2 = fullDisplacementVector[nodeId2 - 1];
                const stress = (stiffness_scaled / area) * (d2 - d1);
                stresses.push(stress);
                elementStressesResult.push({ label: label, stress: stress }); // Store result
            });

            let tableHTML = '<table><thead><tr><th>Element</th><th>Stress (σ)</th></tr></thead><tbody>';
            elementStressesResult.forEach(result => {
                if (isNaN(result.stress)) {
                    tableHTML += `<tr><td>${result.label}</td><td>Invalid Input</td></tr>`;
                } else {
                    const { value: stressValue, exponent: stressExponent } = formatEngineeringNotation(result.stress, parseInt(decimalPlacesInput.value));
                    tableHTML += `<tr><td>${result.label}</td><td>${stressValue} x 10<sup>${stressExponent}</sup></td></tr>`;
                }
            });
            tableHTML += '</tbody></table>';
            stressesContainer.innerHTML = tableHTML;
        });
    }

    if (calculateElementForcesBtn) {
        calculateElementForcesBtn.addEventListener('click', () => {
            if (fullDisplacementVector.length === 0) {
                alert('Please calculate displacements first.');
                return;
            }
            elementForcesResult = []; // Clear previous results

            const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
            const elementRows = elementsContainer.querySelectorAll('.element-row');
            
            elementRows.forEach((row, i) => {
                const label = row.querySelector('.element-label-input').value || `Element ${i + 1}`;
                const stiffness_unscaled = parseFloat(row.querySelector('.stiffness-input').value);
                if (isNaN(stiffness_unscaled)) {
                    elementForcesResult.push({ label: label, force: NaN }); // Invalid input
                    return;
                }
                const stiffness_scaled = stiffness_unscaled * globalMultiplier;
                const nodeId1 = parseInt(row.querySelectorAll('.node-input')[0].value);
                const nodeId2 = parseInt(row.querySelectorAll('.node-input')[1].value);
                const d1 = fullDisplacementVector[nodeId1 - 1];
                const d2 = fullDisplacementVector[nodeId2 - 1];
                const force = stiffness_scaled * (d2 - d1);
                elementForcesResult.push({ label: label, force: force }); // Store result
            });

            let tableHTML = '<table><thead><tr><th>Element</th><th>Force (f)</th></tr></thead><tbody>';
            elementForcesResult.forEach(result => {
                if (isNaN(result.force)) {
                    tableHTML += `<tr><td>${result.label}</td><td>Invalid Input</td></tr>`;
                } else {
                    const { value: forceValue, exponent: forceExponent } = formatEngineeringNotation(result.force, parseInt(decimalPlacesInput.value));
                    tableHTML += `<tr><td>${result.label}</td><td>${forceValue} x 10<sup>${forceExponent}</sup></td></tr>`;
                }
            });
            tableHTML += '</tbody></table>';
            elementForcesContainer.innerHTML = tableHTML;
        });
    }

    const generateLatexSummary = () => {
        const btn = document.getElementById('generate-summary-btn');
        
        // Visual feedback
        btn.classList.add('is-flashing');
        setTimeout(() => {
            btn.classList.remove('is-flashing');
        }, 500);

        const decimalPlaces = parseInt(decimalPlacesInput.value);
        let summary = `% LaTeX Summary from Stiffness Matrix Generator\n`;
        summary += `% Generated on: ${new Date().toUTCString()}\n\n`;

        // --- 1. Input Summary ---
        summary += `%\\documentclass{article}\n`;
        summary += `%\\usepackage{amsmath}\n`;
        summary += `%\\usepackage{graphicx}\n`;
        summary += `%\\usepackage{geometry}\n`;
        summary += `%\\geometry{a4paper, margin=1in}\n\n`;
        summary += `%\\begin{document}\n\n`;
        summary += `\\section*{Stiffness Matrix Analysis Summary}\n\n`;

        summary += `\\subsection*{Input Parameters}\n`;
        summary += `\\begin{itemize}\n`;
        summary += `    \\item Number of Nodes: ${numNodesInput.value}\n`;
        summary += `    \\item Young's Modulus (E): ${formatEngineeringNotationForLatex(parseFloat(document.getElementById('youngs-modulus').value), decimalPlaces)}\n`;
        summary += `    \\item Global Multiplier: ${formatEngineeringNotationForLatex(parseFloat(globalMultiplierInput.value), decimalPlaces)}\n`;
        summary += `\\end{itemize}\n\n`;

        // Elements Table
        summary += `\\subsubsection*{Elements}\n`;
        summary += `\\begin{tabular}{|l|c|c|r|r|r|}\n`;
        summary += `\\hline\n`;
        summary += `\\textbf{Label} & \\textbf{Node Left} & \\textbf{Node Right} & \\textbf{Area (A)} & \\textbf{Length (l)} & \\textbf{Stiffness (k)} \\\\\n`;
        summary += `\\hline\n`;
        const elementRows = elementsContainer.querySelectorAll('.element-row');
        if (elementRows.length > 0) {
            elementRows.forEach(row => {
                const label = row.querySelector('.element-label-input').value || '-';
                const node1 = row.querySelector('.node1').value;
                const node2 = row.querySelector('.node2').value;
                const area = parseFloat(row.querySelector('.area-input').value);
                const length = parseFloat(row.querySelector('.length-input').value);
                const stiffness = parseFloat(row.querySelector('.stiffness-input').value);
                summary += `${label} & ${node1} & ${node2} & ${formatEngineeringNotationForLatex(area, decimalPlaces)} & ${formatEngineeringNotationForLatex(length, decimalPlaces)} & ${formatEngineeringNotationForLatex(stiffness, decimalPlaces)} \\\\\n`;
            });
        } else {
            summary += `\\multicolumn{6}{|c|}{No elements defined.} \\\\\n`;
        }
        summary += `\\hline\n`;
        summary += `\\end{tabular}\n\n`;

        // Boundary Conditions
        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input:checked')).map(cb => cb.id.split('-')[2]);
        summary += `\\subsubsection*{Boundary Conditions}\n`;
        summary += `The following nodes are fixed: ${fixedNodes.length > 0 ? fixedNodes.join(', ') : 'None'}.\n\n`;

        // Applied Forces
        const forces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => parseFloat(input.value) || 0);
        const appliedForces = forces.map((f, i) => ({ node: i + 1, force: f })).filter(item => item.force !== 0);
        summary += `\\subsubsection*{Applied Forces}\n`;
        if (appliedForces.length > 0) {
            summary += `\\begin{tabular}{|c|r|}\n`;
            summary += `\\hline\n`;
            summary += `\\textbf{Node} & \\textbf{Force (F)} \\\\\n`;
            summary += `\\hline\n`;
            appliedForces.forEach(item => {
                summary += `${item.node} & ${formatEngineeringNotationForLatex(item.force, decimalPlaces)} \\\\\n`;
            });
            summary += `\\hline\n`;
            summary += `\\end{tabular}\n\n`;
        } else {
            summary += `No external forces applied.\n\n`;
        }

        // --- 2. Analysis Results ---
        summary += `\\subsection*{Analysis Results}\n`;

        // Global Stiffness Matrix
        summary += `\\subsubsection*{Global Stiffness Matrix (K)}\n`;
        if (matrixForExport.K) {
            summary += generateLatexString(matrixForExport.K, matrixForExport.kHeaders, matrixForExport.kNumericMultiplier);
        } else {
            summary += `Not calculated.\n\n`;
        }

        // Inverse Matrix
        summary += `\\subsubsection*{Inverse of Reduced Matrix ($K_r^{-1}$)}\n`;
        if (matrixForExport.invK) {
            summary += generateLatexString(matrixForExport.invK, matrixForExport.invKHeaders, matrixForExport.invKNumericMultiplier);
        } else {
            summary += `Not calculated.\n\n`;
        }

        // Displacements
        summary += `\\subsubsection*{Nodal Displacements (d)}\n`;
        if (fullDisplacementVector.length > 0) {
            summary += `\\begin{tabular}{|c|r|}\n`;
            summary += `\\hline\n`;
            summary += `\\textbf{Node} & \\textbf{Displacement} \\\\\n`;
            summary += `\\hline\n`;
            fullDisplacementVector.forEach((d, i) => {
                if (d !== 0) { // Only show non-zero displacements
                    summary += `${i + 1} & ${formatEngineeringNotationForLatex(d, decimalPlaces)} \\\\\n`;
                }
            });
            summary += `\\hline\n`;
            summary += `\\end{tabular}\n\n`;
        } else {
            summary += `Not calculated.\n\n`;
        }

        // Reaction Forces
        summary += `\\subsubsection*{Reaction Forces (R)}\n`;
        if (reactionForcesResult.length > 0) {
            summary += `\\begin{tabular}{|c|r|}\n`;
            summary += `\\hline\n`;
            summary += `\\textbf{Node} & \\textbf{Reaction Force} \\\\\n`;
            summary += `\\hline\n`;
            reactionForcesResult.forEach(r => {
                summary += `${r.node} & ${formatEngineeringNotationForLatex(r.force, decimalPlaces)} \\\\\n`;
            });
            summary += `\\hline\n`;
            summary += `\\end{tabular}\n\n`;
        } else {
            summary += `Not calculated.\n\n`;
        }

        // Elemental Forces
        summary += `\\subsubsection*{Elemental Forces (f)}\n`;
        if (elementForcesResult.length > 0) {
            summary += `\\begin{tabular}{|l|r|}\n`;
            summary += `\\hline\n`;
            summary += `\\textbf{Element} & \\textbf{Force} \\\\\n`;
            summary += `\\hline\n`;
            elementForcesResult.forEach(f => {
                summary += `${f.label.replace(/&/g, '\\&')} & ${formatEngineeringNotationForLatex(f.force, decimalPlaces)} \\\\\n`;
            });
            summary += `\\hline\n`;
            summary += `\\end{tabular}\n\n`;
        } else {
            summary += `Not calculated.\n\n`;
        }

        // Elemental Stresses
        summary += `\\subsubsection*{Elemental Stresses ($\\sigma$)}\n`;
        if (elementStressesResult.length > 0) {
            summary += `\\begin{tabular}{|l|r|}\n`;
            summary += `\\hline\n`;
            summary += `\\textbf{Element} & \\textbf{Stress} \\\\\n`;
            summary += `\\hline\n`;
            elementStressesResult.forEach(s => {
                summary += `${s.label.replace(/&/g, '\\&')} & ${formatEngineeringNotationForLatex(s.stress, decimalPlaces)} \\\\\n`;
            });
            summary += `\\hline\n`;
            summary += `\\end{tabular}\n\n`;
        } else {
            summary += `Not calculated.\n\n`;
        }
        
        summary += `%\\end{document}\n`;

        promptWithLatex(summary, "LaTeX Analysis Summary");
    };

    const generateSummaryBtn = document.getElementById('generate-summary-btn');
    if (generateSummaryBtn) {
        generateSummaryBtn.addEventListener('click', generateLatexSummary);
    }


    // --- MODAL LOGIC ---
    const modalContent = document.querySelector('.modal-content');

    const makeDraggable = (element) => {
        let isDragging = false;
        let currentX = 0, currentY = 0; // These will store the accumulated drag offset
        let initialMouseX, initialMouseY;

        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('modal-close-btn')) return;

            isDragging = true;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;

            element.style.cursor = 'grabbing';

            document.addEventListener('mousemove', mouseMove);
            document.addEventListener('mouseup', mouseUp);
        });

        function mouseMove(e) {
            if (isDragging) {
                e.preventDefault(); // Prevent text selection etc.

                let dx = e.clientX - initialMouseX;
                let dy = e.clientY - initialMouseY;

                currentX += dx;
                currentY += dy;

                element.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;

                initialMouseX = e.clientX;
                initialMouseY = e.clientY;
            }
        }

        function mouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', mouseMove);
            document.removeEventListener('mouseup', mouseUp);
            element.style.cursor = 'move';
        }

        // Function to reset the drag offset (called when modal is opened)
        element.resetDragPosition = () => {
            currentX = 0;
            currentY = 0;
            element.style.transform = 'translate(-50%, -50%)';
        };
    };

    makeDraggable(modalContent);
    makeDraggable(constructionModal.querySelector('.modal-content'));
    makeDraggable(diagramModal.querySelector('.modal-content'));

    modalCloseBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // --- INITIALIZATION ---
    loadState();
});