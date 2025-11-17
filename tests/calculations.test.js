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
