import express from "express";
import session from "express-session";
import path from "path";
import { Issuer, generators } from "openid-client";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ===== Fix __dirname for ES Modules =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ===== View & Static Setup =====
app.set("view engine", "ejs");
const viewsPath = path.resolve(__dirname, "views");
app.set("views", viewsPath);
app.use(express.static(path.resolve(__dirname, "public")));

console.log("✅ Views path set to:", viewsPath);

// ===== Session Middleware =====
app.use(
  session({
    secret: "stotra-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

// ===== Cognito Configuration (Hardcoded) =====
const CLIENT_ID = "o82kd78l2ie1chb3h0223e74k";
const CLIENT_SECRET = "bbsjmpmsn4h68q216gui13cff21lnnl9oatr7j6bun14n77h6pk";
const COGNITO_DOMAIN = "https://us-east-1zfmummi7i.auth.us-east-1.amazoncognito.com";
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const LOGOUT_REDIRECT_URI = `http://localhost:${PORT}`;

let client;

// ===== Initialize OpenID Client =====
async function initializeClient() {
  try {
    const issuer = await Issuer.discover(
      "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_zfMUmmI7i"
    );

    client = new issuer.Client({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uris: [REDIRECT_URI],
      response_types: ["code"],
    });

    console.log("✅ OpenID client initialized");
  } catch (err) {
    console.error("❌ Failed to initialize OpenID client:", err);
  }
}
initializeClient();

// ===== Auth Middleware =====
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.userInfo;
  res.locals.userInfo = req.session.userInfo;
  next();
});

const checkAuth = (req, res, next) => {
  req.isAuthenticated = !!req.session.userInfo;
  next();
};

// ===== Routes =====
app.get("/", checkAuth, (req, res) => {
  console.log("🔹 Rendering home view from:", viewsPath);
  res.render("home", {
    isAuthenticated: req.isAuthenticated,
    userInfo: req.session.userInfo,
  });
});

app.get("/login", (req, res) => {
  const nonce = generators.nonce();
  const state = generators.state();

  req.session.nonce = nonce;
  req.session.state = state;

  const authUrl = client.authorizationUrl({
    scope: "openid email profile",
    state,
    nonce,
  });

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  try {
    const params = client.callbackParams(req);
    const tokenSet = await client.callback(REDIRECT_URI, params, {
      nonce: req.session.nonce,
      state: req.session.state,
    });

    req.session.tokenSet = tokenSet;
    req.session.id_token = tokenSet.id_token;

    const userInfo = await client.userinfo(tokenSet.access_token);
    req.session.userInfo = userInfo;

    res.redirect("/");
  } catch (err) {
    console.error("❌ Callback error:", err);
    res.redirect("/");
  }
});

app.get("/dashboard", checkAuth, (req, res) => {
  if (!req.isAuthenticated) return res.redirect("/");
  console.log("🔹 Rendering dashboard view from:", viewsPath);
  res.render("dashboard", { userInfo: req.session.userInfo });
});

app.get("/results", (req, res) => {
  console.log("🔹 Rendering results view from:", viewsPath);
  res.render("results");
});

// ===== Logout Route (100% Reliable) =====
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);

    // clear cookie
    res.clearCookie("connect.sid");

    // ✅ Use direct Cognito logout URL — always works
    const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${encodeURIComponent(
      LOGOUT_REDIRECT_URI
    )}`;

    console.log("🚪 Redirecting to logout:", logoutUrl);
    res.redirect(logoutUrl);
  });
});

// ===== 404 Fallback =====
app.use((req, res) => {
  res.status(404).render("404", { url: req.originalUrl });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🗂️  Serving views from: ${viewsPath}`);
});
