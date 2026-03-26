

const LAST_ORG_KEY = 'sdg4_last_org';

window.API_BASE = window.API_BASE || (
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.port !== '5000'
    ? 'http://localhost:5000/api'
    : '/api'
);

const SESSION_KEY = 'sdg4_session_v3';

const SDG_TARGETS = [
  { id:'4.1', label:'ประถม-มัธยมคุณภาพ', color:'#FF6B6B' },
  { id:'4.2', label:'ปฐมวัยคุณภาพ', color:'#4ECDC4' },
  { id:'4.3', label:'อาชีวะ-อุดมศึกษา', color:'#45B7D1' },
  { id:'4.4', label:'ทักษะเทคนิค/อาชีพ', color:'#FFA07A' },
  { id:'4.5', label:'ลดความเหลื่อมล้ำ', color:'#98D8C8' },
  { id:'4.6', label:'อ่านออกเขียนได้', color:'#6C5CE7' },
  { id:'4.7', label:'ความยั่งยืน', color:'#00B894' },
  { id:'4.a', label:'สถานศึกษาปลอดภัย', color:'#FDCB6E' },
  { id:'4.b', label:'ทุนการศึกษา', color:'#E17055' },
  { id:'4.c', label:'เพิ่มครูมีคุณวุฒิ', color:'#74B9FF' },
];

const DEFAULT_ORG_PIN = '123456';
