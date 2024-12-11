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

      // Create translation requests for all languages
      const translationPromises = languages.map(async (lang) => {
        const response = await fetch(
          `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=${lang.code}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify([{ Text: inputText }]),
          }
        );

        if (!response.ok) {
          throw new Error(`Translation failed for ${lang.name}`);
        }

        const data = await response.json();
        return {
          code: lang.code,
          name: lang.name,
          text: data[0].translations[0].text,
        };
      });

      // Wait for all translations to complete
      const results = await Promise.all(translationPromises);

      // Convert results to an object
      const newTranslations = {};
      results.forEach((result) => {
        newTranslations[result.code] = {
          name: result.name,
          text: result.text,
        };
      });

      setTranslations(newTranslations);
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
          className="w-full p-2 border rounded-md min-h-[6rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className={`px-4 py-2 text-white rounded-md ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gray-900	 hover:bg-gray-600"
          }`}
        >
          {isLoading ? "Translating..." : "Translate to All Languages"}
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {Object.keys(translations).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
        >
          {languages.map((lang) => (
            <div
            key={lang.code}
            className="p-4 bg-gray-50 rounded-md border border-gray-200 shadow-sm"
            onClick={async()=>{
              await navigator.clipboard.writeText(translations[lang.code]?.text)
            }}
            >
              <h3 className="font-medium mb-2">{lang.name} ({lang.code}):</h3>
              <p>{translations[lang.code]?.text}</p>
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
