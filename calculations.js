(function (root, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else {
        root.Calculations = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    const EPS = 1e-12;

    const cloneMatrix = (matrix) => matrix.map(row => row.slice());

    const assembleGlobalStiffnessMatrix = (numNodes, elements) => {
        if (!Number.isInteger(numNodes) || numNodes < 2) {
            throw new Error('Number of nodes must be an integer between 2 and 10.');
        }
        if (!Array.isArray(elements) || elements.length === 0) {
            throw new Error('At least one element must be defined.');
        }
        const matrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(0));
        elements.forEach((element, index) => {
            const stiffness = Number(element.stiffness);
            const node1 = Number(element.node1);
            const node2 = Number(element.node2);
            if (!Number.isFinite(stiffness) || stiffness <= 0) {
                throw new Error(`Element ${index + 1} has an invalid stiffness.`);
            }
            if (!Number.isInteger(node1) || !Number.isInteger(node2) || node1 < 1 || node2 < 1 || node1 > numNodes || node2 > numNodes || node1 === node2) {
                throw new Error(`Element ${index + 1} has invalid node assignments.`);
            }
            const i = node1 - 1;
            const j = node2 - 1;
            matrix[i][i] += stiffness;
            matrix[j][j] += stiffness;
            matrix[i][j] -= stiffness;
            matrix[j][i] -= stiffness;
        });
        return matrix;
    };

    const getDeterminant = (matrix) => {
        const size = matrix.length;
        if (size === 0) return 1;
        const working = cloneMatrix(matrix);
        let detSign = 1;

        for (let i = 0; i < size; i++) {
            let pivotRow = i;
            let pivotValue = Math.abs(working[i][i]);
            for (let r = i + 1; r < size; r++) {
                const candidate = Math.abs(working[r][i]);
                if (candidate > pivotValue) {
                    pivotValue = candidate;
                    pivotRow = r;
                }
            }
            if (pivotValue < EPS) {
                return 0;
            }
            if (pivotRow !== i) {
                [working[i], working[pivotRow]] = [working[pivotRow], working[i]];
                detSign *= -1;
            }
            const pivot = working[i][i];
            for (let r = i + 1; r < size; r++) {
                const factor = working[r][i] / pivot;
                for (let c = i; c < size; c++) {
                    working[r][c] -= factor * working[i][c];
                }
            }
        }
        return detSign * working.reduce((product, row, idx) => product * row[idx], 1);
    };

    const invertMatrix = (matrix) => {
        const size = matrix.length;
        if (size === 0) return [];
        const identity = Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => (i === j ? 1 : 0)));
        const augmented = matrix.map((row, i) => [...row, ...identity[i]]);

        for (let i = 0; i < size; i++) {
            let pivotRow = i;
            let maxVal = Math.abs(augmented[i][i]);
            for (let r = i + 1; r < size; r++) {
                const candidate = Math.abs(augmented[r][i]);
                if (candidate > maxVal) {
                    maxVal = candidate;
                    pivotRow = r;
                }
            }
            if (maxVal < EPS) return null;
            if (pivotRow !== i) {
                [augmented[i], augmented[pivotRow]] = [augmented[pivotRow], augmented[i]];
            }
            const divisor = augmented[i][i];
            for (let j = i; j < 2 * size; j++) {
                augmented[i][j] /= divisor;
            }
            for (let k = 0; k < size; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = i; j < 2 * size; j++) {
                        augmented[k][j] -= factor * augmented[i][j];
                    }
                }
            }
        }
        return augmented.map(row => row.slice(size));
    };

    const buildReducedMatrix = (globalMatrix, freeNodesIndices, globalMultiplier) => {
        return freeNodesIndices.map(i => freeNodesIndices.map(j => globalMatrix[i][j] * globalMultiplier));
    };

    const multiplyMatrixVector = (matrix, vector) => {
        return matrix.map(row => row.reduce((sum, value, index) => sum + value * vector[index], 0));
    };

    const computeDisplacements = ({ invertedReducedMatrix, freeNodesIndices, forces, globalMatrix, globalMultiplier }) => {
        if (!invertedReducedMatrix || !Array.isArray(invertedReducedMatrix)) {
            throw new Error('Inverted reduced matrix is required.');
        }
        const numNodes = globalMatrix.length;
        const freeForces = freeNodesIndices.map(i => forces[i] || 0);
        const displacements = invertedReducedMatrix.map(row => row.reduce((sum, value, idx) => sum + value * freeForces[idx], 0));
        const fullDisplacementVector = Array(numNodes).fill(0);
        freeNodesIndices.forEach((nodeIndex, i) => {
            fullDisplacementVector[nodeIndex] = displacements[i];
        });
        const scaledGlobalMatrix = globalMatrix.map(row => row.map(val => val * globalMultiplier));
        const kTimesD = multiplyMatrixVector(scaledGlobalMatrix, fullDisplacementVector);
        const reactionForces = kTimesD.map((val, idx) => val - (forces[idx] || 0));
        return { displacements, fullDisplacementVector, reactionForces };
    };

    const calculateElementForces = (elements, fullDisplacements, globalMultiplier) => {
        return elements.map((element, index) => {
            const label = element.label || `Element ${index + 1}`;
            const stiffness = Number(element.stiffness);
            const node1 = Number(element.node1) - 1;
            const node2 = Number(element.node2) - 1;
            if (!Number.isFinite(stiffness) || !Number.isInteger(node1) || !Number.isInteger(node2)) {
                return { label, force: NaN };
            }
            const d1 = fullDisplacements[node1] ?? 0;
            const d2 = fullDisplacements[node2] ?? 0;
            const force = stiffness * globalMultiplier * (d2 - d1);
            return { label, force };
        });
    };

    const calculateElementStresses = (elements, fullDisplacements, globalMultiplier) => {
        return elements.map((element, index) => {
            const label = element.label || `Element ${index + 1}`;
            const stiffness = Number(element.stiffness);
            const area = Number(element.area);
            const node1 = Number(element.node1) - 1;
            const node2 = Number(element.node2) - 1;
            if (!Number.isFinite(stiffness) || !Number.isFinite(area) || area === 0 || !Number.isInteger(node1) || !Number.isInteger(node2)) {
                return { label, stress: NaN };
            }
            const d1 = fullDisplacements[node1] ?? 0;
            const d2 = fullDisplacements[node2] ?? 0;
            const stress = (stiffness * globalMultiplier / area) * (d2 - d1);
            return { label, stress };
        });
    };

    return {
        assembleGlobalStiffnessMatrix,
        getDeterminant,
        invertMatrix,
        buildReducedMatrix,
        computeDisplacements,
        calculateElementForces,
        calculateElementStresses
    };
});
