# Direct Formulation (1D Stiffness Matrix Analyser)

[![Launch in Browser](https://img.shields.io/badge/Launch-Browser%20App-blue)](https://gwb2025.github.io/Stiffness-Matrix-Generator/)

A web-based tool for generating and analysing 1D stiffness matrices for systems of springs. This application is designed for engineers and students to quickly assemble and solve simple structural analysis problems.

## Launch from GitHub

Click the **Launch Browser App** badge above to open the live GitHub Pages build in your browser. No install or server is needed for the hosted version. If you run the app locally with `python -m server.py`, your browser may warn about the bundled self-signed certificate—proceed past the warning for local development, or use the hosted link to avoid it.

## Quick Start

1) **Hosted**: Click the badge to open the GitHub Pages build. Pick an analysis mode, set node count, add elements, then generate/invert the matrix and calculate displacements/reactions. Load a preset (Examples 1.1, 1.2, Problem 6, or Kim & Sankar Problem 10) for a ready-made setup.  
2) **Local**: Run `python -m server.py` and open the printed `https://127.0.0.1:5001` URL. Bypass the self-signed cert warning. Workflow is identical to hosted, and local state persists in your browser storage.  
3) **Share results**: Use `Summary` for LaTeX, `Markdown Summary` for forum-friendly output, or `HTML Summary` for TinyMCE/blog posts; JSON export/import helps move setups between machines.

## Key Features

*   **Dual Analysis Modes**: Structural (axial springs/bars) and steady-state thermal conduction. Labels, units, solvers, and LaTeX exports adapt to the selected discipline.
*   **Dynamic System Definition**: Choose node count, add/remove elements, set connectivity, and provide area/length/stiffness (or let the app auto-compute stiffness/conductance from E or k, A, and L).
*   **Boundary Conditions & Loads**: Fix any node, enter prescribed displacements/temperatures, and apply nodal forces/heat loads. A global multiplier scales the assembled matrix when needed.
*   **Computation Suite**: Builds the global matrix, forms and inverts the reduced matrix, then solves for displacements/temperatures, reaction forces, elemental forces, and stresses/heat flux.
*   **Visual Aids**: A draggable system diagram renders the current model; a construction helper walks through how the global matrix is assembled.
*   **Import/Export**: Save or load JSON states, export individual matrices to LaTeX, generate a full LaTeX analysis summary, grab a Markdown summary for quick forum posts, or copy an HTML summary for WYSIWYG editors.
*   **Example Library**: One-click presets for Moaveni Example 1.1 (tapered bar), Moaveni Example 1.2 (thermal wall), Moaveni Problem 6 (spring network), and Kim & Sankar Problem 10 (stepped bar).
*   **Persistent State**: Your setup is stored in local storage so you can resume later.

### Moaveni Example 1.1 Tapered Bar

The “Example 1.1” preset mirrors the direct-formulation walk-through in Saeed Moaveni, *Finite Element Analysis: Theory and Application with ANSYS* (3rd ed., Pearson, 2008), Chapter 1 Example 1.1. Selecting it configures the tapered aluminum strip exactly as tabulated in the text:

*   E = 10.4e6 lb/in^2, w1 = 2 in, w2 = 1 in, t = 0.125 in, and L = 10 in.
*   Four 2.5 in elements are created with average areas [0.234375, 0.203125, 0.171875, 0.140625] in² and equivalent stiffnesses [9.75, 8.45, 7.15, 5.85] × 10⁵ lb/in.
*   Node 1 is fixed, Node 5 carries the P = 1000 lb tip load, and all intermediate nodes are free.

These inputs let you reproduce the published nodal displacements, reaction force, and element stresses for the tapered bar without re-entering the data by hand. The preset is a concise restatement of the Example 1.1 problem published in Saeed Moaveni’s *Finite Element Analysis: Theory and Application with ANSYS* (3rd ed., Pearson, 2008; Library of Congress TA347.F5 M62 2007, ISBN 0‑13‑189080‑8).
The geometry and units are pulled directly from `Moaveni_Example_1_1_Imperial_Units_Summary.pdf` so the lb-in figures on screen match the supplied PDF scan.

