import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import randomstring from 'randomstring';
import type { AuthorizationTokenConfig } from 'simple-oauth2';
import oauth2 from 'simple-oauth2';

const app = express();

// TODO: refresh token if it's close to expiring

const { SESSION_SECRET, RAVELRY_CLIENT_ID, RAVELRY_CLIENT_SECRET, REDIRECT_URL } = process.env;
if (SESSION_SECRET === undefined || RAVELRY_CLIENT_ID === undefined || RAVELRY_CLIENT_SECRET === undefined || REDIRECT_URL === undefined) {
  console.error('Variables missing from .env config');
}

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

app.get('/callback', (req, res) => {
  const { code } = req.query;
  if (typeof code !== 'string') {
    console.error('Code must be of type string, found:', code);
    return res.status(500).send('Invalid callback parameters');
  }

  const options: AuthorizationTokenConfig = {
    code,
    redirect_uri: process.env.REDIRECT_URL!,
  };

  auth.getToken(options).then(token => {
    res.json(token);
  }).catch(e => {
    console.error(e);
    res.status(500).send('Internal server error');
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
