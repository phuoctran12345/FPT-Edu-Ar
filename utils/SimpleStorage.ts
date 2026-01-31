// Simple storage utility để lưu language preference
// Không cần AsyncStorage, chỉ dùng in-memory storage cho demo

interface StorageData {
  language: 'vi' | 'en';
  hasSeenSplash: boolean;
}

class SimpleStorage {
  private data: StorageData = {
    language: 'vi',
    hasSeenSplash: false,
  };

  // Get language preference
  getLanguage(): 'vi' | 'en' {
    return this.data.language;
  }

  // Set language preference
  setLanguage(language: 'vi' | 'en'): void {
    this.data.language = language;
  }

  // Check if user has seen splash screen
  hasSeenSplash(): boolean {
    return this.data.hasSeenSplash;
  }

  // Mark splash screen as seen
  markSplashAsSeen(): void {
    this.data.hasSeenSplash = true;
  }

  // Reset all data (for testing)
  reset(): void {
    this.data = {
      language: 'vi',
      hasSeenSplash: false,
    };
  }
}

// Export singleton instance
export const storage = new SimpleStorage();
export default storage;
