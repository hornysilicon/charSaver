# Character Saver - SillyTavern Extension

A SillyTavern extension that automatically creates chat lorebook entries when the AI introduces new characters.

## Features

- Automatically detects character introductions in AI responses
- Creates chat-bound lorebook entries with character names and descriptions
- Removes character introduction blocks from the chat after processing
- Supports multiple character introductions in a single message
- Supports flexible character name formats:
  - `**Name:** John Doe`
  - `Name: John Doe`
  - `**John Doe**`
- Auto-creates a lorebook if none exists
- Shows toast notifications when characters are added

## Installation

1. In SillyTavern, go to **Extensions → Manage Extensions**
2. Click the **Install from URL** button
3. Paste this URL: `https://github.com/hornysilicon/charSaver`
4. Click **Install**
5. Enable the extension in the extensions list

## Setup

For the extension to work, you need to instruct the AI to use the special delimiters when introducing characters.

### Adding to Your System Prompt

Add this to your system prompt or global preset:

```
When introducing new NPCs, provide a quick full description between `<!-- new character start` and `new character end -->`. The description must include:
- The character's Name

Example format:
<!-- new character start
Name: John Doe
**Physical description:** Tall, lean, with short brown hair and blue eyes.
**Mannerisms:** Speaks slowly, taps his fingers when thinking.
-->
```

### Adding to Character Cards

You can also add this directly to your character card's "System Prompt" field or personality section.

## Character Introduction Format

The extension supports flexible formats. Here are examples that will all work:

### Format 1: With field labels
```
<!-- new character start
Name: Verena Cortez
Physical description: Early 30s, 170cm, lean build. Dark brown skin, close-cropped hair.
Mannerisms: Speaks precisely, rarely blinks.
-->
```

### Format 2: Bolded field labels
```
<!-- new character start
**Name:** Danny Pham
**Physical description:** Late 20s, round face, short black hair.
**Occupation:** Junior financial analyst.
-->
```

### Format 3: Just a bolded name
```
<!-- new character start
**Marcus Doyle**
A large security supervisor in his late 30s with a shaved head and a noticeable limp.
-->
```

## Supported Name Formats

The extension recognizes character names in various formats:
- `Name: Character Name`
- `**Name:** Character Name`
- `**Name**: Character Name`
- `**Character Name**` (standalone bolded name)

## How It Works

1. When the AI generates a message with character introductions
2. The extension detects the special delimiters
3. Extracts the character name and description
4. Creates a lorebook entry with the character name as the keyword
5. Removes the introduction block from the displayed message

## Troubleshooting

### Extension not working

- Make sure the extension is enabled in Extensions → Manage Extensions
- Check that your system prompt includes the delimiter instructions
- Open the browser console (F12) and check for errors prefixed with [CharacterSaver]

### No lorebook active warning

The extension will automatically create a lorebook for your chat if one doesn't exist. The new lorebook will be named "Chat Lorebook YYYY-MM-DD".

### Characters not being detected

- Verify the AI is using the correct delimiters: `<!-- new character start` and `new character end -->`
- Check the browser console for parsing errors
- Make sure the character name is in one of the supported formats

## Files

- `manifest.json` - Extension metadata
- `index.js` - Main extension logic
- `README.md` - This file

## License

MIT License

## Author

hornysilicon

## Version

1.0.0
