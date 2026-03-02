import React, { useState } from 'react';
import { 
  MessageSquare, 
  Activity, 
  Layout, 
  MessageCircle, 
  Copy, 
  MoreHorizontal, 
  Search, 
  User, 
  UserPlus, 
  Zap, 
  Clock, 
  FileText
} from 'lucide-react';

// --- Sub-Component: 简单的 SVG 雷达图 ---
const RadarChart = ({ data }) => {
  const size = 200;
  const center = size / 2;
  const radius = 60; // Slightly smaller to fit labels
  
  // Data order: Price (Top), Needs (Right), Consensus (Bottom), Trust (Left)
  const axes = [
    { label: '价格', key: 'price', x: 0, y: -1 },
    { label: '需求', key: 'needs', x: 1, y: 0 },
    { label: '共识', key: 'consensus', x: 0, y: 1 },
    { label: '信任', key: 'trust', x: -1, y: 0 },
  ];

  const getPoint = (value, axisIndex) => {
    const axis = axes[axisIndex];
    const scale = value / 100;
    return {
      x: center + axis.x * radius * scale,
      y: center + axis.y * radius * scale
    };
  };

  const points = axes.map((_, i) => getPoint(data[axes[i].key], i));
  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const fullPolyPoints = axes.map((_, i) => {
      const p = getPoint(100, i); 
      return `${p.x},${p.y}`;
  }).join(' ');

  return (
    <div className="relative w-full h-[180px] flex items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid (Full 100%) */}
        <polygon points={fullPolyPoints} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" />
        {/* Background Grid (50%) */}
        <polygon points={axes.map((_, i) => {
             const p = getPoint(50, i); 
             return `${p.x},${p.y}`;
        }).join(' ')} fill="none" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* Axes Lines */}
        {axes.map((axis, i) => {
           const p = getPoint(100, i);
           return (
             <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />
           );
        })}

        {/* Data Polygon */}
        <polygon points={polyPoints} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
        
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#2563eb" />
        ))}

        {/* Labels */}
        {axes.map((axis, i) => {
          const p = getPoint(120, i); // Push labels out a bit
          return (
             <text 
               key={i} 
               x={p.x} 
               y={p.y + 4} 
               textAnchor="middle" 
               className="text-[10px] fill-gray-500 font-medium"
             >
               {axis.label}
             </text>
          );
        })}
      </svg>
      {/* Central Score Overlay (Optional, visually nice) */}
      <div className="absolute text-[10px] font-bold text-blue-600 bg-white/80 px-1 rounded">
        AI
      </div>
    </div>
  );
};

