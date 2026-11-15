'use client';

import React, { useState } from 'react';
import {
  ArchNode,
  ArchEdge,
  BlastRadiusSimulation,
  CodeFile,
} from '@/types/legacy';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Flame,
  Activity,
  ChevronsUpDown,
} from 'lucide-react';

interface BlueprintCanvasProps {
  nodes: ArchNode[];
  edges: ArchEdge[];
  selectedFile: CodeFile;
  onSelectNode: (nodeId: string, fileName: string) => void;
  onSelectFile?: (file: CodeFile | string) => void;
  simulation?: BlastRadiusSimulation | null;
  activeSimulationTarget?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  nodes,
  edges,
  selectedFile,
  onSelectNode,
  onSelectFile,
  simulation,
  activeSimulationTarget,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [zoom, setZoom] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Normalize impacted files list from simulation
  const impactedFiles = (simulation?.affectedModules || []).map((m) =>
    m.file.toLowerCase()
  );
  if (simulation?.targetFile) {
    impactedFiles.push(simulation.targetFile.toLowerCase());
  }

  // Deterministic, pixel-aligned architecture coordinates (Locked grid)
  const nodeLayout: Record<string, { x: number; y: number; w: number; h: number }> = {
    'user-auth-schema': { x: 50, y: 40, w: 290, h: 110 },
    'monthly-billing-batch': { x: 640, y: 40, w: 290, h: 110 },
    'loan-interest-engine': { x: 640, y: 240, w: 290, h: 110 },
    'legacy-arch-notes': { x: 50, y: 240, w: 290, h: 110 },
  };

  const getNodePos = (id: string, idx: number) => {
    if (nodeLayout[id]) return nodeLayout[id];
    return {
      x: 50 + (idx % 2) * 590,
      y: 40 + Math.floor(idx / 2) * 200,
      w: 290,
      h: 110,
    };
  };

  // Pixel-accurate anchor port connector calculation
  const getEdgeEndpoints = (
    edge: ArchEdge,
    src: { x: number; y: number; w: number; h: number },
    tgt: { x: number; y: number; w: number; h: number }
  ) => {
    // 1. Dual-lane bidirectional paths between top-left (UserAuthSchema) & top-right (MonthlyBillingBatch)
    if (edge.source === 'user-auth-schema' && edge.target === 'monthly-billing-batch') {
      return { x1: src.x + src.w, y1: src.y + 36, x2: tgt.x, y2: tgt.y + 36 };
    }
    if (edge.source === 'monthly-billing-batch' && edge.target === 'user-auth-schema') {
      return { x1: src.x, y1: src.y + 76, x2: tgt.x + tgt.w, y2: tgt.y + 76 };
    }

    // 2. Vertical downstream path (MonthlyBillingBatch -> LoanInterestEngine)
    if (edge.source === 'monthly-billing-batch' && edge.target === 'loan-interest-engine') {
      return { x1: src.x + src.w / 2, y1: src.y + src.h, x2: tgt.x + tgt.w / 2, y2: tgt.y };
    }

    // 3. Horizontal contradiction drift path (legacy_arch_notes -> LoanInterestEngine)
    if (edge.source === 'legacy-arch-notes' && edge.target === 'loan-interest-engine') {
      return { x1: src.x + src.w, y1: src.y + src.h / 2, x2: tgt.x, y2: tgt.y + tgt.h / 2 };
    }

    // Generalized geometric anchor ports for dynamic topologies
    if (src.x + src.w <= tgt.x + 40) {
      return { x1: src.x + src.w, y1: src.y + src.h / 2, x2: tgt.x, y2: tgt.y + tgt.h / 2 };
    }
    if (tgt.x + tgt.w <= src.x + 40) {
      return { x1: src.x, y1: src.y + src.h / 2, x2: tgt.x + tgt.w, y2: tgt.y + tgt.h / 2 };
    }
    if (src.y + src.h <= tgt.y + 40) {
      return { x1: src.x + src.w / 2, y1: src.y + src.h, x2: tgt.x + tgt.w / 2, y2: tgt.y };
    }
    return { x1: src.x + src.w / 2, y1: src.y, x2: tgt.x + tgt.w / 2, y2: tgt.y + tgt.h };
  };

  const handleNodeClick = (node: ArchNode) => {
    onSelectNode(node.id, node.file);
    if (onSelectFile) {
      onSelectFile(node.file);
    }
  };

