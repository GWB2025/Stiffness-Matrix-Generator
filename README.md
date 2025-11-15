# 1D Stiffness Matrix Analyzer

[![Launch in Browser](https://img.shields.io/badge/Launch-Browser%20App-blue)](https://gwb2025.github.io/Stiffness-Matrix-Generator/)

A web-based tool for generating and analyzing 1D stiffness matrices for systems of springs. This application is designed for engineers and students to quickly assemble and solve simple structural analysis problems.

## Key Features

*   **Dynamic System Definition**: Easily define the number of nodes and add or remove multiple spring elements.
*   **Flexible Element Properties**: For each element, specify its connectivity (nodes), area, length, and stiffness.
*   **Automatic Stiffness Calculation**: Optionally calculates an element's stiffness (`k`) automatically based on its Area (`A`), Length (`L`), and a global Young's Modulus (`E`).
*   **Global Matrix Assembly**: Automatically generates the global stiffness matrix (`K`) from the individual element properties.
*   **Boundary Conditions & Forces**: Apply fixed-node boundary conditions and specify external forces at each node.
*   **Complete Analysis Suite**:
    *   Calculates the inverse of the reduced stiffness matrix (`Kr⁻¹`).
    *   Solves for **Nodal Displacements** (`d`).
    *   Calculates **Reaction Forces** (`R`) at fixed nodes.
    *   Calculates internal **Element Forces** (`f`).
    *   Calculates **Element Stresses** (`σ`).
*   **Visualization Tools**:
    *   **System Diagram**: Generates a 2D diagram of the node/element layout, including boundary conditions and forces.
    *   **Matrix Construction Helper**: Provides a step-by-step walkthrough of how the global stiffness matrix is assembled from individual elements.
*   **LaTeX Export**:
    *   Export the Global Stiffness Matrix or the Inverse Reduced Matrix as a LaTeX code snippet.
    *   Generate a comprehensive **Analysis Summary** in LaTeX format, including all inputs and calculated results.
*   **Example Problems**: Load pre-defined example problems to quickly get started.
*   **Persistent State**: Your setup is automatically saved in your browser's local storage, so you can pick up where you left off.

## How to Use

1.  **Set Global Parameters**: Start by defining the `Number of Nodes`, a `Global Multiplier` (if you want to scale all stiffness values), and the global `Young's Modulus`.
2.  **Define Elements**: Click "Add Element" to create a new spring. For each element, define its label, which nodes it connects, and its physical properties (Area, Length). You can either input the stiffness `k` directly or check the "Calc k" box to have it computed for you.
3.  **Set Boundary Conditions**: In the "Boundary Conditions" section, check the boxes corresponding to any nodes that are fixed (i.e., have zero displacement).
4.  **Apply Forces**: In the "Applied Forces" section, enter any external forces applied at each node.
5.  **Analyze**: Use the action buttons to perform calculations in sequence:
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