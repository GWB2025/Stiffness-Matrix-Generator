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

    let elementCount = 0;
    let globalStiffnessMatrix = []; // Unscaled
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

    const formatScientificNotationForLatex = (value) => {
        if (value === 1) return ''; // No multiplier if it's 1
        if (value === 0) return '0';

        const exponent = Math.floor(Math.log10(Math.abs(value)));
        const base = value / Math.pow(10, exponent);

        // Ensure base has at most 3 decimal places, and remove trailing zeros
        const formattedBase = base.toFixed(3).replace(/\.?0+$/, '');

        if (exponent === 0) {
            return formattedBase;
        } else {
            return `${formattedBase} \\times 10^{${exponent}}`;
        }
    };

    const generateLatexString = (matrix, headers, numericMultiplierValue) => {
        if (!matrix) return '';

        let latex = '';

        // Handle multiplier
        if (numericMultiplierValue && numericMultiplierValue !== 1) {
            const formattedMultiplier = formatScientificNotationForLatex(numericMultiplierValue);
            if (formattedMultiplier) {
                latex += `$${formattedMultiplier} \\times $\n`;
            }
        }

        // Begin matrix
        // Requires \\usepackage{dcolumn} in your LaTeX preamble for decimal alignment
        const numCols = matrix[0].length;
        const decimalPlaces = parseInt(decimalPlacesInput.value);
        const colFormat = Array(numCols).fill(`D{.}{.}{${decimalPlaces}}`).join('');
        latex += `\\[\n\\left[\\begin{array}{${colFormat}}\n`;

        // Add matrix data
        matrix.forEach(row => {
            latex += row.map(val => val.toFixed(decimalPlaces)).join(' & ') + ' \\\\\n';
        });

        latex += `\\end{array}\\right]\n\\]\n`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(latex).then(() => {
                prompt("Copied the LaTeX code to the clipboard. You can also copy it from here:", latex);
            }, () => {
                prompt("Failed to copy to clipboard. Please copy the LaTeX code below:", latex);
            });
        } else {
            prompt("Copy the LaTeX code below:", latex);
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
            node1: row.querySelector('.node1').value,
            node2: row.querySelector('.node2').value,
            stiffness: row.querySelector('.stiffness-input').value,
            area: row.querySelector('.area-input').value
        }));
        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input[type="checkbox"]')).map(cb => cb.checked);
        const forces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => input.value);
        const state = { numNodes: numNodesInput.value, globalMultiplier: globalMultiplierInput.value, decimalPlaces: decimalPlacesInput.value, elements, fixedNodes, forces };
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
            decimalPlacesInput.value = state.decimalPlaces || 4;

            // Clear existing elements before loading
            elementsContainer.innerHTML = '';
            if (state.elements && state.elements.length > 0) {
                state.elements.forEach(el => {
                    addElementRow(el.node1, el.node2, el.stiffness, el.area);
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
        decimalPlacesInput.value = 4;
        elementsContainer.innerHTML = ''; // Clear all elements
        generateBoundaryConditionsUI(2);
        generateForcesUI(2);
        matrixContainer.innerHTML = '';
        inverseMatrixContainer.innerHTML = '';
        displacementsContainer.innerHTML = '';
        reactionForcesContainer.innerHTML = '';
        stressesContainer.innerHTML = '';
        globalMatrixMultiplier.innerHTML = '';
        inverseMatrixMultiplier.innerHTML = '';
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
            item.innerHTML = `<input type="checkbox" id="fixed-node-${i}" ${isChecked ? 'checked' : ''}><label for="fixed-node-${i}">Node ${i}</label>`;
            fixedNodesContainer.appendChild(item);
        }
    };

    const generateForcesUI = (numNodes, forceValues = []) => {
        forcesContainer.innerHTML = '';
        for (let i = 1; i <= numNodes; i++) {
            const value = forceValues[i - 1] || 0;
            const item = document.createElement('div');
            item.classList.add('force-item');
            item.innerHTML = `<label for="force-${i}">F<sub>${i}</sub>:</label><input type="number" id="force-${i}" value="${value}">`;
            forcesContainer.appendChild(item);
        }
    };



    const addElementRow = (node1 = 1, node2 = 2, stiffness = 1, area = 1) => {
        elementCount++;
        const elementRow = document.createElement('div');
        elementRow.classList.add('element-row');
        elementRow.setAttribute('id', `element-${elementCount}`);
        elementRow.innerHTML = `
            <div class="element-input-group">
                <label for="node1-${elementCount}">Node 1</label>
                <input type="number" id="node1-${elementCount}" class="node-input node1" value="${node1}" min="1" max="${parseInt(numNodesInput.value)}">
            </div>
            <div class="element-input-group">
                <label for="node2-${elementCount}">Node 2</label>
                <input type="number" id="node2-${elementCount}" class="node-input node2" value="${node2}" min="1" max="${parseInt(numNodesInput.value)}">
            </div>
            <div class="element-input-group">
                <label for="stiffness-${elementCount}">Stiffness (k)</label>
                <input type="number" id="stiffness-${elementCount}" class="stiffness-input" value="${stiffness}" step="any">
            </div>
            <div class="element-input-group">
                <label for="area-${elementCount}">Area (A)</label>
                <input type="number" id="area-${elementCount}" class="area-input" value="${area}" step="any">
            </div>
            <button type="button" class="remove-element-btn">Remove</button>
        `;
        elementsContainer.appendChild(elementRow);

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
                tableHTML += `<td>${matrix[i][j].toFixed(parseInt(decimalPlacesInput.value))}</td>`;
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
        // The reaction forces (R) are the forces required at the fixed nodes
        // to maintain equilibrium. The fundamental equation of the system is F = K*d,
        // where F is the vector of applied external forces, K is the global stiffness
        // matrix, and d is the vector of nodal displacements.
        // To find the reaction forces, we can rearrange the equation to R = K*d - F.
        // For the free nodes, this should result in R_i = 0 (or a very small number
        // due to floating-point precision), as the internal forces (K*d) balance
        // the external applied forces (F).
        // For the fixed nodes, R_i will be non-zero, representing the reaction
        // force at that support.

        const numNodes = parseInt(numNodesInput.value);
        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input[type="checkbox"]')).map(cb => cb.checked);
        const fixedNodesIndices = fixedNodes.map((isFixed, i) => (isFixed ? i : -1)).filter(i => i !== -1);

        const fullDisplacementVector = Array(numNodes).fill(0);
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
        addElementRow(1, 2, 0.3333, 1e-4);
        addElementRow(2, 3, 1, 1e-4);
        addElementRow(3, 4, 1, 1e-4);
        addElementRow(4, 5, 0.3333, 1e-4);

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
        addElementRow(1, 2, 1.5, 1);
        addElementRow(2, 3, 1.5, 1);
        addElementRow(2, 3, 2, 1); // Parallel element
        addElementRow(2, 4, 5, 1);
        addElementRow(4, 5, 5, 1);
        addElementRow(3, 4, 2.5, 1);

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

    clearAppBtn.addEventListener('click', () => resetAppToDefault(true));

    inputSection.addEventListener('input', saveState);
    globalMultiplierInput.addEventListener('input', saveState);
    decimalPlacesInput.addEventListener('input', saveState);

    const exportKBtn = document.getElementById('export-k-latex');
    if (exportKBtn) {
        exportKBtn.addEventListener('click', () => {
            if (matrixForExport.K) {
                generateLatexString(matrixForExport.K, matrixForExport.kHeaders, matrixForExport.kNumericMultiplier);
            } else {
                alert('Please generate the matrix first.');
            }
        });
    }

    const exportInvKBtn = document.getElementById('export-inv-k-latex');
    if (exportInvKBtn) {
        exportInvKBtn.addEventListener('click', () => {
            if (matrixForExport.invK) {
                generateLatexString(matrixForExport.invK, matrixForExport.invKHeaders, matrixForExport.invKNumericMultiplier);
            } else {
                alert('Please generate the inverse matrix first.');
            }
        });
    }

    if (calculateStressesBtn) {
        calculateStressesBtn.addEventListener('click', () => {
            // Ensure displacements have been calculated
            if (displacementsContainer.innerHTML === '') {
                alert('Please calculate displacements first.');
                return;
            }

            const numNodes = parseInt(numNodesInput.value);
            const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input[type="checkbox"]')).map(cb => cb.checked);
            const freeNodesIndices = fixedNodes.map((isFixed, i) => (isFixed ? -1 : i)).filter(i => i !== -1);

            // Re-calculate displacements to ensure we have the latest values
            const result = getInvertedReducedMatrix();
            if (!result) return;
            const { invertedK } = result;
            const allForces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => parseFloat(input.value) || 0);
            const freeForces = freeNodesIndices.map(i => allForces[i]);
            const displacements = freeNodesIndices.map((_, i) => {
                let d = 0;
                for (let j = 0; j < freeForces.length; j++) {
                    d += invertedK[i][j] * freeForces[j];
                }
                return d;
            });

            const fullDisplacementVector = Array(numNodes).fill(0);
            freeNodesIndices.forEach((nodeIndex, i) => {
                fullDisplacementVector[nodeIndex] = displacements[i];
            });

            const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
            const elementRows = elementsContainer.querySelectorAll('.element-row');
            const stresses = [];
            elementRows.forEach((row, i) => {
                const stiffness_unscaled = parseFloat(row.querySelector('.stiffness-input').value);
                const area = parseFloat(row.querySelector('.area-input').value);
                if (isNaN(stiffness_unscaled) || isNaN(area) || area === 0) {
                    stresses.push(NaN); // Invalid input
                    return;
                }
                const stiffness_scaled = stiffness_unscaled * globalMultiplier;
                const nodeId1 = parseInt(row.querySelectorAll('.node-input')[0].value);
                const nodeId2 = parseInt(row.querySelectorAll('.node-input')[1].value);
                const d1 = fullDisplacementVector[nodeId1 - 1];
                const d2 = fullDisplacementVector[nodeId2 - 1];
                const stress = (stiffness_scaled / area) * (d2 - d1);
                stresses.push(stress);
            });

            let tableHTML = '<table><thead><tr><th>Element</th><th>Stress (σ)</th></tr></thead><tbody>';
            stresses.forEach((stress, i) => {
                if (isNaN(stress)) {
                    tableHTML += `<tr><td>${i + 1}</td><td>Invalid Input</td></tr>`;
                } else {
                    const { value: stressValue, exponent: stressExponent } = formatEngineeringNotation(stress, parseInt(decimalPlacesInput.value));
                    tableHTML += `<tr><td>${i + 1}</td><td>${stressValue} x 10<sup>${stressExponent}</sup></td></tr>`;
                }
            });
            tableHTML += '</tbody></table>';
            stressesContainer.innerHTML = tableHTML;
        });
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

    modalCloseBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // --- INITIALIZATION ---
    loadState();
});