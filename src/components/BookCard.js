import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getOpenLibraryCoverUrl } from '../services/bookCovers';
import './BookCard.css';

// ── Category themes ───────────────────────────────────────────────────────────
const CATEGORY_THEMES = {
  Fiction:       { colors: ['#1a0a2e','#4a1d96','#7c3aed'], accent: '#c4b5fd', pattern: 'fiction'      },
  'Non-Fiction': { colors: ['#0c1445','#1e3a8a','#2563eb'], accent: '#93c5fd', pattern: 'nonfiction'   },
  Science:       { colors: ['#022c22','#065f46','#059669'], accent: '#6ee7b7', pattern: 'science'       },
  History:       { colors: ['#1c0a00','#7c2d12','#c2410c'], accent: '#fdba74', pattern: 'history'       },
  Technology:    { colors: ['#0f0c29','#302b63','#24243e'], accent: '#a5b4fc', pattern: 'technology'    },
  Romance:       { colors: ['#4a0020','#9d174d','#db2777'], accent: '#fbcfe8', pattern: 'romance'       },
  Mystery:       { colors: ['#050510','#0f0f2e','#1e1b4b'], accent: '#94a3b8', pattern: 'mystery'       },
  Programming:   { colors: ['#001420','#002a40','#003d5c'], accent: '#38bdf8', pattern: 'programming'   },
  Biography:     { colors: ['#1c1006','#78350f','#b45309'], accent: '#fde68a', pattern: 'biography'     },
  'Self-Help':   { colors: ['#1a0800','#9a3412','#ea580c'], accent: '#fed7aa', pattern: 'selfhelp'      },
};

