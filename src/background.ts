// Background script for LinkTime Machine extension

import { getLanguage } from "~i18n/utils"

// Inline Wayback Machine API integration for background script
interface WaybackResponse {
  archived_snapshots: {
    closest?: {
      url: string;
      timestamp: string;
      status: string;
    };
  };
}

// Translation messages for background script
const getMessages = (lang: string) => {
  const messages = {
    zh: {
      contextMenu: {
        viewSnapshot: "查看历史快照 (View Historical Snapshot)",
        viewCurrentSnapshot: "查看当前页面快照 (View Current Page Snapshot)"
      },
      notifications: {
        noArchiveFound: "未找到存档 - {{domain}}",
        errorFetching: "获取历史快照时出错"
      }
    },
    en: {
      contextMenu: {
        viewSnapshot: "View Historical Snapshot",
        viewCurrentSnapshot: "View Current Page Snapshot"
      },
      notifications: {
        noArchiveFound: "No archive found - {{domain}}",
        errorFetching: "Error fetching historical snapshot"
      }
    },
    es: {
      contextMenu: {
        viewSnapshot: "Ver Captura Histórica",
        viewCurrentSnapshot: "Ver Captura de la Página Actual"
      },
      notifications: {
        noArchiveFound: "No se encontró archivo - {{domain}}",
        errorFetching: "Error al obtener captura histórica"
      }
    },
    fr: {
      contextMenu: {
        viewSnapshot: "Voir la Capture Historique",
        viewCurrentSnapshot: "Voir la Capture de la Page Actuelle"
      },
      notifications: {
        noArchiveFound: "Aucune archive trouvée - {{domain}}",
        errorFetching: "Erreur lors de la récupération de la capture historique"
      }
    },
    de: {
      contextMenu: {
        viewSnapshot: "Historischen Schnappschuss Anzeigen",
        viewCurrentSnapshot: "Schnappschuss der Aktuellen Seite Anzeigen"
      },
      notifications: {
        noArchiveFound: "Kein Archiv gefunden - {{domain}}",
        errorFetching: "Fehler beim Abrufen des historischen Schnappschusses"
      }
    },
    ja: {
      contextMenu: {
        viewSnapshot: "履歴スナップショットを表示",
        viewCurrentSnapshot: "現在のページのスナップショットを表示"
      },
      notifications: {
        noArchiveFound: "アーカイブが見つかりません - {{domain}}",
        errorFetching: "履歴スナップショットの取得エラー"
      }
    },
    ko: {
      contextMenu: {
        viewSnapshot: "역사 스냅샷 보기",
        viewCurrentSnapshot: "현재 페이지 스냅샷 보기"
      },
      notifications: {
        noArchiveFound: "아카이브를 찾을 수 없습니다 - {{domain}}",
        errorFetching: "역사 스냅샷 가져오기 오류"
      }
    },
    it: {
      contextMenu: {
        viewSnapshot: "Visualizza Istantanea Storica",
        viewCurrentSnapshot: "Visualizza Istantanea della Pagina Corrente"
      },
      notifications: {
        noArchiveFound: "Nessun archivio trovato - {{domain}}",
        errorFetching: "Errore nel recupero dell'istantanea storica"
      }
    },
    pt: {
      contextMenu: {
        viewSnapshot: "Ver Captura Histórica",
        viewCurrentSnapshot: "Ver Captura da Página Atual"
      },
      notifications: {
        noArchiveFound: "Nenhum arquivo encontrado - {{domain}}",
        errorFetching: "Erro ao buscar captura histórica"
      }
    },
    ru: {
      contextMenu: {
        viewSnapshot: "Просмотреть Исторический Снимок",
        viewCurrentSnapshot: "Просмотреть Снимок Текущей Страницы"
      },
      notifications: {
        noArchiveFound: "Архив не найден - {{domain}}",
        errorFetching: "Ошибка получения исторического снимка"
      }
    }
  }
  return messages[lang as keyof typeof messages] || messages.zh
}

// Function to get latest snapshot (inline version for background script)
async function getLatestSnapshot(url: string): Promise<{ url: string; timestamp: string; status: string; originalUrl: string } | null> {
  try {
    const response = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: WaybackResponse = await response.json();
    
    if (data.archived_snapshots.closest?.url) {
      return {
        url: data.archived_snapshots.closest.url,
        timestamp: data.archived_snapshots.closest.timestamp,
        status: data.archived_snapshots.closest.status,
        originalUrl: url
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Wayback snapshot:', error);
    return null;
  }
}

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  
  const lang = await getLanguage()
  const messages = getMessages(lang)
  
  chrome.contextMenus.create({
    id: "view-wayback-snapshot",
    title: messages.contextMenu.viewSnapshot,
    contexts: ["link"]
  });

  chrome.contextMenus.create({
    id: "view-current-wayback",
    title: messages.contextMenu.viewCurrentSnapshot,
    contexts: ["page"]
  });
  
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  
  if (!tab?.id) {
    return;
  }

  let targetUrl: string;

  if (info.menuItemId === "view-wayback-snapshot" && info.linkUrl) {
    targetUrl = info.linkUrl;
  } else if (info.menuItemId === "view-current-wayback" && info.pageUrl) {
    targetUrl = info.pageUrl;
  } else {
    return;
  }

  // Get Wayback Machine snapshot
  getWaybackSnapshotAndOpen(targetUrl, tab.id);
});

// Function to get Wayback Machine snapshot and open it
async function getWaybackSnapshotAndOpen(url: string, tabId: number) {
  try {
    const snapshot = await getLatestSnapshot(url);
    const lang = await getLanguage()
    const messages = getMessages(lang)

    if (snapshot) {
      // Open the snapshot in a new tab
      chrome.tabs.create({
        url: snapshot.url,
        index: (await chrome.tabs.get(tabId)).index + 1
      });
    } else {
      // Show notification when no snapshot is found
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "assets/icon.png",
        title: "LinkTime Machine",
        message: messages.notifications.noArchiveFound.replace('{{domain}}', getDomainFromUrl(url))
      });
    }
  } catch (error) {
    console.error("Error fetching Wayback snapshot:", error);
    const lang = await getLanguage()
    const messages = getMessages(lang)
    
    chrome.notifications?.create({
      type: "basic",
      iconUrl: "assets/icon.png", 
      title: "LinkTime Machine",
      message: messages.notifications.errorFetching
    });
  }
}

// Helper function to extract domain from URL for cleaner notifications
function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}