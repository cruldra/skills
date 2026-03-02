import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Activity, 
  Cpu, 
  Zap, 
  MessageSquare, 
  Settings, 
  Users, 
  ShieldAlert, 
  Layers, 
  ArrowDown,
  ArrowRight,
  Play,
  Terminal,
  Server,
  Radio,
  GitMerge,
  Box
} from 'lucide-react';

// --- Configuration Data ---

const LAYERS = {
  PERCEPTION: {
    id: 'layer1',
    title: '1. 感知层 (Perception)',
    subtitle: '事件驱动信号总线 (Event Bus)',
    color: 'border-orange-500 bg-orange-900/10 text-orange-500',
    icon: <Radio className="w-5 h-5" />,
    desc: '系统的“耳目”。负责实时监听全渠道的异构信号，清洗并标准化为内部事件。',
    modules: ['Webhook 接收器', '直播埋点清洗', '事件去重/防抖', 'Kafka 消息队列']
  },
  DECISION: {
    id: 'layer2',
    title: '2. 决策层 (Decision)',
    subtitle: 'FSM 状态机 & 策略路由 (The Brain)',
    color: 'border-green-500 bg-green-900/10 text-green-500',
    icon: <Cpu className="w-5 h-5" />,
    desc: '系统的“大脑”。维护客户状态(FSM)，基于规则引擎和原子事实做出判断，驱动 AI 生成策略。',
    modules: ['动态客户状态机 (FSM)', '分层策略路由引擎', '冲突消解中心', 'AI Agent & RAG']
  },
  EXECUTION: {
    id: 'layer3',
    title: '3. 执行层 (Execution)',
    subtitle: '通道抽象网关 (Channel Gateway)',
    color: 'border-red-500 bg-red-900/10 text-red-500',
    icon: <Zap className="w-5 h-5" />,
    desc: '系统的“手脚”。屏蔽底层 API 差异，负责安全、合规地将指令触达给客户。',
    modules: ['统一发送指令接口', '高频防护 & 熔断', '企微/短信/外呼适配器', '通道自动切换']
  }
};

const WINGS = {
  LEFT: {
    id: 'wing_left',
    title: '🦅 左翼：销售实操工作台',
    role: 'Human-in-the-loop (交互)',
    color: 'border-blue-500 bg-blue-900/10 text-blue-400',
    icon: <Users className="w-5 h-5" />,
    modules: ['企微侧边栏 (H5)', '实时漏斗仪表盘', '人工干预/改派', '待办任务中心']
  },
  RIGHT: {
    id: 'wing_right',
    title: '🦅 右翼：运营配置中心',
    role: 'Configuration (规则)',
    color: 'border-purple-500 bg-purple-900/10 text-purple-400',
    icon: <Settings className="w-5 h-5" />,
    modules: ['策略画布配置', '原子事实管理 (价格/政策)', '人群包与LTV配置', '审计与风控日志']
  }
};

const SCENARIOS = [
  {
    id: 'pay_success',
    name: '模拟：支付成功 (Happy Path)',
    steps: [
      { layer: 'layer1', msg: '收到 Payment_Success Webhook (Order: #9527)' },
      { layer: 'layer2', msg: 'FSM 状态流转: [未支付] -> [已成交]' },
      { layer: 'layer2', msg: '策略路由: 触发 [履约发课] 剧本' },
      { layer: 'layer3', msg: '指令下发: 发送 [入学通知] + [助教二维码]' },
      { layer: 'wing_left', msg: '销售侧边栏: 客户标签更新为 [S级学员]' }
    ]
  },
  {
    id: 'inventory_low',
    name: '模拟：库存告急 (Event Routing)',
    steps: [
      { layer: 'layer1', msg: 'Redis 监控: 库存跌破阈值 (Stock < 3)' },
      { layer: 'layer2', msg: '事件路由: 触发 [P0 级紧急中断]' },
      { layer: 'layer2', msg: 'AI 决策: 切换话术为 [库存逼单剧本]' },
      { layer: 'layer3', msg: '群发任务: 向 50 名意向用户发送 [锁单提醒]' }
    ]
  },
  {
    id: 'risk_control',
    name: '模拟：高频风控 (Protection)',
    steps: [
      { layer: 'layer1', msg: '收到用户频繁点击 [退款] (5次/min)' },
      { layer: 'layer2', msg: '决策: 识别为恶意行为，拒绝退款' },
      { layer: 'layer3', msg: '通道网关: 拦截短信发送 (熔断保护)' },
      { layer: 'wing_right', msg: '运营中心: 写入风控审计日志' }
    ]
  }
];

