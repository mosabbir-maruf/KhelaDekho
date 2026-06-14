import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left";
import ArrowRight from "lucide-react/dist/esm/icons/arrow-right";
import Zap from "lucide-react/dist/esm/icons/zap";
import Shield from "lucide-react/dist/esm/icons/shield";
import Cpu from "lucide-react/dist/esm/icons/cpu";
import Key from "lucide-react/dist/esm/icons/key";
import Terminal from "lucide-react/dist/esm/icons/terminal";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/CodeBlock";


export default function DecryptionApiPage() {
  const stats = [
    { icon: Cpu, label: "FastAPI Backend", value: "Port 8000", desc: "Local server runner" },
    { icon: Zap, label: "Cloudflare Edge", value: "Edge Worker", desc: "Serverless V8 routes" },
    { icon: Key, label: "Cryptographic", value: "HMAC-SHA256", desc: "Anti-hotlink check" },
    { icon: Shield, label: "Stream Decoding", value: "AES-GCM", desc: "A256GCM v2 parser" },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20 w-full">
        
        {/* Hero Banner */}
        <div className="relative border border-border-alt bg-card overflow-hidden p-8 md:p-12">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-border-alt bg-hover text-[10px] font-mono uppercase tracking-widest text-fg-dim">
                <Cpu className="w-3 h-3 text-red-500" />
                API Specification
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-fg font-mono leading-tight">
                Decryption<span className="text-red-500">.</span> API
              </h1>
              <p className="text-sm font-mono text-fg-dim max-w-2xl leading-relaxed">
                Technical reference for KhelaDekho proxy aggregation, cryptographic key signatures, 
                and AES-GCM stream decryption pipelines.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border-alt bg-input text-xs font-mono text-fg-dim hover:text-fg hover:border-border-alt transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Lobby Lounge
            </Link>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-border-alt bg-card p-5 text-center hover:border-red-500/20 hover:bg-red-500/[0.02] transition-all group"
            >
              <stat.icon className="w-5 h-5 text-fg-faint group-hover:text-red-500/60 mx-auto mb-3 transition-colors" />
              <p className="text-lg font-mono font-bold text-fg">{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-fg-dim mt-2">
                {stat.label}
              </p>
              <p className="text-[9px] font-mono text-fg-faint mt-1">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Authentication Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hover" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-fg-faint">
              Cryptographic Authentication
            </span>
            <div className="h-px flex-1 bg-hover" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-border-alt bg-card p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-lg font-mono font-bold text-fg tracking-tight">
                HMAC-SHA256 Verification
              </h2>
              <p className="text-xs font-mono text-fg-dim leading-relaxed">
                To prevent stream theft and unauthorized proxy access, the stream extraction endpoint 
                is protected with token signatures. Every request to get player keys must supply validation 
                headers hashed using your shared secret key.
              </p>
              <div className="pt-2 text-xs font-mono text-fg-dim">
                <span className="text-red-400">Required Headers:</span>
                <ul className="list-disc pl-5 mt-1.5 space-y-1">
                  <li><code>X-Signature-Token</code></li>
                  <li><code>X-Signature-Timestamp</code></li>
                </ul>
              </div>
            </div>
            
            <div className="border border-border-alt bg-card p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-mono font-bold text-fg tracking-tight">
                Message Signature Format
              </h2>
              <p className="text-xs font-mono text-fg-dim leading-relaxed">
                The HMAC signature payload must be constructed by concatenating the integer timestamp 
                and the target request path, separated by a colon:
              </p>
              <CodeBlock code="{timestamp}:{path}" />
              <p className="text-[10px] font-mono text-fg-faint">
                Example: <code>1781371516:/api/v1/channels/wctveng/stream</code>
              </p>
            </div>
          </div>
        </div>

        {/* Endpoint Specification */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hover" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-fg-faint">
              Endpoints Spec
            </span>
            <div className="h-px flex-1 bg-hover" />
          </div>
          <div className="border border-border-alt bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.02] border-b border-border-alt">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
              <span className="text-[10px] font-mono text-fg-dim tracking-widest uppercase">system_manifest</span>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="text-fg-dim uppercase tracking-wider border-b border-border-alt pb-3">
                    <th className="pb-3 pr-4">Method & Path</th>
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3">Access Auth</th>
                  </tr>
                </thead>
                <tbody className="text-fg-dim">
                  <tr className="border-b border-border-alt">
                    <td className="py-3 pr-4 text-fg font-bold">GET /api/v1/health</td>
                    <td className="py-3 pr-4">App metrics and diagnostic health</td>
                    <td className="py-3 text-fg-faint">Anonymous</td>
                  </tr>
                  <tr className="border-b border-border-alt">
                    <td className="py-3 pr-4 text-fg font-bold">GET /api/v1/matches</td>
                    <td className="py-3 pr-4">Upcoming and live matches list</td>
                    <td className="py-3 text-fg-faint">Anonymous</td>
                  </tr>
                  <tr className="border-b border-border-alt">
                    <td className="py-3 pr-4 text-fg font-bold">GET /api/v1/channels</td>
                    <td className="py-3 pr-4">Active channel details & metadata</td>
                    <td className="py-3 text-fg-faint">Anonymous</td>
                  </tr>
                  <tr className="border-b border-border-alt">
                    <td className="py-3 pr-4 text-fg font-bold">GET /api/v1/stats</td>
                    <td className="py-3 pr-4">Platform transmission analytics</td>
                    <td className="py-3 text-fg-faint">Anonymous</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-red-500 font-bold">GET /api/v1/channels/:key/stream</td>
                    <td className="py-3 pr-4">Get decrypted manifest and decryption keys</td>
                    <td className="py-3 text-red-400 font-bold">HMAC-SHA256</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Responses */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hover" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-fg-faint">
              Standard Response Envelopes
            </span>
            <div className="h-px flex-1 bg-hover" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border-alt bg-card p-6 space-y-4">
              <h3 className="text-sm font-mono font-semibold text-fg">Success Output</h3>
              <CodeBlock code={`{
  "success": true,
  "data": {
    "key": "fifatv",
    "name": "FIFA CTV",
    "url": "https://example.com/stream.mpd",
    "type": "dash",
    "drm": "clearkey",
    "clearkey": {
      "keys": {
        "834fae2345ef01a88bb3d2345eaf12bc": "a12d34bf56ea7890bcde12345fae9812"
      }
    }
  },
  "error": null
}`} />
            </div>
            
            <div className="border border-border-alt bg-card p-6 space-y-4">
              <h3 className="text-sm font-mono font-semibold text-fg">Error Output</h3>
              <CodeBlock code={`{
  "success": false,
  "data": null,
  "error": {
    "code": "HTTP_401",
    "message": "Secure session credentials missing"
  }
}`} />
            </div>
          </div>
        </div>

        {/* Code Integrations */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-hover" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-fg-faint">
              Client Code Integrations
            </span>
            <div className="h-px flex-1 bg-hover" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border-alt bg-card p-6 space-y-4 hover:border-red-500/10 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-hover border border-border-alt flex items-center justify-center shrink-0 group-hover:border-red-500/20 group-hover:bg-red-500/10 transition-all">
                  <Code2 className="w-4 h-4 text-fg-dim group-hover:text-red-400 transition-colors" />
                </div>
                <h3 className="text-sm font-mono font-semibold text-fg">Python Integration</h3>
              </div>
              <CodeBlock code={`import time
import hmac
import hashlib
import requests

secret_key = "your-hmac-secret-key-here"
channel_key = "wctveng"
path = f"/api/v1/channels/{channel_key}/stream"
base_url = "http://localhost:8000"

timestamp = str(int(time.time()))
message = f"{timestamp}:{path}".encode()

token = hmac.new(
    secret_key.encode(),
    message,
    hashlib.sha256
).hexdigest()

headers = {
    "X-Signature-Token": token,
    "X-Signature-Timestamp": timestamp
}

response = requests.get(f"{base_url}{path}", headers=headers)
print(response.json())`} />
            </div>

            <div className="border border-border-alt bg-card p-6 space-y-4 hover:border-red-500/10 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-hover border border-border-alt flex items-center justify-center shrink-0 group-hover:border-red-500/20 group-hover:bg-red-500/10 transition-all">
                  <Terminal className="w-4 h-4 text-fg-dim group-hover:text-red-400 transition-colors" />
                </div>
                <h3 className="text-sm font-mono font-semibold text-fg">Node.js Integration</h3>
              </div>
              <CodeBlock code={`const crypto = require('crypto');
const axios = require('axios');

const secretKey = "your-hmac-secret-key-here";
const channelKey = "wctveng";
const path = \`/api/v1/channels/\${channelKey}/stream\`;
const baseUrl = "http://localhost:8000";

const timestamp = Math.floor(Date.now() / 1000).toString();
const message = \`\${timestamp}:\${path}\`;

const token = crypto
  .createHmac('sha256', secretKey)
  .update(message)
  .digest('hex');

axios.get(\`\${baseUrl}\${path}\`, {
  headers: {
    'X-Signature-Token': token,
    'X-Signature-Timestamp': timestamp
  }
})
.then(res => console.log("Decrypted stream:", res.data))
.catch(err => console.error("Error:", err.message));`} />
            </div>
          </div>
        </div>



        {/* Docs Pagination */}
        <div className="pt-8 mt-12 border-t border-border-alt flex flex-col sm:flex-row items-center justify-between gap-4">
            <div />
            <Link href="/docs/architecture" className="flex items-center justify-end gap-3 text-sm font-mono text-fg border border-border-alt bg-hover hover:bg-hover-alt px-4 py-3 rounded-lg transition-colors w-full sm:w-auto ml-auto group">
                <div className="flex flex-col text-right">
                    <span className="text-[10px] text-fg-faint uppercase tracking-widest group-hover:text-fg-dim transition-colors">Next</span>
                    <span>Architecture</span>
                </div>
                <ArrowRight className="w-4 h-4 text-red-500" />
            </Link>
        </div>

    </div>
  );
}
