import express from "express";
import cors from "cors";
import { adminRouter } from "./Routes/AdminRoute.js";
import Jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
const app = express();
const port = process.env.PORT;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/auth", adminRouter);
app.use(express.static("Public"));
const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    Jwt.verify(token, "jwt_secrete_key_my", (err, decoded) => {
      if (err) return res.json({ Status: false, Error: "Wrong Token!" });
      else {
        req.email = decoded.email;
        req.role = decoded.role;
        next();
      }
    });
  } else {
    return res.json({ Status: false, Error: "Not authenticated" });
  }
};
app.get("/verify", verifyUser, (req, res) => {
  return res.json({ Status: true, role: req.role, email: req.email });
});

app.listen(port, () => {
  console.log("running", port);
});
