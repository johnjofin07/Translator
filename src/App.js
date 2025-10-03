import React, { useState } from "react";
import "./index.css";

const TranslationComponent = () => {
  const [inputText, setInputText] = useState("");
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const languages = [
    { code: "es", name: "Spanish" },
    { code: "da", name: "Danish" },
    { code: "nl", name: "Dutch" },
    { code: "sv", name: "Swedish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "zh-Hans", name: "Chinese (Simplified)" },
  ];

  const translateText = async () => {
    if (!inputText) {
      setError("Please enter text to translate");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use plain text format
      const textsToTranslate = { text: inputText };

      // Get authentication token
      const tokenResponse = await fetch(
        "https://edge.microsoft.com/translate/auth",
        {
          method: "GET",
        }
      );

      if (!tokenResponse.ok) {
        throw new Error("Failed to get authentication token");
      }

      const authToken = await tokenResponse.text();

      // Create translation requests for all languages and all text entries
      const allTranslations = {};

      for (const lang of languages) {
        allTranslations[lang.code] = { name: lang.name, entries: {} };

        // Prepare all texts for this language
        const textsArray = Object.entries(textsToTranslate).map(([_, value]) => ({
          Text: value
        }));

        // Send batch request for all texts in this language
        const response = await fetch(
          `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=${lang.code}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(textsArray),
          }
        );

        if (!response.ok) {
          throw new Error(`Translation failed for ${lang.name}`);
        }

        const data = await response.json();

        // Map the translated texts back to their keys
        const keys = Object.keys(textsToTranslate);
        keys.forEach((key, index) => {
          allTranslations[lang.code].entries[key] = data[index].translations[0].text;
        });
      }

      setTranslations(allTranslations);
    } catch (err) {
      setError(
        "Translation failed. The service might be temporarily unavailable."
      );
      console.error("Translation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div>
        <textarea
          className="w-full p-2 border rounded-md min-h-[12rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter English text to translate..."
        />
      </div>

      <div className="flex items-center gap-4 my-4">
        <button
          type="button"
          onClick={translateText}
          disabled={isLoading}
          className={`px-4 py-2 text-white rounded-md ${isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gray-900	 hover:bg-gray-600"
            }`}
        >
          {isLoading ? "Translating..." : "Translate to All Languages"}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {Object.keys(translations).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className="p-4 bg-gray-50 rounded-md border border-gray-200 shadow-sm relative"
            >
              <button
                type="button"
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-gray-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const translatedText = translations[lang.code]?.entries?.text || '';
                  // Add language code as the first line of the translated block
                  const textToCopy = lang.code + '\n' + translatedText;
                  navigator.clipboard.writeText(textToCopy);
                  const tooltip = e.currentTarget.querySelector('.tooltip');
                  if (tooltip) {
                    tooltip.classList.remove('hidden');
                    setTimeout(() => tooltip.classList.add('hidden'), 1500);
                  }
                }}
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                <span className="tooltip hidden absolute -top-8 -left-2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">Copied!</span>
              </button>
              <h3 className="font-medium mb-2">{lang.name} ({lang.code}):</h3>
              <div className="bg-white p-2 rounded">
                <p>{translations[lang.code]?.entries?.text || ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Multi-Language Translator</h1>
      <TranslationComponent />
    </div>
  );
}

export default App;
export { TranslationComponent };