  // Identify active selected node ID
  const selectedNode = nodes.find(
    (n) =>
      n.file.toLowerCase() === selectedFile.name.toLowerCase() ||
      n.id === selectedFile.id
  );
  const activeSelectedId = selectedNode?.id || null;

  return (
    <div className="w-full h-full flex flex-col bg-[#070B14] blueprint-grid relative overflow-hidden select-none">
      {/* Top Floating Toolbar (Status, Zoom Controls & Focus Mode Toggle) */}
      <div className="absolute top-2.5 left-3.5 right-3.5 z-20 flex items-center justify-between pointer-events-none">
        {/* Left Status Pill */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0F1623]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-lg">
          <Activity className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-zinc-100">
            Visual Blueprint Flow Stage
          </span>
          {simulation && simulation.blastRadiusScore > 0 && (
            <span
              className={`flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ml-2 ${
                simulation.severity === 'HIGH'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse'
                  : simulation.severity === 'MEDIUM'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              }`}
            >
              <Flame className="h-3 w-3 text-rose-400" />
              {simulation.blastRadiusScore}% Ripple • {simulation.severity}
            </span>
          )}
        </div>

        {/* Right Zoom & Focus Controls */}
        <div className="flex items-center gap-1 pointer-events-auto bg-[#0F1623]/95 backdrop-blur-md border border-slate-800 rounded-lg p-0.5 shadow-lg">
          <button
            onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(1))))}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out (-10%)"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-mono text-zinc-300 px-1.5 min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(1))))}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In (+10%)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Zoom to 100%"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Focus Mode Expand / Collapse Toggle */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-all ml-1 ${
                isExpanded
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-slate-800/80 text-zinc-200 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title={isExpanded ? 'Restore Split View' : 'Focus Mode: Maximize Graph Canvas'}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3" />}
              <span>{isExpanded ? 'Exit Focus' : 'Focus Mode'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Unified Canvas Stage (Strict Zoom Scaling Wrapper around SVG & Nodes) */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-4 min-h-[300px] overflow-hidden">
        <div
          className="w-full h-full max-h-[380px] flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <svg
            viewBox="0 0 980 390"
            className="w-full h-full max-h-[380px] overflow-visible"
          >
            <style>
              {`
                .flow-edge-animated {
                  stroke-dasharray: 6 4;
                  animation: blueprintFlow 1.2s linear infinite;
                }
                @keyframes blueprintFlow {
                  from { stroke-dashoffset: 20; }
                  to { stroke-dashoffset: 0; }
                }
                .pulse-glow-crimson {
                  animation: pulseGlowCrimson 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulseGlowCrimson {
                  0%, 100% { opacity: 0.9; stroke-width: 2.5; }
                  50% { opacity: 0.4; stroke-width: 4.5; }
                }
              `}
            </style>

            <defs>
              {/* Arrow Markers for Directed Edges */}
              <marker
                id="edge-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6366F1" />
              </marker>
              <marker
                id="edge-arrow-crimson"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#F43F5E" />
              </marker>
              <marker
                id="edge-arrow-amber"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#F59E0B" />
              </marker>
              <marker
                id="edge-arrow-dim"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
              </marker>

              {/* Glow Filters */}
              <filter id="glow-indigo" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#6366F1" floodOpacity="0.45" />
              </filter>
              <filter id="glow-crimson" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#F43F5E" floodOpacity="0.5" />
              </filter>
            </defs>

            {/* 1. SVG Edge Connector Lines & Non-Overlapping Label Pills */}
            {edges.map((edge) => {
              const srcIdx = nodes.findIndex((n) => n.id === edge.source);
              const tgtIdx = nodes.findIndex((n) => n.id === edge.target);
              const src = getNodePos(edge.source, srcIdx);
              const tgt = getNodePos(edge.target, tgtIdx);

              const isSourceImpacted = impactedFiles.some((f) =>
                edge.source.toLowerCase().includes(f.replace(/\.[a-z0-9]+$/, ''))
              );
              const isTargetImpacted = impactedFiles.some((f) =>
                edge.target.toLowerCase().includes(f.replace(/\.[a-z0-9]+$/, ''))
              );
              const isImpactedEdge = isSourceImpacted && isTargetImpacted;

              // Check connectivity to hovered or selected node
              const isConnectedToHover =
                hoveredNodeId !== null &&
                (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
              const isConnectedToSelect =
                activeSelectedId !== null &&
                (edge.source === activeSelectedId || edge.target === activeSelectedId);

              // Dynamic Opacity Calculation for Hover Illumination
              let edgeOpacity = 0.85;
              if (hoveredNodeId !== null) {
                edgeOpacity = isConnectedToHover ? 1.0 : 0.35;
              } else if (activeSelectedId !== null) {
                edgeOpacity = isConnectedToSelect ? 1.0 : 0.7;
              }

              // Endpoints calculation
              const { x1, y1, x2, y2 } = getEdgeEndpoints(edge, src, tgt);
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              // Color determination
              const strokeColor = isImpactedEdge
                ? '#F43F5E'
                : isConnectedToHover || isConnectedToSelect
                ? '#6366F1'
                : edge.severity === 'high'
                ? '#F43F5E'
                : edge.severity === 'medium'
                ? '#F59E0B'
                : '#6366F1';

              // Marker determination
              const markerRef = edgeOpacity < 0.4
                ? 'url(#edge-arrow-dim)'
                : isImpactedEdge || edge.severity === 'high'
                ? 'url(#edge-arrow-crimson)'
                : edge.severity === 'medium'
                ? 'url(#edge-arrow-amber)'
                : 'url(#edge-arrow)';

              const labelWidth = Math.max(edge.label.length * 7.2 + 28, 148);

              return (
                <g key={edge.id} className="transition-opacity duration-200" style={{ opacity: edgeOpacity }}>
                  {/* Connector Line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={
                      isImpactedEdge
                        ? 3.2
                        : isConnectedToHover || isConnectedToSelect
                        ? 2.6
                        : 1.8
                    }
                    className="flow-edge-animated"
                    markerEnd={markerRef}
                  />

                  {/* Non-Overlapping Midpoint Label Pill */}
                  <rect
                    x={midX - labelWidth / 2}
                    y={midY - 11}
                    width={labelWidth}
                    height={22}
                    rx={6}
                    fill="#0B1120"
                    stroke={strokeColor}
                    strokeWidth={isConnectedToHover || isConnectedToSelect ? 1.5 : 1.1}
                    filter="drop-shadow(0 2px 6px rgba(0,0,0,0.65))"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill={isConnectedToHover || isConnectedToSelect ? '#FFFFFF' : '#E2E8F0'}
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* 2. SVG Node Cards (Strictly Locked to Coordinates with Click & Hover Handlers) */}
            {nodes.map((node, idx) => {
              const pos = getNodePos(node.id, idx);
              const isSelected =
                selectedFile.name.toLowerCase() === node.file.toLowerCase() ||
                node.id === selectedFile.id ||
                node.id === activeSelectedId;

              const isHovered = hoveredNodeId === node.id;

              const isImpacted = impactedFiles.some(
                (f) =>
                  node.file.toLowerCase().includes(f) ||
                  f.includes(node.file.toLowerCase())
              );

              const isTargetFile =
                simulation?.targetFile &&
                simulation.targetFile.toLowerCase() === node.file.toLowerCase();

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => handleNodeClick(node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer transition-transform duration-150"
                  style={{
                    transformOrigin: `${pos.x + pos.w / 2}px ${pos.y + pos.h / 2}px`,
                  }}
                >
                  {/* Outer Glow Ring if Selected */}
                  {isSelected && (
                    <rect
                      x={-4}
                      y={-4}
                      width={pos.w + 8}
                      height={pos.h + 8}
                      rx={14}
                      fill="none"
                      stroke="#6366F1"
                      strokeWidth={2}
                      opacity={0.65}
                      filter="url(#glow-indigo)"
                    />
                  )}

                  {/* Outer Pulsing Glow Ring if Impacted */}
                  {isImpacted && (
                    <rect
                      x={-5}
                      y={-5}
                      width={pos.w + 10}
                      height={pos.h + 10}
                      rx={15}
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth={2.5}
                      className="pulse-glow-crimson"
                      filter="url(#glow-crimson)"
                    />
                  )}

                  {/* Node Surface Box */}
                  <rect
                    width={pos.w}
                    height={pos.h}
                    rx={12}
                    fill={isSelected ? '#141E33' : isHovered ? '#121A2B' : '#0F1623'}
                    stroke={
                      isImpacted
                        ? '#F43F5E'
                        : isSelected
                        ? '#6366F1'
                        : isHovered
                        ? '#818CF8'
                        : '#1E293B'
                    }
                    strokeWidth={isSelected || isImpacted ? 2.4 : isHovered ? 1.8 : 1.2}
                    filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
                  />

                  {/* Top Status Accent Ribbon */}
                  <rect
                    x={0}
                    y={0}
                    width={pos.w}
                    height={3.5}
                    rx={1.75}
                    fill={
                      isImpacted
                        ? '#F43F5E'
                        : isSelected
                        ? '#6366F1'
                        : node.status === 'critical'
                        ? '#F43F5E'
                        : node.status === 'warning'
                        ? '#F59E0B'
                        : '#6366F1'
                    }
                  />

                  {/* Node Title */}
                  <text
                    x={14}
                    y={27}
                    fill="#F8FAFC"
                    fontSize="12.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.name}
                  </text>

                  {/* Type Badge */}
                  <rect
                    x={pos.w - 78}
                    y={13}
                    width={66}
                    height={18}
                    rx={4}
                    fill={isSelected ? '#1E293B' : '#1A2333'}
                    stroke="#334155"
                    strokeWidth={0.8}
                  />
                  <text
                    x={pos.w - 45}
                    y={25.5}
                    textAnchor="middle"
                    fill={isImpacted ? '#FDA4AF' : isSelected ? '#A5B4FC' : '#94A3B8'}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.type.toUpperCase()}
                  </text>

                  {/* Description */}
                  <text
                    x={14}
                    y={49}
                    fill="#94A3B8"
                    fontSize="9.5"
                    fontFamily="sans-serif"
                  >
                    {node.description.length > 44
                      ? node.description.slice(0, 44) + '...'
                      : node.description}
                  </text>

                  {/* Metrics Pill Bar */}
                  <rect
                    x={14}
                    y={68}
                    width={pos.w - 28}
                    height={26}
                    rx={6}
                    fill="#070B14"
                    stroke={isSelected ? '#312E81' : isImpacted ? '#881337' : '#1E293B'}
                    strokeWidth={0.8}
                  />

                  <text
                    x={22}
                    y={84.5}
                    fill="#64748B"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    Lines: <tspan fill="#F1F5F9" fontWeight="bold">{node.metrics.lines}</tspan> • Risk:{' '}
                    <tspan
                      fill={
                        node.metrics.riskScore >= 80
                          ? '#F43F5E'
                          : node.metrics.riskScore >= 50
                          ? '#F59E0B'
                          : '#10B981'
                      }
                      fontWeight="bold"
                    >
                      {node.metrics.riskScore}/100
                    </tspan>
                  </text>

                  {/* Optional Target / Impact Pill on Right of Metrics Bar */}
                  {isTargetFile ? (
                    <text
                      x={pos.w - 24}
                      y={84.5}
                      textAnchor="end"
                      fill="#F43F5E"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      💥 TARGET
                    </text>
                  ) : isImpacted ? (
                    <text
                      x={pos.w - 24}
                      y={84.5}
                      textAnchor="end"
                      fill="#FDA4AF"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      ⚠️ IMPACTED
                    </text>
                  ) : null}

                  {/* Anchor Port Connection Dots */}
                  <circle cx={0} cy={pos.h / 2} r={3} fill="#0F1623" stroke="#6366F1" strokeWidth={1} />
                  <circle cx={pos.w} cy={pos.h / 2} r={3} fill="#0F1623" stroke="#6366F1" strokeWidth={1} />
                  <circle cx={pos.w / 2} cy={0} r={3} fill="#0F1623" stroke="#6366F1" strokeWidth={1} />
                  <circle cx={pos.w / 2} cy={pos.h} r={3} fill="#0F1623" stroke="#6366F1" strokeWidth={1} />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Blueprint Legend Footer Bar */}
      <div className="h-7.5 border-t border-slate-800 bg-[#0F1623]/80 px-4 flex items-center justify-between text-[11px] font-mono text-zinc-400 shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Active Flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Hardcoded Rules
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Blast-Radius Target
          </span>
        </div>
        <span className="text-zinc-500 hidden sm:inline">
          Click any node to inspect side-by-side source & business rules
        </span>
      </div>
    </div>
  );
};