const DEFAULT_THEME = { colors: ['#1e1b4b','#312e81','#4338ca'], accent: '#818cf8', pattern: 'fiction' };

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ── Full-cover SVG Book Cover ─────────────────────────────────────────────────
function BookCoverSVG({ title, author, category, accent, colors, pattern }) {
  const initial  = (title || 'B')[0].toUpperCase();
  const short    = truncate(title, 40);
  const authorSh = truncate(author, 24);
  const uid      = `${initial}${(category||'').replace(/\s/g,'')}${Math.random().toString(36).slice(2,6)}`;

  const words    = (short || '').split(' ');
  const mid      = Math.ceil(words.length / 2);
  const line1    = words.slice(0, mid).join(' ');
  const line2    = words.slice(mid).join(' ');
  const isSingle = words.length <= 2 && short.length <= 13;
  const isLong   = short.length > 20;

  const [c0, c1, c2] = colors;

  return (
    <svg viewBox="0 0 260 340" xmlns="http://www.w3.org/2000/svg"
      width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id={`g1_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c0}/>
          <stop offset="50%"  stopColor={c1}/>
          <stop offset="100%" stopColor={c2}/>
        </linearGradient>
        <linearGradient id={`g2_${uid}`} x1="0%" y1="60%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.88)"/>
        </linearGradient>
        <linearGradient id={`g3_${uid}`} x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.07)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        <linearGradient id={`spine_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(0,0,0,0.5)"/>
          <stop offset="30%"  stopColor="rgba(0,0,0,0.15)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </linearGradient>
        <clipPath id={`clip_${uid}`}>
          <rect width="260" height="340" rx="0"/>
        </clipPath>
        <filter id={`glow_${uid}`}>
          <feGaussianBlur stdDeviation="8" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <g clipPath={`url(#clip_${uid})`}>

        {/* ── Full background ── */}
        <rect width="260" height="340" fill={`url(#g1_${uid})`}/>

        {/* ── Pattern fills ENTIRE cover ── */}

        {pattern === 'fiction' && (
          <g>
            {/* Deep space — full cover */}
            <circle cx="200" cy="80" r="120" fill={accent} opacity="0.04" filter={`url(#glow_${uid})`}/>
            <circle cx="200" cy="80" r="80"  fill={accent} opacity="0.06"/>
            <circle cx="200" cy="80" r="50"  fill={accent} opacity="0.08"/>
            <circle cx="200" cy="80" r="25"  fill={accent} opacity="0.15"/>
            <circle cx="200" cy="80" r="6"   fill={accent} opacity="0.7"/>
            {/* Orbital rings */}
            <ellipse cx="200" cy="80" rx="100" ry="38" fill="none" stroke={accent} strokeWidth="0.6" opacity="0.3"/>
            <ellipse cx="200" cy="80" rx="70"  ry="27" fill="none" stroke={accent} strokeWidth="0.6" opacity="0.4"
              transform="rotate(25 200 80)"/>
            {/* Stars scattered across full cover */}
            {[[20,20],[45,55],[70,15],[100,40],[130,25],[160,50],[230,30],[250,70],[30,120],[80,140],
              [110,100],[150,130],[190,150],[220,110],[245,140],[40,200],[90,220],[140,190],[200,210],
              [240,180],[20,260],[60,280],[110,250],[170,270],[220,240],[250,270],[130,310],[80,300]
            ].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r={i%3===0?1.5:0.8} fill="white" opacity={i%4===0?0.7:0.35}/>
            ))}
            {/* Milky way sweep */}
            <path d="M0 200 Q130 120 260 180" stroke={accent} strokeWidth="40" fill="none" opacity="0.04"/>
          </g>
        )}

        {pattern === 'nonfiction' && (
          <g>
            {/* Full grid of knowledge */}
            {Array.from({length:10}).map((_,row)=>
              Array.from({length:8}).map((_,col)=>(
                <circle key={`${row}-${col}`}
                  cx={15+col*34} cy={15+row*34} r="2.5"
                  fill={accent} opacity={0.12+((row+col)%3)*0.06}/>
              ))
            )}
            {/* Connecting lines */}
            {[[0,0,7,9],[2,1,5,8],[4,0,7,6],[1,3,6,7],[3,2,7,9]].map(([r1,c1,r2,c2],i)=>(
              <line key={i}
                x1={15+c1*34} y1={15+r1*34}
                x2={15+c2*34} y2={15+r2*34}
                stroke={accent} strokeWidth="0.6" opacity="0.2"/>
            ))}
            {/* Large geometric shape */}
            <polygon points="130,60 200,110 180,190 80,190 60,110"
              fill="none" stroke={accent} strokeWidth="1" opacity="0.2"/>
            <polygon points="130,80 185,120 168,180 92,180 75,120"
              fill={accent} opacity="0.05"/>
          </g>
        )}

        {pattern === 'science' && (
          <g>
            {/* Giant atom centered on full cover */}
            <circle cx="130" cy="150" r="12" fill={accent} opacity="0.5"/>
            <circle cx="130" cy="150" r="5"  fill={accent} opacity="0.9"/>
            {/* 3 orbital ellipses */}
            <ellipse cx="130" cy="150" rx="110" ry="40" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35"/>
            <ellipse cx="130" cy="150" rx="110" ry="40" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35"
              transform="rotate(60 130 150)"/>
            <ellipse cx="130" cy="150" rx="110" ry="40" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.35"
              transform="rotate(120 130 150)"/>
            {/* Electrons */}
            {[0,60,120,180,240,300].map((deg,i)=>{
              const a=deg*Math.PI/180;
              return <circle key={i} cx={130+Math.cos(a)*110} cy={150+Math.sin(a)*40} r="4" fill={accent} opacity="0.6"/>;
            })}
            {/* Background glow */}
            <circle cx="130" cy="150" r="80" fill={accent} opacity="0.04" filter={`url(#glow_${uid})`}/>
            {/* Scattered molecules */}
            {[[30,40],[220,60],[40,260],[220,260],[60,150],[200,130]].map(([x,y],i)=>(
              <g key={i}>
                <circle cx={x} cy={y} r="5" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.3"/>
                <circle cx={x} cy={y} r="2" fill={accent} opacity="0.3"/>
              </g>
            ))}
          </g>
        )}

        {pattern === 'history' && (
          <g>
            {/* Full architectural scene */}
            {/* Ground */}
            <rect x="0" y="260" width="260" height="5" fill={accent} opacity="0.25" rx="1"/>
            {/* 5 columns spanning full width */}
            {[20,65,110,155,200].map((x,i)=>(
              <g key={i}>
                <rect x={x} y="90" width="18" height="170" fill={accent} opacity="0.15" rx="1"/>
                {/* Fluting lines */}
                {[3,7,11,15].map(lx=>(
                  <rect key={lx} x={x+lx} y="90" width="0.8" height="170" fill={accent} opacity="0.2"/>
                ))}
                {/* Capital */}
                <rect x={x-5} y="82" width="28" height="10" fill={accent} opacity="0.3" rx="1"/>
                {/* Base */}
                <rect x={x-5} y="258" width="28" height="6" fill={accent} opacity="0.3" rx="1"/>
              </g>
            ))}
            {/* Pediment / triangle roof */}
            <polygon points="5,82 130,20 255,82" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.3"/>
            <polygon points="5,82 130,20 255,82" fill={accent} opacity="0.06"/>
            {/* Entablature */}
            <rect x="0" y="80" width="260" height="12" fill={accent} opacity="0.2" rx="1"/>
            {/* Sun above */}
            <circle cx="130" cy="18" r="10" fill={accent} opacity="0.35"/>
            {Array.from({length:10}).map((_,i)=>{
              const a=(i*36)*Math.PI/180;
              return <line key={i} x1={130+Math.cos(a)*14} y1={18+Math.sin(a)*14}
                x2={130+Math.cos(a)*22} y2={18+Math.sin(a)*22}
                stroke={accent} strokeWidth="1.2" opacity="0.4"/>;
            })}
          </g>
        )}

        {pattern === 'technology' && (
          <g>
            {/* Full PCB circuit board */}
            {/* Horizontal traces */}
            {[40,80,120,160,200,240,280].map((y,i)=>(
              <line key={`h${i}`} x1="0" y1={y} x2="260" y2={y}
                stroke={accent} strokeWidth="0.6" opacity="0.15"/>
            ))}
            {/* Vertical traces */}
            {[30,65,100,135,170,205,240].map((x,i)=>(
              <line key={`v${i}`} x1={x} y1="0" x2={x} y2="340"
                stroke={accent} strokeWidth="0.6" opacity="0.15"/>
            ))}
            {/* Active circuit traces (thicker) */}
            <path d="M0 60 H80 V120 H160 V60 H220 V180 H130 V240 H260"
              stroke={accent} strokeWidth="1.5" fill="none" opacity="0.5"/>
            <path d="M0 200 H50 V140 H120 V200 H190 V140 H260"
              stroke={accent} strokeWidth="1.5" fill="none" opacity="0.45"/>
            <path d="M50 0 V80 H120 V0" stroke={accent} strokeWidth="1.5" fill="none" opacity="0.4"/>
            <path d="M180 340 V260 H100 V300 H30 V340"
              stroke={accent} strokeWidth="1.5" fill="none" opacity="0.4"/>
            {/* Via holes (nodes) */}
            {[[80,120],[160,60],[220,180],[130,240],[50,140],[120,200],[190,140],
              [50,80],[120,80],[180,260],[100,300]].map(([cx,cy],i)=>(
              <g key={i}>
                <circle cx={cx} cy={cy} r="6" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.6"/>
                <circle cx={cx} cy={cy} r="2.5" fill={accent} opacity="0.7"/>
              </g>
            ))}
            {/* IC chip center */}
            <rect x="95" y="130" width="70" height="50" rx="3"
              fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5"/>
            <rect x="100" y="135" width="60" height="40" rx="2" fill={accent} opacity="0.06"/>
            {[140,150,160].map((y,i)=>(
              <line key={i} x1="100" y1={y} x2="155" y2={y} stroke={accent} strokeWidth="0.5" opacity="0.3"/>
            ))}
          </g>
        )}

        {pattern === 'romance' && (
          <g>
            {/* Full floral pattern */}
            {/* Large central bloom */}
            {[0,45,90,135,180,225,270,315].map((deg,i)=>{
              const a=deg*Math.PI/180;
              return (
                <g key={i}>
                  <ellipse cx={130+Math.cos(a)*55} cy={140+Math.sin(a)*55}
                    rx="35" ry="20" fill={accent} opacity="0.1"
                    transform={`rotate(${deg} ${130+Math.cos(a)*55} ${140+Math.sin(a)*55})`}/>
                </g>
              );
            })}
            <circle cx="130" cy="140" r="18" fill={accent} opacity="0.3"/>
            <circle cx="130" cy="140" r="8"  fill={accent} opacity="0.6"/>
            {/* Small blooms corners */}
            {[[30,40],[220,40],[30,260],[220,260],[130,30],[130,270]].map(([cx,cy],i)=>(
              <g key={i}>
                {[0,90,180,270].map((deg,j)=>{
                  const a=deg*Math.PI/180;
                  return <ellipse key={j} cx={cx+Math.cos(a)*18} cy={cy+Math.sin(a)*18}
                    rx="12" ry="7" fill={accent} opacity="0.12"
                    transform={`rotate(${deg} ${cx+Math.cos(a)*18} ${cy+Math.sin(a)*18})`}/>;
                })}
                <circle cx={cx} cy={cy} r="5" fill={accent} opacity="0.4"/>
              </g>
            ))}
            {/* Vine stems */}
            <path d="M0 100 Q65 80 130 140 T260 160" fill="none" stroke={accent} strokeWidth="1" opacity="0.2"/>
            <path d="M0 200 Q65 180 130 140 T260 120" fill="none" stroke={accent} strokeWidth="1" opacity="0.2"/>
          </g>
        )}

        {pattern === 'mystery' && (
          <g>
            {/* Full dark eye / noir */}
            {/* Concentric shapes */}
            <ellipse cx="130" cy="140" rx="120" ry="70" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.2"/>
            <ellipse cx="130" cy="140" rx="90"  ry="52" fill="none" stroke={accent} strokeWidth="0.8" opacity="0.25"/>
            <ellipse cx="130" cy="140" rx="60"  ry="35" fill="none" stroke={accent} strokeWidth="1"   opacity="0.3"/>
            <ellipse cx="130" cy="140" rx="35"  ry="20" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.4"/>
            <circle cx="130" cy="140" r="14" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.5"/>
            <circle cx="130" cy="140" r="6"  fill={accent} opacity="0.6"/>
            <circle cx="130" cy="140" r="2"  fill={accent} opacity="1"/>
            {/* Iris detail */}
            {Array.from({length:16}).map((_,i)=>{
              const a=(i*22.5)*Math.PI/180;
              return <line key={i}
                x1={130+Math.cos(a)*7}  y1={140+Math.sin(a)*7}
                x2={130+Math.cos(a)*14} y2={140+Math.sin(a)*14}
                stroke={accent} strokeWidth="0.8" opacity="0.6"/>;
            })}
            {/* Scattered shadow particles */}
            {[[20,30],[50,20],[200,40],[240,25],[15,180],[240,200],[30,290],[220,300],
              [80,60],[170,50],[90,240],[160,250]].map(([x,y],i)=>(
              <circle key={i} cx={x} cy={y} r={i%2===0?1.5:1} fill={accent} opacity="0.3"/>
            ))}
            {/* Dark fog bands */}
            <path d="M0 230 Q130 200 260 230" stroke={accent} strokeWidth="30" fill="none" opacity="0.04"/>
            <path d="M0 280 Q130 250 260 280" stroke={accent} strokeWidth="20" fill="none" opacity="0.05"/>
          </g>
        )}

        {pattern === 'programming' && (
          <g>
            {/* Full binary tree spanning entire cover */}
            {/* Level 0 — root */}
            <circle cx="130" cy="30" r="10" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.7"/>
            <circle cx="130" cy="30" r="4"  fill={accent} opacity="0.8"/>
            {/* Level 1 */}
            <line x1="130" y1="40" x2="65"  y2="85" stroke={accent} strokeWidth="1" opacity="0.5"/>
            <line x1="130" y1="40" x2="195" y2="85" stroke={accent} strokeWidth="1" opacity="0.5"/>
            {[65,195].map((cx,i)=>(
              <g key={i}>
                <circle cx={cx} cy="92" r="9" fill="none" stroke={accent} strokeWidth="1.3" opacity="0.65"/>
                <circle cx={cx} cy="92" r="3.5" fill={accent} opacity="0.7"/>
              </g>
            ))}
            {/* Level 2 */}
            {[[65,92,32,147],[65,92,98,147],[195,92,162,147],[195,92,228,147]].map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1+9} x2={x2} y2={y2-9} stroke={accent} strokeWidth="0.9" opacity="0.45"/>
            ))}
            {[32,98,162,228].map((cx,i)=>(
              <g key={i}>
                <circle cx={cx} cy="147" r="8" fill="none" stroke={accent} strokeWidth="1.2" opacity="0.6"/>
                <circle cx={cx} cy="147" r="3" fill={accent} opacity="0.6"/>
              </g>
            ))}
            {/* Level 3 */}
            {[[32,147,16,200],[32,147,48,200],[98,147,82,200],[98,147,114,200],
              [162,147,146,200],[162,147,178,200],[228,147,212,200],[228,147,244,200]].map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1+8} x2={x2} y2={y2-6} stroke={accent} strokeWidth="0.7" opacity="0.35"/>
            ))}
            {[16,48,82,114,146,178,212,244].map((cx,i)=>(
              <g key={i}>
                <circle cx={cx} cy="200" r="6" fill="none" stroke={accent} strokeWidth="1" opacity="0.5"/>
                <circle cx={cx} cy="200" r="2.5" fill={accent} opacity="0.5"/>
              </g>
            ))}
            {/* Decorative code symbols bottom */}
            <text x="30"  y="250" fontFamily="monospace" fontSize="11" fill={accent} opacity="0.15">{'<html>'}</text>
            <text x="140" y="250" fontFamily="monospace" fontSize="11" fill={accent} opacity="0.15">{'</>'}</text>
            <text x="60"  y="270" fontFamily="monospace" fontSize="10" fill={accent} opacity="0.12">{'fn main() {}'}</text>
            <text x="30"  y="290" fontFamily="monospace" fontSize="10" fill={accent} opacity="0.10">{'while(true){learn()}'}</text>
          </g>
        )}

        {pattern === 'biography' && (
          <g>
            {/* Full portrait + laurel across entire cover */}
            {/* Background texture — paper-like lines */}
            {[40,60,80,100,120,140,160,180,200,220,240].map((y,i)=>(
              <line key={i} x1="20" y1={y} x2="240" y2={y} stroke={accent} strokeWidth="0.4" opacity="0.1"/>
            ))}
            {/* Large portrait circle */}
            <circle cx="130" cy="120" r="75" fill={accent} opacity="0.06"/>
            <circle cx="130" cy="120" r="72" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.3"/>
            {/* Portrait silhouette */}
            <circle cx="130" cy="95"  r="30" fill={accent} opacity="0.2"/>
            <path d="M75 190 C75 145 185 145 185 190" fill={accent} opacity="0.18"/>
            {/* Inner detail */}
            <circle cx="130" cy="95"  r="30" fill="none" stroke={accent} strokeWidth="1" opacity="0.35"/>
            <path d="M75 190 C75 145 185 145 185 190" fill="none" stroke={accent} strokeWidth="1" opacity="0.35"/>
            {/* Laurel wreath around portrait */}
            {Array.from({length:20}).map((_,i)=>{
              const a = (i*18-90)*Math.PI/180;
              const r = 82;
              return <ellipse key={i}
                cx={130+Math.cos(a)*r} cy={120+Math.sin(a)*r}
                rx="8" ry="4" fill={accent} opacity="0.18"
                transform={`rotate(${i*18} ${130+Math.cos(a)*r} ${120+Math.sin(a)*r})`}/>;
            })}
            {/* Name plate lines */}
            <rect x="60"  y="210" width="140" height="3" rx="1.5" fill={accent} opacity="0.35"/>
            <rect x="80"  y="220" width="100" height="2" rx="1"   fill={accent} opacity="0.25"/>
            <rect x="95"  y="230" width="70"  height="2" rx="1"   fill={accent} opacity="0.18"/>
          </g>
        )}

        {pattern === 'selfhelp' && (
          <g>
            {/* Full rising sun + mountain */}
            {/* Rays spanning full cover */}
            {Array.from({length:18}).map((_,i)=>{
              const a=(i*20-90)*Math.PI/180;
              return <line key={i}
                x1={130+Math.cos(a)*40} y1={160+Math.sin(a)*40}
                x2={130+Math.cos(a)*200} y2={160+Math.sin(a)*200}
                stroke={accent} strokeWidth="1" opacity="0.08"/>;
            })}
            {/* Sun */}
            <circle cx="130" cy="130" r="50" fill={accent} opacity="0.08" filter={`url(#glow_${uid})`}/>
            <circle cx="130" cy="130" r="35" fill={accent} opacity="0.12"/>
            <circle cx="130" cy="130" r="22" fill={accent} opacity="0.25"/>
            <circle cx="130" cy="130" r="12" fill={accent} opacity="0.5"/>
            {/* Mountain silhouette */}
            <polygon points="0,280 80,160 130,210 180,140 260,280"
              fill={accent} opacity="0.12"/>
            <polygon points="0,280 80,160 130,210 180,140 260,280"
              fill="none" stroke={accent} strokeWidth="1.5" opacity="0.3"/>
            {/* Arrow / path upward */}
            <path d="M130 250 L130 100" stroke={accent} strokeWidth="2.5" opacity="0.35"
              strokeLinecap="round" strokeDasharray="4 6"/>
            <polygon points="130,90 120,110 140,110" fill={accent} opacity="0.45"/>
            {/* Horizon glow */}
            <ellipse cx="130" cy="280" rx="160" ry="30" fill={accent} opacity="0.06"/>
          </g>
        )}

        {/* ── Light shine overlay — top-left gloss ── */}
        <rect width="260" height="340" fill={`url(#g3_${uid})`}/>

        {/* ── Bottom gradient for text readability ── */}
        <rect width="260" height="340" fill={`url(#g2_${uid})`}/>

        {/* ── Spine shadow ── */}
        <rect width="260" height="340" fill={`url(#spine_${uid})`}/>

        {/* ── Spine accent line ── */}
        <rect x="0" y="0" width="5" height="340" fill={accent} opacity="0.55" rx="1"/>

        {/* ── Category badge ── */}
        <rect x="14" y="15"
          width={Math.min((category||'').length * 6.8 + 20, 140)} height="20"
          rx="10" fill={accent} opacity="0.2"/>
        <rect x="14" y="15"
          width={Math.min((category||'').length * 6.8 + 20, 140)} height="20"
          rx="10" fill="none" stroke={accent} strokeWidth="0.7" opacity="0.6"/>
        <text x="24" y="29"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="9" fontWeight="800" fill={accent} letterSpacing="0.12em">
          {(category || 'BOOK').toUpperCase()}
        </text>

        {/* ── Title ── */}
        {isSingle ? (
          <text x="16" y="283"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="20" fontWeight="700" fill="#ffffff" letterSpacing="-0.3">
            {short}
          </text>
        ) : (
          <>
            <text x="16" y="275"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={isLong ? "16" : "19"} fontWeight="700" fill="#ffffff" letterSpacing="-0.3">
              {line1}
            </text>
            <text x="16" y={isLong ? "293" : "298"}
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={isLong ? "16" : "19"} fontWeight="700" fill="#ffffff" letterSpacing="-0.3">
              {line2}
            </text>
          </>
        )}

        {/* ── Divider line ── */}
        <rect x="16" y="308" width="60" height="1.5" rx="1" fill={accent} opacity="0.8"/>

        {/* ── Author ── */}
        <text x="16" y="328"
          fontFamily="system-ui, sans-serif"
          fontSize="11" fontStyle="italic"
          fill="rgba(255,255,255,0.55)">
          {authorSh}
        </text>

      </g>
    </svg>
  );
}

