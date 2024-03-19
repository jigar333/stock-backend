import mysql from "mysql";
let mysqlConfig;

// Load server configurations
mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const con = mysql.createConnection(mysqlConfig);
con.connect(function (err) {
  if (err) {
    console.log("Connection error!");
  } else {
    console.log("Connected!");
  }
});

export default con;
