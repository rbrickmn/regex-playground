import React, { useState, useEffect } from "react";

// Predefined example patterns
const EXAMPLE_PATTERNS = [
  {
    name: "Email Address",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    testString: "Contact us at support@example.com or sales@company.co.uk for more information."
  },
  {
    name: "URL",
    pattern: "https?://[\\w-]+(\\.[\\w-]+)+([\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])?",
    flags: "g",
    testString: "Visit our website at https://www.example.com or http://subdomain.example.org/path?query=123"
  },
  {
    name: "Phone Number (US)",
    pattern: "\\(\\d{3}\\)\\s?\\d{3}-\\d{4}|\\d{3}-\\d{3}-\\d{4}",
    flags: "g",
    testString: "Call us at (123) 456-7890 or 987-654-3210 for customer support."
  },
  {
    name: "Date (MM/DD/YYYY)",
    pattern: "(0?[1-9]|1[0-2])/(0?[1-9]|[12]\\d|3[01])/\\d{4}",
    flags: "g",
    testString: "The event is scheduled for 12/25/2023, with registration closing on 11/15/2023."
  },
  {
    name: "HTML Tag",
    pattern: "<([a-z]+)([^<]+)*(?:>(.*?)</\\1>|\\s+/>)",
    flags: "g",
    testString: "<div class=\"container\">This is a <span>sample</span> text with <img src=\"image.jpg\" /></div>"
  }
];

