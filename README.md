# Character Saver - SillyTavern Extension

A SillyTavern extension that automatically creates chat lorebook (World Info) entries when the AI introduces new characters.

## Features

- Automatically detects character introductions in AI responses
- Creates chat-bound lorebook entries with character names and descriptions
- Removes character introduction blocks from the chat after processing
- Supports multiple character introductions in a single message
- Shows toast notifications when characters are added

## Installation

1. Copy this extension folder to your SillyTavern installation:
   - **For all users:** `public/scripts/extensions/third-party/charSaver/`
   - **For current user:** `data/user/scripts/extensions/third-party/charSaver/`

2. Restart SillyTavern

3. Enable the extension in **Extensions → Manage Extensions**

## Usage

### 1. Set up a World Info (Lorebook)

Before using Character Saver, make sure you have a World Info file attached to your chat:

1. Open a chat
2. Click the **World Info** button (book icon)
3. Select an existing World Info file or create a new one

### 2. Prompt the AI to Use Character Delimiters

When you want the AI to introduce a new character, include instructions to use the special delimiters. Example:

```
When introducing new characters, wrap their introduction like this:

<!-- new character start -->
**Character Name**: A brief description of their appearance, personality, and role.
<!-- new character end -->
```

### 3. Character Introduction Format

The AI should format character introductions like this:

```html
<!-- new character start -->
**Eldrin Shadowweaver**: A tall elf with silver hair and piercing violet eyes. He wears dark robes adorned with arcane symbols. As the court mage, he serves as advisor to the queen.
<!-- new character end -->
```

The extension will:
- Extract "Eldrin Shadowweaver" as the character name
- Save the description as the lorebook content
- Remove the entire block from the chat message
- Add the character as a keyword in your World Info

### 4. Multiple Characters

You can introduce multiple characters in one response:

```html
<!-- new character start -->
**Lady Seraphina**: Elegant noblewoman with golden curls and emerald eyes.
<!-- new character end -->

The knights approached cautiously.

<!-- new character start -->
**Sir Gareth**: Weathered warrior with a scarred face and graying beard.
<!-- new character end -->
```

## Example Prompts

### Prompt for Character Creation

```
From now on, whenever you introduce a new named character in the story, format their introduction like this:

<!-- new character start -->
**Character Name**: Description of their appearance, personality, background, and role in the story.
<!-- new character end -->

After the introduction block, continue the story normally without repeating the character details.
```

### System Instructions (for character card)

You can also add this to your character card's system prompt:

```
Character Introduction Format:
When introducing new characters, use this format:
<!-- new character start -->
**Name**: Description
<!-- new character end -->
```

## Troubleshooting

### Extension not working

- Make sure you have a World Info file attached to the chat
- Check that the extension is enabled in Extensions → Manage Extensions
- Open the browser console (F12) and check for errors prefixed with [CharacterSaver]

### No World Info active warning

The extension requires a chat-bound World Info file to work. Create one in the World Info panel before using.

### Characters not being detected

- Verify the AI is using the correct delimiters: `<!-- new character start -->` and `<!-- new character end -->`
- The character name should be bolded (using markdown `**`) followed by a colon
- Check the browser console for parsing errors

## Files

- `manifest.json` - Extension metadata
- `index.js` - Main extension logic
- `README.md` - This file

## License

MIT License - feel free to modify and distribute.

## Author

hornysilicon

## Version

1.0.0
