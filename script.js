document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const numNodesInput = document.getElementById('num-nodes');
    const globalMultiplierInput = document.getElementById('global-multiplier');
    const youngsModulusInput = document.getElementById('youngs-modulus');
    const decimalPlacesInput = document.getElementById('decimal-places');
    const fixedNodesContainer = document.getElementById('fixed-nodes-container');
    const elementsContainer = document.getElementById('elements-container');
    const forcesContainer = document.getElementById('forces-container');
    const generateMatrixBtn = document.getElementById('generate-matrix-btn');
    const invertMatrixBtn = document.getElementById('invert-matrix-btn');
    const calculateDisplacementsBtn = document.getElementById('calculate-displacements-btn');
    const calculateStressesBtn = document.getElementById('calculate-stresses-btn');
    const addElementBtn = document.getElementById('add-element-btn');
    const loadExample11Btn = document.getElementById('load-example-1-1-btn');
    const loadExample4Btn = document.getElementById('load-example-4-btn');
    const clearAppBtn = document.getElementById('clear-app-btn');
    const analysisModeSelect = document.getElementById('analysis-mode');
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
    const exportJsonBtn = document.getElementById('export-json-btn');
    const importJsonBtn = document.getElementById('import-json-btn');
    const importJsonInput = document.getElementById('import-json-input');
    const forcesTitleElement = document.getElementById('forces-title');
    const forcesDescriptionElement = document.getElementById('forces-description');
    const displacementsTitleElement = document.getElementById('displacements-title');
    const reactionTitleElement = document.getElementById('reaction-title');
    const stressesTitleElement = document.getElementById('stresses-title');
    const elementForcesTitleElement = document.getElementById('element-forces-title');
    const bulkPropertyLabelElement = document.querySelector('label[for="youngs-modulus"]');
    const kTitleElement = document.getElementById('k-title');
    const invKTitleElement = document.getElementById('inv-k-title');

    const CalculationsModule = window.Calculations;
    if (!CalculationsModule) {
        throw new Error('Calculations module failed to load.');
    }
    const {
        assembleGlobalStiffnessMatrix,
        getDeterminant,
        invertMatrix,
        buildReducedMatrix,
        computeDisplacements,
        calculateElementForces: calculateElementForcesCore,
        calculateElementStresses: calculateElementStressesCore
    } = CalculationsModule;

    let elementCount = 0;
    let globalStiffnessMatrix = []; // Unscaled
    let fullDisplacementVector = []; // To store nodal displacements
    let reactionForcesResult = [];
    let elementStressesResult = [];
    let elementForcesResult = [];
    let matrixForExport = { K: null, invK: null, kHeaders: null, invKHeaders: null, kMultiplierHtml: '', invKMultiplierHtml: '', kNumericMultiplier: 1, invKNumericMultiplier: 1 };
    const DEFAULT_BULK_PROPERTY = {
        structural: 210e9, // Pa, common steel default
        thermal: 1 // generic thermal conductivity default (e.g., 1 Btu/hr·ft·°F or ~1 W/m·K)
    };
    const MODE_CONFIG = {
        structural: {
            key: 'structural',
            displayName: 'Structural (axial springs/bars)',
            bulkPropertyLabel: "Young's Modulus (E)",
            bulkPropertyDescription: "Enter a global Young's Modulus used when auto-calculating stiffness values from A and L.",
            loadHeading: 'Applied Forces (F)',
            loadDescription: 'Specify the force acting at each node.',
            loadSymbol: 'F',
            loadColumnLabel: 'Force (F)',
            noLoadText: 'No external forces applied.',
            loadInputTitle: 'Enter the external force applied at this node.',
            fixedNodeTitle: 'Tick to fix this node, preventing any displacement.',
            elementCoefficientLabel: 'Stiffness (k)',
            elementCoefficientDescription: 'The stiffness value of the element. Can be calculated automatically.',
            elementAutoLabel: 'Calc k',
            elementAutoDescription: 'Tick to calculate stiffness automatically from E, A, and l.',
            elementMatrixHeading: 'Element Stiffness Matrix',
            primarySolveButton: 'Calculate Displacements',
            primarySolveTitle: 'Calculate the nodal displacements, which also computes reaction forces.',
            primaryResultHeading: 'Nodal Displacements (d)',
            primaryResultColumn: 'Displacement',
            primarySymbol: '$d$',
            reactionHeading: 'Reaction Forces (R)',
            reactionColumn: 'Reaction Force',
            reactionSymbol: '$R$',
            reactionNoneMessage: 'No fixed nodes to calculate reaction forces for.',
            elementForceHeading: 'Elemental Forces (f)',
            elementForceColumn: 'Force',
            elementForceButton: 'Calculate Element Forces',
            elementForceTitle: 'Calculate the internal force within each element.',
            elementForceSymbol: '$f$',
            elementFluxHeading: 'Elemental Stresses ($\\sigma$)',
            elementFluxColumn: 'Stress',
            elementFluxButton: 'Calculate Stresses',
            elementFluxTitle: 'Calculate the stress within each element.',
            elementFluxSymbol: '$\\sigma$',
            highlightPrimaryMetric: 'Maximum |displacement|',
            highlightReactionMetric: 'Maximum |reaction|',
            highlightElementForceMetric: 'Maximum |element force|',
            highlightElementFluxMetric: 'Maximum |element stress|',
            boundaryDescription: 'fixed nodes',
            loadValueLabel: 'Load',
            diagramLoadLabel: 'Force',
            appliedLoadVerb: 'loaded nodes',
            presetImageReminderIntro: 'Reminder: copy the referenced Example figures into the same directory before compiling',
            matrixHeading: 'Global Stiffness Matrix (K)',
            loadedNodesLabel: 'Loaded Nodes',
            matrixButtonText: 'Generate Stiffness Matrix',
            matrixButtonTitle: 'Generate the global stiffness matrix from the defined elements.',
            boundaryValueLabel: 'Prescribed Displacement',
            boundaryValuePlaceholder: 'e.g., 0',
            boundaryValueTitle: 'Enter the displacement enforced at this node (leave blank for zero).',
            formulaSectionHeading: 'Calculation Formulae',
            formulaIntro: 'Key relationships used when computing the reported quantities:',
            globalMultiplierSymbol: '\\lambda',
            summaryFormulae: [
                {
                    title: 'Element stiffness (auto)',
                    math: '\\displaystyle k_e = \\frac{EA}{L}',
                    description: 'Used whenever "Calc k" is enabled.'
                },
                {
                    title: 'Scaled element stiffness',
                    mathBuilder: ({ lambdaSymbol, lambdaValueLatex }) => {
                        const suffix = lambdaValueLatex ? `,\\; ${lambdaSymbol} = ${lambdaValueLatex}` : '';
                        return `k_e^{\\ast} = ${lambdaSymbol}\\,k_e${suffix}`;
                    },
                    description: 'Applies the global multiplier to every element prior to assembly.'
                },
                {
                    title: 'Global equilibrium',
                    mathBuilder: ({ lambdaSymbol, lambdaValueLatex }) => {
                        const suffix = lambdaValueLatex ? `,\\; ${lambdaSymbol} = ${lambdaValueLatex}` : '';
                        return `\\mathbf{K}\\,\\mathbf{d} = \\mathbf{F},\\quad \\mathbf{K} = ${lambdaSymbol}\\,\\mathbf{K}_{\\text{assembled}}${suffix}`;
                    }
                },
                {
                    title: 'Free DOF solve',
                    math: '\\mathbf{d}_f = \\mathbf{K}_r^{-1}\\mathbf{F}_f',
                    description: 'Reduces the system to the unfixed degrees of freedom.'
                },
                {
                    title: 'Reaction forces',
                    math: '\\mathbf{R} = \\mathbf{K}\\mathbf{d} - \\mathbf{F}',
                    description: 'Computed at each fixed node after solving for d.'
                },
                {
                    title: 'Element force',
                    math: 'f_e = k_e^{\\ast}(d_2 - d_1)',
                    description: 'Internal axial force for each element.'
                },
                {
                    title: 'Element stress',
                    math: '\\sigma_e = \\frac{f_e}{A} = \\frac{k_e^{\\ast}}{A}(d_2 - d_1)',
                    description: 'Stress/flux reported in the Elemental Stresses table.'
                }
            ]
        },
        thermal: {
            key: 'thermal',
            displayName: 'Thermal conduction',
            bulkPropertyLabel: 'Thermal Conductivity (k)',
            bulkPropertyDescription: 'Enter a global thermal conductivity used when auto-calculating conductance values from A and L (default k ≈ 1 in your chosen units, e.g., Btu/hr·ft·°F).',
            loadHeading: 'Applied Heat Loads (Q)',
            loadDescription: 'Specify the net heat entering each node (positive adds heat).',
            loadSymbol: 'Q',
            loadColumnLabel: 'Heat Load (Q)',
            noLoadText: 'No heat loads applied.',
            loadInputTitle: 'Enter the applied nodal heat load.',
            fixedNodeTitle: 'Tick to prescribe the temperature of this node.',
            elementCoefficientLabel: 'Conductance (G)',
            elementCoefficientDescription: 'The thermal conductance (kA/L) of the element. Can be calculated automatically.',
            elementAutoLabel: 'Calc G',
            elementAutoDescription: 'Tick to calculate conductance automatically from k, A, and l.',
            elementMatrixHeading: 'Element Conductance Matrix',
            primarySolveButton: 'Calculate Temperatures',
            primarySolveTitle: 'Solve the nodal temperatures and reaction heat flows.',
            primaryResultHeading: 'Nodal Temperatures (T)',
            primaryResultColumn: 'Temperature',
            primarySymbol: '$T$',
            reactionHeading: 'Reaction Heat Flows ($Q_r$)',
            reactionColumn: 'Heat Flow',
            reactionSymbol: '$Q_r$',
            reactionNoneMessage: 'No fixed nodes to calculate reaction heat flows for.',
            elementForceHeading: 'Elemental Heat Flow (Q)',
            elementForceColumn: 'Heat Flow',
            elementForceButton: 'Calculate Heat Flow',
            elementForceTitle: 'Calculate the heat flow through each element.',
            elementForceSymbol: '$Q$',
            elementFluxHeading: 'Elemental Heat Flux ($q$)',
            elementFluxColumn: 'Heat Flux',
            elementFluxButton: 'Calculate Heat Flux',
            elementFluxTitle: 'Calculate the heat flux (per area) for each element.',
            elementFluxSymbol: '$q$',
            highlightPrimaryMetric: 'Maximum |temperature|',
            highlightReactionMetric: 'Maximum |reaction heat|',
            highlightElementForceMetric: 'Maximum |element heat flow|',
            highlightElementFluxMetric: 'Maximum |heat flux|',
            boundaryDescription: 'prescribed temperatures',
            loadValueLabel: 'Heat Load',
            diagramLoadLabel: 'Heat',
            appliedLoadVerb: 'heated nodes',
            presetImageReminderIntro: 'Reminder: copy the referenced Example figures into the same directory before compiling',
            matrixHeading: 'Global Conductance Matrix (K)',
            loadedNodesLabel: 'Heated Nodes',
            matrixButtonText: 'Generate Conductance Matrix',
            matrixButtonTitle: 'Assemble the global conductance matrix from the defined elements.',
            boundaryValueLabel: 'Prescribed Temperature (°C)',
            boundaryValuePlaceholder: 'e.g., 21',
            boundaryValueTitle: 'Enter the enforced nodal temperature (leave blank if unknown).',
            formulaSectionHeading: 'Calculation Formulae',
            formulaIntro: 'Thermal quantities follow the direct formulation shown below:',
            globalMultiplierSymbol: '\\lambda',
            summaryFormulae: [
                {
                    title: 'Element conductance (auto)',
                    math: '\\displaystyle G_e = \\frac{kA}{L}',
                    description: 'Used whenever "Calc G" is enabled.'
                },
                {
                    title: 'Scaled conductance',
                    mathBuilder: ({ lambdaSymbol, lambdaValueLatex }) => {
                        const suffix = lambdaValueLatex ? `,\\; ${lambdaSymbol} = ${lambdaValueLatex}` : '';
                        return `G_e^{\\ast} = ${lambdaSymbol}\\,G_e${suffix}`;
                    },
                    description: 'Applies the global multiplier supplied on the Inputs panel.'
                },
                {
                    title: 'Energy balance',
                    mathBuilder: ({ lambdaSymbol, lambdaValueLatex }) => {
                        const suffix = lambdaValueLatex ? `,\\; ${lambdaSymbol} = ${lambdaValueLatex}` : '';
                        return `\\mathbf{K}\\,\\mathbf{T} = \\mathbf{Q},\\quad \\mathbf{K} = ${lambdaSymbol}\\,\\mathbf{K}_{\\text{assembled}}${suffix}`;
                    }
                },
                {
                    title: 'Free-node solution',
                    math: '\\mathbf{T}_f = \\mathbf{K}_r^{-1}\\mathbf{Q}_f',
                    description: 'Solves the unknown temperatures.'
                },
                {
                    title: 'Reaction heat flow',
                    math: '\\mathbf{Q}_r = \\mathbf{K}\\mathbf{T} - \\mathbf{Q}',
                    description: 'Heat leaving prescribed-temperature nodes.'
                },
                {
                    title: 'Element heat flow',
                    math: 'Q_e = G_e^{\\ast}(T_2 - T_1)',
                    description: 'Positive when heat flows from node 1 to node 2.'
                },
                {
                    title: 'Heat flux',
                    math: 'q_e = \\frac{Q_e}{A} = \\frac{G_e^{\\ast}}{A}(T_2 - T_1)',
                    description: 'Flux/gradient reported in the Elemental Heat Flux table.'
                }
            ]
        }
    };
    const THERMAL_BOUNDARY_TEXT = {
        default: {
            boundaryValueLabel: 'Prescribed Temperature (°C)',
            boundaryValuePlaceholder: 'e.g., 21',
            boundaryValueTitle: 'Enter the enforced nodal temperature (leave blank if unknown).'
        },
        imperial: {
            boundaryValueLabel: 'Prescribed Temperature (°F)',
            boundaryValuePlaceholder: 'e.g., 70',
            boundaryValueTitle: 'Enter the enforced nodal temperature in °F (leave blank if unknown).'
        }
    };
    let thermalBoundaryTextKey = 'default';
    const getValidMode = (mode) => (MODE_CONFIG[mode] ? mode : 'structural');
    let analysisMode = analysisModeSelect ? getValidMode(analysisModeSelect.value) : 'structural';
    const getModeConfig = () => {
        const baseConfig = MODE_CONFIG[analysisMode] || MODE_CONFIG.structural;
        if (analysisMode === 'thermal') {
            return { ...baseConfig, ...(THERMAL_BOUNDARY_TEXT[thermalBoundaryTextKey] || THERMAL_BOUNDARY_TEXT.default) };
        }
        return baseConfig;
    };
    const presetIllustrationMetadata = {
        example24: {
            key: 'example24',
            src: 'images/example_1_2.png',
            caption: 'Moaveni Example 1.2 thermal wall (imperial)'
        },
        example11: {
            key: 'example11',
            src: 'images/example_1_1.png',
            caption: 'Moaveni Example 1.1 tapered bar (imperial)'
        }
    };
    const activePresetIllustrations = new Set();
    const registerPresetIllustration = (key) => {
        if (presetIllustrationMetadata[key]) {
            activePresetIllustrations.add(key);
        }
    };
    const clearPresetIllustrations = () => {
        activePresetIllustrations.clear();
    };
    const calculationState = { matrixDirty: true, inverseDirty: true, displacementsDirty: true };

    const flashTarget = (element) => {
        if (!element) return;
        element.classList.remove('is-updated');
        void element.offsetWidth;
        element.classList.add('is-updated');
    };

    const updateActionButtonStates = () => {
        const modeConfig = getModeConfig();
        if (calculateStressesBtn) {
            calculateStressesBtn.disabled = calculationState.displacementsDirty;
            calculateStressesBtn.title = calculationState.displacementsDirty
                ? `${modeConfig.primarySolveButton} before evaluating ${modeConfig.elementFluxHeading.toLowerCase()}.`
                : modeConfig.elementFluxTitle;
        }
        if (calculateElementForcesBtn) {
            calculateElementForcesBtn.disabled = calculationState.displacementsDirty;
            calculateElementForcesBtn.title = calculationState.displacementsDirty
                ? `${modeConfig.primarySolveButton} before evaluating ${modeConfig.elementForceHeading.toLowerCase()}.`
                : modeConfig.elementForceTitle;
        }
    };

    const clearDisplacementResults = () => {
        displacementsContainer.innerHTML = '';
        reactionForcesContainer.innerHTML = '';
        stressesContainer.innerHTML = '';
        elementForcesContainer.innerHTML = '';
        fullDisplacementVector = [];
        reactionForcesResult = [];
        elementStressesResult = [];
        elementForcesResult = [];
    };

    const markDisplacementsDirty = () => {
        if (!calculationState.displacementsDirty) {
            clearDisplacementResults();
        }
        calculationState.displacementsDirty = true;
        updateActionButtonStates();
    };

    const markInverseDirty = () => {
        if (!calculationState.inverseDirty) {
            inverseMatrixContainer.innerHTML = '';
            inverseMatrixMultiplier.innerHTML = '';
            matrixForExport.invK = null;
            matrixForExport.invKHeaders = null;
            matrixForExport.invKMultiplierHtml = '';
            matrixForExport.invKNumericMultiplier = 1;
        }
        calculationState.inverseDirty = true;
        markDisplacementsDirty();
    };

    const markMatrixDirty = () => {
        if (!calculationState.matrixDirty) {
            matrixContainer.innerHTML = '';
            globalMatrixMultiplier.innerHTML = '';
            matrixForExport.K = null;
            matrixForExport.kHeaders = null;
            matrixForExport.kMultiplierHtml = '';
            matrixForExport.kNumericMultiplier = 1;
            globalStiffnessMatrix = [];
        }
        calculationState.matrixDirty = true;
        markInverseDirty();
    };

    updateActionButtonStates();

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

    const escapeLatex = (value = '') => {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/([%$&#_{}])/g, '\\$1')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}');
    };
    const escapeLatexPreserveMath = (value = '') => {
        const str = value === null || value === undefined ? '' : String(value);
        if (!str.includes('$')) return escapeLatex(str);

        // Split on math delimiters and only escape the text outside math mode.
        const segments = str.split('$');
        const rebuilt = segments.map((segment, idx) => {
            const isMath = idx % 2 === 1;
            return isMath ? segment : escapeLatex(segment);
        });
        return rebuilt.join('$');
    };
    const escapeHtml = (value = '') => {
        if (value === null || value === undefined) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
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

    const wrapLabel = (text, maxLen = 18) => {
        if (!text) return [];
        const words = text.split(/\s+/);
        const lines = [];
        let current = '';
        words.forEach(word => {
            if ((current + ' ' + word).trim().length > maxLen && current.length > 0) {
                lines.push(current.trim());
                current = word;
            } else {
                current = (current + ' ' + word).trim();
            }
        });
        if (current) lines.push(current.trim());
        return lines;
    };

    const computeDiagramLayout = ({ alertOnError = false } = {}) => {
        const numNodes = parseInt(numNodesInput.value, 10);
        if (!Number.isFinite(numNodes) || numNodes < 2 || numNodes > 10) {
            const message = 'Please enter a valid number of nodes (between 2 and 10).';
            if (alertOnError) alert(message);
            return { error: message, layout: null };
        }

        const elements = Array.from(elementsContainer.querySelectorAll('.element-row')).map(row => ({
            node1: parseInt(row.querySelector('.node1').value, 10),
            node2: parseInt(row.querySelector('.node2').value, 10),
            label: row.querySelector('.element-label-input').value
        }));

        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input[type="checkbox"]')).map(cb => cb.checked);
        const forces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => parseFloat(input.value) || 0);

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

            layer.sort((a, b) => a - b);

            layer.forEach((node, nodeIndexInLayer) => {
                const x = xPadding + layerIndex * layerSpacing;
                const y = yPadding + (numNodesInLayer > 1 ? nodeIndexInLayer * nodeSpacingY : nodeSpacingY);
                nodePositions[node] = { x, y };
            });
        });

        const validElements = elements.filter(el =>
            !isNaN(el.node1) &&
            !isNaN(el.node2) &&
            el.node1 !== el.node2 &&
            nodePositions[el.node1] &&
            nodePositions[el.node2]
        );

        const elementCounts = {};
        validElements.forEach(el => {
            const n1 = Math.min(el.node1, el.node2);
            const n2 = Math.max(el.node1, el.node2);
            const key = `${n1}-${n2}`;
            if (!elementCounts[key]) {
                elementCounts[key] = { count: 0, total: 0 };
            }
            elementCounts[key].total++;
        });

        const elementSegments = [];
        validElements.forEach(el => {
            const n1 = Math.min(el.node1, el.node2);
            const n2 = Math.max(el.node1, el.node2);
            const key = `${n1}-${n2}`;
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

            let labelOffset;
            if (parallelOffset === 0) {
                labelOffset = -18;
            } else {
                labelOffset = parallelOffset + Math.sign(parallelOffset) * 18;
            }
            const labelOffsetX = labelOffset * Math.sin(angle);
            const labelOffsetY = -labelOffset * Math.cos(angle);

            elementSegments.push({
                node1: el.node1,
                node2: el.node2,
                label: el.label,
                labelLines: wrapLabel(el.label, 20),
                startX,
                startY,
                endX,
                endY,
                labelX: (pos1.x + pos2.x) / 2 + labelOffsetX,
                labelY: (pos1.y + pos2.y) / 2 + labelOffsetY
            });
        });

        const arrowLength = 50;
        const forceSegments = [];
        forces.forEach((force, index) => {
            const nodeId = index + 1;
            if (force === 0 || !nodePositions[nodeId]) return;
            const pos = nodePositions[nodeId];
            const isPositive = force > 0;
            const startX = pos.x + (isPositive ? nodeRadius : -nodeRadius);
            const endX = startX + (isPositive ? arrowLength : -arrowLength);
            const labelX = startX + (isPositive ? arrowLength / 2 : -arrowLength / 2);
            const labelY = pos.y - 10;
            forceSegments.push({
                node: nodeId,
                value: force,
                startX,
                startY: pos.y,
                endX,
                endY: pos.y,
                labelX,
                labelY
            });
        });

        return {
            error: null,
            layout: {
                numNodes,
                svgWidth,
                svgHeight,
                nodeRadius,
                nodePositions,
                elements: elementSegments,
                fixedNodes,
                forces: forceSegments
            }
        };
    };

    const renderDiagramSvg = (layout) => {
        if (!layout) return '';
        const modeConfig = getModeConfig();
        const { svgWidth, svgHeight, nodeRadius, nodePositions, elements, fixedNodes, forces } = layout;
        let svg = `<svg width="${svgWidth}" height="${svgHeight}" style="font-family: sans-serif;">`;
        svg += `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto" fill="#c0392b">
                    <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
            </defs>
        `;

        elements.forEach(segment => {
            svg += `<line x1="${segment.startX}" y1="${segment.startY}" x2="${segment.endX}" y2="${segment.endY}" stroke="#34495e" stroke-width="2"/>`;
            if (segment.label) {
                const lines = Array.isArray(segment.labelLines) && segment.labelLines.length ? segment.labelLines : [segment.label];
                const lineHeight = 13;
                const totalHeight = lineHeight * lines.length;
                const startY = segment.labelY - (totalHeight - lineHeight) / 2;
                svg += `<text x="${segment.labelX}" y="${startY}" text-anchor="middle" font-size="12" fill="#e67e22">`;
                lines.forEach((line, idx) => {
                    const dy = idx === 0 ? 0 : lineHeight;
                    svg += `<tspan x="${segment.labelX}" dy="${dy}">${line}</tspan>`;
                });
                svg += `</text>`;
            }
        });

        Object.keys(nodePositions).forEach(nodeId => {
            const pos = nodePositions[nodeId];
            svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${nodeRadius}" fill="#3498db" stroke="#2980b9" stroke-width="2"/>`;
            svg += `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dy=".3em" fill="white" font-weight="bold">${nodeId}</text>`;
        });

        fixedNodes.forEach((isFixed, i) => {
            const nodeId = i + 1;
            if (isFixed && nodePositions[nodeId]) {
                const pos = nodePositions[nodeId];
                const supportSize = 20;
                svg += `<path d="M ${pos.x} ${pos.y} l ${-supportSize / 2} ${supportSize} h ${supportSize} Z" fill="#95a5a6" />`;
            }
        });

        forces.forEach(force => {
            svg += `<line x1="${force.startX}" y1="${force.startY}" x2="${force.endX}" y2="${force.endY}" stroke="#c0392b" stroke-width="2" marker-end="url(#arrowhead)" />`;
            const labelText = `${force.value} ${modeConfig.diagramLoadLabel}`.trim();
            svg += `<text x="${force.labelX}" y="${force.labelY}" text-anchor="middle" font-size="12" fill="#c0392b">${labelText}</text>`;
        });

        svg += '</svg>';
        return svg;
    };

    const renderDiagramTikz = (layout, decimalPlaces = 4) => {
        if (!layout) return '';
        const modeConfig = getModeConfig();
        const tikzScale = 0.02;
        let tikz = `\\begin{tikzpicture}[x=${tikzScale}cm,y=-${tikzScale}cm,>=Stealth]\n`;

        layout.elements.forEach(segment => {
            tikz += `    \\draw[line width=1pt,color=black!70] (${segment.startX},${segment.startY}) -- (${segment.endX},${segment.endY});\n`;
            if (segment.label) {
                const lines = Array.isArray(segment.labelLines) && segment.labelLines.length ? segment.labelLines : [segment.label];
                const tikzLabel = lines.map(escapeLatex).join('\\\\');
                tikz += `    \\node[text=orange!80!black,font=\\scriptsize] at (${segment.labelX},${segment.labelY}){\\shortstack{${tikzLabel}}};\n`;
            }
        });

        Object.keys(layout.nodePositions).forEach(nodeId => {
            const pos = layout.nodePositions[nodeId];
            tikz += `    \\filldraw[fill=blue!60,draw=blue!80!black] (${pos.x},${pos.y}) circle (${layout.nodeRadius});\n`;
            tikz += `    \\node[text=white,font=\\footnotesize] at (${pos.x},${pos.y}){${nodeId}};\n`;
        });

        layout.fixedNodes.forEach((isFixed, index) => {
            const nodeId = index + 1;
            if (!isFixed || !layout.nodePositions[nodeId]) return;
            const pos = layout.nodePositions[nodeId];
            const supportSize = 20;
            const leftX = pos.x - supportSize / 2;
            const rightX = pos.x + supportSize / 2;
            const baseY = pos.y + supportSize;
            tikz += `    \\draw[fill=gray!60,draw=gray!70] (${pos.x},${pos.y}) -- (${leftX},${baseY}) -- (${rightX},${baseY}) -- cycle;\n`;
        });

        layout.forces.forEach(force => {
            const numericLatex = formatEngineeringNotationForLatex(force.value, decimalPlaces, false);
            const formattedForce = `$${numericLatex}\\,\\text{${escapeLatex(modeConfig.diagramLoadLabel)}}$`;
            tikz += `    \\draw[->,line width=1pt,color=red!70!black] (${force.startX},${force.startY}) -- (${force.endX},${force.endY});\n`;
            tikz += `    \\node[text=red!70!black,font=\\scriptsize,above] at (${force.labelX},${force.labelY}){${formattedForce}};\n`;
        });

        tikz += '\\end{tikzpicture}\n';
        return tikz;
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

    const buildStateFromUI = () => {
        const elements = Array.from(elementsContainer.querySelectorAll('.element-row')).map(row => ({
            label: row.querySelector('.element-label-input').value,
            node1: row.querySelector('.node1').value,
            node2: row.querySelector('.node2').value,
            stiffness: row.querySelector('.stiffness-input').value,
            area: row.querySelector('.area-input').value,
            length: row.querySelector('.length-input').value,
            calculateK: row.querySelector('.calculate-k-checkbox').checked
        }));
        const fixedNodes = collectFixedNodesData().map(node => ({
            fixed: !!node.fixed,
            value: node.value
        }));
        const forces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => input.value);
        const state = {
            numNodes: numNodesInput.value,
            globalMultiplier: globalMultiplierInput.value,
            youngsModulus: youngsModulusInput.value,
            decimalPlaces: decimalPlacesInput.value,
            elements,
            fixedNodes,
            forces,
            analysisMode
        };
        return state;
    };

    const saveState = () => {
        const state = buildStateFromUI();
        localStorage.setItem('stiffnessMatrixState', JSON.stringify(state));
        return state;
    };

    const applyStateToUI = (state, { persist = false } = {}) => {
        if (!state) {
            resetAppToDefault(persist);
            return;
        }
        try {
            setAnalysisMode(getValidMode(state.analysisMode || (analysisModeSelect ? analysisModeSelect.value : 'structural')), { skipSave: true, refreshInputs: false });

            numNodesInput.value = state.numNodes || 2;
            globalMultiplierInput.value = state.globalMultiplier || 1;
            youngsModulusInput.value = state.youngsModulus || '210e9';
            decimalPlacesInput.value = state.decimalPlaces || 4;

            elementsContainer.innerHTML = '';
            elementCount = 0;

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
                addElementRow();
            }

            generateBoundaryConditionsUI(parseInt(numNodesInput.value), state.fixedNodes);
            generateForcesUI(parseInt(numNodesInput.value), state.forces);
            updateModeUI({ refreshInputs: false });

            markMatrixDirty();

            if (persist) {
                saveState();
            }
        } catch (error) {
            console.error("Failed to apply state.", error);
            throw error;
        }
    };

    const loadState = () => {
        const savedState = localStorage.getItem('stiffnessMatrixState');
        if (!savedState) {
            resetAppToDefault(false);
            return;
        }
        try {
            const state = JSON.parse(savedState);
            applyStateToUI(state);
        } catch (error) {
            console.error("Failed to load saved state, resetting to default.", error);
            localStorage.removeItem('stiffnessMatrixState');
            resetAppToDefault(false);
        }
    };

    const exportStateAsJson = () => {
        const state = buildStateFromUI();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `stiffness-matrix-state-${timestamp}.json`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const importStateFromContent = (content) => {
        try {
            const parsed = JSON.parse(content);
            if (!parsed || typeof parsed !== 'object') {
                alert('Invalid JSON structure.');
                return;
            }
            applyStateToUI(parsed, { persist: true });
            alert('State imported. Regenerate matrices to continue.');
        } catch (error) {
            console.error('Failed to import state:', error);
            alert('Failed to import state. Please ensure the JSON file is valid.');
        }
    };

    const resetAppToDefault = (shouldSave = true) => {
        setAnalysisMode('structural', { skipSave: true, refreshInputs: false });
        numNodesInput.value = 2;
        globalMultiplierInput.value = 1;
        document.getElementById('youngs-modulus').value = '210e9';
        decimalPlacesInput.value = 4;
        elementsContainer.innerHTML = ''; // Clear all elements
        elementCount = 0;
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
        clearPresetIllustrations();

        markMatrixDirty();
        updateModeUI({ refreshInputs: false });

        if (shouldSave) {
            saveState();
        }
    };

    // --- CORE UI & MATRIX GENERATION ---

    const generateBoundaryConditionsUI = (numNodes, fixedStates = []) => {
        const modeConfig = getModeConfig();
        fixedNodesContainer.innerHTML = '';
        for (let i = 1; i <= numNodes; i++) {
            const rawState = fixedStates[i - 1];
            const isChecked = typeof rawState === 'object' ? !!rawState.fixed : !!rawState;
            const presetValue = typeof rawState === 'object' && rawState.value !== undefined ? rawState.value : '';
            const item = document.createElement('div');
            item.classList.add('fixed-node-item');
            item.innerHTML = `
                <div class="fixed-node-controls">
                    <input type="checkbox" id="fixed-node-${i}" ${isChecked ? 'checked' : ''} title="${modeConfig.fixedNodeTitle}">
                    <label for="fixed-node-${i}">Node ${i}</label>
                </div>
                <div class="fixed-node-value">
                    <label class="sr-only" for="fixed-value-${i}">${modeConfig.boundaryValueLabel}</label>
                    <input type="number" id="fixed-value-${i}" class="fixed-value-input" value="${presetValue !== undefined ? presetValue : ''}" placeholder="${modeConfig.boundaryValuePlaceholder}" title="${modeConfig.boundaryValueTitle}" ${isChecked ? '' : 'disabled'}>
                </div>
            `;
            fixedNodesContainer.appendChild(item);
            const checkbox = item.querySelector(`#fixed-node-${i}`);
            const valueInput = item.querySelector(`#fixed-value-${i}`);
            if (checkbox && valueInput) {
                checkbox.addEventListener('change', () => {
                    valueInput.disabled = !checkbox.checked;
                    if (!checkbox.checked) {
                        valueInput.value = '';
                    }
                });
            }
        }
        flashTarget(fixedNodesContainer);
    };

    const generateForcesUI = (numNodes, forceValues = []) => {
        const modeConfig = getModeConfig();
        forcesContainer.innerHTML = '';
        for (let i = 1; i <= numNodes; i++) {
            const value = forceValues[i - 1] || 0;
            const item = document.createElement('div');
            item.classList.add('force-item');
            item.innerHTML = `<label for="force-${i}">${modeConfig.loadSymbol}<sub>${i}</sub>:</label><input type="number" id="force-${i}" value="${value}" title="${modeConfig.loadInputTitle}">`;
            forcesContainer.appendChild(item);
        }
        flashTarget(forcesContainer);
    };

    const collectFixedNodesData = () => {
        const items = Array.from(fixedNodesContainer.querySelectorAll('.fixed-node-item'));
        if (!items.length) {
            const fallbackCount = parseInt(numNodesInput.value, 10) || 0;
            return Array.from({ length: fallbackCount }, () => ({ fixed: false, value: '' }));
        }
        return items.map(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const valueInput = item.querySelector('.fixed-value-input');
            return {
                fixed: checkbox ? checkbox.checked : false,
                value: valueInput ? valueInput.value : ''
            };
        });
    };
    const captureForceValues = () => Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => input.value);

    const refreshBoundaryAndForceUI = () => {
        const numNodes = parseInt(numNodesInput.value, 10) || 2;
        generateBoundaryConditionsUI(numNodes, collectFixedNodesData());
        generateForcesUI(numNodes, captureForceValues());
    };

    const updateElementRowsForMode = () => {
        const modeConfig = getModeConfig();
        elementsContainer.querySelectorAll('.element-row').forEach(row => {
            const stiffnessLabel = row.querySelector('.stiffness-group label');
            if (stiffnessLabel) stiffnessLabel.textContent = modeConfig.elementCoefficientLabel;
            const stiffnessInput = row.querySelector('.stiffness-input');
            if (stiffnessInput) stiffnessInput.title = modeConfig.elementCoefficientDescription;
            const autoCheckbox = row.querySelector('.calculate-k-checkbox');
            if (autoCheckbox) autoCheckbox.title = modeConfig.elementAutoDescription;
            const autoLabel = row.querySelector('.calculate-k-container label');
            if (autoLabel) autoLabel.textContent = modeConfig.elementAutoLabel;
        });
    };

    const updateModeUI = ({ refreshInputs = true } = {}) => {
        const modeConfig = getModeConfig();
        if (analysisModeSelect && analysisModeSelect.value !== analysisMode) {
            analysisModeSelect.value = analysisMode;
        }
        if (bulkPropertyLabelElement) {
            bulkPropertyLabelElement.textContent = modeConfig.bulkPropertyLabel;
        }
        if (youngsModulusInput) {
            youngsModulusInput.title = modeConfig.bulkPropertyDescription;
        }
        if (forcesTitleElement) {
            forcesTitleElement.textContent = modeConfig.loadHeading;
        }
        if (forcesDescriptionElement) {
            forcesDescriptionElement.textContent = modeConfig.loadDescription;
        }
        if (kTitleElement) {
            kTitleElement.textContent = modeConfig.matrixHeading;
        }
        if (invKTitleElement) {
            invKTitleElement.textContent = 'Inverse of Reduced Matrix (K_r⁻¹)';
        }
        if (calculateDisplacementsBtn) {
            calculateDisplacementsBtn.textContent = modeConfig.primarySolveButton;
            calculateDisplacementsBtn.title = modeConfig.primarySolveTitle;
        }
        if (calculateStressesBtn) {
            calculateStressesBtn.textContent = modeConfig.elementFluxButton;
        }
        if (calculateElementForcesBtn) {
            calculateElementForcesBtn.textContent = modeConfig.elementForceButton;
        }
        if (generateMatrixBtn) {
            generateMatrixBtn.textContent = modeConfig.matrixButtonText;
            generateMatrixBtn.title = modeConfig.matrixButtonTitle;
        }
        if (displacementsTitleElement) {
            displacementsTitleElement.textContent = modeConfig.primaryResultHeading;
        }
        if (reactionTitleElement) {
            reactionTitleElement.textContent = modeConfig.reactionHeading;
        }
        if (stressesTitleElement) {
            stressesTitleElement.textContent = modeConfig.elementFluxHeading;
        }
        if (elementForcesTitleElement) {
            elementForcesTitleElement.textContent = modeConfig.elementForceHeading;
        }
        fixedNodesContainer.querySelectorAll('.fixed-value-input').forEach(input => {
            input.placeholder = modeConfig.boundaryValuePlaceholder;
            input.title = modeConfig.boundaryValueTitle;
        });
        updateElementRowsForMode();
        if (refreshInputs) {
            refreshBoundaryAndForceUI();
        }
        updateActionButtonStates();
    };

    const applyDefaultBulkPropertyIfNeeded = (prevMode, nextMode) => {
        if (!youngsModulusInput) return;
        const currentVal = parseFloat(youngsModulusInput.value);
        const nextDefault = DEFAULT_BULK_PROPERTY[nextMode];
        const prevDefault = DEFAULT_BULK_PROPERTY[prevMode];
        if (nextDefault === undefined) return;
        const resetToNextDefault = () => {
            youngsModulusInput.value = nextDefault;
        };
        if (!Number.isFinite(currentVal)) {
            return resetToNextDefault();
        }
        if (prevDefault !== undefined && Math.abs(currentVal - prevDefault) < 1e-9) {
            return resetToNextDefault();
        }
        if (nextMode === 'thermal' && currentVal > 1e4) {
            return resetToNextDefault();
        }
        if (nextMode === 'structural' && currentVal < 1e5) {
            return resetToNextDefault();
        }
    };

    const setAnalysisMode = (mode, { skipSave = false, refreshInputs = true, thermalUnitKey } = {}) => {
        const nextMode = getValidMode(mode);
        if (analysisMode === nextMode && refreshInputs) {
            updateModeUI({ refreshInputs });
            return;
        }
        if (nextMode === 'thermal') {
            thermalBoundaryTextKey = thermalUnitKey && THERMAL_BOUNDARY_TEXT[thermalUnitKey] ? thermalUnitKey : 'default';
        } else {
            thermalBoundaryTextKey = 'default';
        }
        const previousMode = analysisMode;
        analysisMode = nextMode;
        applyDefaultBulkPropertyIfNeeded(previousMode, nextMode);
        updateModeUI({ refreshInputs });
        markMatrixDirty();
        if (!skipSave) {
            saveState();
        }
    };

    const loadCustomExample = (config) => {
        if (!config) return;
        const {
            numNodes,
            globalMultiplier = 1,
            decimalPlaces = 4,
            elements = [],
            fixedNodes = [],
            forces = [],
            autoGenerateMatrix = true,
            analysisMode: presetMode,
            youngsModulus,
            temperatureUnit
        } = config;

        if (presetMode) {
            const unitKey = temperatureUnit === 'F' ? 'imperial' : 'default';
            setAnalysisMode(presetMode, { skipSave: true, refreshInputs: false, thermalUnitKey: unitKey });
        }

        numNodesInput.value = numNodes;
        globalMultiplierInput.value = globalMultiplier;
        decimalPlacesInput.value = decimalPlaces;
        if (youngsModulusInput && typeof youngsModulus === 'number' && !Number.isNaN(youngsModulus)) {
            youngsModulusInput.value = youngsModulus;
        } else if (youngsModulusInput) {
            const modeForDefault = presetMode ? getValidMode(presetMode) : analysisMode;
            const defaultK = DEFAULT_BULK_PROPERTY[modeForDefault];
            if (defaultK !== undefined) {
                youngsModulusInput.value = defaultK;
            }
        }

        elementsContainer.innerHTML = '';
        elementCount = 0;
        elements.forEach(el => {
            addElementRow(
                el.node1 ?? 1,
                el.node2 ?? 2,
                el.stiffness ?? 1,
                el.area ?? 1,
                el.label ?? '',
                el.length ?? 1
            );
        });

        generateBoundaryConditionsUI(numNodes, fixedNodes);
        generateForcesUI(numNodes, Array.from({ length: numNodes }, (_, idx) => forces[idx] || 0));

        markMatrixDirty();
        saveState();

        if (autoGenerateMatrix) {
            generateAndDisplayMatrix();
        }
    };

    const collectElementsData = () => {
        return Array.from(elementsContainer.querySelectorAll('.element-row')).map((row, index) => ({
            label: row.querySelector('.element-label-input').value || `Element ${index + 1}`,
            node1: parseInt(row.querySelector('.node1').value, 10),
            node2: parseInt(row.querySelector('.node2').value, 10),
            stiffness: parseFloat(row.querySelector('.stiffness-input').value),
            area: parseFloat(row.querySelector('.area-input').value),
            length: parseFloat(row.querySelector('.length-input').value)
        }));
    };



    const addElementRow = (node1 = 1, node2 = 2, stiffness = 1, area = 1, label = '', length = 1) => {
        const modeConfig = getModeConfig();
        elementCount++;
        const elementRow = document.createElement('div');
        elementRow.classList.add('element-row', 'flash-target');
        elementRow.setAttribute('id', `element-${elementCount}`);
        elementRow.innerHTML = `
            <div class="element-card-header">
                <div class="element-card-title">
                    <span class="eyebrow">Element</span>
                    <strong>#${elementCount}</strong>
                </div>
                <button type="button" class="btn btn--ghost remove-element-btn" title="Remove this element from the system.">Remove</button>
            </div>
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
                        <label for="stiffness-${elementCount}">${modeConfig.elementCoefficientLabel}</label>
                        <div class="stiffness-input-wrapper">
                            <input type="number" id="stiffness-${elementCount}" class="stiffness-input" value="${stiffness}" step="any" title="${modeConfig.elementCoefficientDescription}">
                            <div class="calculate-k-container">
                                <input type="checkbox" id="calc-k-cb-${elementCount}" class="calculate-k-checkbox" title="${modeConfig.elementAutoDescription}">
                                <label for="calc-k-cb-${elementCount}">${modeConfig.elementAutoLabel}</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        elementsContainer.appendChild(elementRow);
        flashTarget(elementRow);

        // --- Auto-calculation logic for the new row ---
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
            markMatrixDirty();
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
        const modeConfig = getModeConfig();
        const numNodes = parseInt(numNodesInput.value);
        if (isNaN(numNodes) || numNodes < 2 || numNodes > 10) {
            alert('Please enter a valid number of nodes (between 2 and 10).');
            return false;
        }
        const elements = collectElementsData();
        if (elements.length === 0) {
            alert('Please add at least one element.');
            return false;
        }
        try {
            const K = assembleGlobalStiffnessMatrix(numNodes, elements);
            globalStiffnessMatrix = K;
            calculationState.matrixDirty = false;
            updateActionButtonStates();
            const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
            const multiplierText = formatMultiplier(globalMultiplier);
            displayMatrix(K, 'matrix-container', 'k-title', modeConfig.matrixHeading, null, multiplierText, 'global-matrix-multiplier', globalMultiplier);
            return true;
        } catch (error) {
            alert(error.message);
            return false;
        }
    };

    const displayMatrix = (matrix, containerId, titleContainerId, title, headers, multiplierHtml, multiplierContainerId, numericMultiplierValue) => {
        const container = document.getElementById(containerId);
        const multiplierContainer = document.getElementById(multiplierContainerId);
        const titleElement = document.getElementById(titleContainerId);
        if (titleElement && title) titleElement.innerHTML = title;
        if (multiplierContainer) multiplierContainer.innerHTML = multiplierHtml || '';
        if (!matrix || matrix.length === 0) {
            container.innerHTML = '<p>Matrix is empty or not generated.</p>';
            flashTarget(container);
            if (multiplierContainer) {
                multiplierContainer.innerHTML = '';
            }
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
        flashTarget(container);
        if (multiplierContainer) {
            flashTarget(multiplierContainer);
        }

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

    const getInvertedReducedMatrix = () => {
        if (calculationState.matrixDirty) {
            const generated = generateAndDisplayMatrix();
            if (!generated) return null;
        }
        const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
        const boundaryStates = collectFixedNodesData();
        const fixedNodesFlags = boundaryStates.length ? boundaryStates.map(node => !!node.fixed) : Array.from({ length: parseInt(numNodesInput.value, 10) || 0 }, () => false);
        const freeNodesIndices = fixedNodesFlags.map((isFixed, i) => (isFixed ? -1 : i)).filter(i => i !== -1);
        if (freeNodesIndices.length === 0) {
            alert('Cannot invert: No free nodes. Please unfix at least one node.');
            return null;
        }
        const reducedK = buildReducedMatrix(globalStiffnessMatrix, freeNodesIndices, globalMultiplier);
        const det = getDeterminant(reducedK);
        if (Math.abs(det) < 1e-9) {
            alert('The reduced matrix is singular and cannot be inverted. Please check your boundary conditions.');
            inverseMatrixContainer.innerHTML = '<p>The reduced matrix is singular (determinant is zero).</p>';
            inverseMatrixMultiplier.innerHTML = '';
            flashTarget(inverseMatrixContainer);
            flashTarget(inverseMatrixMultiplier);
            return null;
        }
        const invertedK = invertMatrix(reducedK);
        if (!invertedK) {
            alert('The reduced matrix could not be inverted. Please check your inputs.');
            return null;
        }
        calculationState.inverseDirty = false;
        updateActionButtonStates();
        const fixedNodesIndices = fixedNodesFlags.map((isFixed, i) => (isFixed ? i : -1)).filter(i => i !== -1);
        return { invertedK, freeNodesIndices, fixedNodesIndices, globalMultiplier };
    };

    const moaveniExample11Imperial = (() => {
        const modulus = 10.4e6; // lb/in^2, aluminum
        const geometry = {
            widthTop: 2, // in
            widthBottom: 1, // in
            thickness: 0.125, // in
            totalLength: 10, // in
            elementCount: 4
        };
        const elementLength = geometry.totalLength / geometry.elementCount;
        const tipLoad = 1000; // lb
        const nodeAreas = Array.from({ length: geometry.elementCount + 1 }, (_, idx) => {
            const fraction = idx / geometry.elementCount;
            const width = geometry.widthTop + (geometry.widthBottom - geometry.widthTop) * fraction;
            return width * geometry.thickness;
        });
        const elementAreas = Array.from({ length: geometry.elementCount }, (_, idx) => (nodeAreas[idx] + nodeAreas[idx + 1]) / 2);
        const stiffnesses = elementAreas.map(area => (area * modulus) / elementLength);
        const elements = elementAreas.map((area, idx) => ({
            node1: idx + 1,
            node2: idx + 2,
            area,
            length: elementLength,
            stiffness: stiffnesses[idx],
            label: `k${idx + 1}`
        }));
        return {
            preset: {
                analysisMode: 'structural',
                numNodes: geometry.elementCount + 1,
                globalMultiplier: 1,
                decimalPlaces: 6,
                youngsModulus: modulus,
                elements,
                fixedNodes: [true, false, false, false, false],
                forces: [0, 0, 0, 0, tipLoad],
                metadata: {
                    unitSystem: 'imperial (lb-in)',
                    geometry: { ...geometry, elementLength },
                    averageAreas: elementAreas,
                    stiffnesses,
                    tipLoad,
                    modulus,
                    source: 'Moaveni_Example_1_1_Imperial_Units_Summary.pdf'
                }
            }
        };
    })();

    const exampleScenarios = {
        moaveniExample11: moaveniExample11Imperial.preset,
        thermalExteriorWall: {
            analysisMode: 'thermal',
            temperatureUnit: 'F',
            numNodes: 7,
            globalMultiplier: 1,
            decimalPlaces: 4,
            elements: (() => {
                const area = 150; // ft² exposed area from the example
                const layersImperial = [
                    { label: 'Outside film (winter, 15 mph wind)', resistance: 0.17 },
                    { label: 'Siding, wood (1/2 in, 8 in lapped)', resistance: 0.81 },
                    { label: 'Sheathing (1/2 in regular)', resistance: 1.32 },
                    { label: 'Insulation batt (3–3½ in)', resistance: 11.0 },
                    { label: 'Gypsum wall board (1/2 in)', resistance: 0.45 },
                    { label: 'Inside film (winter)', resistance: 0.68 }
                ];
                return layersImperial.map((layer, idx) => ({
                    node1: idx + 1,
                    node2: idx + 2,
                    area,
                    length: 1,
                    // U-factor in Btu/hr·ft²·°F derived from the listed resistance
                    stiffness: parseFloat((1 / layer.resistance).toFixed(3)),
                    label: layer.label
                }));
            })(),
            fixedNodes: [
                { fixed: true, value: 20 },
                { fixed: false, value: '' },
                { fixed: false, value: '' },
                { fixed: false, value: '' },
                { fixed: false, value: '' },
                { fixed: false, value: '' },
                { fixed: true, value: 70 }
            ],
            forces: [0, 0, 0, 0, 0, 0, 0]
        }
    };

    // --- EVENT LISTENERS ---

    numNodesInput.addEventListener('change', () => {
        const numNodes = parseInt(numNodesInput.value);
        generateBoundaryConditionsUI(numNodes, collectFixedNodesData());
        generateForcesUI(numNodes, captureForceValues());
        saveState();
        markMatrixDirty();
    });

    addElementBtn.addEventListener('click', () => {
        addElementRow();
        saveState();
        markMatrixDirty();
    });

    const handleBoundaryChange = () => {
        saveState();
        markMatrixDirty();
    };
    fixedNodesContainer.addEventListener('change', handleBoundaryChange);
    fixedNodesContainer.addEventListener('input', handleBoundaryChange);

    forcesContainer.addEventListener('input', () => {
        saveState();
        markDisplacementsDirty();
    });

    elementsContainer.addEventListener('input', (event) => {
        if (!event.target.closest('.element-row')) return;
        saveState();
        markMatrixDirty();
    });

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportStateAsJson);
    }

    if (importJsonBtn && importJsonInput) {
        importJsonBtn.addEventListener('click', () => importJsonInput.click());
        importJsonInput.addEventListener('change', (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                importStateFromContent(reader.result);
                importJsonInput.value = '';
            };
            reader.onerror = () => {
                alert('Failed to read the selected file.');
                importJsonInput.value = '';
            };
            reader.readAsText(file);
        });
    }

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
        const modeConfig = getModeConfig();
        // Clear previous downstream results
        reactionForcesResult = [];
        elementStressesResult = [];
        elementForcesResult = [];
        reactionForcesContainer.innerHTML = '';
        stressesContainer.innerHTML = '';
        elementForcesContainer.innerHTML = '';

        const result = getInvertedReducedMatrix();
        if (!result) return;
        const { invertedK, freeNodesIndices, fixedNodesIndices, globalMultiplier } = result;
        const allForces = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => parseFloat(input.value) || 0);
        const boundaryStates = collectFixedNodesData();
        const prescribedValues = boundaryStates.length
            ? boundaryStates.map(node => (node.fixed ? (parseFloat(node.value) || 0) : 0))
            : Array.from({ length: parseInt(numNodesInput.value, 10) || 0 }, () => 0);
        let displacementResult;
        try {
            displacementResult = computeDisplacements({
                invertedReducedMatrix: invertedK,
                freeNodesIndices,
                fixedNodesIndices,
                forces: allForces,
                globalMatrix: globalStiffnessMatrix,
                globalMultiplier,
                knownDisplacements: prescribedValues
            });
        } catch (error) {
            alert(error.message);
            return;
        }
        const { fullDisplacementVector: newFullDisplacements, reactionForces } = displacementResult;
        let tableHTML = `<table><thead><tr><th>Node</th><th>${modeConfig.primaryResultColumn}</th></tr></thead><tbody>`;
        newFullDisplacements.forEach((value, index) => {
            const { value: dispValue, exponent: dispExponent } = formatEngineeringNotation(value, parseInt(decimalPlacesInput.value));
            tableHTML += `<tr><td>${index + 1}</td><td>${dispValue} x 10<sup>${dispExponent}</sup></td></tr>`;
        });
        tableHTML += '</tbody></table>';
        displacementsContainer.innerHTML = tableHTML;
        flashTarget(displacementsContainer);

        // --- REACTION FORCE CALCULATION ---
        fullDisplacementVector = newFullDisplacements;

        let reactionTableHTML = `<table><thead><tr><th>Node</th><th>${modeConfig.reactionColumn}</th></tr></thead><tbody>`;
        if (fixedNodesIndices.length > 0) {
            fixedNodesIndices.forEach(nodeIndex => {
                const force = reactionForces[nodeIndex];
                reactionForcesResult.push({ node: nodeIndex + 1, force: force }); // Store result
                const { value: forceValue, exponent: forceExponent } = formatEngineeringNotation(force, parseInt(decimalPlacesInput.value));
                reactionTableHTML += `<tr><td>${nodeIndex + 1}</td><td>${forceValue} x 10<sup>${forceExponent}</sup></td></tr>`;
            });
        } else {
            reactionTableHTML += `<tr><td colspan="2">${modeConfig.reactionNoneMessage}</td></tr>`;
        }
        reactionTableHTML += '</tbody></table>';
        reactionForcesContainer.innerHTML = reactionTableHTML;
        flashTarget(reactionForcesContainer);
        calculationState.displacementsDirty = false;
        updateActionButtonStates();
    });

    if (loadExample11Btn) {
        loadExample11Btn.addEventListener('click', () => {
            loadCustomExample(exampleScenarios.moaveniExample11);
            modalImg.src = 'images/example_1_1.png';
            modalImg.alt = 'Moaveni Example 1.1 tapered bar diagram (imperial units)';
            const modalContent = document.querySelector('.modal-content');
            if (modalContent.resetDragPosition) {
                modalContent.resetDragPosition();
            }
            modal.style.display = 'flex';
            registerPresetIllustration('example11');
        });
    }

    if (loadExample4Btn) {
        loadExample4Btn.addEventListener('click', () => {
            loadCustomExample(exampleScenarios.thermalExteriorWall);
            modalImg.src = 'images/example_1_2.png';
            modalImg.alt = 'Moaveni Example 1.2 thermal wall diagram (imperial units)';
            const modalContent = document.querySelector('.modal-content');
            if (modalContent.resetDragPosition) {
                modalContent.resetDragPosition();
            }
            modal.style.display = 'flex';
            registerPresetIllustration('example24');
        });
    }

    clearAppBtn.addEventListener('click', () => resetAppToDefault(true));

    inputSection.addEventListener('input', (event) => {
        saveState();
        if (!event.target) return;
        if (event.target.id === 'decimal-places') {
            return;
        }
        if (event.target.id === 'global-multiplier' || event.target.id === 'youngs-modulus') {
            markMatrixDirty();
        }
    });

    decimalPlacesInput.addEventListener('input', saveState);
    if (analysisModeSelect) {
        analysisModeSelect.addEventListener('change', () => {
            setAnalysisMode(analysisModeSelect.value);
        });
    }

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
        const modeConfig = getModeConfig();
        const coefficientDescriptor = modeConfig.elementCoefficientLabel || 'Stiffness';
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

        stepsHTML += `<h3>Initial ${modeConfig.matrixHeading || 'Global Matrix'}</h3>`;
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
            stepsHTML += `<p>Element connecting <b>Node ${nodeId1}</b> and <b>Node ${nodeId2}</b> with ${modeConfig.elementCoefficientLabel} <b>= ${stiffness}</b></p>`;

            const i = nodeId1 - 1;
            const j = nodeId2 - 1;

            const elemK = [[stiffness, -stiffness], [-stiffness, stiffness]];
            stepsHTML += `<h4>${modeConfig.elementMatrixHeading}</h4>`;
            stepsHTML += `<p>For nodes ${nodeId1} and ${nodeId2}:</p>`;
            stepsHTML += formatMatrixForDisplay(elemK);


            K[i][i] += stiffness;
            K[j][j] += stiffness;
            K[i][j] -= stiffness;
            K[j][i] -= stiffness;

            stepsHTML += `<h4>Updated ${modeConfig.matrixHeading || 'Global Matrix'}</h4>`;
            stepsHTML += `<p>The element ${coefficientDescriptor.toLowerCase()} values are added to the global matrix at positions corresponding to the nodes.</p>`;
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
        const { layout } = computeDiagramLayout({ alertOnError: true });
        if (!layout) return;
        const svgMarkup = renderDiagramSvg(layout);
        diagramContainer.innerHTML = svgMarkup;
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
                const modeConfig = getModeConfig();
                const latexString = generateLatexString(matrixForExport.K, matrixForExport.kHeaders, matrixForExport.kNumericMultiplier);
                promptWithLatex(latexString, modeConfig.matrixHeading);
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
            const modeConfig = getModeConfig();
            if (fullDisplacementVector.length === 0) {
                alert(`Please ${modeConfig.primarySolveButton.toLowerCase()} first.`);
                return;
            }

            const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
            const elements = collectElementsData();
            elementStressesResult = calculateElementStressesCore(elements, fullDisplacementVector, globalMultiplier);

            let tableHTML = `<table><thead><tr><th>Element</th><th>${modeConfig.elementFluxColumn}</th></tr></thead><tbody>`;
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
            flashTarget(stressesContainer);
        });
    }

    if (calculateElementForcesBtn) {
        calculateElementForcesBtn.addEventListener('click', () => {
            const modeConfig = getModeConfig();
            if (fullDisplacementVector.length === 0) {
                alert(`Please ${modeConfig.primarySolveButton.toLowerCase()} first.`);
                return;
            }

            const globalMultiplier = parseFloat(globalMultiplierInput.value) || 1;
            const elements = collectElementsData();
            elementForcesResult = calculateElementForcesCore(elements, fullDisplacementVector, globalMultiplier);

            let tableHTML = `<table><thead><tr><th>Element</th><th>${modeConfig.elementForceColumn}</th></tr></thead><tbody>`;
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
            flashTarget(elementForcesContainer);
        });
    }

    const generateLatexSummary = () => {
        const btn = document.getElementById('generate-summary-btn');
        if (btn) {
            btn.classList.add('is-flashing');
            setTimeout(() => btn.classList.remove('is-flashing'), 500);
        }

        const modeConfig = getModeConfig();
        const parsedDecimalPlaces = parseInt(decimalPlacesInput.value, 10);
        const decimalPlaces = Number.isFinite(parsedDecimalPlaces) ? parsedDecimalPlaces : 4;
        const nodeCount = parseInt(numNodesInput.value, 10) || 0;
        const bulkPropertyValue = youngsModulusInput ? parseFloat(youngsModulusInput.value) : NaN;
        const globalMultiplierValue = parseFloat(globalMultiplierInput.value);
        const timestamp = new Date();
        const timestampDisplay = timestamp.toISOString().replace(/T/, ' ').replace(/Z$/, ' UTC');
        const diagramResult = computeDiagramLayout();
        const diagramLayout = diagramResult.layout;
        const diagramError = diagramResult.error;
        const formatGraphicPath = (path) => `\\detokenize{${path}}`;
        const requestedExampleFigures = [];
        if (activePresetIllustrations.has('example11')) {
            requestedExampleFigures.push(presetIllustrationMetadata.example11);
        }
        if (activePresetIllustrations.has('example24')) {
            requestedExampleFigures.push(presetIllustrationMetadata.example24);
        }
        const presetContextNotes = [];
        if (activePresetIllustrations.has('example11') && exampleScenarios.moaveniExample11?.metadata) {
            const meta = exampleScenarios.moaveniExample11.metadata;
            const modulusText = formatEngineeringNotationForLatex(meta.modulus, decimalPlaces);
            const tipLoadText = formatEngineeringNotationForLatex(meta.tipLoad, decimalPlaces);
            const areaListText = meta.averageAreas.map(area => formatEngineeringNotationForLatex(area, decimalPlaces)).join(', ');
            const stiffnessListText = meta.stiffnesses.map(k => formatEngineeringNotationForLatex(k, decimalPlaces)).join(', ');
            presetContextNotes.push(
                `Moaveni Example 1.1 (${meta.unitSystem || 'imperial lb-in'}) from ${meta.source || 'the supplied PDF'}: taper ${meta.geometry.widthTop} in -> ${meta.geometry.widthBottom} in, thickness ${meta.geometry.thickness} in, total length ${meta.geometry.totalLength} in split into four ${meta.geometry.elementLength} in elements.`
            );
            presetContextNotes.push(`Material modulus $E = ${modulusText}\\,\\text{lb/in}^2$, tip load $P = ${tipLoadText}\\,\\text{lb}$.`);
            presetContextNotes.push(`Element areas [${areaListText}] $\\text{in}^2$; element stiffnesses [${stiffnessListText}] $\\text{lb/in}$.`);
        }

        const elementRows = elementsContainer.querySelectorAll('.element-row');
        const elementsData = Array.from(elementRows).map((row, index) => {
            const labelValue = row.querySelector('.element-label-input').value.trim();
            return {
                label: labelValue || `Element ${index + 1}`,
                node1: parseInt(row.querySelector('.node1').value, 10),
                node2: parseInt(row.querySelector('.node2').value, 10),
                area: parseFloat(row.querySelector('.area-input').value),
                length: parseFloat(row.querySelector('.length-input').value),
                stiffness: parseFloat(row.querySelector('.stiffness-input').value),
                calculateK: row.querySelector('.calculate-k-checkbox')?.checked || false
            };
        });

        const fixedNodes = Array.from(fixedNodesContainer.querySelectorAll('input:checked')).map(cb => cb.id.split('-')[2]);
        const nodalLoads = Array.from(forcesContainer.querySelectorAll('.force-item input')).map(input => parseFloat(input.value) || 0);
        const appliedLoads = nodalLoads.map((value, index) => ({ node: index + 1, value })).filter(item => item.value !== 0);
        const totalAppliedLoad = appliedLoads.length ? appliedLoads.reduce((sum, item) => sum + item.value, 0) : null;
        const totalAbsLoad = appliedLoads.length ? appliedLoads.reduce((sum, item) => sum + Math.abs(item.value), 0) : null;

        const formatOptionalValue = (value, placeholder = '---') => Number.isFinite(value) ? formatEngineeringNotationForLatex(value, decimalPlaces) : placeholder;
        const formatList = (items) => {
            if (items.length === 0) return '';
            if (items.length === 1) return items[0];
            if (items.length === 2) return `${items[0]} and ${items[1]}`;
            return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
        };

        const computedOutputs = [];
        if (matrixForExport.K) computedOutputs.push('$K$');
        if (matrixForExport.invK) computedOutputs.push('$K_r^{-1}$');
        if (fullDisplacementVector.length > 0) computedOutputs.push(modeConfig.primarySymbol);
        if (reactionForcesResult.length > 0) computedOutputs.push(modeConfig.reactionSymbol);
        if (elementForcesResult.length > 0) computedOutputs.push(modeConfig.elementForceSymbol);
        if (elementStressesResult.length > 0) computedOutputs.push(modeConfig.elementFluxSymbol);

        const areaSamples = elementsData.map(element => {
            const value = parseFloat(element.area);
            return Number.isFinite(value) ? value : null;
        });
        const firstFiniteArea = areaSamples.find(value => value !== null);
        const uniformArea = typeof firstFiniteArea === 'number' && areaSamples.every(value => value === null || Math.abs(value - firstFiniteArea) < 1e-9)
            ? firstFiniteArea
            : null;
        const isThermalMode = modeConfig.key === 'thermal';
        const thermalHeatTotals = isThermalMode && elementForcesResult.length > 0
            ? elementForcesResult.map((result, idx) => {
                const explicitArea = areaSamples[idx];
                const pairedArea = Number.isFinite(explicitArea) ? explicitArea : uniformArea;
                if (!Number.isFinite(pairedArea) || !Number.isFinite(result.force)) {
                    return null;
                }
                return {
                    label: result.label || `Element ${idx + 1}`,
                    perArea: result.force,
                    area: pairedArea,
                    total: result.force * pairedArea
                };
            }).filter(Boolean)
            : [];
        const averagedTotalHeat = thermalHeatTotals.length > 0
            ? thermalHeatTotals.reduce((sum, entry) => sum + entry.total, 0) / thermalHeatTotals.length
            : null;

        const autoCoefficientCount = elementsData.filter(el => el.calculateK).length;
        const validLengths = elementsData.map(el => el.length).filter(val => Number.isFinite(val));
        const validAreas = elementsData.map(el => el.area).filter(val => Number.isFinite(val));
        const validCoefficients = elementsData.map(el => el.stiffness).filter(val => Number.isFinite(val));
        const totalLength = validLengths.length ? validLengths.reduce((sum, val) => sum + val, 0) : null;
        const shortestLength = validLengths.length ? Math.min(...validLengths) : null;
        const longestLength = validLengths.length ? Math.max(...validLengths) : null;
        const minArea = validAreas.length ? Math.min(...validAreas) : null;
        const maxArea = validAreas.length ? Math.max(...validAreas) : null;
        const averageCoefficient = validCoefficients.length ? validCoefficients.reduce((sum, val) => sum + val, 0) / validCoefficients.length : null;

        const summaryLines = [];
        summaryLines.push(`% LaTeX Summary from Stiffness Matrix Generator\n`);
        summaryLines.push(`% Generated on: ${timestamp.toUTCString()}\n\n`);
        summaryLines.push(`\\documentclass{article}\n`);
        summaryLines.push(`\\usepackage[T1]{fontenc}\n`);
        summaryLines.push(`\\usepackage[utf8]{inputenc}\n`);
        summaryLines.push(`\\usepackage{amsmath}\n`);
        summaryLines.push(`\\usepackage{booktabs}\n`);
        summaryLines.push(`\\usepackage{graphicx}\n`);
        summaryLines.push(`\\usepackage{tikz}\n`);
        summaryLines.push(`\\usetikzlibrary{arrows.meta}\n`);
        summaryLines.push(`\\usepackage{geometry}\n`);
        summaryLines.push(`\\geometry{a4paper, margin=1in}\n\n`);
        summaryLines.push(`\\begin{document}\n\n`);
        summaryLines.push(`\\title{${escapeLatex(modeConfig.displayName)} Summary}\n`);
        summaryLines.push(`\\author{Stiffness Matrix Generator}\n`);
        summaryLines.push(`\\date{${escapeLatex(timestampDisplay)}}\n`);
        summaryLines.push(`\\maketitle\n\n`);

        const fixedNodesText = fixedNodes.length
            ? `${fixedNodes.length} ${modeConfig.boundaryDescription}`
            : `no ${modeConfig.boundaryDescription}`;
        const loadedNodesText = appliedLoads.length
            ? `${appliedLoads.length} ${modeConfig.appliedLoadVerb}`
            : `no ${modeConfig.appliedLoadVerb}`;
        const outputsText = computedOutputs.length
            ? `Computed outputs include ${formatList(computedOutputs)}.`
            : 'No solver outputs have been generated yet; run the action buttons and regenerate this summary.';

        summaryLines.push(`\\begin{abstract}\n`);
        summaryLines.push(`Analysis configured for a ${nodeCount}-node system with ${elementsData.length} element${elementsData.length === 1 ? '' : 's'}, ${fixedNodesText}, and ${loadedNodesText}. ${outputsText}\n`);
        summaryLines.push(`\\end{abstract}\n\n`);

        summaryLines.push(`\\section*{Model Overview}\n`);
        summaryLines.push(`\\begin{tabular}{@{}ll@{}}\n`);
        summaryLines.push(`Generated & ${escapeLatex(timestampDisplay)} \\\\\n`);
        summaryLines.push(`Nodes & ${nodeCount || '---'} \\\\\n`);
        summaryLines.push(`Elements & ${elementsData.length} \\\\\n`);
        summaryLines.push(`Fixed Nodes & ${fixedNodes.length ? escapeLatex(fixedNodes.join(', ')) : 'None'} \\\\\n`);
        summaryLines.push(`Free Degrees of Freedom & ${Math.max(nodeCount - fixedNodes.length, 0)} \\\\\n`);
        summaryLines.push(`${escapeLatex(modeConfig.loadedNodesLabel || 'Loaded Nodes')} & ${appliedLoads.length ? escapeLatex(appliedLoads.map(f => f.node).join(', ')) : 'None'} \\\\\n`);
        summaryLines.push(`Net ${escapeLatex(modeConfig.loadValueLabel)} & ${totalAppliedLoad !== null ? formatEngineeringNotationForLatex(totalAppliedLoad, decimalPlaces) : 'N/A'} \\\\\n`);
        summaryLines.push(`Total Applied |${escapeLatex(modeConfig.loadValueLabel)}| & ${totalAbsLoad !== null ? formatEngineeringNotationForLatex(totalAbsLoad, decimalPlaces) : 'N/A'} \\\\\n`);
        summaryLines.push(`Decimal Places & ${Number.isFinite(parsedDecimalPlaces) ? parsedDecimalPlaces : 'Default (4)'} \\\\\n`);
        summaryLines.push(`\\end{tabular}\n\n`);

        summaryLines.push(`\\subsection*{Global Parameters}\n`);
        summaryLines.push(`\\begin{itemize}\n`);
        summaryLines.push(`    \\item Number of Nodes: ${nodeCount || '---'}\n`);
        summaryLines.push(`    \\item ${escapeLatex(modeConfig.bulkPropertyLabel)}: ${formatOptionalValue(bulkPropertyValue)}\n`);
        summaryLines.push(`    \\item Global Multiplier: ${formatOptionalValue(globalMultiplierValue)}\n`);
        if (modeConfig.key === 'thermal') {
            const tempUnitsLatex = thermalBoundaryTextKey === 'imperial' ? '$^\\circ$F' : '$^\\circ$C';
            summaryLines.push(`    \\item Temperature Units: ${tempUnitsLatex}\n`);
        }
        summaryLines.push(`\\end{itemize}\n\n`);

        if (presetContextNotes.length > 0) {
            summaryLines.push(`\\subsection*{Preset Context}\n`);
            summaryLines.push(`\\begin{itemize}\n`);
            presetContextNotes.forEach(note => {
                summaryLines.push(`    \\item ${escapeLatex(note)}\n`);
            });
            summaryLines.push(`\\end{itemize}\n\n`);
        }

        const summaryFormulae = Array.isArray(modeConfig.summaryFormulae) ? modeConfig.summaryFormulae : [];
        if (summaryFormulae.length > 0) {
            const formulaHeading = modeConfig.formulaSectionHeading || 'Calculation Formulae';
            summaryLines.push(`\\subsection*{${escapeLatex(formulaHeading)}}\n`);
            if (modeConfig.formulaIntro) {
                summaryLines.push(`${escapeLatex(modeConfig.formulaIntro)}\n\n`);
            }
            const lambdaSymbol = modeConfig.globalMultiplierSymbol || '\\lambda';
            const lambdaValueLatex = Number.isFinite(globalMultiplierValue)
                ? formatEngineeringNotationForLatex(globalMultiplierValue, decimalPlaces, false)
                : null;
            const formulaContext = {
                lambdaSymbol,
                lambdaValueLatex
            };
            summaryLines.push(`\\begin{description}\n`);
            summaryFormulae.forEach(block => {
                const mathContent = typeof block.mathBuilder === 'function'
                    ? block.mathBuilder(formulaContext)
                    : block.math;
                if (!mathContent) {
                    return;
                }
                const displayType = block.display === 'inline' ? 'inline' : 'block';
                const mathWrapped = displayType === 'inline' ? `$${mathContent}$` : `\\[${mathContent}\\]`;
                const description = block.description ? ` ${escapeLatex(block.description)}` : '';
                summaryLines.push(`\\item[${escapeLatex(block.title || 'Formula')}] ${mathWrapped}${description}\n`);
            });
            summaryLines.push(`\\end{description}\n\n`);
        }

        summaryLines.push(`\\subsection*{Element Inventory}\n`);
        summaryLines.push(`\\resizebox{\\textwidth}{!}{%\n`);
        summaryLines.push(`\\begin{tabular}{|l|c|c|r|r|r|c|}\n`);
        summaryLines.push(`\\hline\n`);
        summaryLines.push(`\\textbf{Label} & \\textbf{Node Left} & \\textbf{Node Right} & \\textbf{Area (A)} & \\textbf{Length (l)} & \\textbf{${escapeLatex(modeConfig.elementCoefficientLabel)}} & \\textbf{Source} \\\\\n`);
        summaryLines.push(`\\hline\n`);
        if (elementsData.length > 0) {
            elementsData.forEach(element => {
                summaryLines.push(`${escapeLatex(element.label)} & ${Number.isFinite(element.node1) ? element.node1 : '--'} & ${Number.isFinite(element.node2) ? element.node2 : '--'} & ${formatOptionalValue(element.area)} & ${formatOptionalValue(element.length)} & ${formatOptionalValue(element.stiffness)} & ${element.calculateK ? '\\textsc{Auto}' : '\\textsc{Manual}'} \\\\\n`);
            });
        } else {
            summaryLines.push(`\\multicolumn{7}{|c|}{No elements defined.} \\\\\n`);
        }
        summaryLines.push(`\\hline\n`);
        summaryLines.push(`\\end{tabular}\n`);
        summaryLines.push(`}%\n\n`);

        summaryLines.push(`\\paragraph{Element Statistics}\n`);
        summaryLines.push(`\\begin{tabular}{|l|r|}\n`);
        summaryLines.push(`\\hline\nMetric & Value \\\\\n\\hline\n`);
        summaryLines.push(`Total Length & ${formatOptionalValue(totalLength)} \\\\\n`);
        summaryLines.push(`Shortest Length & ${formatOptionalValue(shortestLength)} \\\\\n`);
        summaryLines.push(`Longest Length & ${formatOptionalValue(longestLength)} \\\\\n`);
        summaryLines.push(`Minimum Area & ${formatOptionalValue(minArea)} \\\\\n`);
        summaryLines.push(`Maximum Area & ${formatOptionalValue(maxArea)} \\\\\n`);
        summaryLines.push(`Average ${escapeLatex(modeConfig.elementCoefficientLabel)} & ${formatOptionalValue(averageCoefficient)} \\\\\n`);
        summaryLines.push(`Auto-calculated ${escapeLatex(modeConfig.elementCoefficientLabel)} Entries & ${autoCoefficientCount} \\\\\n`);
        summaryLines.push(`\\hline\n\\end{tabular}\n\n`);

        summaryLines.push(`\\subsection*{${escapeLatex(modeConfig.loadHeading)}}\n`);
        if (appliedLoads.length > 0) {
            summaryLines.push(`\\begin{tabular}{|c|r|}\n`);
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\textbf{Node} & \\textbf{${escapeLatex(modeConfig.loadColumnLabel)}} \\\\\n`);
            summaryLines.push(`\\hline\n`);
            appliedLoads.forEach(item => {
                summaryLines.push(`${item.node} & ${formatEngineeringNotationForLatex(item.value, decimalPlaces)} \\\\\n`);
            });
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\end{tabular}\n\n`);
        } else {
            summaryLines.push(`${modeConfig.noLoadText}\n\n`);
        }

        summaryLines.push(`\\subsection*{System Diagram}\n`);
        const hasPresetFigures = requestedExampleFigures.length > 0;
        if (hasPresetFigures) {
            requestedExampleFigures.forEach(fig => {
                summaryLines.push(`\\begin{figure}[h]\n\\centering\n\\includegraphics[width=0.85\\textwidth]{${formatGraphicPath(fig.src)}}\n\\caption{${escapeLatex(fig.caption)}}\n\\end{figure}\n\n`);
            });
            const figurePaths = requestedExampleFigures.map(fig => `\\texttt{${escapeLatex(fig.src)}}`).join(', ');
            summaryLines.push(`\\textit{${escapeLatex(modeConfig.presetImageReminderIntro)} ${figurePaths}.}\\par\n\n`);
        } else if (diagramLayout) {
            const tikzFigure = renderDiagramTikz(diagramLayout, decimalPlaces);
            summaryLines.push(`\\begin{figure}[h]\n\\centering\n${tikzFigure}\\caption{Automatically generated node and element connectivity diagram.}\n\\end{figure}\n\n`);
        } else {
            summaryLines.push(`${diagramError ? escapeLatex(diagramError) : 'Diagram unavailable. Ensure nodes and elements are defined before exporting.'}\n\n`);
        }

        summaryLines.push(`\\subsection*{Computation Checklist}\n`);
        summaryLines.push(`\\begin{tabular}{|l|c|}\n`);
        summaryLines.push(`\\hline\nTask & State \\\\\n\\hline\n`);
        const computationRows = [
            { label: `${escapeLatexPreserveMath(modeConfig.matrixHeading)}`, ready: Boolean(matrixForExport.K), hint: `\\texttt{${escapeLatex(modeConfig.matrixButtonText)}}` },
            { label: 'Inverse reduced matrix ($K_r^{-1}$)', ready: Boolean(matrixForExport.invK), hint: '\\texttt{Invert Matrix}' },
            { label: `${escapeLatexPreserveMath(modeConfig.primaryResultHeading)}`, ready: fullDisplacementVector.length > 0, hint: `\\texttt{${escapeLatex(modeConfig.primarySolveButton)}}` },
            { label: `${escapeLatexPreserveMath(modeConfig.reactionHeading)}`, ready: reactionForcesResult.length > 0, hint: `\\texttt{${escapeLatex(modeConfig.primarySolveButton)}}` },
            { label: `${escapeLatexPreserveMath(modeConfig.elementForceHeading)}`, ready: elementForcesResult.length > 0, hint: `\\texttt{${escapeLatex(modeConfig.elementForceButton)}}` },
            { label: `${escapeLatexPreserveMath(modeConfig.elementFluxHeading)}`, ready: elementStressesResult.length > 0, hint: `\\texttt{${escapeLatex(modeConfig.elementFluxButton)}}` }
        ];
        computationRows.forEach(row => {
            const statusText = row.ready ? '\\textbf{Ready}' : `Pending (${row.hint})`;
            summaryLines.push(`${row.label} & ${statusText} \\\\\n`);
        });
        summaryLines.push(`\\hline\n\\end{tabular}\n\n`);

        const highlightRows = [];
        if (appliedLoads.length > 0) {
            const peakLoad = appliedLoads.reduce((best, current) => (!best || Math.abs(current.value) > Math.abs(best.value) ? current : best), null);
            if (peakLoad) {
                highlightRows.push({
                    metric: `Largest applied ${modeConfig.loadValueLabel.toLowerCase()}`,
                    location: `Node ${peakLoad.node}`,
                    value: formatEngineeringNotationForLatex(peakLoad.value, decimalPlaces)
                });
            }
        }

        const fieldEntries = fullDisplacementVector
            .map((value, index) => ({ node: index + 1, value }))
            .filter(entry => Number.isFinite(entry.value) && entry.value !== 0);
        if (fieldEntries.length > 0) {
            const maxEntry = fieldEntries.reduce((best, curr) => Math.abs(curr.value) > Math.abs(best.value) ? curr : best, fieldEntries[0]);
            highlightRows.push({
                metric: modeConfig.highlightPrimaryMetric,
                location: `Node ${maxEntry.node}`,
                value: formatEngineeringNotationForLatex(maxEntry.value, decimalPlaces)
            });
        }

        if (reactionForcesResult.length > 0) {
            const maxReaction = reactionForcesResult.reduce((best, curr) => Math.abs(curr.force) > Math.abs(best.force) ? curr : best, reactionForcesResult[0]);
            highlightRows.push({
                metric: modeConfig.highlightReactionMetric,
                location: `Node ${maxReaction.node}`,
                value: formatEngineeringNotationForLatex(maxReaction.force, decimalPlaces)
            });
        }

        if (elementForcesResult.length > 0) {
            const maxElementForce = elementForcesResult.reduce((best, curr) => Math.abs(curr.force) > Math.abs(best.force) ? curr : best, elementForcesResult[0]);
            highlightRows.push({
                metric: modeConfig.highlightElementForceMetric,
                location: escapeLatex(maxElementForce.label || ''),
                value: formatEngineeringNotationForLatex(maxElementForce.force, decimalPlaces)
            });
        }
        if (averagedTotalHeat !== null) {
            const heatLocation = thermalHeatTotals.length === 1 ? thermalHeatTotals[0].label : 'Layer average';
            highlightRows.push({
                metric: 'Total through-wall heat',
                location: escapeLatex(heatLocation),
                value: formatEngineeringNotationForLatex(averagedTotalHeat, decimalPlaces)
            });
        }

        if (elementStressesResult.length > 0) {
            const maxStress = elementStressesResult.reduce((best, curr) => Math.abs(curr.stress) > Math.abs(best.stress) ? curr : best, elementStressesResult[0]);
            highlightRows.push({
                metric: modeConfig.highlightElementFluxMetric,
                location: escapeLatex(maxStress.label || ''),
                value: formatEngineeringNotationForLatex(maxStress.stress, decimalPlaces)
            });
        }

        summaryLines.push(`\\subsection*{Key Numerical Highlights}\n`);
        if (highlightRows.length > 0) {
            summaryLines.push(`\\begin{tabular}{|l|l|r|}\n`);
            summaryLines.push(`\\hline\nMetric & Location & Value \\\\\n\\hline\n`);
            highlightRows.forEach(row => {
                summaryLines.push(`${row.metric} & ${row.location} & ${row.value} \\\\\n`);
            });
            summaryLines.push(`\\hline\n\\end{tabular}\n\n`);
        } else {
            summaryLines.push(`No analysis results to highlight.\n\n`);
        }

        summaryLines.push(`\\section*{Analysis Results}\n`);

        summaryLines.push(`\\subsection*{${escapeLatexPreserveMath(modeConfig.matrixHeading)}}\n`);
        if (matrixForExport.K) {
            summaryLines.push(generateLatexString(matrixForExport.K, matrixForExport.kHeaders, matrixForExport.kNumericMultiplier));
        } else {
            summaryLines.push(`Not calculated.\n\n`);
        }

        summaryLines.push(`\\subsection*{${escapeLatexPreserveMath('Inverse of Reduced Matrix ($K_r^{-1}$)')}}\n`);
        if (matrixForExport.invK) {
            summaryLines.push(generateLatexString(matrixForExport.invK, matrixForExport.invKHeaders, matrixForExport.invKNumericMultiplier));
        } else {
            summaryLines.push(`Not calculated.\n\n`);
        }

        summaryLines.push(`\\subsection*{${escapeLatexPreserveMath(modeConfig.primaryResultHeading)}}\n`);
        if (fullDisplacementVector.length > 0) {
            summaryLines.push(`\\begin{tabular}{|c|r|}\n`);
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\textbf{Node} & \\textbf{${escapeLatex(modeConfig.primaryResultColumn)}} \\\\\n`);
            summaryLines.push(`\\hline\n`);
            fullDisplacementVector.forEach((value, index) => {
                if (value !== 0 && Number.isFinite(value)) {
                    summaryLines.push(`${index + 1} & ${formatEngineeringNotationForLatex(value, decimalPlaces)} \\\\\n`);
                }
            });
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\end{tabular}\n\n`);
        } else {
            summaryLines.push(`Not calculated.\n\n`);
        }

        summaryLines.push(`\\subsection*{${escapeLatexPreserveMath(modeConfig.reactionHeading)}}\n`);
        if (reactionForcesResult.length > 0) {
            summaryLines.push(`\\begin{tabular}{|c|r|}\n`);
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\textbf{Node} & \\textbf{${escapeLatex(modeConfig.reactionColumn)}} \\\\\n`);
            summaryLines.push(`\\hline\n`);
            reactionForcesResult.forEach(r => {
                summaryLines.push(`${r.node} & ${formatEngineeringNotationForLatex(r.force, decimalPlaces)} \\\\\n`);
            });
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\end{tabular}\n\n`);
        } else {
            summaryLines.push(`Not calculated.\n\n`);
        }

        summaryLines.push(`\\subsection*{${escapeLatexPreserveMath(modeConfig.elementForceHeading)}}\n`);
        if (elementForcesResult.length > 0) {
            summaryLines.push(`\\begin{tabular}{|l|r|}\n`);
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\textbf{Element} & \\textbf{${escapeLatex(modeConfig.elementForceColumn)}} \\\\\n`);
            summaryLines.push(`\\hline\n`);
            elementForcesResult.forEach(f => {
                summaryLines.push(`${escapeLatex(f.label)} & ${formatEngineeringNotationForLatex(f.force, decimalPlaces)} \\\\\n`);
            });
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\end{tabular}\n\n`);
            if (thermalHeatTotals.length > 0) {
                const representativeEntry = thermalHeatTotals[0];
                const perAreaValue = formatEngineeringNotationForLatex(representativeEntry.perArea, decimalPlaces);
                const areaValue = formatEngineeringNotationForLatex(representativeEntry.area, decimalPlaces);
                if (averagedTotalHeat !== null) {
                    const totalHeatLatex = formatEngineeringNotationForLatex(averagedTotalHeat, decimalPlaces);
                    summaryLines.push(`Per-area flow (${perAreaValue}) multiplied by the specified area (${areaValue}) yields a total heat transfer of ${totalHeatLatex}.\n\n`);
                } else {
                    summaryLines.push(`Per-area heat flows may be multiplied by the specified area (${areaValue}) to obtain total heat transfer for each layer.\n\n`);
                }
                const matchesMoaveniExample = representativeEntry.area && Math.abs(representativeEntry.area - 150) < 1e-6 && averagedTotalHeat !== null && Math.abs(averagedTotalHeat - 520) < 5;
                if (matchesMoaveniExample) {
                    summaryLines.push(`This matches the 520\\,Btu/hr loss reported in Moaveni Example\\,1.2.\n\n`);
                }
            }
        } else {
            summaryLines.push(`Not calculated.\n\n`);
        }

        summaryLines.push(`\\subsection*{${escapeLatexPreserveMath(modeConfig.elementFluxHeading)}}\n`);
        if (elementStressesResult.length > 0) {
            summaryLines.push(`\\begin{tabular}{|l|r|}\n`);
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\textbf{Element} & \\textbf{${escapeLatex(modeConfig.elementFluxColumn)}} \\\\\n`);
            summaryLines.push(`\\hline\n`);
            elementStressesResult.forEach(s => {
                summaryLines.push(`${escapeLatex(s.label)} & ${formatEngineeringNotationForLatex(s.stress, decimalPlaces)} \\\\\n`);
            });
            summaryLines.push(`\\hline\n`);
            summaryLines.push(`\\end{tabular}\n\n`);
        } else {
            summaryLines.push(`Not calculated.\n\n`);
        }

        summaryLines.push(`\\end{document}\n`);

        const summary = summaryLines.join('');
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
