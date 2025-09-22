import React, { useEffect, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import {
  Home,
  Upload,
  ListChecks,
  FileText,
  Printer,
  Moon,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// =============================
// Types
// =============================
export type Rule = {
  id: number;
  name: string;
  category: string;
  regex?: string | null;
  pattern?: string | null;
  threshold?: number | null;
  description?: string;
};
export type UploadedFile = {
  name: string;
  size: number;
  type: string;
  ext: string;
  contentText?: string;
};
export type TestHit = { start: number; text: string };
export type TestResult = {
  id: number;
  name: string;
  category: string;
  regex: string;
  count: number;
  examples: string[];
};

// =============================
// Context + Hook
// =============================
const AppContext = createContext<any>(null);
export const useApp = () => useContext(AppContext);

function useAppState() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [sequence, setSequence] = useState<string>("");
  const [results, setResults] = useState<TestResult[]>([]);

  // ✅ Load theme from localStorage (default: light)
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // save preference
    localStorage.setItem("theme", theme);
  }, [theme]);


  return {
    rules,
    setRules,
    sequence,
    setSequence,
    results,
    setResults,
    theme,
    setTheme,
  };
}

// =============================
// Helpers
// =============================
const extOf = (n: string) =>
  n.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || "";

function parseFASTA(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((l) => !l.startsWith(">"))
    .join("")
    .toUpperCase()
    .replace(/[^ACGTUN]/g, "");
}

function buildRegex(rule: Rule): RegExp | null {
  const source = rule.regex ?? rule.pattern ?? null;
  if (!source) return null;
  try {
    const m = source.match(/^\/(.*)\/([gimsuy]*)$/);
    const body = m ? m[1] : source;
    const flags = m ? m[2] : "gi";
    return new RegExp(body, flags.includes("g") ? flags : flags + "g");
  } catch {
    return null;
  }
}

function scan(seq: string, rx: RegExp): TestHit[] {
  const out: TestHit[] = [];
  for (const m of seq.matchAll(rx)) {
    const start = m.index ?? 0;
    const text = m[0];
    out.push({ start, text });
    if (rx.lastIndex === m.index) rx.lastIndex++;
  }
  return out;
}