### Moaveni Example 1.2 Thermal Wall

The “Example 1.2” preset mirrors the thermal walk-through from Saeed Moaveni, *Finite Element Analysis: Theory and Application with ANSYS* (3rd ed., Pearson, 2008): a 2×4 exterior wall with a 150 ft² exposed area, outside air at 20 °F, and an indoor temperature of 70 °F. The six layers listed in Moaveni’s imperial table are modeled as sequential thermal elements, each using the U-factor derived directly from the listed resistances (hr·ft²·°F/Btu → Btu/hr·ft²·°F) so the nodal temperatures (20.59, 23.41, 27.97, 66.08, 67.64 °F) and 520 Btu/hr heat loss match the worked example:

*   Outside film (winter, 15 mph), U = 5.88
*   Wood siding (1/2 in. lapped), U = 1.23
*   Sheathing (1/2 in. regular), U = 0.76
*   Insulation batt (3–3½ in.), U = 0.091
*   Gypsum wallboard (1/2 in.), U = 2.22
*   Inside film (winter), U = 1.47

Loading the preset switches the app to thermal mode, fixes node 1 at 20 °F and node 7 at 70 °F, and leaves the intermediate nodes free so you can reproduce the book’s nodal temperature distribution and total heat loss with one click.

### Moaveni Problem 6 Spring Network

The “Problem 6” preset sets up the six-spring network from Moaveni (2008): parallel springs between nodes 2–3, fixed ends at nodes 1 and 5, and 10 lb loads at nodes 2 and 4. The preset matches the diagram in `images/problem_6.png` and preloads all element stiffnesses and boundary conditions so you can focus on the resulting displacements and reactions.

### Kim & Sankar Problem 10 Stepped Bar

The “Kim & Sankar Problem 10” preset mirrors the stepped bar in Figure 2.17 (five nodes, four elements). It fixes nodes 1 and 5, applies a 10 kN force at node 3, and uses $E = 100$ GPa with end areas of $1\\times10^{-4}\\ \\text{m}^2$, middle areas of $2\\times10^{-4}\\ \\text{m}^2$, and segment lengths of 0.3, 0.2, 0.2, and 0.3 m. Load it to jump straight into solving the reaction forces and segment stresses.

## How to Use

1.  **Set Global Parameters**: Start by choosing the `Analysis Type`, defining the `Number of Nodes`, a `Global Multiplier`, and the discipline-specific material property (Young's Modulus for structural mode or Thermal Conductivity for thermal mode).
2.  **Define Elements**: Click "Add Element" to create a new spring. For each element, define its label, which nodes it connects, and its physical properties (Area, Length). You can either input the stiffness `k` directly or check the "Calc k" box to have it computed for you.
3.  **Set Boundary Conditions**: In the "Boundary Conditions" section, tick fixed nodes and (optionally) enter prescribed displacement/temperature values.
4.  **Apply Loads**: Enter nodal forces (structural) or heat loads (thermal) in the "Applied Forces/Loads" section.
5.  **Analyse**: Use the action buttons in order:
    *   `Generate Stiffness Matrix`
    *   `Invert Matrix`
    *   `Calculate Displacements` (also computes reactions)
    *   `Calculate Stresses` / `Calculate Element Forces` (discipline-specific post-processing)
6.  **Visualise**: Use the System Diagram button to view the layout and the Matrix Construction helper to see how `K` is assembled.
7.  **Export**: Use `Summary` for LaTeX, `Markdown Summary` for forum-friendly text, `HTML Summary` for TinyMCE/WYSIWYG editors, the `TeX` buttons on the matrix tables for quick snippets, or export/import JSON to share states.

## Run Locally

```bash
python -m server.py
```

The dev server runs over HTTPS with the bundled self-signed cert. Open the printed URL (https://127.0.0.1:5001), bypass the browser warning, and start working. The app is also published at the GitHub Pages link above if you prefer not to run it locally.

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
