import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post("/adminlogin", (req, res) => {
  const sql = "SELECT * FROM admin where email = ? and password = ?";
  con.query(sql, [req.body.email, req.body.password], (err, result) => {
    if (err) return res.json({ loginStatus: false, Error: "Query error" });
    if (result.length > 0) {
      const email = result[0].email;
      const token = jwt.sign(
        { role: "admin", email: email },
        "jwt_secrete_key_my",
        {
          expiresIn: "1d",
        }
      );
      res.cookie("token", token);
      return res.json({ loginStatus: true });
    } else {
      return res.json({ loginStatus: false, Error: "Wrong credentials!" });
    }
  });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Status: true });
});

router.post("/add_design", (req, res) => {
  const sql = "INSERT INTO design_master (`design_number`) VALUES (?)";
  con.query(sql, [req.body.design], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query error" });
    return res.json({ Status: true });
  });
});

router.get("/design", (req, res) => {
  const sql = "SELECT * FROM design_master";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query error" });
    return res.json({ Status: true, Result: result });
  });
});

router.post("/manage_stock", (req, res) => {
  const sql =
    "INSERT INTO stock_master (`design_number`, `box`,`date`,`sell`) VALUES ?";

  const values = req.body.map((data) => [
    data.design_number,
    data.box,
    data.date,
    data.sell,
  ]);
  con.query(sql, [values], (err, result) => {
    if (err) return res.json({ Status: false, Error: err });
    return res.json({ Status: true });
  });
});

router.get("/purchasedstock", (req, res) => {
  const sql =
    "SELECT d.id,d.design_number,sum(s.box) as box FROM stock_master AS s LEFT JOIN design_master AS d  ON d.id = s.design_number where s.sell = 0 GROUP BY d.id";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query error" });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/purchasedstock/:id", (req, res) => {
  const { id } = req.params;
  const sql =
    "SELECT d.design_number, s.box, s.date FROM stock_master AS s LEFT JOIN design_master AS d ON d.id = s.design_number WHERE s.sell = 0 AND d.id = ?  ORDER BY date";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query error" });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/soldstock", (req, res) => {
  const sql =
    "SELECT d.id,d.design_number,sum(s.box) as box FROM stock_master AS s LEFT JOIN design_master AS d  ON d.id = s.design_number where s.sell = 1 GROUP BY d.id";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query error" });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/soldstock/:id", (req, res) => {
  const { id } = req.params;
  const sql =
    "SELECT d.design_number, s.box, s.date FROM stock_master AS s LEFT JOIN design_master AS d ON d.id = s.design_number WHERE s.sell = 1 AND d.id = ?  ORDER BY date";
  con.query(sql, [id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query error" });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/totalstock", (req, res) => {
  const sql =
    "SELECT d.id,d.design_number,SUM(CASE WHEN sell = 0 THEN box ELSE -box END) AS remaining_stock FROM stock_master AS s LEFT JOIN design_master AS d  ON d.id = s.design_number GROUP BY d.id";
  con.query(sql, (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query error" });
    return res.json({ Status: true, Result: result });
  });
});

router.get("/totalstock/:id", (req, res) => {
  const { id } = req.params;
  const sql =
    "(SELECT s.sell, d.design_number, s.box, s.date FROM stock_master AS s LEFT JOIN design_master AS d ON d.id = s.design_number WHERE s.sell = 0 AND d.id = ?  ORDER BY DATE) UNION (SELECT s.sell, d.design_number, s.box, s.date FROM stock_master AS s LEFT JOIN design_master AS d ON d.id = s.design_number WHERE s.sell = 1 AND d.id = ?  ORDER BY DATE)";
  con.query(sql, [id, id], (err, result) => {
    if (err) return res.json({ Status: false, Error: "Query error" });
    return res.json({ Status: true, Result: result });
  });
});

export { router as adminRouter };