// =============================
// UI Components
// =============================
const Button = ({ className = "", children, ...props }: any) => (
  <button
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl shadow-sm border border-slate-200 bg-white hover:bg-slate-50 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = (props: any) => (
  <input
    {...props}
    className={`w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 ${
      props.className || ""
    }`}
  />
);

const Card = ({ children, className = "" }: any) => (
  <div className={`rounded-3xl ${className}`}>{children}</div>
);

const CardHeader = ({ title }: any) => (
  <div className="p-5 border-b border-slate-100">
    <div className="text-lg font-semibold">{title}</div>
  </div>
);

const CardBody = ({ children, className = "" }: any) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

// =============================
// Pages
// =============================
function HomePage() {
  const { rules } = useApp();

  return (
    <div className="text-center space-y-4">
      <h1 className="text-3xl font-bold">Welcome to Genomic Platform</h1>
      <p className="text-slate-600 dark:text-slate-300">
        Upload DNA sequences, run {rules.length} automated tests (motifs,
        mutations, repeats, CpG islands, etc.), and generate reports.
      </p>
      <div className="flex justify-center gap-4 mt-6">
        <Link
          to="/upload"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-700"
        >
          Get Started
        </Link>
        <Link
          to="/catalog"
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          View Catalog
        </Link>
      </div>
    </div>
  );
}

function UploadPage() {
  const { sequence, setSequence, setResults, rules } = useApp();
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const ext = extOf(f.name);
    if (["fa", "fasta", "fna"].includes(ext)) {
      setSequence(parseFASTA(text));
    }
  };

  const runTests = () => {
    setRunning(true);
    const newResults: TestResult[] = [];

    for (const rule of rules) {
      const rx = buildRegex(rule);
      if (!rx) continue;
      const hits = scan(sequence, rx);
      newResults.push({
        id: rule.id,
        name: rule.name,
        category: rule.category,
        regex: rule.regex || rule.pattern || "",
        count: hits.length,
        examples: hits.slice(0, 5).map((h) => h.text),
      });
    }

    setResults(newResults);
    setRunning(false);
  };

  // NEW reset function
  const resetAll = () => {
    setSequence("");
    setResults([]);
    navigate("/"); // go back to Home
  };

  return (
    <Card className="bg-transparent border-none shadow-none">
      <CardHeader title="Upload DNA File" />
      <CardBody className="space-y-4">
        <Input
          type="file"
          accept=".fasta,.fa,.fq,.fastq,.sam"
          onChange={handleUpload}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Supported file types:{" "}
          <span className="font-mono">.fasta, .fa, .fq, .fastq, .sam</span>
        </p>

        {sequence && (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Sequence length: {sequence.length} bp
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={runTests}
            disabled={!sequence || running}
            className="bg-white/80 hover:bg-white/90 dark:bg-slate-700/30 dark:hover:bg-slate-700/50 backdrop-blur-md border border-slate-300/30"
          >
            {running ? "Running tests..." : "Run All Tests"}
          </Button>

          <Button
            onClick={resetAll}
            className="bg-white/80 hover:bg-white/90 dark:bg-slate-700/30 dark:hover:bg-slate-700/50 backdrop-blur-md border border-slate-300/30"
          >
            Reset & Home
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function CatalogPage() {
  const { rules } = useApp();
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Catalog of Tests</h1>
      <table className="w-full border border-slate-200 text-sm">
        <thead className="bg-slate-100 dark:bg-slate-800">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Category</th>
            <th className="p-2 border">Pattern</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r: Rule) => (
            <tr key={r.id}>
              <td className="p-2 border">{r.name}</td>
              <td className="p-2 border">{r.category}</td>
              <td className="p-2 border font-mono">{r.regex || r.pattern}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultsPage() {
  const { sequence, results } = useApp();
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Analysis Results</h1>
      {!sequence ? (
        <p className="text-slate-500">No sequence uploaded yet.</p>
      ) : results.length === 0 ? (
        <p className="text-slate-500">No results yet. Run tests from Upload page.</p>
      ) : (
        <table className="w-full border border-slate-200 text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 border">Test</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Matches</th>
              <th className="p-2 border">Examples</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r: TestResult) => (
              <tr key={r.id}>
                <td className="p-2 border">{r.name}</td>
                <td className="p-2 border">{r.category}</td>
                <td className="p-2 border text-center">{r.count}</td>
                <td className="p-2 border font-mono">{r.examples.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ReportPage() {
  const { results } = useApp();

  const exportCSV = () => {
    if (!results.length) return alert("No results to export.");
    const header = ["Test", "Category", "Regex", "Matches", "Examples"];
    const rows = results.map((r: TestResult) => [
      r.name,
      r.category,
      r.regex,
      r.count,
      r.examples.join(" "),
    ]);
    const csvContent =
      [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "genomic_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Generate Report</h1>
      <p className="text-slate-600 dark:text-slate-300">
        After running tests, export your results to CSV.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}

// =============================
// Layout
// =============================
function Layout({ children }: { children: any }) {
  const { theme, setTheme } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 
                dark:from-slate-900 dark:to-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-semibold tracking-tight">
            Genomic Testing Platform
          </div>
          <nav className="ml-auto hidden md:flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/upload"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>
            <Link
              to="/catalog"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <ListChecks className="w-4 h-4" />
              Catalog
            </Link>
            <Link
              to="/results"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Results
            </Link>
            <Link
              to="/report"
              className="px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Report
            </Link>
          </nav>
          <div className="ml-2">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="!px-2 !py-1 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      <footer className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
        Client-side pattern engine. Binary formats (BAM/CRAM/BCF/Fast5) require
        backend/WASM for full parsing.
      </footer>
    </div>
  );
}

// =============================
// App
// =============================
function App() {
  const appState = useAppState();

  // Load rules JSON
  useEffect(() => {
    fetch("/data/current_mutation_tester.json")
      .then((res) => res.json())
      .then((data) => appState.setRules(data))
      .catch((err) => {
        console.error("Failed to load rules:", err);
        appState.setRules([
          { id: 1, name: "AT-rich motif", category: "Motif", regex: "AT{3,}" },
          { id: 2, name: "CpG island", category: "Epigenetics", regex: "CG" },
          { id: 3, name: "Poly-A tail", category: "Motif", regex: "A{6,}" },
        ]);
      });
  }, []);

  return (
    <BrowserRouter>
      <AppContext.Provider value={appState}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/report" element={<ReportPage />} />
          </Routes>
        </Layout>
      </AppContext.Provider>
    </BrowserRouter>
  );
}

export default App;
