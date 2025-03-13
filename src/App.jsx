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
  const [themeMode, setThemeMode] = useState(
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  // Listen for theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleThemeChange = (e) => {
      setThemeMode(e.matches ? 'dark' : 'light');
      
      // Force re-render of input elements to update placeholder colors
      const inputs = document.querySelectorAll('.input-field');
      inputs.forEach(input => {
        // Clone and replace the element to force a re-render
        const parent = input.parentNode;
        const clone = input.cloneNode(true);
        parent.replaceChild(clone, input);
        
        // Restore event listeners and values
        if (clone.id === 'pattern') {
          clone.value = pattern;
          clone.addEventListener('input', (e) => setPattern(e.target.value));
        } else if (clone.id === 'flags') {
          clone.value = flags;
          clone.addEventListener('input', (e) => setFlags(e.target.value));
        } else if (clone.id === 'testString') {
          clone.value = testString;
          clone.addEventListener('input', (e) => setTestString(e.target.value));
        }
      });
    };
    
    mediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [pattern, flags, testString]);

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
          highlighted += `<span class="match-highlight">${match.fullMatch}</span>`;
          
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
    <div className="min-h-screen bg-theme text-theme p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Regex Playground</h1>
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Pattern Input */}
          <div className="card">
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
                  className="input-field w-full"
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
                  className="input-field w-24"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              <button 
                onClick={saveCurrentPattern}
                disabled={!pattern}
                className="btn btn-primary disabled:opacity-50 disabled:bg-muted"
              >
                Save Pattern
              </button>
              <button 
                onClick={() => setShowExamples(!showExamples)}
                className="btn btn-secondary"
              >
                {showExamples ? "Hide Examples" : "Show Examples"}
              </button>
              
              {pattern && (
                <div className="flex-1 flex items-center gap-2 justify-end">
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
                    <span className="text-success text-xs ml-2 font-medium">{copySuccess}</span>
                  )}
                </div>
              )}
            </div>
            
            {error && (
              <div className="text-danger text-sm mt-2">
                Error: {error}
              </div>
            )}
          </div>
          
          {/* Examples and Saved Patterns */}
          {showExamples && (
            <div className="card animate-fadeIn">
              <h2 className="text-xl font-semibold mb-3">Example Patterns</h2>
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
                      <div key={index} className="list-item">
                        <div>
                          <div className="font-medium">{saved.name}</div>
                          <div className="text-sm text-muted font-mono">{saved.pattern}</div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => loadPattern(saved)}
                            className="btn btn-primary"
                          >
                            Load
                          </button>
                          <button 
                            onClick={() => deletePattern(index)}
                            className="btn btn-danger"
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
          <div className="card">
            <label htmlFor="testString" className="block text-sm font-medium mb-1">
              Test String
            </label>
            <textarea
              id="testString"
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Enter text to test against the regex..."
              rows={5}
              className="input-field w-full"
            />
          </div>
          
          {/* Highlighted Text */}
          {testString && (
            <div className="card animate-fadeIn">
              <h2 className="text-xl font-semibold mb-3">Highlighted Matches</h2>
              <div 
                className="bg-input p-3 rounded whitespace-pre-wrap font-mono"
                dangerouslySetInnerHTML={{ __html: highlightedText }}
              />
            </div>
          )}
          
          {/* Results */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-3">Results</h2>
            
            {matches.length === 0 ? (
              <p className="text-muted">No matches found</p>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-secondary mb-2">
                  Found {matches.length} match{matches.length !== 1 ? "es" : ""}
                </div>
                
                {matches.map((match, index) => (
                  <div key={index} className="result-item">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Regex Cheat Sheet */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-3">Regex Cheat Sheet</h2>
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
        </div>
      </div>
    </div>
  );
}

export default App;
