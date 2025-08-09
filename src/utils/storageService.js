class StorageService {
    getItem(key, defaultValue) {
        let savedData;
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                savedData = null;
            } else {
                savedData = this.migrateValue(key, item);
            }
        } catch (error) {
            console.warn(`Failed to parse localStorage item ${key}:`, error);
            // Clear corrupted data
            localStorage.removeItem(key);
            savedData = null;
        }

        return savedData !== null ? savedData : defaultValue;
    }

    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Failed to set localStorage item ${key}:`, error);
        }
    }

    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            // Silent failure - no-op if key doesn't exist
        }
    }

    migrateValue(key, value) {
        // Handle migration from raw string values to JSON
        if (key === "provider" && value === "openai") {
            // Re-save as proper JSON
            localStorage.setItem(key, JSON.stringify("openai"));
            return "openai";
        } else if (key === "model" && !value.startsWith('"') && !value.startsWith("{")) {
            // Re-save as proper JSON
            localStorage.setItem(key, JSON.stringify(value));
            return value;
        } else {
            return JSON.parse(value);
        }
    }
}

// Create a singleton instance
const storageService = new StorageService();

export default storageService;
