# SYX -> Figma Integration Guide

This guide explains how to synchronize your SYX Design System tokens with Figma using the **Tokens Studio for Figma** plugin.

## Prerequisites

1.  **Node.js**: Ensure you have Node.js installed on your machine.
2.  **Figma**: You need a Figma account.
3.  **Tokens Studio for Figma**: Install this plugin from the Figma Community.

## Step 1: Generate Tokens JSON

Run the following command in your terminal from the root of the SYX project:

```bash
node scripts/generate-tokens.js
```

This will create a `tokens.json` file in the root directory.

## Step 2: Import into Figma

1.  Open your Figma file.
2.  Launch the **Tokens Studio for Figma** plugin.
3.  Go to the **Tools** tab (or Settings).
4.  Click on **Load from file / Import**.
5.  Select the `tokens.json` file generated in Step 1.
6.  You will see your tokens organized by:
    - `primitives` (Global tokens like colors, spacing)
    - `semantic` (Contextual aliases)
    - `components` (Specific component values)

## Step 3: Syncing Updates

Whenever you make changes to `scss/abstracts/tokens/**` files:

1.  Re-run `node scripts/generate-tokens.js`.
2.  Re-import the `tokens.json` into the plugin.

> **Tip**: You can use the "Sync" feature in Tokens Studio (available in the Pro version) to automate this by connecting to a GitHub repository where checking in `tokens.json` triggers an update.
