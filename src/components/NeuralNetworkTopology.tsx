import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Network, Activity, Zap, Server, Box, Maximize2 } from 'lucide-react';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  status: 'active' | 'idle' | 'warning';
  load: number;
  z?: number; // Simulated Z-depth
}

interface Link extends d3.SimulationLinkDatum<Node> {
  value: number;
}

export const NeuralNetworkTopology: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [is3DMode, setIs3DMode] = useState(true);

  // Mouse tilt for pseudo-3D
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), { damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), { damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - (rect.left + rect.width / 2));
    mouseY.set(e.clientY - (rect.top + rect.height / 2));
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/system/nodes');
        const data = await response.json();
        if (data.nodes) {
          // Add random initial Z-depth for 3D effect
          const initializedNodes = data.nodes.map((n: Node) => ({
            ...n,
            z: Math.random() * 200 - 100
          }));
          setNodes(initializedNodes);
          renderGraph(initializedNodes);
        }
      } catch (err) {
        console.error('Failed to fetch system nodes:', err);
      }
    };

    const renderGraph = (nodes: Node[]) => {
      if (!svgRef.current || !containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = 400;

      const links: Link[] = [];
      nodes.forEach(n => {
        if (n.group !== 1) {
          const core = nodes.find(coreNode => coreNode.group === 1);
          if (core) {
            links.push({ source: core.id, target: n.id, value: 1 });
          }
        }
      });

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      // Create a background grid for 3D sense
      const gridG = svg.append('g').attr('class', 'grid').style('opacity', 0.2);
      for (let i = 0; i <= width; i += 40) {
        gridG.append('line').attr('x1', i).attr('y1', 0).attr('x2', i).attr('y2', height).attr('stroke', '#27272a');
      }
      for (let i = 0; i <= height; i += 40) {
        gridG.append('line').attr('x1', 0).attr('y1', i).attr('x2', width).attr('y2', i).attr('stroke', '#27272a');
      }

      const g = svg.append('g');

      const simulation = d3.forceSimulation<Node>(nodes)
        .force('link', d3.forceLink<Node, Link>(links).id(d => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(40));

      const link = g.append('g')
        .selectAll('line')
        .data(links)
        .enter().append('line')
        .attr('stroke', 'url(#link-gradient)')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5);

      let hoveredNodeId: string | null = null;
      let connectedNodeIds = new Set<string>();

      const updateHoverStates = () => {
        if (!hoveredNodeId) {
          node.transition().duration(200).style('opacity', d => 0.4 + ((d.z || 0) + 100) / 200);
          link.transition().duration(200).style('stroke-opacity', 0.4).attr('stroke-width', 1.5);
        } else {
          node.transition().duration(200).style('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.1);
          link.transition().duration(200)
            .style('stroke-opacity', d => ((d.source as Node).id === hoveredNodeId || (d.target as Node).id === hoveredNodeId) ? 0.8 : 0.05)
            .attr('stroke-width', d => ((d.source as Node).id === hoveredNodeId || (d.target as Node).id === hoveredNodeId) ? 3 : 1.5);
        }
      };

      const node = g.append('g')
        .selectAll('g')
        .data(nodes)
        .enter().append('g')
        .style('cursor', 'pointer')
        .on('click', (e, d) => setSelectedNode(d))
        .on('mouseenter', (e, d) => {
          hoveredNodeId = d.id;
          connectedNodeIds.clear();
          connectedNodeIds.add(d.id);
          links.forEach(l => {
            if ((l.source as Node).id === d.id) connectedNodeIds.add((l.target as Node).id);
            if ((l.target as Node).id === d.id) connectedNodeIds.add((l.source as Node).id);
          });
          updateHoverStates();
        })
        .on('mouseleave', () => {
          hoveredNodeId = null;
          connectedNodeIds.clear();
          updateHoverStates();
        })
        .call(d3.drag<SVGGElement, Node>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended));

      // Node base glow
      node.append('circle')
        .attr('r', d => 10 + (d.z || 0) / 50)
        .attr('fill', d => {
          if (d.status === 'active') return '#10b981';
          if (d.status === 'warning') return '#f59e0b';
          return '#71717a';
        })
        .attr('filter', 'url(#glow)')
        .style('opacity', d => 0.6 + (d.z || 0) / 250);

      // Node inner core
      node.append('circle')
        .attr('r', 4)
        .attr('fill', '#fff')
        .style('opacity', 0.9);

      node.append('text')
        .attr('dx', 15)
        .attr('dy', 5)
        .text(d => d.label)
        .attr('fill', '#a1a1aa')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Plus Jakarta Sans, sans-serif')
        .style('pointer-events', 'none');

      // Gradients and Filters
      const defs = svg.append('defs');
      
      const lg = defs.append('linearGradient').attr('id', 'link-gradient').attr('gradientUnits', 'userSpaceOnUse');
      lg.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6');
      lg.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');

      const filter = defs.append('filter').attr('id', 'glow');
      filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      simulation.on('tick', () => {
        link
          .attr('x1', d => (d.source as any).x)
          .attr('y1', d => (d.source as any).y)
          .attr('x2', d => (d.target as any).x)
          .attr('y2', d => (d.target as any).y);

        node
          .attr('transform', d => `translate(${d.x},${d.y})`)
          .style('opacity', d => {
            if (hoveredNodeId) return connectedNodeIds.has(d.id) ? 1 : 0.1;
            return 0.4 + ((d.z || 0) + 100) / 200;
          });
          
        // Adjust scale based on simulated depth
        node.selectAll('circle').attr('r', (d: any) => 8 + (d.z || 0) / 40);
      });

      function dragstarted(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event: any, d: any) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event: any, d: any) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    };

    fetchData();
  }, []);

  return (
    <motion.div 
      className="bg-zinc-950 border border-zinc-800 rounded-[2rem] p-8 space-y-8 shadow-2xl relative overflow-hidden group"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d'
      }}
    >
      <motion.div
        style={{
          rotateX: is3DMode ? rotateX : 0,
          rotateY: is3DMode ? rotateY : 0,
          transformStyle: 'preserve-3d'
        }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl">
              <Network size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Infrastructure Topology</h2>
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest">N+1 AXIOM Neural Mesh</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIs3DMode(!is3DMode)}
              className={`p-2 rounded-xl border transition-all ${is3DMode ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}
              title="Toggle 3D Viewport"
            >
              <Box size={18} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-400 uppercase font-black tracking-tighter">Live Mesh</span>
            </div>
          </div>
        </div>

        <div className="relative bg-zinc-900/30 rounded-3xl border border-zinc-800/50 overflow-hidden">
          <svg ref={svgRef} width="100%" height="400" className="cursor-crosshair" />
          
          <AnimatePresence>
            {selectedNode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                className="absolute top-6 right-6 w-64 p-6 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl z-10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                    <Maximize2 size={14} className="text-zinc-400" />
                  </div>
                  <button onClick={() => setSelectedNode(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <Activity size={16} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Node Identifier</div>
                    <div className="text-sm font-bold text-white font-mono truncate">{selectedNode.label}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[9px] text-zinc-500 uppercase font-black mb-1">Status</div>
                      <div className={`text-xs font-bold ${selectedNode.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedNode.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[9px] text-zinc-500 uppercase font-black mb-1">Load</div>
                      <div className="text-xs font-bold text-cyan-400">{selectedNode.load}%</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">ID: {selectedNode.id}</span>
                    <div className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] text-zinc-400 font-bold">L-{selectedNode.group}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-6 left-6 flex gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-600">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span>Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <span>Pressure</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          <div className="flex items-center gap-4 group/item">
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 transition-colors group-hover/item:border-cyan-500/50">
              <Activity size={18} className="text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Global Nodes</span>
              <span className="text-sm font-black text-white">{nodes.length} Connected</span>
            </div>
          </div>
          <div className="flex items-center gap-4 group/item">
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 transition-colors group-hover/item:border-emerald-500/50">
              <Zap size={18} className="text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Throughput</span>
              <span className="text-sm font-black text-white">4.2 GB/s</span>
            </div>
          </div>
          <div className="flex items-center gap-4 group/item">
            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 transition-colors group-hover/item:border-purple-500/50">
              <Server size={18} className="text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Protocol</span>
              <span className="text-sm font-black text-white">Axiomatic v4</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

