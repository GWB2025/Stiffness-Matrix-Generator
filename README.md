# 1D Stiffness Matrix Analyser

[![Launch in Browser](https://img.shields.io/badge/Launch-Browser%20App-blue)](https://gwb2025.github.io/Stiffness-Matrix-Generator/)

A web-based tool for generating and analysing 1D stiffness matrices for systems of springs. This application is designed for engineers and students to quickly assemble and solve simple structural analysis problems.

## Key Features

*   **Dynamic System Definition**: Easily define the number of nodes and add or remove multiple spring elements.
*   **Flexible Element Properties**: For each element, specify its connectivity (nodes), area, length, and stiffness.
*   **Automatic Stiffness Calculation**: Optionally calculates an element's stiffness (`k`) automatically based on its Area (`A`), Length (`L`), and a global Young's Modulus (`E`).
*   **Dual Analysis Modes**: Toggle between structural (axial springs/bars) and steady-state thermal conduction; labels, solvers, and LaTeX reports adapt automatically for each discipline.
*   **Global Matrix Assembly**: Automatically generates the global stiffness matrix (`K`) from the individual element properties.
*   **Boundary Conditions & Forces**: Apply fixed-node boundary conditions and specify external forces at each node.
*   **Custom Boundary Values**: Enter non-zero prescribed displacements or temperatures directly on the fixed nodes to model known supports or Dirichlet thermal boundaries.
*   **Complete Analysis Suite**:
    *   Calculates the inverse of the reduced stiffness matrix (`Kr⁻¹`).
    *   Solves for **Nodal Displacements** (`d`).
    *   Calculates **Reaction Forces** (`R`) at fixed nodes.
    *   Calculates internal **Element Forces** (`f`).
    *   Calculates **Element Stresses** (`σ`).
*   **Visualisation Tools**:
    *   **System Diagram**: Generates a 2D diagram of the node/element layout, including boundary conditions and forces.
    *   **Matrix Construction Helper**: Provides a step-by-step walkthrough of how the global stiffness matrix is assembled from individual elements.
*   **LaTeX Export**:
    *   Export the Global Stiffness Matrix or the Inverse Reduced Matrix as a LaTeX code snippet.
    *   Generate a comprehensive **Analysis Summary** in LaTeX format, including all inputs and calculated results.
*   **Example Problems**: Load predefined example problems to quickly get started.
*   **Persistent State**: Your setup is automatically saved in your browser's local storage, so you can pick up where you left off.

### Cook et al. Cantilever Example

The Cook et al. preset replicates the textbook cantilever made of three axial segments with varying lengths and areas:

*   **Bar 1**: \(L_1 = 1.5\,\mathrm{m}\), \(A_1 = 2.0 \times 10^{-4}\,\mathrm{m}^2\)
*   **Bar 2**: \(L_2 = 1.0\,\mathrm{m}\), \(A_2 = 1.5 \times 10^{-4}\,\mathrm{m}^2\)
*   **Bar 3**: \(L_3 = 0.5\,\mathrm{m}\), \(A_3 = 1.0 \times 10^{-4}\,\mathrm{m}^2\)

Nodes 1–3 are arranged sequentially with the left end fixed, and a 50 kN tip load acts downward at Node 4. The preset uses the same data quoted in Cook et al., *Concepts and Applications of Finite Element Analysis* (4th ed., Chapter 2). Launching “Cook Cantilever” from the presets menu configures the mesh, boundary condition, force vector, and displays the accompanying equivalent-spring diagram for quick verification.

### Moaveni Parallel Branch Example

The “Moaveni Parallel” preset reproduces the axial bar assembly from Saeed Moaveni, *Finite Element Analysis: Theory and Application with ANSYS* (6th ed., Pearson, 2015), Chapter 2 Example 2.3. In that example, the bar contains three sequential segments with a parallel branch between nodes 2 and 3, all evaluated with \((E = 210\,\text{GPa})\) and a 40 kN end load. Loading the preset recreates the geometry, areas, lengths, and stiffnesses shown in Moaveni’s worked problem so you can verify the book’s nodal displacements, internal forces, and reaction forces directly inside the app.

### Moaveni Example 1.1 Tapered Bar

The “Example 1.1” preset mirrors the direct-formulation walk-through in Saeed Moaveni, *Finite Element Analysis: Theory and Application with ANSYS* (3rd ed., Pearson, 2008), Chapter 1 Example 1.1. Selecting it configures the tapered aluminum strip exactly as tabulated in the text:

*   E = 10.4e6 lb/in^2, w1 = 2 in, w2 = 1 in, t = 0.125 in, and L = 10 in.
*   Four 2.5 in elements are created with average areas [0.234375, 0.203125, 0.171875, 0.140625] in² and equivalent stiffnesses [9.75, 8.45, 7.15, 5.85] × 10⁵ lb/in.
*   Node 1 is fixed, Node 5 carries the P = 1000 lb tip load, and all intermediate nodes are free.

These inputs let you reproduce the published nodal displacements, reaction force, and element stresses for the tapered bar without re-entering the data by hand. The preset is a concise restatement of the Example 1.1 problem published in Saeed Moaveni’s *Finite Element Analysis: Theory and Application with ANSYS* (3rd ed., Pearson, 2008; Library of Congress TA347.F5 M62 2007, ISBN 0‑13‑189080‑8).

### Example 2.4 Thermal Wall

The “Example 2.4” preset switches the app into steady-state thermal analysis, loads the six-layer exterior wall described in *Heat_transfer_example.pdf* (“Direct formulation: thermal applications”), and pre-fills the outside/inside film temperatures (\(-6.7^\circ\text{C}\) and \(21^\circ\text{C}\)). Each layer’s U-factor is automatically converted into a conductance ( \(G = U \times A\) with \(A = 14\,\text{m}^2\) ), so you can immediately reproduce the published nodal temperature distribution and total heat loss through the wall.

## How to Use

1.  **Set Global Parameters**: Start by choosing the `Analysis Type`, defining the `Number of Nodes`, a `Global Multiplier`, and the discipline-specific material property (Young's Modulus for structural mode or Thermal Conductivity for thermal mode).
2.  **Define Elements**: Click "Add Element" to create a new spring. For each element, define its label, which nodes it connects, and its physical properties (Area, Length). You can either input the stiffness `k` directly or check the "Calc k" box to have it computed for you.
3.  **Set Boundary Conditions**: In the "Boundary Conditions" section, check the boxes corresponding to any nodes that are fixed and (optionally) type the prescribed displacement/temperature value for those nodes.
4.  **Apply Forces**: In the "Applied Forces" section, enter any external forces applied at each node.
5.  **Analyse**: Use the action buttons to perform calculations in sequence:
    *   `Generate Stiffness Matrix`
    *   `Invert Matrix`
    *   `Calculate Displacements`
    *   `Calculate Stresses` / `Calculate Element Forces`
6.  **Export**: Use the `Summary` button to get a full LaTeX report or the `TeX` buttons on the matrix tables to export them individually.

## Technologies Used

*   **HTML5**
*   **CSS3**
*   **Vanilla JavaScript**

No external frameworks or libraries are used for the core application logic, ensuring it is lightweight and fast.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

If you spot any potential copyright infringement in this project, please notify the app's creator and every effort will be made to address the concern promptly.

## Testing

Use Node.js v18+ (the repo was verified with v22). Run the automated calculations tests with:

```bash
node --test tests/*.test.js
```
