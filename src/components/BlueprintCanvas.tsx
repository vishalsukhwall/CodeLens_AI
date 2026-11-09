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
  Database,
  Cpu,
  Layers,
  FileText,
  Flame,
  AlertTriangle,
  ArrowRight,
  Info,
  Activity,
  ChevronsUpDown,
} from 'lucide-react';

interface BlueprintCanvasProps {
  nodes: ArchNode[];
  edges: ArchEdge[];
  selectedFile: CodeFile;
  onSelectNode: (nodeId: string, fileName: string) => void;
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
  simulation,
  activeSimulationTarget,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [zoom, setZoom] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Determine which files/nodes are affected by the current blast-radius simulation
  const impactedFiles = (simulation?.affectedModules || []).map((m) =>
    m.file.toLowerCase()
  );
  if (simulation?.targetFile) {
    impactedFiles.push(simulation.targetFile.toLowerCase());
  }

  // Generously spaced node coordinates for the 4-file blueprint topology
  // SVG ViewBox: 0 0 960 400 (generous 280px horizontal gap between columns)
  const nodeLayout: Record<string, { x: number; y: number; w: number; h: number }> = {
    'user-auth-schema': { x: 50, y: 50, w: 290, h: 105 },
    'monthly-billing-batch': { x: 620, y: 50, w: 290, h: 105 },
    'loan-interest-engine': { x: 620, y: 245, w: 290, h: 105 },
    'legacy-arch-notes': { x: 50, y: 245, w: 290, h: 105 },
  };

  const getNodePos = (id: string, idx: number) => {
    if (nodeLayout[id]) return nodeLayout[id];
    return {
      x: 50 + (idx % 2) * 570,
      y: 50 + Math.floor(idx / 2) * 195,
      w: 290,
      h: 105,
    };
  };

