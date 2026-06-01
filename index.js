// Character Saver Extension for SillyTavern
// Automatically creates chat lorebook entries for characters introduced by the AI

const MODULE_NAME = 'CharacterSaver';

// Import required functions from SillyTavern
import {
    chat,
    chat_metadata,
} from '../../../script.js';

import {
    METADATA_KEY,
    worldInfo,
    world_names,
    createWorldInfoEntry,
    loadWorldInfo,
    saveWorldInfo,
} from '../../../scripts/world-info.js';

import {
    eventSource,
    event_types,
} from '../../../scripts/events.js';

import {
    updateMessageBlock,
    saveChatConditional,
} from '../../../script.js';

// Constants for character block delimiters
const START_DELIMITER = '<!-- new character start -->';
const END_DELIMITER = '<!-- new character end -->';

/**
 * Detects all character introduction blocks in a message
 * @param {string} messageContent - The message text to search
 * @returns {Array} Array of character block strings
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
 * Escapes special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parses a character block to extract name and description
 * @param {string} block - The character block text
 * @returns {Object|null} Object with name and description, or null if parsing fails
 */
function parseCharacterBlock(block) {
    try {
        // Remove delimiters
        let content = block
            .replace(new RegExp(escapeRegExp(START_DELIMITER), 'gi'), '')
            .replace(new RegExp(escapeRegExp(END_DELIMITER), 'gi'), '')
            .trim();

        // Try to extract character name (assumes format: **Name**: description)
        // This pattern matches bold text followed by a colon
        const namePattern = /\*\*([^*]+)\*\*\s*:/;
        const nameMatch = content.match(namePattern);

        if (!nameMatch) {
            console.warn(`[${MODULE_NAME}] Could not extract character name from block`);
            return null;
        }

        const characterName = nameMatch[1].trim();
        const description = content.replace(namePattern, '').trim();

        if (!characterName) {
            console.warn(`[${MODULE_NAME}] Empty character name in block`);
            return null;
        }

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
 * Gets the current chat's World Info name
 * @returns {string|null} The World Info name or null if none is active
 */
function getCurrentWorldInfoName() {
    const worldName = chat_metadata[METADATA_KEY];

    if (!worldName || !world_names.includes(worldName)) {
        return null;
    }

    return worldName;
}

/**
 * Creates a new lorebook entry for a character
 * @param {string} worldName - The World Info file name
 * @param {string} characterName - The character's name
 * @param {string} description - The character's description
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function createLorebookEntry(worldName, characterName, description) {
    try {
        // Load the World Info data
        const worldData = await loadWorldInfo(worldName);

        if (!worldData) {
            console.error(`[${MODULE_NAME}] Failed to load World Info: ${worldName}`);
            return false;
        }

        // Create a new entry
        const newEntry = createWorldInfoEntry(worldName, worldData);

        // Set up the entry with character data
        newEntry.key = [characterName];
        newEntry.keysecondary = [];
        newEntry.content = description;
        newEntry.comment = `Character: ${characterName}`;
        newEntry.order = 100; // Default priority
        newEntry.constant = false;
        newEntry.selective = false; // Activate on any keyword match
        newEntry.depth = 4; // Default scan depth
        newEntry.probability = 100; // Always activate when matched
        newEntry.position = 0; // Default position (before context)

        // Save the changes
        await saveWorldInfo(worldName, worldData, true);

        console.log(`[${MODULE_NAME}] Created lorebook entry for: ${characterName}`);
        return true;
    } catch (error) {
        console.error(`[${MODULE_NAME}] Error creating lorebook entry:`, error);
        return false;
    }
}

/**
 * Removes character introduction blocks from a message
 * @param {string} messageContent - The original message content
 * @returns {string} The message content with blocks removed
 */
function removeCharacterBlocks(messageContent) {
    const regex = new RegExp(
        `\\s*${escapeRegExp(START_DELIMITER)}[\\s\\S]*?${escapeRegExp(END_DELIMITER)}\\s*`,
        'gi'
    );

    return messageContent.replace(regex, '').trim();
}

/**
 * Processes a newly received message for character introductions
 * @param {number} messageId - The ID of the message to process
 */
async function processMessage(messageId) {
    try {
        // Get the message from the chat
        const message = chat[messageId];

        if (!message || message.is_user || message.is_system) {
            // Skip user messages and system messages
            return;
        }

        const messageContent = message.mes;

        if (!messageContent) {
            return;
        }

        // Check if there's a World Info active for this chat
        const worldName = getCurrentWorldInfoName();

        if (!worldName) {
            console.warn(`[${MODULE_NAME}] No World Info active for this chat. Skipping character detection.`);
            return;
        }

        // Detect character introduction blocks
        const characterBlocks = detectCharacterBlocks(messageContent);

        if (characterBlocks.length === 0) {
            // No character introductions found
            return;
        }

        console.log(`[${MODULE_NAME}] Found ${characterBlocks.length} character introduction(s)`);

        // Process each character block
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

        // If we created any entries, update the message
        if (createdCharacters.length > 0) {
            // Remove the character blocks from the message
            message.mes = removeCharacterBlocks(messageContent);

            // Update the message display
            updateMessageBlock(messageId, message);

            // Save the chat
            await saveChatConditional();

            // Show notification
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

// Set up event listener when the extension loads
(function init() {
    console.log(`[${MODULE_NAME}] Extension loaded`);

    // Listen for MESSAGE_RECEIVED events
    eventSource.on(event_types.MESSAGE_RECEIVED, async (chatId, type) => {
        // Process all AI messages (skip user messages)
        if (chatId >= 0 && chat[chatId] && !chat[chatId].is_user) {
            await processMessage(chatId);
        }
    });

    console.log(`[${MODULE_NAME}] Event listener registered for MESSAGE_RECEIVED`);
})();

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
