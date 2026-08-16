# UI & UX Design System

## The Aesthetic (Tailwind CSS)
The application utilizes a dark-mode-first, high-contrast aesthetic designed for technical power users. It mimics IDEs like Zed or VSCodium. No generic, overly padded corporate components.

## The Command Palette (⌘ + K)
All navigation is keyboard-driven. A global event listener captures `Cmd + K`. The palette supports fuzzy-searchable commands:
* `> New Application [URL]`
* `> Sync Coursera`
* `> View Master Profile JSON`

## Split-Screen Generative UI (N-Way Tiling)
* **Reality Layer (Left):** Renders the un-editable employer constraints and ATS questions extracted by the Scout agent.
* **Generative Layer (Right):** Renders the AST produced by the Synthesizer. 
* **Ergonomics:** Text is wrapped in `<CopyBlock>` React components. A single click copies the data to the clipboard and flashes a green "Copied!" tooltip. This allows the user to paste ATS answers into Greenhouse/Lever portals with sub-second latency.

## Real-Time Diff Engine
The tailored resume summary is rendered with a `git diff` overlay. 
* Removals from the baseline `masterProfile` are highlighted in faint red with strikethroughs.
* Additions (e.g., specific references to CodeQL or k6 injected by the AI to match the job) are highlighted in faint green. 
* This provides immediate, visual observability into the AI's reasoning.