  return (
    <div className="w-full h-full flex flex-col bg-blueprint-950 blueprint-grid relative overflow-hidden select-none">
      {/* Blueprint Canvas Header Controls */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-blueprint-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-blueprint-800 shadow-md">
          <Activity className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-zinc-100">
            Visual Blueprint Flow Stage
          </span>
          {simulation && simulation.blastRadiusScore > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-400 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/40 pulse-crimson ml-2">
              <Flame className="h-3.5 w-3.5" />
              Impact Active: {simulation.blastRadiusScore}% Ripple
            </span>
          )}
        </div>

        {/* Zoom & Expand Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-blueprint-900/90 backdrop-blur-md border border-blueprint-800 rounded-lg p-1 shadow-md">
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-blueprint-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-mono text-zinc-300 px-1.5">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-blueprint-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-blueprint-800 transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Expand / Collapse Canvas Toggle */}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                isExpanded
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                  : 'bg-blueprint-800/80 text-zinc-300 border-blueprint-700 hover:text-white hover:bg-blueprint-700'
              }`}
              title={isExpanded ? 'Restore Split View' : 'Maximize Blueprint Stage'}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <ChevronsUpDown className="h-3 w-3" />}
              <span className="hidden sm:inline">{isExpanded ? 'Restore Split' : 'Maximize Canvas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas Area with Generous Padding */}
      <div className="flex-1 w-full h-full flex items-center justify-center p-6 min-h-[340px]">
        <svg
          viewBox="0 0 960 400"
          className="w-full h-full max-h-[380px] transition-transform duration-200"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          <defs>
            <marker
              id="edge-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366F1" />
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
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E" />
            </marker>
          </defs>

          {/* Edges */}
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

            // Connection coordinates
            let x1 = src.x + src.w;
            let y1 = src.y + src.h / 2;
            let x2 = tgt.x;
            let y2 = tgt.y + tgt.h / 2;

            if (src.x === tgt.x) {
              x1 = src.x + src.w / 2;
              y1 = src.y > tgt.y ? src.y : src.y + src.h;
              x2 = tgt.x + tgt.w / 2;
              y2 = src.y > tgt.y ? tgt.y + tgt.h : tgt.y;
            } else if (src.x > tgt.x) {
              x1 = src.x;
              x2 = tgt.x + tgt.w;
            }

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const strokeColor = isImpactedEdge
              ? '#F43F5E'
              : edge.severity === 'high'
              ? '#F43F5E'
              : edge.severity === 'medium'
              ? '#F59E0B'
              : '#6366F1';

            // Distinct edge label pill dimensions
            const labelWidth = Math.max(edge.label.length * 7.5 + 24, 130);

            return (
              <g key={edge.id} className="transition-all">
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={isImpactedEdge ? 3 : 2}
                  className="flow-edge-animated"
                  markerEnd={isImpactedEdge ? 'url(#edge-arrow-crimson)' : 'url(#edge-arrow)'}
                  opacity={0.88}
                />
                {/* Clean Non-Overlapping Edge Label Pill */}
                <rect
                  x={midX - labelWidth / 2}
                  y={midY - 11}
                  width={labelWidth}
                  height={22}
                  rx={6}
                  fill="#0B1120"
                  stroke={strokeColor}
                  strokeWidth={1}
                  opacity={0.96}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fill="#F1F5F9"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node, idx) => {
            const pos = getNodePos(node.id, idx);
            const isSelected =
              selectedFile.name.toLowerCase() === node.file.toLowerCase() ||
              node.id === selectedFile.id;

            const isImpacted = impactedFiles.some(
              (f) =>
                node.file.toLowerCase().includes(f) ||
                f.includes(node.file.toLowerCase())
            );

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onSelectNode(node.id, node.file)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer transition-all hover:scale-[1.02]"
              >
                {/* Outer Glow Ring if Impacted or Selected */}
                {isImpacted && (
                  <rect
                    x={-5}
                    y={-5}
                    width={pos.w + 10}
                    height={pos.h + 10}
                    rx={14}
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth={2.5}
                    className="pulse-crimson"
                  />
                )}

                {/* Node Box */}
                <rect
                  width={pos.w}
                  height={pos.h}
                  rx={10}
                  fill={isSelected ? '#141E33' : '#0B1120'}
                  stroke={
                    isImpacted
                      ? '#F43F5E'
                      : isSelected
                      ? '#6366F1'
                      : '#1E293B'
                  }
                  strokeWidth={isSelected || isImpacted ? 2.2 : 1.2}
                  filter="drop-shadow(0 4px 10px rgba(0,0,0,0.4))"
                />

                {/* Top Accent Ribbon */}
                <rect
                  x={0}
                  y={0}
                  width={pos.w}
                  height={3.5}
                  rx={1.75}
                  fill={
                    isImpacted
                      ? '#F43F5E'
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
                  y={26}
                  fill="#F8FAFC"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.name}
                </text>

                {/* Type Badge */}
                <rect
                  x={pos.w - 76}
                  y={13}
                  width={64}
                  height={18}
                  rx={4}
                  fill="#1E293B"
                />
                <text
                  x={pos.w - 44}
                  y={25.5}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.type.toUpperCase()}
                </text>

                {/* Description */}
                <text
                  x={14}
                  y={48}
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="sans-serif"
                >
                  {node.description.length > 42
                    ? node.description.slice(0, 42) + '...'
                    : node.description}
                </text>

                {/* Metrics Pill Bar */}
                <rect
                  x={14}
                  y={65}
                  width={pos.w - 28}
                  height={26}
                  rx={5}
                  fill="#070B14"
                  stroke="#1E293B"
                  strokeWidth={0.8}
                />
                <text
                  x={22}
                  y={81.5}
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
              </g>
            );
          })}
        </svg>
      </div>

      {/* Blueprint Legend Footer Bar */}
      <div className="h-8 border-t border-blueprint-800 bg-blueprint-900/60 px-5 flex items-center justify-between text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            Active Flow
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Hardcoded Rules
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Blast-Radius Target
          </span>
        </div>
        <span className="text-zinc-500 hidden sm:inline">
          Click any node to inspect side-by-side source & plain-English logic below
        </span>
      </div>
    </div>
  );
};
