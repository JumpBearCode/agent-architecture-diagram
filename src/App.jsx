import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud, FileCode2, Bot, Wrench, Users, Plug,
  Terminal, Code2, Building2, Github, Brain, Sparkles,
  X, ArrowRight, Zap, Cpu, ShieldCheck, BookOpen, HardHat,
  Search, Link, Server, Database, KeyRound, BarChart3,
} from "lucide-react";

/* ────────────────────── DATA ────────────────────── */

const nodes = {
  llm: {
    id: "llm", label: "LLM", color: "#0078D4",
    icon: Cpu,
    split: {
      left: {
        title: "Azure AI", icon: Cloud, color: "#0078D4",
        items: [
          { label: "Anthropic API", icon: Brain },
          { label: "OpenAI API", icon: Sparkles },
        ],
      },
      right: {
        title: "GitHub Copilot", subtitle: "Code Plan", icon: Github, color: "#6366F1",
        items: [],
      },
    },
    children: [],
    desc: "The LLM layer provides AI inference capabilities. Azure AI offers access to Anthropic Claude and OpenAI GPT models, while GitHub Copilot Code Plan handles task decomposition and execution planning.",
    bullets: ["Unified model gateway", "Enterprise auth & compliance", "Task planning & decomposition", "Context-aware scheduling"],
  },
  agentRuntime: {
    id: "agentRuntime", label: "Agent Runtime", color: "#019b98",
    icon: Bot,
    gridCols: 2,
    children: [
      { label: "Claude Code", icon: Terminal },
      { label: "Open Code", icon: Code2 },
      { label: "In-house", icon: Building2 },
      { label: "GitHub Copilot", icon: Github },
    ],
    desc: "The core execution layer hosting multiple AI coding agents. It manages agent lifecycles, coordinates interactions with Skills, SubAgents, and MCP to ensure efficient task completion.",
    bullets: ["Multi-agent unified runtime", "Lifecycle management", "Context & memory management", "Task routing & scheduling"],
  },
  skills: {
    id: "skills", label: "Skills", color: "#F59E0B",
    icon: Wrench,
    gridCols: 1,
    children: [
      { label: "ADF Pipeline Skills", icon: Server },
      { label: "Lookup Skills", icon: Search },
      { label: "Link Service Skills", icon: Link },
      { label: "Integration Runtime Skills", icon: HardHat },
      { label: "Snowflake Skills", icon: Database },
    ],
    desc: "Pre-defined capability modules that agents can reference on demand. Each Skill encapsulates domain-specific expertise and toolchains for Azure Data Factory, Snowflake, and more.",
    bullets: ["ADF pipeline orchestration", "Service linking & lookup", "Integration runtime management", "Snowflake data operations"],
  },
  subAgents: {
    id: "subAgents", label: "SubAgents", color: "#DD0025",
    icon: Users,
    gridCols: 1,
    children: [
      { label: "IAC Agent", icon: HardHat },
      { label: "Code Review Agent", icon: Search },
      { label: "Security Scan Agent", icon: ShieldCheck },
      { label: "ReadMe Agent", icon: BookOpen },
    ],
    desc: "Delegated task workers spawned by the main agent. They run in isolated contexts handling infrastructure-as-code, code review, security scanning, and documentation generation.",
    bullets: ["IAC provisioning & validation", "Automated code review", "Security vulnerability scanning", "Documentation generation"],
  },
  mcp: {
    id: "mcp", label: "MCP", color: "#8B5CF6",
    icon: Plug,
    gridCols: 2,
    children: [
      { label: "Snowflake MCP", icon: Database },
      { label: "ADF MCP", icon: Server },
      { label: "Log Analytics MCP", icon: BarChart3 },
      { label: "Key Vault MCP", icon: KeyRound },
    ],
    desc: "Model Context Protocol — the standard protocol connecting agents to external tools and data sources via STDIO. Through MCP Servers, agents access Snowflake, ADF, Log Analytics, and Key Vault.",
    bullets: ["All connections via STDIO", "Snowflake data queries", "ADF pipeline management", "Secrets & log access"],
  },
};

const edges = [
  { from: "agentRuntime", to: "llm",       label: "call",     info: "Calls LLM for inference and task planning" },
  { from: "agentRuntime", to: "skills",    label: "refer",    info: "References Skills for domain capabilities" },
  { from: "agentRuntime", to: "subAgents", label: "dispatch", info: "Dispatches subtasks for parallel processing" },
  { from: "agentRuntime", to: "mcp",       label: "use (STDIO)", info: "Invokes external tools via MCP protocol over STDIO" },
];

