import type { Metadata } from "next";
import { CodeBlock } from "@/components/ui/CodeBlock";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Link from "next/link";

const title = "Installation";
const description = "Set up KhelaDekho frontend and backend locally for development.";
const url = "https://kheladekho.pages.dev/docs/installation";

export const metadata: Metadata = {
    title,
    description,
    openGraph: {
        title: `${title} | KhelaDekho`,
        description,
        url,
        type: "article",
        images: [
            {
                url: "https://kheladekho.pages.dev/meta-graph.webp",
                width: 1200,
                height: 630,
                alt: "KhelaDekho — Live Sports Streaming Aggregator",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: `${title} | KhelaDekho`,
        description,
    },
    alternates: {
        canonical: url,
    },
};

export default function InstallationPage() {
    return (
        <div className="w-full">
            {/* Hero Banner */}
            <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12 mb-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                            <Terminal className="w-3 h-3 text-red-500" />
                            SETUP_GUIDE
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                            Installation
                        </h1>
                        <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                            How to install and run the KhelaDekho Next.js frontend and FastAPI backend locally for development.
                        </p>
                    </div>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-red-500/30 hover:bg-red-500/[0.03] transition-all shrink-0"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
                    </Link>
                </div>
            </div>

            <div className="space-y-12">

                {/* Step 1 */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <h2 className="text-xl font-mono tracking-widest text-fg uppercase">1. Backend Setup (FastAPI)</h2>
                    </div>
                    <div className="ml-[3px] pl-6 border-l border-border-alt space-y-6">
                        <p className="text-fg-dim font-mono text-sm">
                            Clone the backend repository, create a virtual environment, and install the Python dependencies.
                        </p>
                        <CodeBlock code={`# Navigate to backend directory
cd KhelaDekho-API

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables template
cp .env.example .env`} />
                    </div>
                </section>

                {/* Step 2 */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <h2 className="text-xl font-mono tracking-widest text-fg uppercase">2. Frontend Setup (Next.js)</h2>
                    </div>
                    <div className="ml-[3px] pl-6 border-l border-border-alt space-y-6">
                        <p className="text-fg-dim font-mono text-sm">
                            Navigate to the frontend directory, install NPM packages, and prepare your environment variables.
                        </p>
                        <CodeBlock code={`# Navigate to frontend directory
cd KhelaDekho

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local`} />
                    </div>
                </section>

                {/* Step 3 */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <h2 className="text-xl font-mono tracking-widest text-fg uppercase">3. Environment Configuration</h2>
                    </div>
                    <div className="ml-[3px] pl-6 border-l border-border-alt space-y-6">
                        <p className="text-fg-dim font-mono text-sm">
                            Now that you have copied the templates, edit your <code>.env.local</code> (Frontend) file.
                        </p>
                        
                        <div className="space-y-6 mt-4">
                            <div className="border border-border-alt bg-card p-4 space-y-2">
                                <div className="text-xs font-mono text-fg-dim tracking-widest uppercase">Worker (wrangler.toml / Cloudflare Dashboard)</div>
                                <CodeBlock code={`# Set in wrangler.toml under [vars]:
V1_HOME_URL=https://your-v1-provider.example
V2_HOME_URL=https://your-v2-provider.example
V4_HOME_URL=https://your-v4-provider.example
# XKEY is a secret: wrangler secret put XKEY`} />
                            </div>

                                <div className="border border-border-alt bg-card p-4 space-y-2">
                                <div className="text-xs font-mono text-fg-dim tracking-widest uppercase">Frontend (.env.local)</div>
                                <CodeBlock code={`# --- Backend API ---
KHELADEKHO_API_URL=https://your-api.workers.dev
XKEY=your-xkey-here

# --- Telegram Contact Form ---
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
TELEGRAM_CHAT_ID=your-telegram-chat-id-here

# --- GitHub (Optional) ---
GITHUB_TOKEN=

# --- Google Analytics 4 (Optional) ---
NEXT_PUBLIC_GA_MEASUREMENT_ID=`} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Step 4 */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <h2 className="text-xl font-mono tracking-widest text-fg uppercase">4. Start Services</h2>
                    </div>
                    <div className="ml-[3px] pl-6 border-l border-border-alt space-y-6">
                        <p className="text-fg-dim font-mono text-sm">
                            Open two separate terminal windows to run both servers simultaneously.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-xs font-mono text-fg-dim tracking-widest uppercase">Terminal 1 (Backend)</div>
                                <CodeBlock code={`cd KhelaDekho-API
source venv/bin/activate
uvicorn app.main:app --reload --port 8000`} />
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-mono text-fg-dim tracking-widest uppercase">Terminal 2 (Frontend)</div>
                                <CodeBlock code={`cd KhelaDekho
npm run dev`} />
                            </div>
                        </div>

                        <p className="text-fg-dim font-mono text-sm leading-relaxed pt-2">
                            {`> The backend also ships as a Cloudflare Worker (the production API). To run it instead of FastAPI, start the Wrangler dev server and point the frontend at it via `}<code>KHELADEKHO_API_URL=http://localhost:8787</code>.
                        </p>
                        <div className="space-y-2">
                            <div className="text-xs font-mono text-fg-dim tracking-widest uppercase">Alternative Backend (Cloudflare Worker)</div>
                            <CodeBlock code={`cd KhelaDekho-API/worker
npm install
npm run dev        # http://localhost:8787
# deploy: npm run deploy  (set XKEY via: wrangler secret put XKEY)`} />
                        </div>
                    </div>
                </section>

                {/* Step 5 */}
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        <h2 className="text-xl font-mono tracking-widest text-fg uppercase">5. Verify Installation</h2>
                    </div>
                    <div className="ml-[3px] pl-6 border-l border-border-alt space-y-6">
                        <p className="text-fg-dim font-mono text-sm leading-relaxed">
                            {`> Open your browser and navigate to http://localhost:3000. You should see the KhelaDekho lobby. If the backend is running properly, the live matches and channels will populate automatically.`}
                        </p>
                    </div>
                </section>

                {/* Docs Pagination */}
                <div className="pt-8 mt-12 border-t border-border-alt flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Link href="/docs/api" className="flex items-center gap-3 text-sm font-mono text-fg-dim hover:text-fg border border-border-alt bg-card hover:bg-hover px-4 py-3 rounded-lg transition-colors w-full sm:w-auto group">
                        <ArrowLeft className="w-4 h-4" />
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] text-fg-faint uppercase tracking-widest group-hover:text-fg-dim transition-colors">Back to Start</span>
                            <span>KhelaDekho API</span>
                        </div>
                    </Link>

                    <Link href="/docs/request" className="flex items-center justify-end gap-3 text-sm font-mono text-fg border border-border-alt bg-hover hover:bg-hover-alt px-4 py-3 rounded-lg transition-colors w-full sm:w-auto ml-auto group">
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] text-fg-faint uppercase tracking-widest group-hover:text-fg-dim transition-colors">Next</span>
                            <span>Request API / Repo</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-red-500" />
                    </Link>
                </div>

            </div>
        </div>
    );
}
