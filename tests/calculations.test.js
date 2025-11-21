const test = require('node:test');
const assert = require('node:assert/strict');

const Calculations = require('../calculations.js');

const approxEqual = (actual, expected, tolerance = 1e-9) => {
    assert.ok(
        Math.abs(actual - expected) <= tolerance,
        `Expected ${expected}, received ${actual}`
    );
};

test('assembleGlobalStiffnessMatrix builds expected matrix', () => {
    const matrix = Calculations.assembleGlobalStiffnessMatrix(3, [
        { node1: 1, node2: 2, stiffness: 1000 },
        { node1: 2, node2: 3, stiffness: 1000 }
    ]);

    assert.deepStrictEqual(matrix, [
        [1000, -1000, 0],
        [-1000, 2000, -1000],
        [0, -1000, 1000]
    ]);
});

test('displacement and reaction calculations match analytical solution', () => {
    const numNodes = 3;
    const elements = [
        { node1: 1, node2: 2, stiffness: 1000, area: 1 },
        { node1: 2, node2: 3, stiffness: 1000, area: 1 }
    ];
    const globalMatrix = Calculations.assembleGlobalStiffnessMatrix(numNodes, elements);
    const fixedNodes = [true, false, true];
    const forces = [0, 100, 0];
    const globalMultiplier = 1;
    const freeNodes = fixedNodes.map((isFixed, i) => (isFixed ? -1 : i)).filter(i => i !== -1);
    const reducedMatrix = Calculations.buildReducedMatrix(globalMatrix, freeNodes, globalMultiplier);
    approxEqual(Calculations.getDeterminant(reducedMatrix), 2000);

    const invertedReduced = Calculations.invertMatrix(reducedMatrix);
    assert.ok(invertedReduced, 'Matrix inversion should produce a result');

    const { displacements, fullDisplacementVector, reactionForces } = Calculations.computeDisplacements({
        invertedReducedMatrix: invertedReduced,
        freeNodesIndices: freeNodes,
        forces,
        globalMatrix,
        globalMultiplier
    });

    approxEqual(displacements.length, 1);
    approxEqual(displacements[0], 0.05);
    approxEqual(fullDisplacementVector[1], 0.05);
    approxEqual(reactionForces[0], -50);
    approxEqual(reactionForces[2], -50);

    const forcesResult = Calculations.calculateElementForces(elements, fullDisplacementVector, globalMultiplier);
    approxEqual(forcesResult[0].force, 50);
    approxEqual(forcesResult[1].force, -50);

    const stressesResult = Calculations.calculateElementStresses(elements, fullDisplacementVector, globalMultiplier);
    approxEqual(stressesResult[0].stress, 50);
    approxEqual(stressesResult[1].stress, -50);
});

test('global multiplier scales stiffness and displacements accordingly', () => {
    const numNodes = 3;
    const elements = [
        { node1: 1, node2: 2, stiffness: 500, area: 2 },
        { node1: 2, node2: 3, stiffness: 500, area: 2 }
    ];
    const globalMatrix = Calculations.assembleGlobalStiffnessMatrix(numNodes, elements);
    const fixedNodes = [true, false, true];
    const forces = [0, 200, 0];
    const globalMultiplier = 2; // doubles stiffness, halves displacement
    const freeNodes = fixedNodes.map((isFixed, i) => (isFixed ? -1 : i)).filter(i => i !== -1);
    const reducedMatrix = Calculations.buildReducedMatrix(globalMatrix, freeNodes, globalMultiplier);
    const invertedReduced = Calculations.invertMatrix(reducedMatrix);
    const { displacements } = Calculations.computeDisplacements({
        invertedReducedMatrix: invertedReduced,
        freeNodesIndices: freeNodes,
        forces,
        globalMatrix,
        globalMultiplier
    });

    approxEqual(displacements[0], 0.1); // Without multiplier would be 0.2
});

test('thermal interpretation returns expected heat flow and flux', () => {
    const elements = [
        { node1: 1, node2: 2, stiffness: 15, area: 0.5 },
        { node1: 2, node2: 3, stiffness: 30, area: 0.25 }
    ];
    const nodalTemperatures = [350, 300, 260];
    const heatFlows = Calculations.calculateElementForces(elements, nodalTemperatures, 1);
    approxEqual(heatFlows[0].force, -750);
    approxEqual(heatFlows[1].force, -1200);

    const heatFlux = Calculations.calculateElementStresses(elements, nodalTemperatures, 1);
    approxEqual(heatFlux[0].stress, -1500);
   approxEqual(heatFlux[1].stress, -4800);
});

