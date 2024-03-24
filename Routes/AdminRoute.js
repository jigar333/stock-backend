import express from "express";
import con from "../utils/db.js";
import jwt from "jsonwebtoken";
const router = express.Router();
import bcrypt from "bcryptjs";

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUserQuery = "SELECT * FROM admin WHERE email = ?";
    con.query(existingUserQuery, [email], async (err, existingUser) => {
      if (err) {
        console.error("Error checking existing user:", err);
        return res
          .status(500)
          .json({ signupStatus: false, error: "Internal server error" });
      }

      if (existingUser.length > 0) {
        return res
          .status(400)
          .json({ signupStatus: false, error: "User already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

      // Insert the new user into the database
      const insertUserQuery =
        "INSERT INTO admin (email, password) VALUES (?, ?)";
      con.query(
        insertUserQuery,
        [email, hashedPassword],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Error inserting new user:", insertErr);
            return res
              .status(500)
              .json({ signupStatus: false, error: "Internal server error" });
          }

          // Generate JWT token for the new user
          const token = jwt.sign({ email }, "your_jwt_secret", {
            expiresIn: "1d",
          });

          res.cookie("token", token);
          res.json({ signupStatus: true });
        }
      );
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res
      .status(500)
      .json({ signupStatus: false, error: "Internal server error" });
  }
});

router.post("/adminlogin", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Modify the SQL query to select the user by email
  const sql = "SELECT * FROM admin WHERE email = ?";
  con.query(sql, [email], (err, result) => {
    if (err) return res.json({ loginStatus: false, Error: "Query error" });
    if (result.length > 0) {
      // Compare the hashed password with the hashed password stored in the database
      bcrypt.compare(
        password,
        result[0].password,
        (bcryptErr, bcryptResult) => {
          if (bcryptErr) {
            return res.json({
              loginStatus: false,
              Error: "Hash comparison error",
            });
          }
          if (bcryptResult) {
            const token = jwt.sign(
              { role: "admin", email: email },
              "jwt_secrete_key_my",
              { expiresIn: "1d" }
            );
            res.cookie("token", token);
            return res.json({ loginStatus: true });
          } else {
            return res.json({
              loginStatus: false,
              Error: "Wrong credentials!",
            });
          }
        }
      );
    } else {
      return res.json({ loginStatus: false, Error: "User not found" });
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
