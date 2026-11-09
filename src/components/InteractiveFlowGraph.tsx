'use client';

import React, { useState } from 'react';
import {
  ArchNode,
  ArchEdge,
  Citation,
} from '@/types/legacy';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Database,
  Cpu,
  Layers,
  FileText,
  AlertCircle,
  ArrowRight,
  Info,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface InteractiveFlowGraphProps {
  nodes: ArchNode[];
  edges: ArchEdge[];
  onSelectCitation?: (file: string, lineStart: number, lineEnd: number) => void;
}

export const InteractiveFlowGraph: React.FC<InteractiveFlowGraphProps> = ({
  nodes,
  edges,
  onSelectCitation,
}) => {
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    nodes[0]?.id || 'user-auth-schema'
  );
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // Coordinates for nodes in SVG canvas (width: 900, height: 440)
  const nodePositions: Record<string, { x: number; y: number; w: number; h: number }> = {
    'user-auth-schema': { x: 50, y: 50, w: 260, h: 105 },
    'monthly-billing-batch': { x: 580, y: 50, w: 270, h: 105 },
    'loan-interest-engine': { x: 580, y: 270, w: 270, h: 105 },
    'legacy-arch-notes': { x: 50, y: 270, w: 260, h: 105 },
  };

  // Fallback for custom nodes
  const getNodePos = (id: string, index: number) => {
    if (nodePositions[id]) return nodePositions[id];
    const col = index % 2;
    const row = Math.floor(index / 2);
    return {
      x: 50 + col * 530,
      y: 50 + row * 210,
      w: 260,
      h: 105,
    };
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4 text-emerald-400" />;
      case 'batch':
        return <Layers className="h-4 w-4 text-rose-400" />;
      case 'service':
        return <Cpu className="h-4 w-4 text-amber-400" />;
      default:
        return <FileText className="h-4 w-4 text-blue-400" />;
    }
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'high') return '#F43F5E';
    if (sev === 'medium') return '#F59E0B';
    return '#3B82F6';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Interactive SVG Graph Area (8 cols on lg) */}
      <div className="lg:col-span-8 flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-950 p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Interactive Cross-Module Dependency Flow
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">
              (Click nodes to inspect logic & callers)
            </span>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono text-zinc-400 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
              title="Reset Zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas viewport */}
        <div className="relative w-full h-[460px] overflow-hidden rounded-lg bg-zinc-900/40 border border-zinc-800/60 flex items-center justify-center">
          <svg
            viewBox="0 0 900 440"
            className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-200 select-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <defs>
              <marker
                id="arrow-high"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E" />
              </marker>
              <marker
                id="arrow-medium"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B" />
              </marker>
              <marker
                id="arrow-blue"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6" />
              </marker>
            </defs>

            {/* Subtle background grid */}
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1c1c24" strokeWidth="0.8" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Edges */}
            {edges.map((edge) => {
              const srcNodeIdx = nodes.findIndex((n) => n.id === edge.source);
              const tgtNodeIdx = nodes.findIndex((n) => n.id === edge.target);
              const src = getNodePos(edge.source, srcNodeIdx);
              const tgt = getNodePos(edge.target, tgtNodeIdx);

              const strokeColor = getSeverityColor(edge.severity);
              const markerId =
                edge.severity === 'high'
                  ? 'url(#arrow-high)'
                  : edge.severity === 'medium'
                  ? 'url(#arrow-medium)'
                  : 'url(#arrow-blue)';

              // Compute connection coordinates
              let x1 = src.x + src.w;
              let y1 = src.y + src.h / 2;
              let x2 = tgt.x;
              let y2 = tgt.y + tgt.h / 2;

              if (src.x === tgt.x) {
                // Vertical alignment
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

              return (
                <g
                  key={edge.id}
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredEdgeId(edge.id)}
                  onMouseLeave={() => setHoveredEdgeId(null)}
                >
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={hoveredEdgeId === edge.id ? 3.5 : 2}
                    strokeDasharray={edge.type === 'implicit' ? '5,5' : undefined}
                    markerEnd={markerId}
                    opacity={hoveredEdgeId && hoveredEdgeId !== edge.id ? 0.3 : 0.9}
                  />
                  {/* Edge label pill */}
                  <rect
                    x={midX - 70}
                    y={midY - 10}
                    width={140}
                    height={20}
                    rx={5}
                    fill="#121217"
                    stroke={strokeColor}
                    strokeWidth={1}
                    opacity={0.95}
                  />
                  <text
                    x={midX}
                    y={midY + 3.5}
                    textAnchor="middle"
                    fill="#e4e4e7"
                    fontSize="9"
                    fontWeight="600"
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
              const isSelected = selectedNodeId === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  {/* Card Background */}
                  <rect
                    width={pos.w}
                    height={pos.h}
                    rx={10}
                    fill={isSelected ? '#181822' : '#121217'}
                    stroke={
                      isSelected
                        ? '#3B82F6'
                        : node.status === 'critical'
                        ? '#F43F5E80'
                        : node.status === 'warning'
                        ? '#F59E0B80'
                        : '#27272a'
                    }
                    strokeWidth={isSelected ? 2 : 1.2}
                    className="filter drop-shadow-md transition-colors"
                  />

                  {/* Header bar indicator */}
                  <rect
                    x={0}
                    y={0}
                    width={pos.w}
                    height={4}
                    rx={2}
                    fill={
                      node.status === 'critical'
                        ? '#F43F5E'
                        : node.status === 'warning'
                        ? '#F59E0B'
                        : '#3B82F6'
                    }
                  />

                  {/* Node Title */}
                  <text
                    x={14}
                    y={28}
                    fill="#FFFFFF"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {node.name}
                  </text>

                  {/* Type badge */}
                  <rect
                    x={pos.w - 74}
                    y={15}
                    width={60}
                    height={18}
                    rx={4}
                    fill="#27272a"
                  />
                  <text
                    x={pos.w - 44}
                    y={27.5}
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {node.type.toUpperCase()}
                  </text>

                  {/* Description snippet */}
                  <text
                    x={14}
                    y={50}
                    fill="#a1a1aa"
                    fontSize="9.5"
                    fontFamily="sans-serif"
                  >
                    {node.description.length > 36
                      ? node.description.slice(0, 36) + '...'
                      : node.description}
                  </text>

                  {/* Metrics bar */}
                  <rect
                    x={14}
                    y={66}
                    width={pos.w - 28}
                    height={26}
                    rx={5}
                    fill="#18181f"
                    stroke="#27272a"
                    strokeWidth={0.8}
                  />
                  <text
                    x={22}
                    y={82}
                    fill="#71717a"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    Lines: <tspan fill="#e4e4e7">{node.metrics.lines}</tspan> • Risk:{' '}
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
      </div>

      {/* Inspector Panel (4 cols on lg) */}
      <div className="lg:col-span-4 flex flex-col rounded-xl border border-zinc-800/90 bg-zinc-950 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            {getNodeIcon(selectedNode.type)}
            <div>
              <h4 className="text-xs font-bold text-white font-mono">{selectedNode.name}</h4>
              <p className="text-[10px] text-zinc-400 font-mono">Lines {selectedNode.lines}</p>
            </div>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${
              selectedNode.status === 'critical'
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : selectedNode.status === 'warning'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {selectedNode.status}
          </span>
        </div>

        {/* Upstream & Downstream Dependents */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
              Upstream Callers
            </span>
            <div className="mt-1 font-mono text-zinc-200 text-[11px]">
              {selectedNode.upstreamIds.length > 0
                ? selectedNode.upstreamIds.join(', ')
                : 'Root (0 Callers)'}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-zinc-800">
            <span className="text-[10px] text-zinc-400 font-semibold block uppercase">
              Downstream Dep.
            </span>
            <div className="mt-1 font-mono text-zinc-200 text-[11px]">
              {selectedNode.downstreamIds.length > 0
                ? selectedNode.downstreamIds.join(', ')
                : 'Terminal (0 Deps)'}
            </div>
          </div>
        </div>

        {/* Plain-English Business Logic with Citation Pills */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-400" />
            Extracted Business Logic & Constraints
          </span>
          <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
            {(selectedNode.plainEnglishLogic || []).map((logic, lidx) => (
              <div
                key={lidx}
                className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80 leading-relaxed"
              >
                • {logic}
              </div>
            ))}
          </div>
        </div>

        {/* I/O Contracts */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Exported I/O Contracts
          </span>
          <div className="space-y-1.5 font-mono text-[11px]">
            {(selectedNode.contracts || []).map((contract, cidx) => (
              <div
                key={cidx}
                className="p-2 rounded bg-zinc-900 border border-zinc-800 text-blue-300 truncate"
                title={contract}
              >
                {contract}
              </div>
            ))}
          </div>
        </div>

        {/* Action to Jump to Code Viewer */}
        {onSelectCitation && (
          <button
            onClick={() => onSelectCitation(selectedNode.file, 1, 50)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 transition-colors"
          >
            <span>View Source Lines in Forensic Viewer</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