const TripleHitDemo = () => {
  // --- Sidebar Simulation State ---
  const [chatInput, setChatInput] = useState('');
  const [toast, setToast] = useState(null);

  // --- Sidebar Logic ---
  const handleCopyScript = (text) => {
    setChatInput(text);
    setToast("已复制并粘贴到输入框");
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans flex flex-col">
      {/* Global Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded text-white">
            <Activity size={20} />
          </div>
          <h1 className="text-lg font-bold text-gray-800">华坤AI销售系统</h1>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">工作台视图</span>
        </div>
        
        <div className="flex items-center gap-3 text-sm text-gray-500">
           <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> 系统在线</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative p-4">
        
          <div className="h-full flex max-w-[1400px] mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200">
            {/* 1. Far Left Nav (WeCom Style) */}
            <div className="w-[60px] bg-[#2e2e2e] flex flex-col items-center py-4 gap-6 text-gray-400 shrink-0">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sales" className="w-9 h-9 rounded bg-white mb-4" alt="Me" />
               <MessageCircle className="text-green-500 cursor-pointer" />
               <Layout className="hover:text-white cursor-pointer" />
               <User className="hover:text-white cursor-pointer" />
            </div>

            {/* 2. Chat List (Simplified) */}
            <div className="w-[240px] bg-[#f7f7f7] border-r border-gray-200 flex flex-col shrink-0 hidden md:flex">
              <div className="p-3 bg-[#f7f7f7] border-b border-gray-200 flex items-center gap-2">
                 <div className="bg-gray-200 flex items-center px-2 py-1 rounded w-full">
                    <Search size={14} className="text-gray-500" />
                    <span className="text-xs text-gray-400 ml-2">搜索</span>
                 </div>
                 <button className="bg-gray-200 p-1 rounded text-gray-500"><UserPlus size={14} /></button>
              </div>
              <div className="overflow-y-auto flex-1">
                {/* Active Chat */}
                <div className="p-3 bg-[#e9e9e9] flex gap-3 cursor-pointer">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ZhangSan" className="w-10 h-10 rounded" alt="User" />
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center mb-1">
                       <span className="font-medium text-sm truncate">学员-张三</span>
                       <span className="text-[10px] text-gray-400">14:20</span>
                     </div>
                     <p className="text-xs text-gray-500 truncate">这里想问一下分期的具体...</p>
                   </div>
                </div>
                {/* Other Chats */}
                {[1,2,3].map(i => (
                   <div key={i} className="p-3 hover:bg-[#e9e9e9] flex gap-3 cursor-pointer transition-colors">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className="w-10 h-10 rounded grayscale opacity-70" alt="User" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm text-gray-600 truncate">潜在客户 {i}</span>
                          <span className="text-[10px] text-gray-400">昨天</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">好的，我考虑一下。</p>
                      </div>
                   </div>
                ))}
              </div>
            </div>

            {/* 3. Main Chat Window */}
            <div className="flex-1 flex flex-col bg-[#f5f5f5] relative min-w-0">
               {/* Chat Header */}
               <div className="h-14 border-b border-gray-200 flex justify-between items-center px-4 bg-[#f5f5f5]">
                  <h2 className="font-bold text-gray-800">学员-张三 @ 抖音来源</h2>
                  <MoreHorizontal className="text-gray-500 cursor-pointer" />
               </div>

               {/* Messages Area */}
               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="text-center text-xs text-gray-400 my-2">10月24日 14:00</div>
                  {/* Sales Msg */}
                  <div className="flex justify-end gap-3">
                     <div className="bg-[#95ec69] p-2.5 rounded-lg max-w-[80%] text-sm shadow-sm border border-[#85d85d]">
                        你好，欢迎加入华坤AI训练营！我是你的专属顾问。
                     </div>
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sales" className="w-9 h-9 rounded" alt="Me" />
                  </div>
                  {/* User Msg */}
                  <div className="flex justify-start gap-3">
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ZhangSan" className="w-9 h-9 rounded" alt="User" />
                     <div className="bg-white p-2.5 rounded-lg max-w-[80%] text-sm shadow-sm border border-gray-200">
                        老师，我看直播说今天有优惠，但是2980对我来说有点贵，能不能便宜点？
                     </div>
                  </div>
               </div>

               {/* Input Area */}
               <div className="h-[140px] border-t border-gray-200 bg-white flex flex-col">
                  <div className="flex items-center gap-4 px-4 py-2 text-gray-500">
                     <FileText size={18} className="cursor-pointer hover:text-gray-700" />
                     <MessageSquare size={18} className="cursor-pointer hover:text-gray-700" />
                  </div>
                  <textarea 
                    className="flex-1 resize-none outline-none px-4 py-1 text-sm text-gray-700"
                    placeholder="输入消息..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  ></textarea>
                  <div className="flex justify-end px-4 py-2">
                     <button className="bg-[#e9e9e9] text-gray-400 px-4 py-1 rounded text-sm hover:bg-[#d2d2d2] hover:text-gray-600 transition-colors">发送(S)</button>
                  </div>
               </div>

               {/* Toast Notification */}
               {toast && (
                 <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded shadow-lg text-sm animate-fadeIn">
                   {toast}
                 </div>
               )}
            </div>

            {/* 4. Sales Sidebar (THE REQUEST) */}
            <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col h-full shrink-0 overflow-hidden">
               {/* Sidebar Header: Tabs */}
               <div className="flex border-b border-gray-200">
                  <button className="flex-1 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50/50">客户详情</button>
                  <button className="flex-1 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50">话术库</button>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {/* Section A: Customer Profile */}
                  <div className="p-4 border-b border-gray-100 relative">
                     <div className="flex items-start gap-3">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=ZhangSan" className="w-12 h-12 rounded bg-gray-100" alt="User" />
                        <div className="flex-1">
                           <h3 className="font-bold text-gray-800 text-lg flex items-center justify-between">
                             张三 
                             <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border">UI设计师</span>
                           </h3>
                           <p className="text-xs text-gray-500 mt-0.5">28岁 | 北京 | 抖音来源</p>
                        </div>
                     </div>
                     
                     {/* Score Badge - Absolute Positioned or Flex */}
                     <div className="mt-4 flex items-center justify-between bg-red-50 border border-red-100 rounded-lg p-2">
                        <div className="flex flex-col">
                           <span className="text-[10px] text-red-400 font-semibold uppercase">AI 意向度评分</span>
                           <span className="text-2xl font-black text-red-600 leading-none">92<span className="text-sm font-normal">分</span></span>
                        </div>
                        <div className="bg-red-500 text-white text-xl font-bold px-3 py-1 rounded shadow-sm shadow-red-200">
                           S 量
                        </div>
                     </div>
                  </div>

                  {/* Section B: AI Radar & Analysis */}
                  <div className="p-4 border-b border-gray-100">
                     <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
                        <Activity size={12} /> 多维画像分析
                     </h4>
                     
                     {/* Radar Chart Component */}
                     <RadarChart data={{ price: 30, needs: 90, consensus: 70, trust: 85 }} />
                     
                     {/* AI Summary */}
                     <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                        <div className="flex items-start gap-2">
                           <Zap size={14} className="text-blue-500 mt-0.5 shrink-0" />
                           <p className="text-xs text-gray-700 leading-relaxed">
                              <span className="font-bold text-blue-700">AI 洞察：</span>
                              张三是典型的<span className="font-bold text-red-500">S量学员</span>，对职业转型需求极其强烈（UI转AI），但对<span className="bg-yellow-200 px-1 rounded">价格敏感</span>（价格维度得分低）。已建立基础信任，建议主推<span className="underline decoration-blue-400 decoration-wavy">分期方案</span>降低门槛。
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Section C: Timeline */}
                  <div className="p-4 border-b border-gray-100">
                     <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1">
                        <Clock size={12} /> 关键行为轨迹
                     </h4>
                     <div className="relative pl-2 ml-1 space-y-4 before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-0 before:w-0.5 before:bg-gray-200">
                        {/* Event 1 */}
                        <div className="relative pl-4">
                           <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                           <p className="text-xs font-bold text-gray-700">✅ DAY1 申请规划卡片</p>
                           <p className="text-[10px] text-gray-400">昨天 19:30</p>
                        </div>
                        {/* Event 2 */}
                        <div className="relative pl-4">
                           <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-orange-400 border-2 border-white shadow-sm"></div>
                           <p className="text-xs font-bold text-gray-700">⏳ DAY2 首次触发秒杀</p>
                           <p className="text-[10px] text-gray-400">今天 10:00 • 停留5分钟未支付</p>
                        </div>
                        {/* Event 3 */}
                        <div className="relative pl-4 opacity-70">
                           <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white"></div>
                           <p className="text-xs text-gray-600">10/03 观看直播30分钟</p>
                        </div>
                     </div>
                  </div>

                  {/* Section D: Script Recommendations */}
                  <div className="p-4 bg-gray-50 h-full">
                     <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center justify-between">
                        <span>💡 AI 话术推荐</span>
                        <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-blue-600">S量-价格敏感</span>
                     </h4>
                     <div className="space-y-2.5">
                        
                        {/* Script Card 1 */}
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative" onClick={() => handleCopyScript("我完全理解您的压力。其实正因为现在行业变化快，早点掌握AI反而能帮您接更多私单。考虑到您的预算，我们可以申请免息分期，每天仅需一杯咖啡钱。")}>
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">异议处理-嫌贵</span>
                              <Copy size={12} className="text-gray-300 group-hover:text-blue-500" />
                           </div>
                           <p className="text-xs text-gray-600 leading-5">
                              "我完全理解您的压力...考虑到您的预算，我们可以申请<span className="font-bold text-blue-600">免息分期</span>，每天仅需一杯咖啡钱。"
                           </p>
                        </div>

                        {/* Script Card 2 */}
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => handleCopyScript("张同学，咱们这期特训营只剩最后3个名额了。如果您今天能定下来，我可以帮您额外申请一个【往期优秀学员案例库】的权限（价值599元）。")}>
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">逼单-限时权益</span>
                              <Copy size={12} className="text-gray-300 group-hover:text-blue-500" />
                           </div>
                           <p className="text-xs text-gray-600 leading-5">
                              "张同学，咱们这期特训营只剩最后3个名额了...帮您额外申请一个<span className="font-bold text-blue-600">【案例库】权限</span>..."
                           </p>
                        </div>

                         {/* Script Card 3 */}
                         <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => handleCopyScript("您担心的主要是怕学不会吗？其实我们这套课程专门针对零基础设计，前三天都有助教1对1带跑...")}>
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">共识-建立信心</span>
                              <Copy size={12} className="text-gray-300 group-hover:text-blue-500" />
                           </div>
                           <p className="text-xs text-gray-600 leading-5">
                              "您担心的主要是怕学不会吗？其实我们这套课程专门针对零基础..."
                           </p>
                        </div>

                     </div>
                  </div>

               </div>
            </div>
          </div>

      </div>
    </div>
  );
};

export default TripleHitDemo;