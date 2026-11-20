import type { ReactNode } from 'react'

// رسومات المحطات: كل موديول شكل بسيط ملوّن، الأرض عند y=0 والرسمة بتطلع لفوق. الألوان من متغير --cc (لون الموديول)
const bars = (x: number, y: number, n: number, w: number, gap: number, cls = 'w') => Array.from({ length: n }, (_, i) => <rect key={i} className={cls} x={x} y={y + i * gap} width={w - (i % 2) * 14} height={7} rx={3.5} />)

export const ILL: Record<string, ReactNode> = {
  base: <>
    <rect className="d" x={-72} y={-62} width={144} height={62} rx={10} /><rect className="c" x={-72} y={-128} width={144} height={58} rx={10} /><rect className="l" x={-72} y={-194} width={144} height={58} rx={10} />
    {[-30, -96, -162].map(y => <g key={y}><circle className="w" cx={-48} cy={y} r={6} /><circle className="w" cx={-28} cy={y} r={6} /><rect className="w" x={10} y={y - 5} width={50} height={10} rx={5} /></g>)}
  </>,
  con: <>
    <rect className="d" x={-7} y={-60} width={14} height={60} /><rect className="d" x={-44} y={-10} width={88} height={10} rx={5} />
    <rect className="c" x={-80} y={-165} width={160} height={105} rx={14} /><circle className="w" cx={-36} cy={-128} r={18} /><path className="w" d="M-62 -84 q26 -34 52 0z" />
    <rect className="w" x={2} y={-140} width={62} height={9} rx={4.5} /><rect className="l" x={2} y={-118} width={46} height={9} rx={4.5} /><rect className="l" x={2} y={-96} width={54} height={9} rx={4.5} />
  </>,
  crm: <>
    <rect className="d" x={-34} y={-46} width={68} height={46} rx={8} />
    <path className="c" d="M-88 -184 H88 L22 -84 V-40 H-22 V-84Z" /><path className="l" d="M-88 -184 H88 L76 -166 H-76Z" />
    <circle className="w smoke" cx={-34} cy={-212} r={9} /><circle className="l smoke s2" cx={10} cy={-228} r={8} /><circle className="w smoke s3" cx={46} cy={-210} r={7} />
  </>,
  s: <>
    <rect className="c" x={-84} y={-112} width={168} height={112} /><path className="d" d="M-96 -112 L-80 -164 H80 L96 -112Z" />
    {[-60, -20, 20, 60].map(x => <path key={x} className="w" d={`M${x - 10} -112 L${x - 4} -164 H${x + 6} L${x + 10} -112Z`} />)}
    <rect className="k" x={-22} y={-74} width={44} height={74} rx={4} /><rect className="l" x={-72} y={-92} width={36} height={40} rx={4} /><rect className="l" x={36} y={-92} width={36} height={40} rx={4} />
    <rect className="w" x={-44} y={-192} width={88} height={20} rx={6} />
  </>,
  p: <>
    <rect className="c" x={-96} y={-104} width={136} height={104} /><rect className="d" x={-96} y={-116} width={136} height={14} />
    <rect className="k" x={-72} y={-84} width={88} height={84} />{[-70, -52, -34, -16].map(y => <rect key={y} className="l" x={-72} y={y} width={88} height={3} />)}
    <rect className="l" x={50} y={-48} width={48} height={48} rx={3} /><rect className="d" x={56} y={-96} width={40} height={48} rx={3} /><rect className="w" x={72} y={-48} width={6} height={48} />
  </>,
  i: <>
    <path className="d" d="M-104 -112 Q0 -196 104 -112Z" /><rect className="c" x={-98} y={-112} width={196} height={112} />
    <rect className="k" x={-48} y={-84} width={96} height={84} />{[-56, -28, 0].map(y => <rect key={y} className="l" x={-48} y={y - 28} width={96} height={4} />)}
    <rect className="l" x={-92} y={-40} width={34} height={40} rx={3} /><rect className="w" x={58} y={-40} width={34} height={40} rx={3} /><rect className="l" x={62} y={-76} width={28} height={36} rx={3} />
  </>,
  m: <>
    <rect className="c" x={-100} y={-96} width={200} height={96} /><path className="d" d="M-100 -96 V-140 L-58 -96 V-140 L-16 -96 V-140 L26 -96Z" />
    <rect className="d" x={48} y={-196} width={30} height={100} /><rect className="d" x={84} y={-166} width={22} height={70} />
    <circle className="w smoke" cx={63} cy={-210} r={13} /><circle className="l smoke s2" cx={72} cy={-238} r={16} /><circle className="w smoke s3" cx={98} cy={-188} r={10} />
    {[-80, -50, -20].map(x => <rect key={x} className="w" x={x} y={-72} width={20} height={20} rx={3} />)}<rect className="k" x={24} y={-60} width={44} height={60} />
  </>,
  pos: <>
    <rect className="d" x={-76} y={-72} width={152} height={72} rx={10} /><rect className="c" x={-58} y={-148} width={116} height={78} rx={10} /><rect className="w" x={-46} y={-138} width={92} height={40} rx={5} />
    {[-40, -18, 4, 26].map(x => <rect key={x} className="l" x={x} y={-88} width={16} height={10} rx={3} />)}<rect className="k" x={-50} y={-44} width={100} height={12} rx={4} />
    <rect className="l" x={52} y={-180} width={40} height={60} rx={4} />
  </>,
  a: <>
    <rect className="c" x={-68} y={-186} width={136} height={186} rx={16} /><rect className="k" x={-52} y={-170} width={104} height={44} rx={8} /><rect className="l" x={-8} y={-160} width={50} height={8} rx={4} />
    {[0, 1, 2, 3].flatMap(r => [0, 1, 2].map(c => <rect key={r + '-' + c} className={r === 3 && c === 2 ? 'd' : 'w'} x={-46 + c * 34} y={-110 + r * 30} width={26} height={20} rx={5} />))}
  </>,
  ai: <>
    <line className="ln" x1={0} y1={-200} x2={0} y2={-160} /><circle className="l pulse" cx={0} cy={-208} r={11} />
    <rect className="c" x={-64} y={-160} width={128} height={90} rx={22} /><circle className="w" cx={-28} cy={-120} r={14} /><circle className="w" cx={28} cy={-120} r={14} /><circle className="k" cx={-28} cy={-120} r={6} /><circle className="k" cx={28} cy={-120} r={6} />
    <rect className="w" x={-26} y={-94} width={52} height={8} rx={4} /><rect className="d" x={-48} y={-64} width={96} height={64} rx={12} /><rect className="l" x={-76} y={-58} width={20} height={44} rx={8} /><rect className="l" x={56} y={-58} width={20} height={44} rx={8} />
  </>,
  rec: <>
    <circle className="ring" cx={-10} cy={-120} r={58} /><rect className="d" x={32} y={-82} width={16} height={86} rx={8} transform="rotate(-42 40 -82)" />
    <circle className="l" cx={-10} cy={-138} r={17} /><path className="l" d="M-40 -88 q30 -44 60 0z" />
  </>,
  emp: <>
    <rect className="d" x={-86} y={-14} width={172} height={14} rx={7} />
    <circle className="c" cx={-34} cy={-146} r={26} /><path className="c" d="M-80 -20 q46 -100 92 0z" /><circle className="l" cx={44} cy={-118} r={22} /><path className="l" d="M6 -20 q38 -84 76 0z" />
  </>,
  att: <>
    <circle className="c" cx={0} cy={-112} r={74} /><circle className="w" cx={0} cy={-112} r={60} />
    {[0, 90, 180, 270].map(a => <rect key={a} className="d" x={-3} y={-168} width={6} height={12} transform={`rotate(${a} 0 -112)`} />)}
    <g className="spin" style={{ transformOrigin: '0px -112px' }}><rect className="k" x={-3} y={-160} width={6} height={50} rx={3} /></g><rect className="d" x={-3} y={-112} width={34} height={6} rx={3} /><circle className="d" cx={0} cy={-112} r={8} />
    <rect className="d" x={-8} y={-38} width={16} height={38} />
  </>,
  to: <>
    <rect className="c" x={-76} y={-156} width={152} height={150} rx={14} /><path className="d" d="M-76 -142 a14 14 0 0 1 14 -14 H62 a14 14 0 0 1 14 14 V-118 H-76Z" />
    <rect className="w" x={-48} y={-172} width={10} height={26} rx={5} /><rect className="w" x={38} y={-172} width={10} height={26} rx={5} />
    {[0, 1, 2].flatMap(r => [0, 1, 2, 3].map(c => <rect key={r + '-' + c} className={r === 1 && c === 2 ? 'k' : 'w'} x={-58 + c * 34} y={-104 + r * 30} width={22} height={18} rx={4} />))}
  </>,
  pay: <>
    <path className="c" d="M-56 0 Q-96 -64 -38 -104 L-50 -134 H50 L38 -104 Q96 -64 56 0Z" /><rect className="d" x={-34} y={-142} width={68} height={14} rx={7} />
    <circle className="w" cx={0} cy={-62} r={26} /><rect className="c" x={-4} y={-80} width={8} height={36} rx={3} /><circle className="l coin" cx={74} cy={-26} r={22} /><circle className="d" cx={74} cy={-26} r={12} />
  </>,
  exp: <>
    <path className="c" d="M-58 -194 H58 V0 L42 -13 L26 0 L10 -13 L-6 0 L-22 -13 L-38 0 L-58 -13Z" />{bars(-38, -166, 5, 76, 24)}
    <rect className="d" x={-38} y={-52} width={76} height={10} rx={5} />
  </>,
  plm: <>
    <g className="spin" style={{ transformOrigin: '-34px -118px' }}><circle className="gearC" cx={-34} cy={-118} r={42} /><circle className="gear" cx={-34} cy={-118} r={50} /></g>
    <g className="spin r" style={{ transformOrigin: '52px -66px' }}><circle className="gearD" cx={52} cy={-66} r={26} /><circle className="gearT" cx={52} cy={-66} r={32} /></g>
    <rect className="d" x={-10} y={-24} width={20} height={24} />
  </>,
  studio: <>
    <rect className="c" x={-92} y={-150} width={184} height={140} rx={14} /><rect className="d" x={-92} y={-150} width={184} height={30} rx={14} />
    <rect className="w" x={-74} y={-100} width={70} height={60} rx={6} /><rect className="l" x={6} y={-100} width={68} height={24} rx={6} /><rect className="l" x={6} y={-66} width={46} height={24} rx={6} />
    <g transform="rotate(38 60 -130)"><rect className="k" x={52} y={-210} width={16} height={80} rx={3} /><path className="d" d="M52 -130 H68 L60 -108Z" /></g><circle className="l pulse" cx={86} cy={-196} r={7} />
  </>,
  web: <>
    <rect className="c" x={-98} y={-156} width={196} height={148} rx={14} /><rect className="d" x={-98} y={-156} width={196} height={32} rx={14} />
    {[-80, -62, -44].map(x => <circle key={x} className="w" cx={x} cy={-140} r={5} />)}<rect className="w" x={-20} y={-146} width={100} height={12} rx={6} />
    <rect className="w" x={-80} y={-108} width={90} height={60} rx={6} /><rect className="l" x={22} y={-108} width={58} height={26} rx={6} /><rect className="l" x={22} y={-74} width={58} height={26} rx={6} />
  </>,
  ecom: <>
    <path className="c" d="M-64 -114 H64 L78 0 H-78Z" /><path className="ring" d="M-32 -114 q0 -58 32 -58 q32 0 32 58" /><circle className="w" cx={-22} cy={-86} r={7} /><circle className="w" cx={22} cy={-86} r={7} />
    <path className="w" d="M-26 -50 q26 26 52 0" style={{ fill: 'none', stroke: '#fff', strokeWidth: 8, strokeLinecap: 'round' }} />
  </>,
  fleet: <>
    <path className="c" d="M-100 -38 L-84 -78 Q-80 -86 -70 -86 H34 Q46 -86 54 -78 L82 -52 H100 V-18 H-100Z" /><path className="l" d="M-70 -74 H-20 V-52 H-84Z M-8 -74 H30 L52 -52 H-8Z" />
    <circle className="k" cx={-56} cy={-16} r={22} /><circle className="w" cx={-56} cy={-16} r={9} /><circle className="k" cx={58} cy={-16} r={22} /><circle className="w" cx={58} cy={-16} r={9} /><rect className="w" x={86} y={-46} width={12} height={10} rx={3} />
  </>,
  prj: <>
    <rect className="d" x={-100} y={-160} width={200} height={160} rx={12} />
    {[-84, -28, 28].map((x, i) => <g key={x}><rect className="l" x={x} y={-144} width={50} height={128} rx={8} />{Array.from({ length: 3 - i % 2 }, (_, j) => <rect key={j} className={j === 0 ? 'c' : 'w'} x={x + 6} y={-130 + j * 36} width={38} height={26} rx={5} />)}</g>)}
  </>,
  grad: <>
    <rect className="d" x={-70} y={-34} width={140} height={34} rx={5} /><rect className="c" x={-58} y={-68} width={116} height={34} rx={5} /><rect className="l" x={-46} y={-100} width={92} height={32} rx={5} />
    <path className="k" d="M0 -190 L100 -154 L0 -118 L-100 -154Z" /><path className="c" d="M-56 -136 V-104 Q0 -84 56 -104 V-136 L0 -118Z" />
    <line className="ln" x1={92} y1={-152} x2={92} y2={-112} /><circle className="l" cx={92} cy={-106} r={7} />
  </>,
}
