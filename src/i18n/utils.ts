// Language utilities for extension
export const setLanguage = async (language: string): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      await chrome.storage.sync.set({ language })
    } catch (error) {
      console.error('Error saving language to storage:', error)
    }
  }
}

export const getLanguage = async (): Promise<string> => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    try {
      const result = await chrome.storage.sync.get(['language'])
      return result.language || 'zh'
    } catch (error) {
      console.error('Error getting language from storage:', error)
    }
  }
  return 'zh'
}

export const getSupportedLanguages = () => [
  { code: 'zh', name: '中文', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' }
]