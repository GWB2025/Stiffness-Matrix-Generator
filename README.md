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

### Moaveni Example 1.1 Tapered Bar

The “Example 1.1” preset mirrors the direct-formulation walk-through in Saeed Moaveni, *Finite Element Analysis: Theory and Application with ANSYS* (3rd ed., Pearson, 2008), Chapter 1 Example 1.1. Selecting it configures the tapered aluminum strip exactly as tabulated in the text:

*   E = 10.4e6 lb/in^2, w1 = 2 in, w2 = 1 in, t = 0.125 in, and L = 10 in.
*   Four 2.5 in elements are created with average areas [0.234375, 0.203125, 0.171875, 0.140625] in² and equivalent stiffnesses [9.75, 8.45, 7.15, 5.85] × 10⁵ lb/in.
*   Node 1 is fixed, Node 5 carries the P = 1000 lb tip load, and all intermediate nodes are free.

These inputs let you reproduce the published nodal displacements, reaction force, and element stresses for the tapered bar without re-entering the data by hand. The preset is a concise restatement of the Example 1.1 problem published in Saeed Moaveni’s *Finite Element Analysis: Theory and Application with ANSYS* (3rd ed., Pearson, 2008; Library of Congress TA347.F5 M62 2007, ISBN 0‑13‑189080‑8).

### Moaveni Example 1.2 Thermal Wall

The “Example 1.2” preset mirrors the thermal walk-through from Saeed Moaveni, *Finite Element Analysis: Theory and Application with ANSYS* (3rd ed., Pearson, 2008): a 2×4 exterior wall with a 150 ft² exposed area, outside air at 20 °F, and an indoor temperature of 70 °F. The six layers listed in Moaveni’s table are modeled as sequential thermal elements, each using the book’s U-factor (Btu/hr·ft²·°F) directly as the element conductance so the nodal temperatures (20.59, 23.41, 27.97, 66.08, 67.64 °F) and 520 Btu/hr heat loss match the worked example:

*   Outside film (winter, 15 mph), U = 5.88
*   Wood siding (1/2 in. lapped), U = 1.23
*   Sheathing (1/2 in. regular), U = 0.76
*   Insulation batt (3–3½ in.), U = 0.091
*   Gypsum wallboard (1/2 in.), U = 2.22
*   Inside film (winter), U = 1.47

Loading the preset switches the app to thermal mode, fixes node 1 at 20 °F and node 7 at 70 °F, and leaves the intermediate nodes free so you can reproduce the book’s nodal temperature distribution and total heat loss with one click.

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
