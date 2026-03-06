import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Database, Download, FlaskConical, MessageSquare, NotebookPen, PlayCircle, ShieldCheck } from "lucide-react";
import { runBacktest } from "@/lib/quant/backtester";
import { BacktestConfig, BacktestResult, DatasetCatalog, PriceBar } from "@/lib/quant/types";

interface CommunityComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommunityPost {
  id: string;
  type: "dataset" | "strategy" | "result";
  title: string;
  summary: string;
  preprocessingSteps: string;
  metrics: string;
  author: string;
  createdAt: string;
  comments: CommunityComment[];
}

const BASE = import.meta.env.BASE_URL;
const CATALOG_PATH = `${BASE}quant-lab/datasets/catalog.json`;
const COMMUNITY_STORAGE_KEY = "quant_lab_community_v1";

const notebookLinks = [
  {
    title: "01 - Loading Datasets",
    description: "Read CSV/JSON datasets and inspect schema safely.",
    path: `${BASE}quant-lab/notebooks/01_loading_datasets.ipynb`,
  },
  {
    title: "02 - Cleaning + Preprocessing",
    description: "Handle missing values and normalize feature columns.",
    path: `${BASE}quant-lab/notebooks/02_cleaning_preprocessing.ipynb`,
  },
  {
    title: "03 - Simple Momentum Strategy",
    description: "Run a deterministic strategy and analyze outcomes.",
    path: `${BASE}quant-lab/notebooks/03_strategy_and_metrics.ipynb`,
  },
];

const seedCommunityPosts: CommunityPost[] = [
  {
    id: "seed_strategy_1",
    type: "strategy",
    title: "Momentum v1 on BTC Daily",
    summary: "Entry when 5-day return > 2%, exit when return < -1%, with 4% stop-loss and 8% take-profit.",
    preprocessingSteps: "Filled missing close prices with previous close, removed duplicate dates, sorted ascending by date.",
    metrics: "Cumulative Return: 18.4%, Max Drawdown: -7.2%, Volatility: 22.8%, Sharpe: 0.91",
    author: "Quant Mentor",
    createdAt: "2026-03-01T12:00:00.000Z",
    comments: [
      {
        id: "seed_comment_1",
        author: "Student A",
        content: "Clear preprocessing notes. Thanks for including all parameters.",
        createdAt: "2026-03-02T09:30:00.000Z",
      },
    ],
  },
];

const defaultConfig: BacktestConfig = {
  datasetId: "",
  datasetVersion: "",
  startingCapital: 10000,
  lookbackDays: 5,
  entryThresholdPct: 2,
  exitThresholdPct: -1,
  positionSizePct: 25,
  stopLossPct: 4,
  takeProfitPct: 8,
};

const toPercent = (value: number) => `${value.toFixed(2)}%`;

