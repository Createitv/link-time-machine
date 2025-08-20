import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isValidUrl, normalizeUrl, formatWaybackTimestamp } from "~utils/wayback";
import { getSupportedLanguages, setLanguage } from "~i18n/utils";

export const WaybackMachine = () => {
  const { t, i18n } = useTranslation();
  const [url, setUrl] = useState("");
  const [currentTabUrl, setCurrentTabUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Language change handler
  const handleLanguageChange = async (langCode: string) => {
    await setLanguage(langCode);
    await i18n.changeLanguage(langCode);
  };

  // Get current tab URL when popup opens
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        // Filter out chrome:// and extension:// URLs
        if (!tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('chrome-extension://') &&
          !tab.url.startsWith('moz-extension://') &&
          !tab.url.startsWith('edge://')) {
          setCurrentTabUrl(tab.url);
        }
      }
    });
  }, []);

  const handleSearch = async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      setError(t("messages.pleaseEnterUrl"));
      return;
    }

    if (!isValidUrl(targetUrl)) {
      setError(t("messages.pleaseEnterValidUrl"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const normalizedUrl = normalizeUrl(targetUrl);

      // Direct API call instead of using utility function
      const response = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(normalizedUrl)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.archived_snapshots.closest?.url) {
        // Open snapshot in new tab
        chrome.tabs.create({ url: data.archived_snapshots.closest.url });
        setSuccess(t("messages.foundSnapshot", { date: formatWaybackTimestamp(data.archived_snapshots.closest.timestamp) }));
      } else {
        // 如果没有找到，尝试主域名
        try {
          const url = new URL(normalizedUrl);
          const domain = `${url.protocol}//${url.hostname}`;

          const domainResponse = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(domain)}`);

          if (domainResponse.ok) {
            const domainData = await domainResponse.json();

            if (domainData.archived_snapshots.closest?.url) {
              chrome.tabs.create({ url: domainData.archived_snapshots.closest.url });
              setSuccess(t("messages.foundDomainSnapshot", { date: formatWaybackTimestamp(domainData.archived_snapshots.closest.timestamp) }));
            } else {
              setError(t("messages.noArchiveFound"));
            }
          } else {
            setError(t("messages.noPageArchiveFound"));
          }
        } catch (domainError) {
          console.error('Error trying domain fallback:', domainError);
          setError(t("messages.noPageArchiveFound"));
        }
      }
    } catch (err) {
      console.error('Error in handleSearch:', err);
      setError(t("messages.errorFetching", { error: err instanceof Error ? err.message : t("messages.unknownError") }));
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentTab = () => {
    if (currentTabUrl) {
      handleSearch(currentTabUrl);
    } else {
      setError(t("messages.cannotGetCurrentUrl"));
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  return (
    <div className="plasmo-extension-root plasmo-w-96 plasmo-p-6 plasmo-bg-white plasmo-text-gray-900 plasmo-min-h-[400px]">
      {/* Header */}
      <div className="plasmo-mb-6 plasmo-text-center">
        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-mb-2">
          <h1 className="plasmo-text-xl plasmo-font-bold plasmo-text-black">
            {t("app.title")}
          </h1>
          {/* Language switcher */}
          <select
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="plasmo-text-xs plasmo-border plasmo-border-gray-300 plasmo-rounded plasmo-px-2 plasmo-py-1"
          >
            {getSupportedLanguages().map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
        <p className="plasmo-text-sm plasmo-text-gray-600 plasmo-leading-relaxed">
          {t("app.description")}
        </p>
      </div>

      {/* Current Tab Section */}
      {currentTabUrl && (
        <div className="plasmo-mb-6 plasmo-card plasmo-card-hover plasmo-p-4">
          <div className="plasmo-flex plasmo-items-center plasmo-mb-3">
            <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-green-500 plasmo-rounded-full plasmo-mr-2"></div>
            <h3 className="plasmo-text-sm plasmo-font-semibold plasmo-text-black">
              {t("currentTab.title")}
            </h3>
          </div>
          <p className="plasmo-text-xs plasmo-text-gray-600 plasmo-mb-4 plasmo-break-all plasmo-bg-gray-50 plasmo-p-2 plasmo-rounded">
            {(() => {
              try {
                return new URL(currentTabUrl).hostname;
              } catch {
                return currentTabUrl;
              }
            })()}
          </p>
          <button
            onClick={handleCurrentTab}
            disabled={loading}
            className="plasmo-btn-primary plasmo-w-full plasmo-text-sm"
          >
            {loading ? (
              <>
                <svg className="plasmo-animate-spin plasmo--ml-1 plasmo-mr-2 plasmo-h-4 plasmo-w-4 plasmo-text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="plasmo-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="plasmo-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("messages.searching")}
              </>
            ) : (
              t("currentTab.button")
            )}
          </button>
        </div>
      )}

      {/* URL Input Section */}
      <div className="plasmo-mb-6">
        <label className="plasmo-block plasmo-text-sm plasmo-font-semibold plasmo-text-black plasmo-mb-3">
          {t("urlInput.label")}
        </label>
        <div className="plasmo-flex plasmo-gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); clearMessages(); }}
            placeholder={t("urlInput.placeholder")}
            className="plasmo-input-primary plasmo-flex-1 plasmo-text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(url)}
          />
          <button
            onClick={() => handleSearch(url)}
            disabled={loading || !url.trim()}
            className="plasmo-btn-primary plasmo-text-sm plasmo-shrink-0"
          >
            {t("urlInput.button")}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="plasmo-mb-4 plasmo-p-3 plasmo-text-sm plasmo-text-red-800 plasmo-bg-red-50 
                      plasmo-border plasmo-border-red-200 plasmo-rounded-lg plasmo-flex plasmo-items-center">
          <svg className="plasmo-w-4 plasmo-h-4 plasmo-mr-2 plasmo-flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="plasmo-mb-4 plasmo-p-3 plasmo-text-sm plasmo-text-green-800 plasmo-bg-green-50 
                      plasmo-border plasmo-border-green-200 plasmo-rounded-lg plasmo-flex plasmo-items-center">
          <svg className="plasmo-w-4 plasmo-h-4 plasmo-mr-2 plasmo-flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      {/* Instructions */}
      <div className="plasmo-text-xs plasmo-text-gray-500 plasmo-leading-relaxed plasmo-bg-gray-50 plasmo-p-4 plasmo-rounded-lg">
        <p className="plasmo-mb-2 plasmo-font-medium plasmo-text-gray-700">
          {t("instructions.title")}
        </p>
        <ul className="plasmo-space-y-1 plasmo-ml-2">
          <li className="plasmo-flex plasmo-items-start">
            <span className="plasmo-w-1 plasmo-h-1 plasmo-bg-gray-400 plasmo-rounded-full plasmo-mt-2 plasmo-mr-2 plasmo-flex-shrink-0"></span>
            {t("instructions.rightClickLink")}
          </li>
          <li className="plasmo-flex plasmo-items-start">
            <span className="plasmo-w-1 plasmo-h-1 plasmo-bg-gray-400 plasmo-rounded-full plasmo-mt-2 plasmo-mr-2 plasmo-flex-shrink-0"></span>
            {t("instructions.rightClickPage")}
          </li>
          <li className="plasmo-flex plasmo-items-start">
            <span className="plasmo-w-1 plasmo-h-1 plasmo-bg-gray-400 plasmo-rounded-full plasmo-mt-2 plasmo-mr-2 plasmo-flex-shrink-0"></span>
            {t("instructions.enterUrl")}
          </li>
        </ul>
      </div>
    </div>
  );
};