const Koa = require('koa');
const send = require('koa-send');
const websockify = require('koa-websocket');

const PORT = process.env.PORT || 8080;

const app = websockify(new Koa());

// 현재 연결되어있는 웹소켓 목록
const wsList = [];
// 현재 연결되어있는 웹소켓 닉네임 목록
const nickList = [];

// 클라이언트에서 연결 시
app.ws.use(async (ctx) => {
  // 닉네임 랜덤 생성
  const nick = Math.random().toString(16).slice(-6);
  // 웹소켓 리스트에 추가
  wsList.push(ctx.websocket);
  nickList.push(nick);
  // 연결 알림 메시지 전송
  ctx.websocket.send(`어서오세요. 당신의 닉네임은 ${nick} 입니다.`);
  // 콘솔 로그
  console.log(`[WS] ${nick} opened connection`);

  // 클라이언트에서 메시지 수신 시
  ctx.websocket.on('message', function (data) {
    // 현재 웹소켓 인덱스, 닉네임 가져오기
    const index = wsList.indexOf(this);
    const nick = index > -1 ? nickList[index] : 'Unknown';
    // 모든 클라이언트에게 메시지 전달
    for (const ws of wsList) {
      ws.send(`${nick}: ${data}`);
    }
    // 콘솔 로그
    console.log(`[WS] message from ${nick}:`, data);
  });

  // 클라이언트에서 연결 종료 시
  ctx.websocket.on('close', function (code, reason) {
    // 현재 웹소켓 인덱스, 닉네임 가져오기
    const index = wsList.indexOf(this);
    const nick = index > -1 ? nickList[index] : 'Unknown';
    // 리스트에 있으면 제거
    if (index > -1) {
      wsList.splice(index, 1);
      nickList.splice(index, 1);
    }
    // 콘솔 로그
    console.log(`[WS] ${nick} closed connection:`, code, reason);
  });
});

// http 접속 시
app.use((ctx) => {
  // html 전송
  return send(ctx, 'index.html');
});

// 서버 시작
app.listen(PORT);
