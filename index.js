// Character Saver Extension for SillyTavern
// Automatically creates chat lorebook entries for characters introduced by the AI

const MODULE_NAME = 'CharacterSaver';

// Constants for character block delimiters
const START_DELIMITER = '<!-- new character start';
const END_DELIMITER = '-->';

// Import required modules
// Note: Third-party extensions are in public/scripts/extensions/third-party/NAME/
// So we need to go up 4 levels to reach public/
import {
    chat,
    chat_metadata,
    updateMessageBlock,
    saveChatConditional,
    saveMetadata,
    name2,
} from '../../../../script.js';

import {
    METADATA_KEY,
    world_names,
    loadWorldInfo,
    createWorldInfoEntry,
    saveWorldInfo,
    createNewWorldInfo,
    updateWorldInfoList,
} from '../../../../scripts/world-info.js';

import {
    eventSource,
    event_types,
} from '../../../../scripts/events.js';

console.log(`[${MODULE_NAME}] All imports successful`);

/**
 * Escapes special regex characters
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detects all character introduction blocks in a message
 */
function detectCharacterBlocks(messageContent) {
    const blocks = [];
    const regex = new RegExp(
        `${escapeRegExp(START_DELIMITER)}([\\s\\S]*?)${escapeRegExp(END_DELIMITER)}`,
        'gi'
    );

    let match;
    while ((match = regex.exec(messageContent)) !== null) {
        blocks.push(match[0].trim());
    }

    return blocks;
}

/**
 * Parses a character block to extract name and description
 */
function parseCharacterBlock(block) {
    try {
        let content = block
            .replace(new RegExp(escapeRegExp(START_DELIMITER), 'gi'), '')
            .replace(new RegExp(escapeRegExp(END_DELIMITER), 'gi'), '')
            .trim();

        // Look for Name: field (with or without bold markdown, various whitespace)
        // Or just a bolded name like **John Doe**
        const namePatterns = [
            /\*\*Name\*\*:\s*(.+)/im,           // **Name:** X
            /\*\*Name\*\*:\s*(.+)/im,            // **Name**: X
            /Name\s*:\s*(.+)/im,                 // Name: X
            /^\*\*([^*]+)\*\*\s*$/m,             // **John Doe** (standalone, first line)
            /\*\*([^*]+)\*\*\s*[\r\n]/,          // **John Doe** (followed by newline)
        ];

        let characterName = null;
        let namePatternUsed = null;

        for (const pattern of namePatterns) {
            const match = content.match(pattern);
            if (match) {
                characterName = match[1].trim();
                namePatternUsed = pattern;
                console.log(`[${MODULE_NAME}] Found character name: '${characterName}'`);
                break;
            }
        }

        if (!characterName) {
            console.warn(`[${MODULE_NAME}] Could not extract character name from block`);
            console.debug(`[${MODULE_NAME}] Block content:`, content);
            return null;
        }

        if (!characterName) {
            console.warn(`[${MODULE_NAME}] Empty character name in block`);
            return null;
        }

        // The entire block (excluding delimiters) is the description
        // Remove the Name line from the description to avoid redundancy
        const description = namePatternUsed ? content.replace(namePatternUsed, '').trim() : content.trim();

        return {
            name: characterName,
            description: description || `Character named ${characterName}`,
        };
    } catch (error) {
        console.error(`[${MODULE_NAME}] Error parsing character block:`, error);
        return null;
    }
}

/**
 * Removes character introduction blocks from a message
 */
function removeCharacterBlocks(messageContent) {
    const regex = new RegExp(
        `\\s*${escapeRegExp(START_DELIMITER)}[\\s\\S]*?${escapeRegExp(END_DELIMITER)}\\s*`,
        'gi'
    );

    return messageContent.replace(regex, '').trim();
}

/**
 * Gets or creates the current chat's World Info name
 */
async function getOrCreateWorldInfoName() {
    let worldName = chat_metadata[METADATA_KEY];

    console.log(`[${MODULE_NAME}] Detected World Info name: '${worldName}'`);
    console.log(`[${MODULE_NAME}] Available World Info books:`, world_names);

    // Check if World Info exists and is valid
    if (worldName && world_names.includes(worldName)) {
        return worldName;
    }

    // No World Info exists - create one
    console.log(`[${MODULE_NAME}] No World Info found. Creating new one...`);

    // Generate a name for the new World Info using the character name
    const characterName = name2 || 'Chat';
    // Format: YYYY-MM-DD HH:MM (example: 2026-06-02 14:30)
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5); // HH:MM
    const newWorldName = `${characterName} Chat Lorebook ${dateStr} ${timeStr}`;

    try {
        // Create the new World Info
        await createNewWorldInfo(newWorldName, { interactive: false });

        console.log(`[${MODULE_NAME}] Created new World Info: '${newWorldName}'`);

        // Update the chat metadata to use the new World Info
        chat_metadata[METADATA_KEY] = newWorldName;

        // Save the metadata
        await saveMetadata();

        console.log(`[${MODULE_NAME}] Attached World Info to chat`);

        // Refresh the world_names list
        await updateWorldInfoList();

        return newWorldName;
    } catch (error) {
        console.error(`[${MODULE_NAME}] Failed to create World Info:`, error);
        return null;
    }
}