const QuantLab = () => {
  const [catalog, setCatalog] = useState<DatasetCatalog | null>(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [datasetRows, setDatasetRows] = useState<PriceBar[]>([]);
  const [session, setSession] = useState<Session | null>(null);

  const [config, setConfig] = useState<BacktestConfig>(defaultConfig);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [reproStatus, setReproStatus] = useState<string>("");

  const [posts, setPosts] = useState<CommunityPost[]>(seedCommunityPosts);
  const [postType, setPostType] = useState<CommunityPost["type"]>("strategy");
  const [postTitle, setPostTitle] = useState("");
  const [postSummary, setPostSummary] = useState("");
  const [postPreprocessing, setPostPreprocessing] = useState("");
  const [postMetrics, setPostMetrics] = useState("");
  const [postAuthor, setPostAuthor] = useState("Guest");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadCatalog = async () => {
      const response = await fetch(CATALOG_PATH);
      const data: DatasetCatalog = await response.json();
      setCatalog(data);
      if (data.datasets.length > 0) {
        const first = data.datasets[0];
        setSelectedDatasetId(first.id);
        setSelectedVersion(first.versions[0].version);
        setConfig((previous) => ({
          ...previous,
          datasetId: first.id,
          datasetVersion: first.versions[0].version,
        }));
      }
    };

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session?.user?.email) {
        setPostAuthor(data.session.user.email.split("@")[0]);
      }
    };

    const loadCommunity = () => {
      const stored = localStorage.getItem(COMMUNITY_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as CommunityPost[];
          setPosts(parsed);
          return;
        } catch (error) {
          console.warn("Failed to parse community posts", error);
        }
      }
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(seedCommunityPosts));
    };

    void loadCatalog();
    void loadSession();
    loadCommunity();
  }, []);

  useEffect(() => {
    if (!catalog || !selectedDatasetId || !selectedVersion) {
      return;
    }

    const selectedDataset = catalog.datasets.find((item) => item.id === selectedDatasetId);
    const version = selectedDataset?.versions.find((item) => item.version === selectedVersion);
    if (!version) {
      return;
    }

    const loadRows = async () => {
      const response = await fetch(`${BASE}${version.apiPath}`);
      const rows = (await response.json()) as PriceBar[];
      setDatasetRows(rows);
    };

    setConfig((previous) => ({
      ...previous,
      datasetId: selectedDatasetId,
      datasetVersion: selectedVersion,
    }));
    void loadRows();
  }, [catalog, selectedDatasetId, selectedVersion]);

  const selectedDataset = useMemo(() => {
    if (!catalog) return null;
    return catalog.datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null;
  }, [catalog, selectedDatasetId]);

  const selectedDatasetVersion = useMemo(() => {
    if (!selectedDataset) return null;
    return selectedDataset.versions.find((version) => version.version === selectedVersion) ?? null;
  }, [selectedDataset, selectedVersion]);

  const handleDatasetChange = (datasetId: string) => {
    const dataset = catalog?.datasets.find((item) => item.id === datasetId);
    if (!dataset) return;
    setSelectedDatasetId(datasetId);
    setSelectedVersion(dataset.versions[0].version);
  };

  const persistPosts = (updatedPosts: CommunityPost[]) => {
    setPosts(updatedPosts);
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(updatedPosts));
  };

  const runStrategy = () => {
    if (!datasetRows.length || !selectedDatasetVersion) return;

    const backtest = runBacktest(datasetRows, {
      ...config,
      datasetId: selectedDatasetId,
      datasetVersion: selectedDatasetVersion.version,
    });

    if (result?.runId === backtest.runId) {
      setReproStatus(`Reproducible run confirmed. Run ID: ${backtest.runId}`);
    } else {
      setReproStatus(`Backtest completed. Run ID: ${backtest.runId}`);
    }
    setResult(backtest);
  };

  const submitPost = () => {
    if (!postTitle.trim() || !postSummary.trim() || !postPreprocessing.trim() || !postMetrics.trim()) {
      return;
    }

    const newPost: CommunityPost = {
      id: `${Date.now()}`,
      type: postType,
      title: postTitle.trim(),
      summary: postSummary.trim(),
      preprocessingSteps: postPreprocessing.trim(),
      metrics: postMetrics.trim(),
      author: postAuthor.trim() || "Guest",
      createdAt: new Date().toISOString(),
      comments: [],
    };

    persistPosts([newPost, ...posts]);
    setPostTitle("");
    setPostSummary("");
    setPostPreprocessing("");
    setPostMetrics("");
  };

  const submitComment = (postId: string) => {
    const draft = commentDrafts[postId]?.trim();
    if (!draft) return;

    const updatedPosts = posts.map((post) => {
      if (post.id !== postId) return post;
      return {
        ...post,
        comments: [
          ...post.comments,
          {
            id: `${Date.now()}_${postId}`,
            author: postAuthor.trim() || "Guest",
            content: draft,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    persistPosts(updatedPosts);
    setCommentDrafts((previous) => ({ ...previous, [postId]: "" }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-cyan-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <SEO
        title="Quant Lab"
        description="Clean datasets, reproducible backtesting, educational notebooks, and collaborative quant workflows for students and early researchers."
        canonicalUrl="/quant-lab"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={session ? "default" : "secondary"}>{session ? "Signed in" : "Guest mode"}</Badge>
            {!session ? (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            ) : null}
          </div>
        </div>

        <Card className="mb-8 border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-3xl tracking-tight">Quant Lab</CardTitle>
            <CardDescription>
              Reproducible data + strategy workflows built for students and early researchers.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <Database className="mb-2 h-5 w-5" />
              Data Hub with versioned CSV/JSON datasets and preprocessing metadata.
            </div>
            <div className="rounded-lg border bg-background p-3">
              <FlaskConical className="mb-2 h-5 w-5" />
              Deterministic sandbox with fixed rules and no unsafe code execution.
            </div>
            <div className="rounded-lg border bg-background p-3">
              <MessageSquare className="mb-2 h-5 w-5" />
              Community sharing with required preprocessing notes and performance metrics.
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="data-hub" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
            <TabsTrigger value="data-hub">Data Hub</TabsTrigger>
            <TabsTrigger value="backtesting">Backtesting Sandbox</TabsTrigger>
            <TabsTrigger value="tutorials">Tutorial Notebooks</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="data-hub" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dataset Explorer</CardTitle>
                <CardDescription>
                  Download or call JSON endpoints directly. Each version has a reproducible metadata record.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dataset">Dataset</Label>
                    <select
                      id="dataset"
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={selectedDatasetId}
                      onChange={(event) => handleDatasetChange(event.target.value)}
                    >
                      {catalog?.datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.name} ({dataset.assetClass})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <select
                      id="version"
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={selectedVersion}
                      onChange={(event) => setSelectedVersion(event.target.value)}
                    >
                      {selectedDataset?.versions.map((version) => (
                        <option key={version.version} value={version.version}>
                          {version.version} (Updated {version.lastUpdated})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedDataset && selectedDatasetVersion ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="bg-muted/20">
                      <CardHeader>
                        <CardTitle className="text-base">Metadata</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Source:</strong> {selectedDatasetVersion.source}</div>
                        <div><strong>Last updated:</strong> {selectedDatasetVersion.lastUpdated}</div>
                        <div><strong>Missing values:</strong> {selectedDatasetVersion.missingValuesHandled}</div>
                        <div><strong>Rows:</strong> {selectedDatasetVersion.rowCount.toLocaleString()}</div>
                        <div className="space-y-1">
                          <strong>Preprocessing:</strong>
                          <ul className="list-disc pl-5">
                            {selectedDatasetVersion.preprocessingSteps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/20">
                      <CardHeader>
                        <CardTitle className="text-base">Access</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <a href={`${BASE}${selectedDatasetVersion.downloads.csv}`} download>
                            <Button className="w-full" variant="outline">
                              <Download className="mr-2 h-4 w-4" /> CSV
                            </Button>
                          </a>
                          <a href={`${BASE}${selectedDatasetVersion.downloads.json}`} download>
                            <Button className="w-full" variant="outline">
                              <Download className="mr-2 h-4 w-4" /> JSON
                            </Button>
                          </a>
                        </div>
                        <div className="rounded-md border bg-background p-3 font-mono text-xs break-all">
                          GET {window.location.origin}{BASE}{selectedDatasetVersion.apiPath}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}

                <Card className="bg-muted/20">
                  <CardHeader>
                    <CardTitle className="text-base">Preview (first 20 rows)</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Open</TableHead>
                          <TableHead>High</TableHead>
                          <TableHead>Low</TableHead>
                          <TableHead>Close</TableHead>
                          <TableHead>Volume</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datasetRows.slice(0, 20).map((row) => (
                          <TableRow key={row.date}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.open.toFixed(2)}</TableCell>
                            <TableCell>{row.high.toFixed(2)}</TableCell>
                            <TableCell>{row.low.toFixed(2)}</TableCell>
                            <TableCell>{row.close.toFixed(2)}</TableCell>
                            <TableCell>{row.volume.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backtesting" className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Safe and deterministic execution</AlertTitle>
              <AlertDescription>
                This sandbox does not execute user code. It only applies validated numeric parameters to built-in strategy rules.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Strategy Controls</CardTitle>
                <CardDescription>
                  Same dataset + same strategy settings always produces the same run ID and metrics.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Starting Capital</Label>
                  <Input
                    type="number"
                    value={config.startingCapital}
                    onChange={(event) => setConfig({ ...config, startingCapital: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lookback Days</Label>
                  <Input
                    type="number"
                    value={config.lookbackDays}
                    onChange={(event) => setConfig({ ...config, lookbackDays: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entry Threshold (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.entryThresholdPct}
                    onChange={(event) => setConfig({ ...config, entryThresholdPct: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exit Threshold (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.exitThresholdPct}
                    onChange={(event) => setConfig({ ...config, exitThresholdPct: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position Size (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    value={config.positionSizePct}
                    onChange={(event) => setConfig({ ...config, positionSizePct: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stop-loss (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.stopLossPct}
                    onChange={(event) => setConfig({ ...config, stopLossPct: Number(event.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Take-profit (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.takeProfitPct}
                    onChange={(event) => setConfig({ ...config, takeProfitPct: Number(event.target.value) })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={runStrategy} className="w-full">
                    <PlayCircle className="mr-2 h-4 w-4" /> Run Backtest
                  </Button>
                </div>
              </CardContent>
            </Card>

            {reproStatus ? (
              <Alert>
                <AlertTitle>Reproducibility Status</AlertTitle>
                <AlertDescription>{reproStatus}</AlertDescription>
              </Alert>
            ) : null}

            {result ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Run ID: {result.runId}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Cumulative Return</div>
                      <div className="text-lg font-semibold">{toPercent(result.metrics.cumulativeReturnPct)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Max Drawdown</div>
                      <div className="text-lg font-semibold">{toPercent(result.metrics.maxDrawdownPct)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Volatility</div>
                      <div className="text-lg font-semibold">{toPercent(result.metrics.volatilityPct)}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                      <div className="text-lg font-semibold">{result.metrics.sharpeRatio.toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Equity Curve</CardTitle>
                    <CardDescription>Fast-rendered client chart for immediate strategy feedback.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={result.curve}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" hide />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="equity" stroke="#0284c7" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {result?.trades.length ? (
              <Card>
                <CardHeader>
                  <CardTitle>Trade Log (latest 12)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.trades.slice(-12).reverse().map((trade) => (
                        <TableRow key={`${trade.date}_${trade.action}_${trade.shares}`}>
                          <TableCell>{trade.date}</TableCell>
                          <TableCell>{trade.action}</TableCell>
                          <TableCell>{trade.price.toFixed(2)}</TableCell>
                          <TableCell>{trade.shares}</TableCell>
                          <TableCell>{trade.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="tutorials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Educational Notebooks</CardTitle>
                <CardDescription>
                  Beginner-friendly notebooks cover loading, cleaning, strategy execution, and metric interpretation.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {notebookLinks.map((notebook) => (
                  <Card key={notebook.title} className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-base">{notebook.title}</CardTitle>
                      <CardDescription>{notebook.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <a href={notebook.path} target="_blank" rel="noreferrer">
                        <Button className="w-full" variant="outline">
                          <NotebookPen className="mr-2 h-4 w-4" /> Open Notebook JSON
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Share Dataset / Strategy / Result</CardTitle>
                <CardDescription>
                  Transparency is enforced: each post requires preprocessing steps and metrics.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={postType}
                      onChange={(event) => setPostType(event.target.value as CommunityPost["type"])}
                    >
                      <option value="dataset">Dataset</option>
                      <option value="strategy">Strategy</option>
                      <option value="result">Result</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Author</Label>
                    <Input value={postAuthor} onChange={(event) => setPostAuthor(event.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={postTitle} onChange={(event) => setPostTitle(event.target.value)} placeholder="Momentum strategy on ETF basket" />
                </div>
                <div className="space-y-2">
                  <Label>Summary</Label>
                  <Textarea value={postSummary} onChange={(event) => setPostSummary(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Preprocessing steps (required)</Label>
                  <Textarea value={postPreprocessing} onChange={(event) => setPostPreprocessing(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Metrics (required)</Label>
                  <Textarea value={postMetrics} onChange={(event) => setPostMetrics(event.target.value)} />
                </div>
                <Button onClick={submitPost}>Share to Community</Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <Badge variant="outline">{post.type}</Badge>
                    </div>
                    <CardDescription>
                      By {post.author} on {new Date(post.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Summary:</strong> {post.summary}</p>
                    <p><strong>Preprocessing:</strong> {post.preprocessingSteps}</p>
                    <p><strong>Metrics:</strong> {post.metrics}</p>

                    <div className="rounded-md border p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" /> Discussion
                      </div>
                      <div className="space-y-2">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="rounded-md bg-muted/40 p-2">
                            <div className="text-xs text-muted-foreground">
                              {comment.author} • {new Date(comment.createdAt).toLocaleString()}
                            </div>
                            <div>{comment.content}</div>
                          </div>
                        ))}
                        {!post.comments.length ? <div className="text-xs text-muted-foreground">No comments yet.</div> : null}
                      </div>

                      <div className="mt-2 flex gap-2">
                        <Input
                          value={commentDrafts[post.id] ?? ""}
                          onChange={(event) => setCommentDrafts((previous) => ({ ...previous, [post.id]: event.target.value }))}
                          placeholder="Add a comment"
                        />
                        <Button variant="outline" onClick={() => submitComment(post.id)}>Post</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QuantLab;