/* ────────── LAYOUT (percentage-based, centre-point) ────────── */
const layout = {
  llm:          [50, 14],
  skills:       [12, 50],
  agentRuntime: [50, 50],
  subAgents:    [88, 50],
  mcp:          [50, 88],
};

/* ────────── refs ────────── */

function useNodeRefs() {
  const refs = useRef({});
  const setRef = useCallback((id) => (el) => { refs.current[id] = el; }, []);
  return { refs, setRef };
}

/* ────────────── COMPONENTS ────────────── */

function ChildBox({ label, icon: Icon, color, selected }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200"
      style={{
        background: selected ? `${color}15` : "rgba(255,255,255,0.55)",
        border: `1px solid ${selected ? `${color}40` : "rgba(0,0,0,0.06)"}`,
        color: selected ? color : "var(--text-100)",
      }}
    >
      <Icon size={14} style={{ opacity: 0.7, flexShrink: 0 }} />
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}

/* Special split card for the LLM node */
function LlmCard({ node, selected, highlighted, onSelect, setRef }) {
  const dimmed = highlighted !== null && !selected && !highlighted;
  const { left, right } = node.split;

  return (
    <motion.div
      ref={setRef(node.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: dimmed ? 0.35 : 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(node.id)}
      className="absolute cursor-pointer select-none -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${layout[node.id][0]}%`,
        top: `${layout[node.id][1]}%`,
        zIndex: selected ? 20 : 10,
      }}
    >
      <div
        className={`rounded-[20px] transition-shadow duration-300 ${selected ? "pulse" : ""}`}
        style={{
          padding: "1rem 1.25rem",
          background: selected
            ? `linear-gradient(135deg, ${node.color}10, rgba(255,255,255,0.92))`
            : "rgba(255,255,255,0.75)",
          border: `2px solid ${selected ? node.color : "rgba(255,255,255,0.6)"}`,
          boxShadow: selected
            ? `0 10px 40px ${node.color}22, 0 0 0 1px ${node.color}30`
            : "0 8px 32px rgba(1,78,96,0.1)",
          backdropFilter: "blur(12px)",
          "--ring-color": `${node.color}40`,
        }}
      >
        {/* Top label */}
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: `${node.color}15` }}
          >
            <Cpu size={18} style={{ color: node.color }} />
          </div>
          <span
            className="font-bold text-[17px] leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              color: selected ? node.color : "var(--text-100)",
            }}
          >
            {node.label}
          </span>
        </div>

        {/* Split content */}
        <div className="flex gap-0">
          {/* Left — Azure AI */}
          <div
            className="flex-1 rounded-l-2xl p-3"
            style={{
              background: selected ? `${left.color}08` : "rgba(255,255,255,0.5)",
              border: `1px solid ${selected ? `${left.color}25` : "rgba(0,0,0,0.06)"}`,
              borderRight: "none",
              minWidth: "160px",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <left.icon size={14} style={{ color: left.color, opacity: 0.8 }} />
              <span
                className="text-xs font-bold"
                style={{ color: selected ? left.color : "var(--text-100)" }}
              >
                {left.title}
              </span>
            </div>
            <div className="grid gap-1.5">
              {left.items.map((item) => (
                <ChildBox key={item.label} {...item} color={left.color} selected={selected} />
              ))}
            </div>
          </div>

          {/* Divider — clear visible line */}
          <div
            className="self-stretch"
            style={{
              width: "2px",
              background: selected
                ? `linear-gradient(to bottom, ${left.color}60, ${right.color}60)`
                : "rgba(0,0,0,0.12)",
            }}
          />

          {/* Right — GitHub Copilot Code Plan */}
          <div
            className="flex-1 rounded-r-2xl p-3 flex flex-col items-center justify-center text-center"
            style={{
              background: selected ? `${right.color}08` : "rgba(255,255,255,0.5)",
              border: `1px solid ${selected ? `${right.color}25` : "rgba(0,0,0,0.06)"}`,
              borderLeft: "none",
              minWidth: "160px",
            }}
          >
            <right.icon size={20} style={{ color: right.color, opacity: 0.8, marginBottom: 8 }} />
            <span
              className="text-xs font-bold leading-tight"
              style={{ color: selected ? right.color : "var(--text-100)" }}
            >
              {right.title}
            </span>
            <span
              className="text-xs font-bold leading-tight mt-1"
              style={{ color: selected ? right.color : "var(--text-100)" }}
            >
              {right.subtitle}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NodeCard({ node, selected, highlighted, onSelect, setRef }) {
  if (node.split) {
    return (
      <LlmCard
        node={node} selected={selected} highlighted={highlighted}
        onSelect={onSelect} setRef={setRef}
      />
    );
  }

  const Icon = node.icon;
  const isCenter = node.id === "agentRuntime";
  const dimmed = highlighted !== null && !selected && !highlighted;
  const cols = node.gridCols || (isCenter ? 2 : 1);

  return (
    <motion.div
      ref={setRef(node.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: dimmed ? 0.35 : 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(node.id)}
      className="absolute cursor-pointer select-none -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${layout[node.id][0]}%`,
        top: `${layout[node.id][1]}%`,
        zIndex: selected ? 20 : 10,
      }}
    >
      <div
        className={`rounded-[20px] transition-shadow duration-300 ${selected ? "pulse" : ""}`}
        style={{
          padding: isCenter ? "1.5rem 2rem" : "1rem",
          background: selected
            ? `linear-gradient(135deg, ${node.color}10, rgba(255,255,255,0.92))`
            : "rgba(255,255,255,0.75)",
          border: `2px solid ${selected ? node.color : "rgba(255,255,255,0.6)"}`,
          boxShadow: selected
            ? `0 10px 40px ${node.color}22, 0 0 0 1px ${node.color}30`
            : "0 8px 32px rgba(1,78,96,0.1)",
          backdropFilter: "blur(12px)",
          "--ring-color": `${node.color}40`,
          minWidth: isCenter ? "380px" : undefined,
        }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: `${node.color}15` }}
          >
            <Icon size={18} style={{ color: node.color }} />
          </div>
          <span
            className="font-bold leading-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: isCenter ? "17px" : "15px",
              color: selected ? node.color : "var(--text-100)",
            }}
          >
            {node.label}
          </span>
        </div>

        {node.children.length > 0 && (
          <div className={`grid gap-1.5 grid-cols-${cols}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {node.children.map((c) => (
              <ChildBox key={c.label} {...c} color={node.color} selected={selected} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── SVG Arrows ── */

function Arrows({ selected, onHoverEdge, hoveredEdge, nodeRefs, containerRef }) {
  const [lines, setLines] = useState([]);

  const recalc = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();

    const result = edges.map((e) => {
      const fromEl = nodeRefs.current[e.from];
      const toEl = nodeRefs.current[e.to];
      if (!fromEl || !toEl) return null;

      const fr = fromEl.getBoundingClientRect();
      const tr = toEl.getBoundingClientRect();

      const fcx = fr.left + fr.width / 2 - cr.left;
      const fcy = fr.top + fr.height / 2 - cr.top;
      const tcx = tr.left + tr.width / 2 - cr.left;
      const tcy = tr.top + tr.height / 2 - cr.top;

      const dx = tcx - fcx;
      const dy = tcy - fcy;

      let x1, y1, x2, y2;

      if (Math.abs(dy) > Math.abs(dx)) {
        if (dy < 0) {
          x1 = fcx; y1 = fr.top - cr.top;
          x2 = tcx; y2 = tr.bottom - cr.top;
        } else {
          x1 = fcx; y1 = fr.bottom - cr.top;
          x2 = tcx; y2 = tr.top - cr.top;
        }
      } else {
        if (dx < 0) {
          x1 = fr.left - cr.left; y1 = fcy;
          x2 = tr.right - cr.left; y2 = tcy;
        } else {
          x1 = fr.right - cr.left; y1 = fcy;
          x2 = tr.left - cr.left; y2 = tcy;
        }
      }

      return { x1, y1, x2, y2 };
    });

    setLines(result);
  }, [nodeRefs, containerRef]);

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    const t1 = setTimeout(recalc, 400);
    const t2 = setTimeout(recalc, 800);
    return () => {
      window.removeEventListener("resize", recalc);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [recalc]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,4 L0,8 Z" fill="var(--primary-200)" />
        </marker>
        <marker id="arrow-active" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,4 L0,8 Z" fill="var(--primary-100)" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const l = lines[i];
        if (!l) return null;

        const active = selected === e.from || selected === e.to || hoveredEdge === i;
        const mx = (l.x1 + l.x2) / 2;
        const my = (l.y1 + l.y2) / 2;
        const isHorizontal = Math.abs(l.x2 - l.x1) > Math.abs(l.y2 - l.y1);

        return (
          <g key={i}>
            <line
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="transparent" strokeWidth={20}
              style={{ pointerEvents: "stroke", cursor: "pointer" }}
              onMouseEnter={() => onHoverEdge(i)}
              onMouseLeave={() => onHoverEdge(null)}
            />
            <line
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={active ? "var(--primary-100)" : "var(--primary-200)"}
              strokeWidth={active ? 2.5 : 1.5}
              opacity={active ? 1 : 0.45}
              className={active ? "arrow-animated" : ""}
              markerEnd={`url(#${active ? "arrow-active" : "arrow"})`}
              style={{ transition: "opacity 0.3s, stroke 0.3s" }}
            />
            <text
              x={mx} y={my}
              dy={isHorizontal ? -10 : 0}
              dx={isHorizontal ? 0 : 14}
              textAnchor="middle"
              className="text-[12px] font-semibold select-none"
              style={{
                fontFamily: "var(--font-mono)",
                fill: active ? "var(--primary-100)" : "var(--text-200)",
                transition: "fill 0.3s",
              }}
            >
              {e.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DetailPanel({ node, edge, onClose }) {
  if (!node && edge === null) return null;

  const data = node ? nodes[node] : null;
  const edgeData = edge !== null ? edges[edge] : null;

  return (
    <AnimatePresence>
      <motion.div
        key={node || `edge-${edge}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[600px] rounded-2xl p-5"
        style={{
          zIndex: 30,
          background: "rgba(255,255,255,0.88)",
          border: `1px solid ${data ? `${data.color}30` : "rgba(1,155,152,0.2)"}`,
          boxShadow: "0 24px 80px rgba(1,78,96,0.15)",
          backdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
        >
          <X size={16} className="text-text-200" />
        </button>

        {data && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ background: `${data.color}15` }}
              >
                <data.icon size={20} style={{ color: data.color }} />
              </div>
              <h3
                className="text-lg font-bold leading-tight"
                style={{ fontFamily: "var(--font-display)", color: data.color }}
              >
                {data.label}
              </h3>
            </div>
            <p className="text-sm text-text-200 leading-relaxed mb-3">{data.desc}</p>
            <div className="grid grid-cols-2 gap-2">
              {data.bullets.map((b) => (
                <div
                  key={b}
                  className="flex items-start gap-2 text-xs text-text-100 bg-white/60 rounded-lg px-3 py-2"
                >
                  <Zap size={12} style={{ color: data.color, marginTop: 2, flexShrink: 0 }} />
                  {b}
                </div>
              ))}
            </div>
          </>
        )}

        {edgeData && !data && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-100">
              <span className="px-2 py-1 rounded-lg bg-primary-100/10 text-primary-100 font-mono text-xs">
                {nodes[edgeData.from].label}
              </span>
              <ArrowRight size={14} className="text-text-200" />
              <span className="px-2 py-1 rounded-lg bg-primary-100/10 text-primary-100 font-mono text-xs">
                {nodes[edgeData.to].label}
              </span>
            </div>
            <span className="font-mono text-xs px-2 py-1 rounded-full bg-accent-100/10 text-accent-100 font-semibold">
              {edgeData.label}
            </span>
            <span className="text-sm text-text-200">{edgeData.info}</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ────────────── APP ────────────── */

export default function App() {
  const [selected, setSelected] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const containerRef = useRef(null);
  const { refs: nodeRefs, setRef } = useNodeRefs();

  const highlightSet = useCallback(() => {
    if (!selected) return null;
    const s = new Set([selected]);
    edges.forEach((e) => {
      if (e.from === selected) s.add(e.to);
      if (e.to === selected) s.add(e.from);
    });
    return s;
  }, [selected]);

  const highlights = highlightSet();

  const handleSelect = (id) => {
    setSelected((prev) => (prev === id ? null : id));
    setHoveredEdge(null);
  };

  const handleBgClick = (e) => {
    if (e.target === containerRef.current) {
      setSelected(null);
      setHoveredEdge(null);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { setSelected(null); setHoveredEdge(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={handleBgClick}
      className="relative w-full h-screen overflow-hidden"
    >
      <Arrows
        selected={selected}
        hoveredEdge={hoveredEdge}
        onHoverEdge={setHoveredEdge}
        nodeRefs={nodeRefs}
        containerRef={containerRef}
      />

      {Object.values(nodes).map((n) => (
        <NodeCard
          key={n.id}
          node={n}
          selected={selected === n.id}
          highlighted={highlights ? highlights.has(n.id) : null}
          onSelect={handleSelect}
          setRef={setRef}
        />
      ))}

      <DetailPanel
        node={selected}
        edge={!selected ? hoveredEdge : null}
        onClose={() => { setSelected(null); setHoveredEdge(null); }}
      />
    </div>
  );
}