/**
 * Creates a new lorebook entry for a character
 */
async function createLorebookEntry(worldName, characterName, description) {
    try {
        console.log(`[${MODULE_NAME}] Creating entry for '${characterName}' in World Info: '${worldName}'`);

        const worldData = await loadWorldInfo(worldName);

        if (!worldData) {
            console.error(`[${MODULE_NAME}] Failed to load World Info: ${worldName}`);
            return false;
        }

        console.log(`[${MODULE_NAME}] World Info loaded, entries before:`, Object.keys(worldData.entries || {}).length);

        const newEntry = createWorldInfoEntry(worldName, worldData);

        console.log(`[${MODULE_NAME}] Created new entry with UID:`, newEntry.uid);

        newEntry.key = [characterName];
        newEntry.keysecondary = [];
        newEntry.content = description;
        newEntry.comment = `Character: ${characterName}`;
        newEntry.order = 100;
        newEntry.constant = false;
        newEntry.selective = false;
        newEntry.depth = 4;
        newEntry.probability = 100;
        newEntry.position = 0;

        console.log(`[${MODULE_NAME}] Saving World Info with`, Object.keys(worldData.entries || {}).length, 'entries');

        await saveWorldInfo(worldName, worldData, true);

        console.log(`[${MODULE_NAME}] World Info saved successfully for: ${characterName}`);
        return true;
    } catch (error) {
        console.error(`[${MODULE_NAME}] Error creating lorebook entry:`, error);
        return false;
    }
}

/**
 * Processes a newly received message for character introductions
 */
async function processMessage(messageId) {
    try {
        const message = chat[messageId];

        if (!message || message.is_user || message.is_system) {
            return;
        }

        const messageContent = message.mes;

        if (!messageContent) {
            return;
        }

        const worldName = await getOrCreateWorldInfoName();

        if (!worldName) {
            console.warn(`[${MODULE_NAME}] Could not get or create World Info`);
            return;
        }

        const characterBlocks = detectCharacterBlocks(messageContent);

        if (characterBlocks.length === 0) {
            return;
        }

        console.log(`[${MODULE_NAME}] Found ${characterBlocks.length} character introduction(s)`);

        const createdCharacters = [];

        for (const block of characterBlocks) {
            const characterData = parseCharacterBlock(block);

            if (characterData) {
                const success = await createLorebookEntry(
                    worldName,
                    characterData.name,
                    characterData.description
                );

                if (success) {
                    createdCharacters.push(characterData.name);
                }
            }
        }

        if (createdCharacters.length > 0) {
            console.log(`[${MODULE_NAME}] Message BEFORE edit:\n${messageContent}`);
            message.mes = removeCharacterBlocks(messageContent);
            console.log(`[${MODULE_NAME}] Message AFTER edit:\n${message.mes}`);
            updateMessageBlock(messageId, message);
            await saveChatConditional();

            const names = createdCharacters.join(', ');
            if (typeof toastr !== 'undefined') {
                toastr.success(
                    `Added lorebook entries for: ${names}`,
                    `${MODULE_NAME}`,
                    { timeOut: 5000, preventDuplicates: true }
                );
            }

            console.log(`[${MODULE_NAME}] Created entries for: ${names}`);
        }
    } catch (error) {
        console.error(`[${MODULE_NAME}] Error processing message:`, error);
    }
}

// Set up event listener
eventSource.on(event_types.MESSAGE_RECEIVED, async (chatId, type) => {
    console.log(`[${MODULE_NAME}] MESSAGE_RECEIVED event: chatId=${chatId}, type=${type}`);
    if (chatId >= 0 && chat[chatId] && !chat[chatId].is_user) {
        await processMessage(chatId);
    }
});

console.log(`[${MODULE_NAME}] Extension initialized successfully`);

// Export for debugging
if (typeof globalThis !== 'undefined') {
    globalThis.CharacterSaver = {
        MODULE_NAME,
        detectCharacterBlocks,
        parseCharacterBlock,
        getCurrentWorldInfoName,
        processMessage,
    };
}