test('computeDisplacements respects prescribed boundary values', () => {
    const numNodes = 3;
    const elements = [
        { node1: 1, node2: 2, stiffness: 100, area: 1 },
        { node1: 2, node2: 3, stiffness: 100, area: 1 }
    ];
    const globalMatrix = Calculations.assembleGlobalStiffnessMatrix(numNodes, elements);
    const freeNodes = [1];
    const fixedNodesIndices = [0, 2];
    const knownDisplacements = [10, 0, 20];
    const forces = [0, 0, 0];
    const reducedMatrix = Calculations.buildReducedMatrix(globalMatrix, freeNodes, 1);
    const invertedReduced = Calculations.invertMatrix(reducedMatrix);
    const { fullDisplacementVector, reactionForces } = Calculations.computeDisplacements({
        invertedReducedMatrix: invertedReduced,
        freeNodesIndices: freeNodes,
        fixedNodesIndices,
        knownDisplacements,
        forces,
        globalMatrix,
        globalMultiplier: 1
    });

    approxEqual(fullDisplacementVector[1], 15);
    approxEqual(reactionForces[0], -500);
    approxEqual(reactionForces[2], 500);
});

test('Moaveni Example 1.1 preset reproduces textbook displacements & stresses', () => {
    const numNodes = 5;
    const elements = [
        { node1: 1, node2: 2, stiffness: 975000, area: 0.234375 },
        { node1: 2, node2: 3, stiffness: 845000, area: 0.203125 },
        { node1: 3, node2: 4, stiffness: 715000, area: 0.171875 },
        { node1: 4, node2: 5, stiffness: 585000, area: 0.140625 }
    ];
    const forces = [0, 0, 0, 0, 1000];
    const fixedNodes = [true, false, false, false, false];
    const freeNodes = fixedNodes.map((fixed, index) => (fixed ? -1 : index)).filter(index => index !== -1);
    const globalMatrix = Calculations.assembleGlobalStiffnessMatrix(numNodes, elements);
    const reducedMatrix = Calculations.buildReducedMatrix(globalMatrix, freeNodes, 1);
    const invertedMatrix = Calculations.invertMatrix(reducedMatrix);

    const { fullDisplacementVector, reactionForces } = Calculations.computeDisplacements({
        invertedReducedMatrix: invertedMatrix,
        freeNodesIndices: freeNodes,
        fixedNodesIndices: [0],
        forces,
        globalMatrix,
        globalMultiplier: 1,
        knownDisplacements: [0, 0, 0, 0, 0]
    });

    const expectedDisplacements = [0, 0.001026, 0.002210, 0.003608, 0.005317];
    expectedDisplacements.forEach((value, index) => {
        approxEqual(fullDisplacementVector[index], value, 5e-6);
    });
    approxEqual(reactionForces[0], -1000, 1e-6);

    const elementStresses = Calculations.calculateElementStresses(elements, fullDisplacementVector, 1);
    const expectedStresses = [4268, 4925, 5816, 7109];
    expectedStresses.forEach((stress, idx) => {
        approxEqual(elementStresses[idx].stress, stress, 5);
    });
});

test('Moaveni Example 1.2 thermal wall matches nodal temperatures and heat flow', () => {
    const elements = [
        { node1: 1, node2: 2, stiffness: 5.88, area: 150 },
        { node1: 2, node2: 3, stiffness: 1.23, area: 150 },
        { node1: 3, node2: 4, stiffness: 0.76, area: 150 },
        { node1: 4, node2: 5, stiffness: 0.091, area: 150 },
        { node1: 5, node2: 6, stiffness: 2.22, area: 150 },
        { node1: 6, node2: 7, stiffness: 1.47, area: 150 }
    ];
    const numNodes = 7;
    const K = Calculations.assembleGlobalStiffnessMatrix(numNodes, elements);
    const fixedNodes = [true, false, false, false, false, false, true];
    const freeNodes = fixedNodes.map((fixed, index) => (fixed ? -1 : index)).filter(index => index !== -1);
    const reducedMatrix = Calculations.buildReducedMatrix(K, freeNodes, 1);
    const invertedMatrix = Calculations.invertMatrix(reducedMatrix);
    const { fullDisplacementVector } = Calculations.computeDisplacements({
        invertedReducedMatrix: invertedMatrix,
        freeNodesIndices: freeNodes,
        fixedNodesIndices: [0, 6],
        knownDisplacements: [20, 0, 0, 0, 0, 0, 70],
        forces: Array(numNodes).fill(0),
        globalMatrix: K,
        globalMultiplier: 1
    });

    const expectedTemps = [20, 20.59, 23.41, 27.97, 66.08, 67.64, 70];
    expectedTemps.forEach((temp, idx) => {
        approxEqual(fullDisplacementVector[idx], temp, 0.02);
    });

    const heatFlows = Calculations.calculateElementForces(elements, fullDisplacementVector, 1);
    heatFlows.forEach(flow => {
        approxEqual(Math.abs(flow.force * 150), 520, 5); // Multiply by area to reflect Example 1.2 heat loss
    });
});
