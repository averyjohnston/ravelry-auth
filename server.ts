import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import randomstring from 'randomstring';
import oauth2 from 'simple-oauth2';

const app = express();

// TODO: refresh token if it's close to expiring

app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: true,
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

const config = {
  client: {
    id: process.env.RAVELRY_CLIENT_ID!,
    secret: process.env.RAVELRY_CLIENT_SECRET!,
  },
  auth: {
    tokenHost: 'https://www.ravelry.com',
    tokenPath: '/oauth2/token',
    authorizePath: '/oauth2/auth',
  },
};

const auth = new oauth2.AuthorizationCode(config);

app.get('/auth', (_req, res) => {
  const authUri = auth.authorizeURL({
    redirect_uri: process.env.REDIRECT_URL,
    state: randomstring.generate(),
    scope: 'offline',
  });

  res.redirect(authUri);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