// ── BookCover wrapper ─────────────────────────────────────────────────────────
function BookCover({ book, theme }) {
  const [imageError, setImageError] = React.useState(false);

  let bookData = { ...book };
  if (!bookData.isbn && typeof window !== 'undefined') {
    const s = localStorage.getItem(`book_isbn_${book.id}`);
    if (s) bookData.isbn = s;
  }
  if (!bookData.coverUrl && typeof window !== 'undefined') {
    const s = localStorage.getItem(`book_cover_${book.id}`);
    if (s) bookData.coverUrl = s;
  }

  const coverUrl = getOpenLibraryCoverUrl(bookData);

  if (coverUrl && !imageError) {
    return (
      <img src={coverUrl} alt={book.title}
        className="book-cover-image"
        onError={() => setImageError(true)}/>
    );
  }

  return (
    <BookCoverSVG
      title={book.title}
      author={book.author}
      category={book.category || 'Book'}
      accent={theme.accent}
      colors={theme.colors}
      pattern={theme.pattern}
    />
  );
}

// ── BookCard ──────────────────────────────────────────────────────────────────
export default function BookCard({ book, onEdit, onDelete, onAddToCart, isAdmin, isLoggedIn }) {
  const [adding, setAdding] = useState(false);
  const [added,  setAdded]  = useState(false);

  const theme   = CATEGORY_THEMES[book.category] || DEFAULT_THEME;
  const inStock = book.stock > 0;

  const handleAddToCart = async () => {
    if (!onAddToCart || adding || added) return;
    setAdding(true);
    try {
      await onAddToCart(book);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // handled in parent
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="book-card fade-up">
      <Link to={`/books/${book.id}`} className="book-card-link">
        <div className="book-cover">
          <BookCover book={book} theme={theme} />
          {!inStock && <div className="book-out-of-stock">Out of Stock</div>}
        </div>

        <div className="book-info">
          <h3 className="book-title">{book.title}</h3>
          <p className="book-author">by {book.author}</p>

          <div className="book-meta">
            <span className="book-price">&#8377;{book.price?.toFixed(2)}</span>
            <span className="book-stock" style={{ color: inStock ? 'var(--green)' : 'var(--red)' }}>
              {inStock ? 'Available' : 'Out of stock'}
            </span>
          </div>
        </div>
      </Link>

      <div className="book-actions">
        {!isAdmin && inStock && (
          <button
            className={`btn btn-xs btn-cart ${added ? 'btn-cart-added' : ''}`}
            onClick={(e) => { e.preventDefault(); handleAddToCart(); }}
            disabled={adding || added}
            style={{ flex: 1 }}
          >
                {adding ? '...' : added ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Added
                  </>
                ) : isLoggedIn ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.98-1.72L23 6H6"/>
                    </svg>
                    Add to Cart
                  </>
                ) : (
                  'Login to Buy'
                )}
          </button>
        )}

        {isAdmin && (
          <>
            <button className="btn btn-ghost btn-xs" style={{ flex: 1 }} onClick={(e) => { e.preventDefault(); onEdit(book); }}>Edit</button>
            <button className="btn btn-danger btn-xs" style={{ flex: 1 }} onClick={(e) => { e.preventDefault(); onDelete(book.id); }}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}