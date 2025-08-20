import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import it from './locales/it.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'

// Get language from Chrome storage or default to 'zh'
const getLanguage = async (): Promise<string> => {
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

// Initialize i18n
const initI18n = async () => {
  const lng = await getLanguage()
  
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        zh: { translation: zh },
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
        de: { translation: de },
        ja: { translation: ja },
        ko: { translation: ko },
        it: { translation: it },
        pt: { translation: pt },
        ru: { translation: ru }
      },
      lng,
      fallbackLng: 'zh',
      interpolation: {
        escapeValue: false
      }
    })
}

// Initialize and export
initI18n()

export { i18n }
export default i18n