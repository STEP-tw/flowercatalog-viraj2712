let fs = require('fs');
const http = require('http');
const WebApp = require('./webapp');
let toS = o => JSON.stringify(o, null, 2);

let guestBook = fs.readFileSync('public/guestBook.html', 'utf8');

let registered_users = [{
    userName: 'viraj',
    name: 'Viraj Patil'
  },
  {
    userName: 'omkar',
    name: 'Omkar Mote'
  }
];

let logRequest = (req, res) => {
  let text = ['------------------------------',
    `${new Date().toLocaleTimeString()}`,
    `${req.method} ${req.url}`,
  ].join('\n');
  console.log(text);
}

let loadUser = (req, res) => {
  let sessionid = req.cookies.sessionid;
  let user = registered_users.find(u => u.sessionid == sessionid);
  if (sessionid && user) {
    req.user = user;
  }
}

let isGetMethod = function(req) {
  return req.method == 'GET';
}

let isFile = function(path) {
  return fs.existsSync(path);
}

const getContentType = function(fileName) {
  let fileExtension = fileName.slice(fileName.lastIndexOf('.'));
  let extensions = {
    '.gif': 'image/gif',
    '.jpg': 'image/jpg',
    '.pdf': 'application/pdf',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
  };
  return extensions[fileExtension];
}

let serveFile = function(req, res) {
  if (req.url == '/') req.url = '/index.html';
  let path = './public' + req.url;
  if (isGetMethod(req) && isFile(path)) {
    let contentType = getContentType(path);
    res.setHeader('Content-type', contentType);
    res.write(fs.readFileSync(path));
    res.end();
  };
}

const toHtml = function(comment) {
  let dateAndTime = `<p>Time : ${comment.date} ${comment.time}</p>`
  let userName = `<p>Name : ${comment.name}</p>`;
  let userComment = `<p>Comment : ${comment.comment}</p><br>`;
  return `${dateAndTime} ${userName} ${userComment}`;
}

const storeCommentInFile = function(comments) {
  let allComments = comments.map(toHtml).join('\n');
  fs.writeFileSync('public/comments.html', allComments);
}

const getComment = function(req) {
  let data = req.body;
  if (!data.name && !data.comment) return;
  data.time = new Date().toLocaleTimeString();
  data.date = new Date().toDateString();
  return data;
}

const storeComments = (req) => {
  let data = getComment(req);
  let comments = fs.readFileSync('data/comments.json', 'utf8');
  comments = JSON.parse(comments);
  comments.unshift(data);
  storeCommentInFile(comments);
  let commentsToStore = JSON.stringify(comments, null, 2);
  fs.writeFileSync('data/comments.json', commentsToStore);
}

const redirectToGuestBook = (req, res) => {
  storeComments(req)
  res.redirect('/guestBook.html');
}

const redirectLoggedInToAddComment = function(req, res) {
  if (req.user) {
    let content = guestBook.replace('currentUser', `User : ${req.user.name}`);
    res.write(content);
    res.end();
  }
}

const redirectUserToLogin = (req, res) => {
  if (!req.user) {
    res.redirect('/loginWithComments.html');
  } else {
    res.redirect('/guestBook.html');
  }
}

let app = WebApp.create();
app.use(logRequest);
app.use(loadUser);
app.use(serveFile);
app.get('/guestBook', redirectUserToLogin);
app.get('/guestBookPage', redirectLoggedInToAddComment);
app.post('/commentPage', redirectToGuestBook);

app.post('/login', (req, res) => {
  let user = registered_users.find(u => u.userName == req.body.name)
  if (!user) {
    res.setHeader('Set-Cookie', `logInFailed=true`);
    res.redirect('/login.html');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie', `sessionid=${sessionid}`);
  user.sessionid = sessionid;
  res.redirect('/guestBookPage');
});

const PORT = 5000;
let server = http.createServer(app);
server.on('error', e => console.error('**error**', e.message));
server.listen(PORT, (e) => console.log(`server listening at ${PORT}`));