export default function SystemArchitecture() {
  const [activeLayer, setActiveLayer] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [simStep, setSimStep] = useState(-1);
  const [logs, setLogs] = useState([]);

  // --- Simulation Logic ---
  const runSimulation = (scenarioId) => {
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    setSimulation(scenario);
    setSimStep(0);
    setLogs([{ time: new Date().toLocaleTimeString(), msg: `🚀 开始模拟: ${scenario.name}` }]);
  };

  useEffect(() => {
    if (simulation && simStep < simulation.steps.length) {
      const timer = setTimeout(() => {
        const currentStep = simulation.steps[simStep];
        setActiveLayer(currentStep.layer);
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: currentStep.msg }, ...prev]);
        
        if (simStep < simulation.steps.length - 1) {
          setSimStep(prev => prev + 1);
        } else {
          // Finish
          setTimeout(() => {
            setActiveLayer(null);
            setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg: '✅ 流程结束' }, ...prev]);
          }, 1500);
        }
      }, 1200); // Step duration
      return () => clearTimeout(timer);
    }
  }, [simulation, simStep]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 overflow-hidden relative selection:bg-indigo-500 selection:text-white">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-3">
            智能销售系统架构视图
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            基于 <span className="text-indigo-400 font-bold">“三层两翼”</span> 设计理念 • 事件驱动与状态机决策模型
          </p>
        </header>

        {/* Main Architecture Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[700px] lg:h-[600px]">
          
          {/* Left Wing (Sales) */}
          <div className="lg:col-span-3 h-full flex flex-col justify-center">
            <WingCard 
              config={WINGS.LEFT} 
              isActive={activeLayer === 'wing_left'} 
            />
            {/* Connection Line */}
            <div className="hidden lg:flex justify-center my-4">
               <ArrowRight className="text-slate-600 animate-pulse" />
            </div>
          </div>

          {/* Center Core (Three Layers) */}
          <div className="lg:col-span-6 h-full flex flex-col gap-4 relative">
            
            {/* Vertical Flow Line */}
            <div className="absolute left-1/2 top-4 bottom-4 w-0.5 bg-gradient-to-b from-orange-500/20 via-green-500/20 to-red-500/20 -translate-x-1/2 -z-10"></div>

            {/* Layer 1: Perception */}
            <LayerCard 
              config={LAYERS.PERCEPTION} 
              isActive={activeLayer === 'layer1'} 
            />

            <FlowArrow />

            {/* Layer 2: Decision */}
            <LayerCard 
              config={LAYERS.DECISION} 
              isActive={activeLayer === 'layer2'} 
            />

            <FlowArrow />

            {/* Layer 3: Execution */}
            <LayerCard 
              config={LAYERS.EXECUTION} 
              isActive={activeLayer === 'layer3'} 
            />

          </div>

          {/* Right Wing (Ops) */}
          <div className="lg:col-span-3 h-full flex flex-col justify-center">
            <WingCard 
              config={WINGS.RIGHT} 
              isActive={activeLayer === 'wing_right'} 
            />
             {/* Connection Line */}
             <div className="hidden lg:flex justify-center my-4 rotate-180">
               <ArrowRight className="text-slate-600" />
            </div>
          </div>

        </div>

        {/* Control & Logs Panel */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Simulator Controls */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> 架构模拟器 (Simulation)
            </h3>
            <div className="flex gap-3 flex-wrap">
              {SCENARIOS.map(s => (
                <button
                  key={s.id}
                  onClick={() => runSimulation(s.id)}
                  disabled={simulation && simStep < simulation.steps.length}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border
                    ${simulation?.id === s.id && simStep < simulation.steps.length
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'}
                  `}
                >
                  <Play className="w-3 h-3" />
                  {s.name.split('：')[1]}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              点击上方按钮，观察不同业务场景下，信号如何在架构层级间流转。注意观察中间“三层”的点亮顺序。
            </p>
          </div>

          {/* System Console */}
          <div className="bg-black rounded-xl p-4 font-mono text-xs h-40 overflow-y-auto border border-slate-800 shadow-inner">
            <div className="sticky top-0 bg-black pb-2 border-b border-slate-900 mb-2 text-slate-500 font-bold flex justify-between">
              <span>SYSTEM.LOG</span>
              <span className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${activeLayer ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
                {activeLayer ? 'PROCESSING' : 'IDLE'}
              </span>
            </div>
            <div className="space-y-1.5">
              {logs.length === 0 && <span className="text-slate-700">Waiting for event triggers...</span>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3 text-slate-300 animate-in slide-in-from-left-2">
                  <span className="text-slate-600 whitespace-nowrap">[{log.time}]</span>
                  <span className={log.msg.includes('开始') ? 'text-indigo-400 font-bold' : ''}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// --- Sub Components ---

function WingCard({ config, isActive }) {
  return (
    <div className={`
      relative p-6 rounded-2xl border-2 transition-all duration-500 h-64 flex flex-col justify-center gap-3
      ${isActive 
        ? `${config.color} bg-opacity-20 scale-105 shadow-[0_0_30px_rgba(79,70,229,0.2)]` 
        : `border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-700`}
    `}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-3 py-1 flex items-center gap-2 border border-inherit rounded-full whitespace-nowrap">
        {config.icon}
        <span className="text-xs font-bold uppercase tracking-wider">{config.role}</span>
      </div>
      
      <h3 className="text-lg font-bold text-center mb-2">{config.title}</h3>
      
      <div className="space-y-2">
        {config.modules.map((mod, i) => (
          <div key={i} className="bg-slate-950/50 p-2 rounded text-xs text-center border border-white/5">
            {mod}
          </div>
        ))}
      </div>
    </div>
  );
}

function LayerCard({ config, isActive }) {
  return (
    <div className={`
      flex-1 p-5 rounded-xl border-2 transition-all duration-500 relative overflow-hidden group
      ${isActive 
        ? `${config.color} scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.1)]` 
        : `border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700`}
    `}>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none"></div>
      )}

      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-current text-slate-950' : 'bg-slate-800'}`}>
            {config.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold">{config.title}</h3>
            <p className="text-xs font-mono opacity-70 uppercase">{config.subtitle}</p>
          </div>
        </div>
      </div>

      <p className={`text-xs mb-4 leading-relaxed ${isActive ? 'text-current opacity-90' : 'text-slate-500'}`}>
        {config.desc}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 relative z-10">
        {config.modules.map((mod, i) => (
          <div 
            key={i} 
            className={`
              text-[10px] px-2 py-1.5 rounded border text-center transition-colors
              ${isActive ? 'border-current bg-white/10' : 'border-slate-700 bg-slate-800 text-slate-500'}
            `}
          >
            {mod}
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center -my-2 relative z-0">
      <ArrowDown className="text-slate-700 w-5 h-5 animate-bounce" />
    </div>
  );
}