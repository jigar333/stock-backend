import mysql from "mysql";
let mysqlConfig;
// Check if running locally or on live server
if (process.env.NODE_ENV === "production") {
  // Load live server configurations
  mysqlConfig = {
    host: process.env.LIVE_MYSQL_HOST,
    user: process.env.LIVE_MYSQL_USER,
    password: process.env.LIVE_MYSQL_PASSWORD,
    database: process.env.LIVE_MYSQL_DATABASE,
  };
} else {
  // Load local configurations
  mysqlConfig = {
    host: process.env.LOCAL_MYSQL_HOST,
    user: process.env.LOCAL_MYSQL_USER,
    password: process.env.LOCAL_MYSQL_PASSWORD,
    database: process.env.LOCAL_MYSQL_DATABASE,
  };
}
const con = mysql.createConnection(mysqlConfig);
con.connect(function (err) {
  if (err) {
    console.log("Connection error!");
  } else {
    console.log("Connected!");
  }
});

export default con;