function App() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [highlightedText, setHighlightedText] = useState("");
  const [savedPatterns, setSavedPatterns] = useState(() => {
    const saved = localStorage.getItem("savedPatterns");
    return saved ? JSON.parse(saved) : [];
  });
  const [showExamples, setShowExamples] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");

  // Save patterns to localStorage when they change
  useEffect(() => {
    localStorage.setItem("savedPatterns", JSON.stringify(savedPatterns));
  }, [savedPatterns]);

  useEffect(() => {
    if (!pattern || !testString) {
      setMatches([]);
      setError(null);
      setHighlightedText(testString);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const results = [];
      let match;

      if (flags.includes("g")) {
        // Global flag - find all matches
        while ((match = regex.exec(testString)) !== null) {
          results.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
            input: match.input,
          });
        }
      } else {
        // Non-global - find first match only
        match = regex.exec(testString);
        if (match) {
          results.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
            input: match.input,
          });
        }
      }

      setMatches(results);
      setError(null);
      
      // Create highlighted text
      if (results.length > 0) {
        // Sort matches by index to ensure proper highlighting
        const sortedMatches = [...results].sort((a, b) => a.index - b.index);
        
        let lastIndex = 0;
        let highlighted = "";
        
        sortedMatches.forEach((match) => {
          // Add text before the match
          highlighted += testString.substring(lastIndex, match.index);
          
          // Add the highlighted match
          highlighted += `<span class="bg-green-500/30 text-white font-medium">${match.fullMatch}</span>`;
          
          // Update the last index
          lastIndex = match.index + match.fullMatch.length;
        });
        
        // Add any remaining text
        highlighted += testString.substring(lastIndex);
        
        setHighlightedText(highlighted);
      } else {
        setHighlightedText(testString);
      }
    } catch (err) {
      setError(err.message);
      setMatches([]);
      setHighlightedText(testString);
    }
  }, [pattern, flags, testString]);

  const saveCurrentPattern = () => {
    if (!pattern) return;
    
    const patternName = prompt("Enter a name for this pattern:");
    if (!patternName) return;
    
    const newPattern = {
      name: patternName,
      pattern,
      flags,
      testString
    };
    
    setSavedPatterns([...savedPatterns, newPattern]);
  };

  const loadPattern = (savedPattern) => {
    setPattern(savedPattern.pattern);
    setFlags(savedPattern.flags);
    setTestString(savedPattern.testString);
    setShowExamples(false);
  };

  const deletePattern = (index) => {
    if (confirm("Are you sure you want to delete this pattern?")) {
      const newPatterns = [...savedPatterns];
      newPatterns.splice(index, 1);
      setSavedPatterns(newPatterns);
    }
  };

  const copyToClipboard = (format) => {
    let textToCopy = "";
    
    switch (format) {
      case 'js':
        textToCopy = `const regex = /${pattern}/${flags};`;
        break;
      case 'python':
        textToCopy = `import re\npattern = r'${pattern}'\nregex = re.compile(pattern${flags.includes('g') ? '' : ', re.DOTALL' }${flags.includes('i') ? ', re.IGNORECASE' : ''}${flags.includes('m') ? ', re.MULTILINE' : ''})`;
        break;
      case 'php':
        textToCopy = `$pattern = '/${pattern}/${flags}';`;
        break;
      case 'raw':
      default:
        textToCopy = pattern;
    }
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopySuccess(`Copied ${format.toUpperCase()} format!`);
        setTimeout(() => setCopySuccess(""), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setCopySuccess("Copy failed");
        setTimeout(() => setCopySuccess(""), 2000);
      });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Regex Playground</h1>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Pattern Input */}
          <div className="bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="pattern" className="block text-sm font-medium mb-1">
                  Pattern
                </label>
                <input
                  id="pattern"
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter regex pattern..."
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
              
              <div>
                <label htmlFor="flags" className="block text-sm font-medium mb-1">
                  Flags
                </label>
                <input
                  id="flags"
                  type="text"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  placeholder="g, i, m..."
                  className="w-24 bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <button 
                onClick={saveCurrentPattern}
                disabled={!pattern}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:opacity-50 rounded text-sm cursor-pointer transition-colors duration-200 hover:shadow-md"
              >
                Save Pattern
              </button>
              <button 
                onClick={() => setShowExamples(!showExamples)}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm cursor-pointer transition-colors duration-200 hover:shadow-md"
              >
                {showExamples ? "Hide Examples" : "Show Examples"}
              </button>
              
              {pattern && (
                <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className="text-sm">Copy as:</span>
                  <button 
                    onClick={() => copyToClipboard('raw')}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs cursor-pointer transition-colors duration-200 hover:shadow-md"
                  >
                    Raw
                  </button>
                  <button 
                    onClick={() => copyToClipboard('js')}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs cursor-pointer transition-colors duration-200 hover:shadow-md"
                  >
                    JavaScript
                  </button>
                  <button 
                    onClick={() => copyToClipboard('python')}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs cursor-pointer transition-colors duration-200 hover:shadow-md"
                  >
                    Python
                  </button>
                  <button 
                    onClick={() => copyToClipboard('php')}
                    className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs cursor-pointer transition-colors duration-200 hover:shadow-md"
                  >
                    PHP
                  </button>
                  
                  {copySuccess && (
                    <span className="text-green-400 text-xs ml-2">{copySuccess}</span>
                  )}
                </div>
              )}
            </div>
            
            {error && (
              <div className="text-red-400 text-sm mt-2">
                Error: {error}
              </div>
            )}
          </div>
          
          {/* Examples and Saved Patterns */}
          {showExamples && (
            <div className="bg-slate-800 rounded-lg p-4 shadow-lg animate-fadeIn">
              <h2 className="text-xl font-semibold mb-3">Example Patterns</h2>
              <div className="grid grid-cols-1 gap-2">
                {EXAMPLE_PATTERNS.map((example, index) => (
                  <div key={index} className="bg-slate-700 p-2 rounded flex justify-between items-center hover:bg-slate-650 transition-colors duration-200">
                    <div>
                      <div className="font-medium">{example.name}</div>
                      <div className="text-sm text-slate-400 font-mono">{example.pattern}</div>
                    </div>
                    <button 
                      onClick={() => loadPattern(example)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm cursor-pointer transition-colors duration-200 hover:shadow-md"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
              
              {savedPatterns.length > 0 && (
                <>
                  <h2 className="text-xl font-semibold mt-6 mb-3">Your Saved Patterns</h2>
                  <div className="grid grid-cols-1 gap-2">
                    {savedPatterns.map((saved, index) => (
                      <div key={index} className="bg-slate-700 p-2 rounded flex justify-between items-center hover:bg-slate-650 transition-colors duration-200">
                        <div>
                          <div className="font-medium">{saved.name}</div>
                          <div className="text-sm text-slate-400 font-mono">{saved.pattern}</div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => loadPattern(saved)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm cursor-pointer transition-colors duration-200 hover:shadow-md"
                          >
                            Load
                          </button>
                          <button 
                            onClick={() => deletePattern(index)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm cursor-pointer transition-colors duration-200 hover:shadow-md"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Test String Input */}
          <div className="bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl">
            <label htmlFor="testString" className="block text-sm font-medium mb-1">
              Test String
            </label>
            <textarea
              id="testString"
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter text to test against the regex..."
              rows={5}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
          
          {/* Highlighted Text */}
          {testString && (
            <div className="bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 animate-fadeIn">
              <h2 className="text-xl font-semibold mb-3">Highlighted Matches</h2>
              <div 
                className="bg-slate-700 p-3 rounded whitespace-pre-wrap font-mono"
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
            </div>
          )}
          
          {/* Results */}
          <div className="bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl">
            <h2 className="text-xl font-semibold mb-3">Results</h2>
            
            {matches.length === 0 ? (
              <p className="text-slate-400">No matches found</p>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-slate-300 mb-2">
                  Found {matches.length} match{matches.length !== 1 ? "es" : ""}
                </div>
                
                {matches.map((match, index) => (
                  <div key={index} className="bg-slate-700 rounded p-3 transition-all duration-200 hover:translate-x-1">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Match {index + 1}</span>
                      <span className="text-sm text-slate-400">Index: {match.index}</span>
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-sm text-slate-400 mb-1">Full Match:</div>
                      <div className="bg-slate-600 p-2 rounded font-mono text-green-400">
                        {match.fullMatch}
                      </div>
                    </div>
                    
                    {match.groups.length > 0 && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Capture Groups:</div>
                        <div className="space-y-2">
                          {match.groups.map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-slate-600 p-2 rounded font-mono text-blue-400">
                              Group {groupIndex + 1}: {group}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Regex Cheat Sheet */}
        <div className="bg-slate-800 rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl">
          <h2 className="text-xl font-semibold mb-3">Regex Cheat Sheet</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-blue-400 mb-1">Character Classes</h3>
              <ul className="space-y-1">
                <li><code className="bg-slate-700 px-1 rounded">\d</code> - Digit (0-9)</li>
                <li><code className="bg-slate-700 px-1 rounded">\w</code> - Word character (a-z, A-Z, 0-9, _)</li>
                <li><code className="bg-slate-700 px-1 rounded">\s</code> - Whitespace</li>
                <li><code className="bg-slate-700 px-1 rounded">.</code> - Any character except newline</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-1">Quantifiers</h3>
              <ul className="space-y-1">
                <li><code className="bg-slate-700 px-1 rounded">*</code> - 0 or more</li>
                <li><code className="bg-slate-700 px-1 rounded">+</code> - 1 or more</li>
                <li><code className="bg-slate-700 px-1 rounded">?</code> - 0 or 1</li>
                <li><code className="bg-slate-700 px-1 rounded">{"{n}"}</code> - Exactly n times</li>
                <li><code className="bg-slate-700 px-1 rounded">{"{n,m}"}</code> - Between n and m times</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-1">Flags</h3>
              <ul className="space-y-1">
                <li><code className="bg-slate-700 px-1 rounded">g</code> - Global (find all matches)</li>
                <li><code className="bg-slate-700 px-1 rounded">i</code> - Case-insensitive</li>
                <li><code className="bg-slate-700 px-1 rounded">m</code> - Multiline</li>
                <li><code className="bg-slate-700 px-1 rounded">s</code> - Dot matches newlines</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-400 mb-1">Groups & Assertions</h3>
              <ul className="space-y-1">
                <li><code className="bg-slate-700 px-1 rounded">(abc)</code> - Capture group</li>
                <li><code className="bg-slate-700 px-1 rounded">(?:abc)</code> - Non-capturing group</li>
                <li><code className="bg-slate-700 px-1 rounded">^</code> - Start of string/line</li>
                <li><code className="bg-slate-700 px-1 rounded">$</code> - End of string/line</li>
                <li><code className="bg-slate-700 px-1 rounded">\b</code> - Word boundary</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
