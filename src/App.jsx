import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

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

// Add a debounce utility function at the top of the file
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

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
  const [themeMode, setThemeMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );
  
  // Create refs for input elements
  const patternInputRef = useRef(null);
  const flagsInputRef = useRef(null);
  const testStringInputRef = useRef(null);

  // Memoize event handlers
  const handlePatternChange = useCallback((e) => setPattern(e.target.value), []);
  const handleFlagsChange = useCallback((e) => setFlags(e.target.value), []);
  const handleTestStringChange = useCallback((e) => setTestString(e.target.value), []);

  // Add debounced state variables for performance
  const [debouncedPattern, setDebouncedPattern] = useState("");
  const [debouncedFlags, setDebouncedFlags] = useState("g");
  const [debouncedTestString, setDebouncedTestString] = useState("");

  // Debounce the input changes
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedPattern(pattern);
      setDebouncedFlags(flags);
      setDebouncedTestString(testString);
    }, 300); // 300ms debounce time
    
    return () => clearTimeout(timerId);
  }, [pattern, flags, testString]);

  // Listen for theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e) => {
      setThemeMode(e.matches ? 'dark' : 'light');
      
      // Force a re-render of the component to update placeholder colors
      // This is more React-friendly than direct DOM manipulation
      document.documentElement.style.setProperty('--force-refresh', Date.now());
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Save patterns to localStorage when they change
  useEffect(() => {
    localStorage.setItem("savedPatterns", JSON.stringify(savedPatterns));
  }, [savedPatterns]);

  // Memoize regex results to prevent unnecessary recalculations
  const { computedMatches, computedError, computedHighlightedText } = useMemo(() => {
    if (!debouncedPattern || !debouncedTestString) {
      return { 
        computedMatches: [], 
        computedError: null, 
        computedHighlightedText: debouncedTestString 
      };
    }

    try {
      const regex = new RegExp(debouncedPattern, debouncedFlags);
      const results = [];
      let match;

      if (debouncedFlags.includes("g")) {
        // Global flag - find all matches
        while ((match = regex.exec(debouncedTestString)) !== null) {
          results.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
            input: match.input,
          });
        }
      } else {
        // Non-global - find first match only
        match = regex.exec(debouncedTestString);
        if (match) {
          results.push({
            fullMatch: match[0],
            groups: match.slice(1),
            index: match.index,
            input: match.input,
          });
        }
      }
      
      // Create highlighted text
      let highlightedText = debouncedTestString;
      
      if (results.length > 0) {
        // Sort matches by index to ensure proper highlighting
        const sortedMatches = [...results].sort((a, b) => a.index - b.index);
        
        let lastIndex = 0;
        let highlighted = "";
        
        sortedMatches.forEach((match) => {
          // Add text before the match
          highlighted += debouncedTestString.substring(lastIndex, match.index);
          
          // Add the highlighted match
          highlighted += `<span class="match-highlight">${match.fullMatch}</span>`;
          
          // Update the last index
          lastIndex = match.index + match.fullMatch.length;
        });
        
        // Add any remaining text
        highlighted += debouncedTestString.substring(lastIndex);
        
        highlightedText = highlighted;
      }

      return { 
        computedMatches: results, 
        computedError: null, 
        computedHighlightedText: highlightedText 
      };
    } catch (err) {
      return { 
        computedMatches: [], 
        computedError: err.message, 
        computedHighlightedText: debouncedTestString 
      };
    }
  }, [debouncedPattern, debouncedFlags, debouncedTestString]);

  // Update state with memoized values
  useEffect(() => {
    setMatches(computedMatches);
    setError(computedError);
    setHighlightedText(computedHighlightedText);
  }, [computedMatches, computedError, computedHighlightedText]);

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

  // Memoize the copyToClipboard function
  const copyToClipboard = useCallback((format) => {
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
  }, [pattern, flags]);

  return (
    <div className="min-h-screen bg-theme text-theme p-6">
      {/* Skip to main content link for keyboard users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-accent-color focus:text-white focus:rounded">
        Skip to main content
      </a>
      
      <div className="max-w-4xl mx-auto">
        <header>
          <h1 className="text-3xl font-bold mb-6 text-center">Regex Playground</h1>
        </header>
        
        <main id="main-content">
          <div className="grid grid-cols-1 gap-6 mb-8">
            {/* Pattern Input */}
            <section className="card" aria-labelledby="pattern-section-title">
              <h2 id="pattern-section-title" className="sr-only">Regex Pattern Input</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <label htmlFor="pattern" className="block text-sm font-medium mb-1">
                    Pattern
                  </label>
                  <input
                    id="pattern"
                    type="text"
                    value={pattern}
                    onChange={handlePatternChange}
                    placeholder="Enter regex pattern..."
                    className="input-field w-full"
                    ref={patternInputRef}
                    aria-describedby={error ? "pattern-error" : undefined}
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
                    onChange={handleFlagsChange}
                    placeholder="g, i, m..."
                    className="input-field w-24"
                    ref={flagsInputRef}
                    aria-describedby="flags-help"
                  />
                  <span id="flags-help" className="sr-only">Valid flags are g for global, i for case insensitive, m for multiline, and s for dot matches newlines</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <button 
                  onClick={saveCurrentPattern}
                  disabled={!pattern}
                  className="btn btn-primary disabled:opacity-50 disabled:bg-muted"
                  aria-disabled={!pattern}
                >
                  Save Pattern
                </button>
                <button 
                  onClick={() => setShowExamples(!showExamples)}
                  className="btn btn-secondary"
                  aria-expanded={showExamples}
                  aria-controls="examples-section"
                >
                  {showExamples ? "Hide Examples" : "Show Examples"}
                </button>
                
                {pattern && (
                  <div className="flex-1 flex items-center gap-2 justify-end" role="group" aria-label="Copy pattern in different formats">
                    <span className="text-sm">Copy as:</span>
                    <button 
                      onClick={() => copyToClipboard('raw')}
                      className="btn-small"
                    >
                      Raw
                    </button>
                    <button 
                      onClick={() => copyToClipboard('js')}
                      className="btn-small"
                    >
                      JavaScript
                    </button>
                    <button 
                      onClick={() => copyToClipboard('python')}
                      className="btn-small"
                    >
                      Python
                    </button>
                    <button 
                      onClick={() => copyToClipboard('php')}
                      className="btn-small"
                    >
                      PHP
                    </button>
                    
                    {copySuccess && (
                      <span className="text-success text-xs ml-2 font-medium" role="status" aria-live="polite">{copySuccess}</span>
                    )}
                  </div>
                )}
              </div>
              
              {error && (
                <div id="pattern-error" className="text-danger text-sm mt-2" role="alert">
                  Error: {error}
                </div>
              )}
            </section>
            
            {/* Examples and Saved Patterns */}
            {showExamples && (
              <section id="examples-section" className="card animate-fadeIn" aria-labelledby="examples-title">
                <h2 id="examples-title" className="text-xl font-semibold mb-3">Example Patterns</h2>
                <div className="grid grid-cols-1 gap-2">
                  {EXAMPLE_PATTERNS.map((example, index) => (
                    <div key={index} className="list-item">
                      <div>
                        <div className="font-medium">{example.name}</div>
                        <div className="text-sm text-muted font-mono">{example.pattern}</div>
                      </div>
                      <button 
                        onClick={() => loadPattern(example)}
                        className="btn btn-primary"
                        aria-label={`Load ${example.name} pattern`}
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
                
                {savedPatterns.length > 0 && (
                  <>
                    <h2 id="saved-patterns-title" className="text-xl font-semibold mt-6 mb-3">Your Saved Patterns</h2>
                    <div className="grid grid-cols-1 gap-2" aria-labelledby="saved-patterns-title">
                      {savedPatterns.map((saved, index) => (
                        <div key={index} className="list-item">
                          <div>
                            <div className="font-medium">{saved.name}</div>
                            <div className="text-sm text-muted font-mono">{saved.pattern}</div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => loadPattern(saved)}
                              className="btn btn-primary"
                              aria-label={`Load ${saved.name} pattern`}
                            >
                              Load
                            </button>
                            <button 
                              onClick={() => deletePattern(index)}
                              className="btn btn-danger"
                              aria-label={`Delete ${saved.name} pattern`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}
            
            {/* Test String Input */}
            <section className="card" aria-labelledby="test-string-title">
              <label id="test-string-title" htmlFor="testString" className="block text-sm font-medium mb-1">
                Test String
              </label>
              <textarea
                id="testString"
                value={testString}
                onChange={handleTestStringChange}
                placeholder="Enter text to test against the regex..."
                rows={5}
                className="input-field w-full"
                ref={testStringInputRef}
              />
            </section>
            
            {/* Highlighted Text */}
            {testString && (
              <section className="card animate-fadeIn" aria-labelledby="highlighted-title">
                <h2 id="highlighted-title" className="text-xl font-semibold mb-3">Highlighted Matches</h2>
                <div 
                  className="bg-input p-3 rounded whitespace-pre-wrap font-mono"
                  dangerouslySetInnerHTML={{ __html: highlightedText }}
                  aria-live="polite"
                  tabIndex={0}
                />
              </section>
            )}
            
            {/* Results */}
            <section className="card" aria-labelledby="results-title">
              <h2 id="results-title" className="text-xl font-semibold mb-3">Results</h2>
              
              {matches.length === 0 ? (
                <p className="text-muted" aria-live="polite">No matches found</p>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-secondary mb-2" aria-live="polite">
                    Found {matches.length} match{matches.length !== 1 ? "es" : ""}
                  </div>
                  
                  <ul className="space-y-4 list-none p-0">
                    {matches.map((match, index) => (
                      <li key={index} className="result-item">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Match {index + 1}</span>
                          <span className="text-sm text-muted">Index: {match.index}</span>
                        </div>
                        
                        <div className="mb-2">
                          <div className="text-sm text-muted mb-1">Full Match:</div>
                          <div className="code-block text-success">
                            {match.fullMatch}
                          </div>
                        </div>
                        
                        {match.groups.length > 0 && (
                          <div>
                            <div className="text-sm text-muted mb-1">Capture Groups:</div>
                            <div className="space-y-2">
                              {match.groups.map((group, groupIndex) => (
                                <div key={groupIndex} className="code-block text-info">
                                  Group {groupIndex + 1}: {group}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
          
          {/* Regex Cheat Sheet */}
          <section className="card" aria-labelledby="cheatsheet-title">
            <h2 id="cheatsheet-title" className="text-xl font-semibold mb-3">Regex Cheat Sheet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-info mb-1">Character Classes</h3>
                <ul className="space-y-1">
                  <li><code className="code-inline">\d</code> - Digit (0-9)</li>
                  <li><code className="code-inline">\w</code> - Word character (a-z, A-Z, 0-9, _)</li>
                  <li><code className="code-inline">\s</code> - Whitespace</li>
                  <li><code className="code-inline">.</code> - Any character except newline</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-info mb-1">Quantifiers</h3>
                <ul className="space-y-1">
                  <li><code className="code-inline">*</code> - 0 or more</li>
                  <li><code className="code-inline">+</code> - 1 or more</li>
                  <li><code className="code-inline">?</code> - 0 or 1</li>
                  <li><code className="code-inline">{"{n}"}</code> - Exactly n times</li>
                  <li><code className="code-inline">{"{n,m}"}</code> - Between n and m times</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-info mb-1">Flags</h3>
                <ul className="space-y-1">
                  <li><code className="code-inline">g</code> - Global (find all matches)</li>
                  <li><code className="code-inline">i</code> - Case-insensitive</li>
                  <li><code className="code-inline">m</code> - Multiline</li>
                  <li><code className="code-inline">s</code> - Dot matches newlines</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-info mb-1">Groups & Assertions</h3>
                <ul className="space-y-1">
                  <li><code className="code-inline">(abc)</code> - Capture group</li>
                  <li><code className="code-inline">(?:abc)</code> - Non-capturing group</li>
                  <li><code className="code-inline">^</code> - Start of string/line</li>
                  <li><code className="code-inline">$</code> - End of string/line</li>
                  <li><code className="code-inline">\b</code> - Word boundary</li>
                </ul>
              </div>
            </div>
          </section>
        </main>
        
        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-muted">
          <p>
            Created by <a href="https://github.com/rbrickmn" target="_blank" rel="noopener noreferrer" className="text-info hover:underline">Riley Brickman</a> | © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
